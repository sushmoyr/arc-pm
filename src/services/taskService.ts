import type { Database } from 'better-sqlite3';
import { ProjectRepo } from '../repositories/projectRepo.js';
import { TaskRepo, type TaskFilters } from '../repositories/taskRepo.js';
import { WorklogRepo } from '../repositories/worklogRepo.js';
import { DependencyRepo } from '../repositories/dependencyRepo.js';
import {
  NewTaskInput,
  TaskStatus,
  TaskType,
  Priority,
  TaskIdSchema,
  type Dependency,
  type Task,
  type TaskType as TaskTypeT,
  type Worklog,
} from '../types/domain.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface TaskWithWorklog extends Task {
  worklog: Worklog[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: number;
  type?: TaskTypeT;
  parent_id?: string | null;
}

export class TaskService {
  private readonly tasks: TaskRepo;
  private readonly projects: ProjectRepo;
  private readonly worklog: WorklogRepo;
  private readonly deps: DependencyRepo;

  constructor(private readonly db: Database) {
    this.tasks = new TaskRepo(db);
    this.projects = new ProjectRepo(db);
    this.worklog = new WorklogRepo(db);
    this.deps = new DependencyRepo(db);
  }

  create(raw: unknown): Task {
    const input = NewTaskInput.parse(raw);
    if (!this.projects.exists(input.project_id)) {
      throw new ValidationError(`project '${input.project_id}' not found — run 'arc init' first`);
    }
    if (input.parent_id) {
      const parent = this.tasks.findById(input.parent_id);
      if (!parent) throw new ValidationError(`parent task '${input.parent_id}' not found`);
      if (parent.project_id !== input.project_id) {
        throw new ValidationError(`parent task belongs to a different project`);
      }
    }
    const tx = this.db.transaction((): Task => {
      let id = input.id;
      if (id) {
        if (this.tasks.findById(id)) {
          throw new ValidationError(`task '${id}' already exists`);
        }
        if (!id.startsWith(`${input.project_id}-`)) {
          throw new ValidationError(`task id '${id}' does not match project '${input.project_id}'`);
        }
        const num = parseInt(id.split('-')[1]!, 10);
        this.projects.ensureCounter(input.project_id, num);
      } else {
        const n = this.projects.mintNextTaskNumber(input.project_id);
        id = `${input.project_id}-${n}`;
      }
      const task = this.tasks.insert({
        id,
        project_id: input.project_id,
        parent_id: input.parent_id ?? null,
        type: input.type,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
      });

      if (task.parent_id) {
        this.updateParentStatusRecursive(task.parent_id);
      }

      return task;
    });
    return tx();
  }

  delete(id: string): void {
    const validated = TaskIdSchema.parse(id);
    const deleted = this.tasks.delete(validated);
    if (!deleted) throw new NotFoundError(`task '${id}' not found`);
  }

  list(filters: TaskFilters = {}): Task[] {
    return this.tasks.findAll(filters);
  }

  get(id: string): Task {
    const validated = TaskIdSchema.parse(id);
    const task = this.tasks.findById(validated);
    if (!task) throw new NotFoundError(`task '${id}' not found`);
    return task;
  }

  getWithWorklog(id: string): TaskWithWorklog {
    const task = this.get(id);
    return { ...task, worklog: this.worklog.listFor(task.id) };
  }

  updateStatus(id: string, status: string): Task {
    const validated = TaskIdSchema.parse(id);
    const parsedStatus = TaskStatus.safeParse(status);
    if (!parsedStatus.success) {
      throw new ValidationError(
        `invalid status '${status}'. Expected one of: ${TaskStatus.options.join(', ')}`,
      );
    }
    const tx = this.db.transaction(() => {
      const task = this.get(validated);
      const updated = this.tasks.updateStatus(validated, parsedStatus.data);
      if (!updated) throw new NotFoundError(`task '${id}' not found`);

      // Epic Status Automation: if this task has a parent, check if we need to update the parent status
      if (task.parent_id) {
        this.updateParentStatusRecursive(task.parent_id);
      }
      return updated;
    });
    return tx();
  }

