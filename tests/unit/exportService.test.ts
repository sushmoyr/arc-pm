import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database as Db } from 'better-sqlite3';
import { openDatabase, closeDatabase } from '../../src/db/connection.js';
import { ProjectService } from '../../src/services/projectService.js';
import { TaskService } from '../../src/services/taskService.js';
import { ExportService, EXPORT_VERSION } from '../../src/services/exportService.js';
import {
  exportToCsvFiles,
  exportToJson,
  exportToMarkdown,
} from '../../src/utils/exportFormatters.js';
import { NotFoundError } from '../../src/utils/errors.js';

describe('ExportService', () => {
  let db: Db;
  let projects: ProjectService;
  let tasks: TaskService;
  let exporter: ExportService;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    projects = new ProjectService(db);
    tasks = new TaskService(db);
    exporter = new ExportService(db);
    projects.create({ id: 'EXP', name: 'Export Test', tech_stack: 'Node' });
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('throws NotFoundError for unknown project', () => {
    expect(() => exporter.buildProjectExport('NOPE')).toThrow(NotFoundError);
  });

  it('builds an export payload for an empty project', () => {
    const payload = exporter.buildProjectExport('EXP');
    expect(payload.version).toBe(EXPORT_VERSION);
    expect(payload.project.id).toBe('EXP');
    expect(payload.tasks).toEqual([]);
    expect(payload.worklogs).toEqual([]);
    expect(payload.dependencies).toEqual([]);
    expect(payload.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes tasks, worklogs, and dependencies scoped to the project', () => {
    projects.create({ id: 'OTH', name: 'Other' });
    const a = tasks.create({ project_id: 'EXP', title: 'A', priority: 1 });
    const b = tasks.create({ project_id: 'EXP', title: 'B', type: 'BUG' });
    tasks.create({ project_id: 'OTH', title: 'should not appear' });
    tasks.log(a.id, 'started A');
    tasks.log(a.id, 'still on A');
    tasks.addDependency(b.id, a.id, 'depends_on');

    const payload = exporter.buildProjectExport('EXP');
    expect(payload.tasks.map((t) => t.id).sort()).toEqual([a.id, b.id]);
    expect(payload.worklogs).toHaveLength(2);
    expect(payload.worklogs.every((w) => w.task_id === a.id)).toBe(true);
    expect(payload.dependencies).toEqual([
      { task_id: b.id, target_id: a.id, kind: 'depends_on' },
    ]);
  });
});

describe('export formatters', () => {
  let db: Db;
  let projects: ProjectService;
  let tasks: TaskService;
  let exporter: ExportService;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    projects = new ProjectService(db);
    tasks = new TaskService(db);
    exporter = new ExportService(db);
    projects.create({ id: 'FMT', name: 'Formatter Test' });
    const t = tasks.create({
      project_id: 'FMT',
      title: 'Has, comma "and" quote',
      description: 'multi\nline',
    });
    tasks.log(t.id, 'note one');
    tasks.updateStatus(t.id, 'IN_PROGRESS');
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('json output is valid JSON containing the payload', () => {
    const payload = exporter.buildProjectExport('FMT');
    const text = exportToJson(payload);
    const parsed = JSON.parse(text);
    expect(parsed.project.id).toBe('FMT');
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.worklogs).toHaveLength(1);
  });

  it('markdown output contains project, status sections, and worklog entries', () => {
    const payload = exporter.buildProjectExport('FMT');
    const md = exportToMarkdown(payload);
    expect(md).toContain('# FMT: Formatter Test');
    expect(md).toContain('### IN_PROGRESS');
    expect(md).toContain('FMT-1');
    expect(md).toContain('note one');
  });

  it('csv output produces 4 files and escapes commas/quotes/newlines', () => {
    const payload = exporter.buildProjectExport('FMT');
    const files = exportToCsvFiles(payload);
    const names = files.map((f) => f.name);
    expect(names).toEqual(['project.csv', 'tasks.csv', 'worklogs.csv', 'dependencies.csv']);

    const tasksCsv = files.find((f) => f.name === 'tasks.csv')!.contents;
    expect(tasksCsv.split('\n')[0]).toBe(
      'id,project_id,parent_id,type,title,description,status,priority,created_at,updated_at',
    );
    expect(tasksCsv).toContain('"Has, comma ""and"" quote"');
    expect(tasksCsv).toContain('"multi\nline"');

    const depsCsv = files.find((f) => f.name === 'dependencies.csv')!.contents;
    expect(depsCsv.trim()).toBe('task_id,target_id,kind');
  });
});
