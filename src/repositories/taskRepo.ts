import type { Database } from 'better-sqlite3';
import type { Task, TaskStatus } from '../types/domain.js';

export interface TaskFilters {
  project_id?: string;
  status?: TaskStatus;
}

export interface TaskRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  type: Task['type'];
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export class TaskRepo {
  constructor(private readonly db: Database) {}

  insert(row: Omit<TaskRow, 'created_at' | 'updated_at'>): Task {
    const stmt = this.db.prepare(
      `INSERT INTO tasks (id, project_id, parent_id, type, title, description, status, priority)
       VALUES (@id, @project_id, @parent_id, @type, @title, @description, @status, @priority)
       RETURNING *`,
    );
    return stmt.get(row) as Task;
  }

  findById(id: string): Task | null {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return (row as Task) ?? null;
  }

  findAll(filters: TaskFilters = {}): Task[] {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (filters.project_id) {
      where.push('project_id = @project_id');
      params.project_id = filters.project_id;
    }
    if (filters.status) {
      where.push('status = @status');
      params.status = filters.status;
    }
    const sql = `SELECT * FROM tasks ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY priority ASC, created_at ASC`;
    return this.db.prepare(sql).all(params) as Task[];
  }

  updateStatus(id: string, status: TaskStatus): Task | null {
    const row = this.db
      .prepare('UPDATE tasks SET status = ? WHERE id = ? RETURNING *')
      .get(status, id);
    return (row as Task) ?? null;
  }

  update(id: string, fields: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'parent_id' | 'type'>>): Task | null {
    const sets: string[] = [];
    const params: Record<string, unknown> = { id };
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) continue;
      sets.push(`${k} = @${k}`);
      params[k] = v;
    }
    if (sets.length === 0) return this.findById(id);
    const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = @id RETURNING *`;
    return (this.db.prepare(sql).get(params) as Task) ?? null;
  }

  /** Tasks that are ready to work on: status BACKLOG/TODO and no unfulfilled depends_on. */
  findReady(opts: { project_id?: string; limit: number }): Task[] {
    const params: Record<string, unknown> = { limit: opts.limit };
    let projectClause = '';
    if (opts.project_id) {
      projectClause = 'AND t.project_id = @project_id';
      params.project_id = opts.project_id;
    }
    const sql = `
      SELECT t.* FROM tasks t
      WHERE t.status IN ('BACKLOG','TODO')
        ${projectClause}
        AND NOT EXISTS (
          SELECT 1 FROM task_dependencies d
          JOIN tasks dep ON dep.id = d.target_id
          WHERE d.task_id = t.id AND d.kind = 'depends_on' AND dep.status != 'DONE'
        )
      ORDER BY t.priority ASC, t.created_at ASC
      LIMIT @limit
    `;
    return this.db.prepare(sql).all(params) as Task[];
  }
}
