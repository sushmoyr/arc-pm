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
      const n = this.projects.mintNextTaskNumber(input.project_id);
      const id = `${input.project_id}-${n}`;
      return this.tasks.insert({
        id,
        project_id: input.project_id,
        parent_id: input.parent_id ?? null,
        type: input.type,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
      });
    });
    return tx();
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
    const updated = this.tasks.updateStatus(validated, parsedStatus.data);
    if (!updated) throw new NotFoundError(`task '${id}' not found`);
    return updated;
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
    this.get(taskId);
    this.get(targetId);
    this.deps.add(taskId, targetId, kind);
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