  private updateParentStatusRecursive(parentId: string): void {
    const parent = this.tasks.findById(parentId);
    if (!parent) return;

    const children = this.tasks.findByParent(parentId);
    if (children.length === 0) return;

    const allDone = children.every((c) => c.status === 'DONE');
    const anyInProgress = children.some((c) => c.status !== 'TODO' && c.status !== 'BACKLOG' && c.status !== 'DONE');
    const anyDone = children.some((c) => c.status === 'DONE');

    let nextStatus: TaskStatus = parent.status;
    if (allDone) {
      nextStatus = 'DONE';
    } else if (anyInProgress || anyDone) {
      // If parent is currently BACKLOG/TODO, move to IN_PROGRESS
      if (parent.status === 'BACKLOG' || parent.status === 'TODO') {
        nextStatus = 'IN_PROGRESS';
      }
    }

    if (nextStatus !== parent.status) {
      this.tasks.updateStatus(parentId, nextStatus);
      // Recursively update grand-parents if necessary
      if (parent.parent_id) {
        this.updateParentStatusRecursive(parent.parent_id);
      }
    }
  }

  log(id: string, message: string): Worklog {
    if (!message.trim()) throw new ValidationError('worklog message cannot be empty');
    this.get(id);
    return this.worklog.add(id, message);
  }

  next(opts: { project_id?: string; limit?: number } = {}): Task[] {
    const limit = Math.max(1, Math.min(opts.limit ?? 1, 50));
    return this.tasks.findReady({ project_id: opts.project_id, limit });
  }

  addDependency(taskId: string, targetId: string, kind: 'blocks' | 'depends_on'): void {
    if (taskId === targetId) throw new ValidationError('a task cannot depend on itself');
    const task = this.get(taskId);
    const target = this.get(targetId);
    if (task.project_id !== target.project_id) {
      throw new ValidationError('cross-project dependencies are not allowed');
    }

    // Cycle detection
    // If we add A depends_on B, check if B already (transitively) depends on A
    // If we add A blocks B (which is B depends_on A), check if A already (transitively) depends on B
    const wouldBeSource = kind === 'depends_on' ? taskId : targetId;
    const wouldBeTarget = kind === 'depends_on' ? targetId : taskId;

    if (this.isReachable(wouldBeTarget, wouldBeSource)) {
      throw new ValidationError(`dependency cycle detected: ${wouldBeTarget} already depends on ${wouldBeSource}`);
    }

    this.deps.add(taskId, targetId, kind);
  }

  /** Returns true if 'targetId' is reachable from 'sourceId' via 'depends_on' (or reverse 'blocks'). */
  private isReachable(sourceId: string, targetId: string, visited = new Set<string>()): boolean {
    if (sourceId === targetId) return true;
    if (visited.has(sourceId)) return false;
    visited.add(sourceId);

    // 1. sourceId depends_on X
    const outgoing = this.deps.listFor(sourceId);
    for (const d of outgoing) {
      if (d.kind === 'depends_on') {
        if (this.isReachable(d.target_id, targetId, visited)) return true;
      }
    }

    // 2. X blocks sourceId (means sourceId depends on X)
    const incoming = this.deps.listIncoming(sourceId);
    for (const d of incoming) {
      if (d.kind === 'blocks') {
        if (this.isReachable(d.task_id, targetId, visited)) return true;
      }
    }

    return false;
  }

  listDependencies(taskId: string): Dependency[] {
    const validated = TaskIdSchema.parse(taskId);
    return this.deps.listFor(validated);
  }

  update(id: string, input: TaskUpdateInput): Task {
    const validated = TaskIdSchema.parse(id);
    const fields: TaskUpdateInput = {};
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new ValidationError('title cannot be empty');
      fields.title = input.title.trim();
    }
    if (input.description !== undefined) {
      fields.description = input.description;
    }
    if (input.priority !== undefined) {
      fields.priority = Priority.parse(input.priority);
    }
    if (input.type !== undefined) {
      fields.type = TaskType.parse(input.type);
    }
    if (input.parent_id !== undefined) {
      fields.parent_id = input.parent_id;
    }
    const updated = this.tasks.update(validated, fields);
    if (!updated) throw new NotFoundError(`task '${id}' not found`);
    return updated;
  }
}
