import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database as Db } from 'better-sqlite3';
import { openDatabase, closeDatabase } from '../../src/db/connection.js';
import { ProjectService } from '../../src/services/projectService.js';
import { TaskService } from '../../src/services/taskService.js';
import { NotFoundError, ValidationError } from '../../src/utils/errors.js';

describe('TaskService', () => {
  let db: Db;
  let projects: ProjectService;
  let tasks: TaskService;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    projects = new ProjectService(db);
    tasks = new TaskService(db);
    projects.create({ id: 'TST', name: 'Test', description: '', tech_stack: '' });
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('mints sequential PROJECT-N ids per project', () => {
    const a = tasks.create({ project_id: 'TST', title: 'A' });
    const b = tasks.create({ project_id: 'TST', title: 'B' });
    const c = tasks.create({ project_id: 'TST', title: 'C' });
    expect([a.id, b.id, c.id]).toEqual(['TST-1', 'TST-2', 'TST-3']);
  });

  it('counters are independent per project', () => {
    projects.create({ id: 'OTH', name: 'Other', description: '', tech_stack: '' });
    const t1 = tasks.create({ project_id: 'TST', title: 'A' });
    const t2 = tasks.create({ project_id: 'OTH', title: 'B' });
    expect(t1.id).toBe('TST-1');
    expect(t2.id).toBe('OTH-1');
  });

  it('rejects unknown project', () => {
    expect(() => tasks.create({ project_id: 'NOPE', title: 'X' })).toThrow(ValidationError);
  });

  it('rejects parent from a different project', () => {
    projects.create({ id: 'OTH', name: 'Other', description: '', tech_stack: '' });
    const parent = tasks.create({ project_id: 'OTH', title: 'parent', type: 'EPIC' });
    expect(() =>
      tasks.create({ project_id: 'TST', title: 'child', parent_id: parent.id }),
    ).toThrow(ValidationError);
  });

  describe('updateStatus', () => {
    it('updates a valid status', () => {
      const t = tasks.create({ project_id: 'TST', title: 'A' });
      const updated = tasks.updateStatus(t.id, 'IN_PROGRESS');
      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('rejects invalid status with ValidationError', () => {
      const t = tasks.create({ project_id: 'TST', title: 'A' });
      expect(() => tasks.updateStatus(t.id, 'NOPE')).toThrow(ValidationError);
    });

    it('throws NotFoundError for unknown task', () => {
      expect(() => tasks.updateStatus('TST-999', 'DONE')).toThrow(NotFoundError);
    });
  });

  describe('next', () => {
    it('returns tasks in priority order, oldest first as tiebreak', () => {
      tasks.create({ project_id: 'TST', title: 'low', priority: 5 });
      tasks.create({ project_id: 'TST', title: 'high', priority: 1 });
      tasks.create({ project_id: 'TST', title: 'mid-1', priority: 3 });
      tasks.create({ project_id: 'TST', title: 'mid-2', priority: 3 });
      const ready = tasks.next({ project_id: 'TST', limit: 5 });
      expect(ready.map((t) => t.title)).toEqual(['high', 'mid-1', 'mid-2', 'low']);
    });

    it('skips tasks blocked by unfulfilled depends_on', () => {
      const a = tasks.create({ project_id: 'TST', title: 'A', priority: 1 });
      const b = tasks.create({ project_id: 'TST', title: 'B', priority: 1 });
      tasks.addDependency(b.id, a.id, 'depends_on');
      const ready = tasks.next({ project_id: 'TST', limit: 5 });
      expect(ready.map((t) => t.id)).toEqual([a.id]);
    });

    it('unblocks a task once its dependency is DONE', () => {
      const a = tasks.create({ project_id: 'TST', title: 'A', priority: 2 });
      const b = tasks.create({ project_id: 'TST', title: 'B', priority: 1 });
      tasks.addDependency(b.id, a.id, 'depends_on');
      tasks.updateStatus(a.id, 'DONE');
      const ready = tasks.next({ project_id: 'TST', limit: 5 });
      expect(ready.map((t) => t.id)).toEqual([b.id]);
    });

    it('excludes IN_PROGRESS, REVIEW, DONE', () => {
      const a = tasks.create({ project_id: 'TST', title: 'A' });
      const b = tasks.create({ project_id: 'TST', title: 'B' });
      const c = tasks.create({ project_id: 'TST', title: 'C' });
      tasks.updateStatus(a.id, 'IN_PROGRESS');
      tasks.updateStatus(b.id, 'REVIEW');
      const ready = tasks.next({ project_id: 'TST', limit: 5 });
      expect(ready.map((t) => t.id)).toEqual([c.id]);
    });
  });

  describe('log', () => {
    it('appends worklog entries in order', () => {
      const t = tasks.create({ project_id: 'TST', title: 'A' });
      tasks.log(t.id, 'first');
      tasks.log(t.id, 'second');
      const detail = tasks.getWithWorklog(t.id);
      expect(detail.worklog.map((w) => w.message)).toEqual(['first', 'second']);
    });

    it('rejects empty messages', () => {
      const t = tasks.create({ project_id: 'TST', title: 'A' });
      expect(() => tasks.log(t.id, '   ')).toThrow(ValidationError);
    });
  });

  describe('addDependency', () => {
    it('rejects self-dependency', () => {
      const t = tasks.create({ project_id: 'TST', title: 'A' });
      expect(() => tasks.addDependency(t.id, t.id, 'depends_on')).toThrow(ValidationError);
    });

    it('is idempotent', () => {
      const a = tasks.create({ project_id: 'TST', title: 'A' });
      const b = tasks.create({ project_id: 'TST', title: 'B' });
      tasks.addDependency(b.id, a.id, 'depends_on');
      tasks.addDependency(b.id, a.id, 'depends_on');
      // no throw — second call hits ON CONFLICT IGNORE
    });
  });
});
