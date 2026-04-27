import chalk from 'chalk';
import Table from 'cli-table3';
import type { Project, Task, TaskStatus, Worklog } from '../types/domain.js';

const STATUS_COLORS: Record<TaskStatus, (s: string) => string> = {
  BACKLOG: chalk.gray,
  TODO: chalk.white,
  IN_PROGRESS: chalk.cyan,
  REVIEW: chalk.yellow,
  DONE: chalk.green,
};

const TYPE_COLORS: Record<Task['type'], (s: string) => string> = {
  EPIC: chalk.magenta,
  STORY: chalk.blue,
  TASK: chalk.white,
  BUG: chalk.red,
};

export function formatTasksTable(tasks: Task[]): string {
  if (tasks.length === 0) return chalk.dim('(no tasks)');
  const table = new Table({
    head: ['ID', 'Type', 'Pri', 'Status', 'Title'].map((h) => chalk.bold(h)),
    style: { head: [], border: ['gray'] },
    colWidths: [12, 8, 5, 14, 60],
    wordWrap: true,
  });
  for (const t of tasks) {
    table.push([
      chalk.bold(t.id),
      TYPE_COLORS[t.type](t.type),
      String(t.priority),
      STATUS_COLORS[t.status](t.status),
      t.title,
    ]);
  }
  return table.toString();
}

export function formatTasksGrouped(tasks: Task[]): string {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = groups.get(t.project_id) ?? [];
    list.push(t);
    groups.set(t.project_id, list);
  }
  const sections: string[] = [];
  for (const [projectId, items] of [...groups.entries()].sort()) {
    sections.push(chalk.bold.underline(projectId));
    sections.push(formatTasksTable(items));
  }
  return sections.join('\n\n');
}

export function formatProjectsTable(projects: Project[]): string {
  if (projects.length === 0) return chalk.dim('(no projects — run `arc init` to create one)');
  const table = new Table({
    head: ['ID', 'Name', 'Tech Stack'].map((h) => chalk.bold(h)),
    style: { head: [], border: ['gray'] },
    colWidths: [12, 30, 50],
    wordWrap: true,
  });
  for (const p of projects) {
    table.push([chalk.bold(p.id), p.name, p.tech_stack || chalk.dim('—')]);
  }
  return table.toString();
}

export function formatTaskDetail(task: Task, worklog: Worklog[]): string {
  const lines: string[] = [];
  lines.push(`${chalk.bold(task.id)}  ${TYPE_COLORS[task.type](task.type)}  ${STATUS_COLORS[task.status](task.status)}  ${chalk.dim(`P${task.priority}`)}`);
  lines.push(chalk.bold(task.title));
  if (task.parent_id) lines.push(chalk.dim(`parent: ${task.parent_id}`));
  lines.push('');
  lines.push(task.description || chalk.dim('(no description)'));
  lines.push('');
  lines.push(chalk.bold('Worklog'));
  if (worklog.length === 0) {
    lines.push(chalk.dim('  (none)'));
  } else {
    for (const w of worklog) lines.push(`  ${chalk.dim(w.created_at)}  ${w.message}`);
  }
  return lines.join('\n');
}

export function formatTaskMarkdown(task: Task, worklog: Worklog[]): string {
  const lines: string[] = [];
  lines.push(`# ${task.id}: ${task.title}`);
  lines.push('');
  lines.push(`- **Type:** ${task.type}`);
  lines.push(`- **Status:** ${task.status}`);
  lines.push(`- **Priority:** ${task.priority}`);
  if (task.parent_id) lines.push(`- **Parent:** ${task.parent_id}`);
  lines.push(`- **Created:** ${task.created_at}`);
  lines.push(`- **Updated:** ${task.updated_at}`);
  lines.push('');
  lines.push('## Description');
  lines.push('');
  lines.push(task.description || '_no description_');
  lines.push('');
  lines.push('## Worklog');
  lines.push('');
  if (worklog.length === 0) lines.push('_no entries_');
  else for (const w of worklog) lines.push(`- \`${w.created_at}\` — ${w.message}`);
  return lines.join('\n');
}
