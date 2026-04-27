import type { Dependency, Task, TaskStatus, Worklog } from '../types/domain.js';
import type { ProjectExport } from '../services/exportService.js';

export function exportToJson(payload: ProjectExport): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

const STATUS_ORDER: TaskStatus[] = ['IN_PROGRESS', 'REVIEW', 'TODO', 'BACKLOG', 'DONE'];

export function exportToMarkdown(payload: ProjectExport): string {
  const { project, tasks, worklogs, dependencies, exported_at, version } = payload;
  const lines: string[] = [];

  lines.push(`# ${project.id}: ${project.name}`);
  lines.push('');
  lines.push(`> Exported ${exported_at} (arc export v${version})`);
  lines.push('');
  if (project.description) {
    lines.push(project.description);
    lines.push('');
  }
  lines.push('## Project');
  lines.push('');
  lines.push(`- **ID:** ${project.id}`);
  lines.push(`- **Name:** ${project.name}`);
  lines.push(`- **Tech stack:** ${project.tech_stack || '_none_'}`);
  lines.push(`- **Created:** ${project.created_at}`);
  lines.push(`- **Updated:** ${project.updated_at}`);
  lines.push('');

  const worklogsByTask = new Map<string, Worklog[]>();
  for (const w of worklogs) {
    const list = worklogsByTask.get(w.task_id) ?? [];
    list.push(w);
    worklogsByTask.set(w.task_id, list);
  }
  const tasksByStatus = new Map<TaskStatus, Task[]>();
  for (const t of tasks) {
    const list = tasksByStatus.get(t.status) ?? [];
    list.push(t);
    tasksByStatus.set(t.status, list);
  }

  lines.push('## Tasks');
  lines.push('');
  if (tasks.length === 0) {
    lines.push('_no tasks_');
    lines.push('');
  } else {
    for (const status of STATUS_ORDER) {
      const list = tasksByStatus.get(status);
      if (!list || list.length === 0) continue;
      lines.push(`### ${status} (${list.length})`);
      lines.push('');
      for (const t of list) {
        lines.push(`#### ${t.id} — ${t.title}`);
        lines.push('');
        lines.push(`- **Type:** ${t.type}`);
        lines.push(`- **Priority:** ${t.priority}`);
        if (t.parent_id) lines.push(`- **Parent:** ${t.parent_id}`);
        lines.push(`- **Created:** ${t.created_at}`);
        lines.push(`- **Updated:** ${t.updated_at}`);
        lines.push('');
        lines.push(t.description || '_no description_');
        lines.push('');
        const wl = worklogsByTask.get(t.id) ?? [];
        if (wl.length > 0) {
          lines.push('**Worklog**');
          lines.push('');
          for (const w of wl) lines.push(`- \`${w.created_at}\` — ${w.message}`);
          lines.push('');
        }
      }
    }
  }

  lines.push('## Dependencies');
  lines.push('');
  if (dependencies.length === 0) {
    lines.push('_no dependencies_');
  } else {
    for (const d of dependencies) {
      lines.push(`- \`${d.task_id}\` **${d.kind}** \`${d.target_id}\``);
    }
  }
  lines.push('');
  return lines.join('\n');
}

export interface CsvFile {
  name: string;
  contents: string;
}

export function exportToCsvFiles(payload: ProjectExport): CsvFile[] {
  const projectCsv = csvFromRows(
    ['id', 'name', 'description', 'tech_stack', 'created_at', 'updated_at'],
    [payload.project],
  );
  const tasksCsv = csvFromRows(
    [
      'id',
      'project_id',
      'parent_id',
      'type',
      'title',
      'description',
      'status',
      'priority',
      'created_at',
      'updated_at',
    ],
    payload.tasks,
  );
  const worklogsCsv = csvFromRows(
    ['id', 'task_id', 'message', 'created_at'],
    payload.worklogs,
  );
  const depsCsv = csvFromRows(['task_id', 'target_id', 'kind'], payload.dependencies);
  return [
    { name: 'project.csv', contents: projectCsv },
    { name: 'tasks.csv', contents: tasksCsv },
    { name: 'worklogs.csv', contents: worklogsCsv },
    { name: 'dependencies.csv', contents: depsCsv },
  ];
}

function csvFromRows<T extends Record<string, unknown>>(columns: string[], rows: T[]): string {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvEscape(row[c])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
