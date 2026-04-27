import type { Database } from 'better-sqlite3';
import type { Worklog } from '../types/domain.js';

export class WorklogRepo {
  constructor(private readonly db: Database) {}

  add(taskId: string, message: string): Worklog {
    const row = this.db
      .prepare('INSERT INTO worklog (task_id, message) VALUES (?, ?) RETURNING *')
      .get(taskId, message);
    return row as Worklog;
  }

  listFor(taskId: string): Worklog[] {
    return this.db
      .prepare('SELECT * FROM worklog WHERE task_id = ? ORDER BY id ASC')
      .all(taskId) as Worklog[];
  }

  listForProject(projectId: string): Worklog[] {
    return this.db
      .prepare(
        `SELECT w.* FROM worklog w
         JOIN tasks t ON t.id = w.task_id
         WHERE t.project_id = ?
         ORDER BY w.id ASC`,
      )
      .all(projectId) as Worklog[];
  }
}
