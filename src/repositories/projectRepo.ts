import type { Database } from 'better-sqlite3';
import type { Project, NewProjectInput } from '../types/domain.js';

export class ProjectRepo {
  constructor(private readonly db: Database) {}

  create(input: NewProjectInput): Project {
    const insert = this.db.prepare(
      'INSERT INTO projects (id, name, description, tech_stack) VALUES (@id, @name, @description, @tech_stack) RETURNING *',
    );
    return insert.get(input) as Project;
  }

  findById(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return (row as Project) ?? null;
  }

  findAll(): Project[] {
    return this.db.prepare('SELECT * FROM projects ORDER BY id').all() as Project[];
  }

  exists(id: string): boolean {
    return this.findById(id) !== null;
  }

  countTasks(id: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as n FROM tasks WHERE project_id = ?')
      .get(id) as { n: number };
    return row.n;
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }

  update(id: string, fields: Partial<Pick<Project, 'name' | 'description' | 'tech_stack'>>): Project {
    const sets: string[] = [];
    const params: Record<string, unknown> = { id };
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) continue;
      sets.push(`${k} = @${k}`);
      params[k] = v;
    }
    if (sets.length === 0) return this.findById(id) as Project;
    const sql = `UPDATE projects SET ${sets.join(', ')} WHERE id = @id RETURNING *`;
    return this.db.prepare(sql).get(params) as Project;
  }

  mintNextTaskNumber(projectId: string): number {
    const row = this.db
      .prepare(
        `INSERT INTO project_counters (project_id, last_id) VALUES (?, 1)
         ON CONFLICT(project_id) DO UPDATE SET last_id = last_id + 1
         RETURNING last_id`,
      )
      .get(projectId) as { last_id: number };
    return row.last_id;
  }
}
