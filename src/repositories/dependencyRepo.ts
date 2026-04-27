import type { Database } from 'better-sqlite3';
import type { Dependency, DependencyKind } from '../types/domain.js';

export class DependencyRepo {
  constructor(private readonly db: Database) {}

  add(taskId: string, targetId: string, kind: DependencyKind): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO task_dependencies (task_id, target_id, kind) VALUES (?, ?, ?)',
      )
      .run(taskId, targetId, kind);
  }

  listFor(taskId: string): Dependency[] {
    return this.db
      .prepare('SELECT * FROM task_dependencies WHERE task_id = ? OR target_id = ?')
      .all(taskId, taskId) as Dependency[];
  }

  listForProject(projectId: string): Dependency[] {
    return this.db
      .prepare(
        `SELECT d.* FROM task_dependencies d
         JOIN tasks t ON t.id = d.task_id
         WHERE t.project_id = ?
         ORDER BY d.task_id ASC, d.target_id ASC`,
      )
      .all(projectId) as Dependency[];
  }
}
