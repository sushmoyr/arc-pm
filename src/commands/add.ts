import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { findProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { ValidationError } from '../utils/errors.js';
import { TaskType, TaskStatus } from '../types/domain.js';
import chalk from 'chalk';

export function buildAddCommand(): Command {
  return new Command('add')
    .description('Add a new task')
    .argument('<title...>', 'task title')
    .option('-p, --project <id>', 'project id (defaults to cwd-pinned)')
    .option('-t, --type <type>', 'EPIC | STORY | TASK | BUG', 'TASK')
    .option('-s, --status <status>', 'initial status', 'TODO')
    .option('-P, --priority <n>', 'priority 1 (highest) – 5', (v) => parseInt(v, 10), 3)
    .option('--parent <id>', 'parent task id (epic)')
    .option('-d, --description <desc>', 'description', '')
    .option('--json', 'machine-readable output')
    .action(
      (
        titleParts: string[],
        opts: {
          project?: string;
          type: string;
          status: string;
          priority: number;
          parent?: string;
          description: string;
          json?: boolean;
        },
      ) => {
        const db = openDatabase();
        try {
          const projectId = opts.project ?? findProjectContext()?.context.projectId;
          if (!projectId) {
            throw new ValidationError(
              'no project given and no .arc/project.json found — pass --project or run `arc init` first',
            );
          }
          const service = new TaskService(db);
          const task = service.create({
            project_id: projectId,
            title: titleParts.join(' '),
            type: TaskType.parse(opts.type.toUpperCase()),
            status: TaskStatus.parse(opts.status.toUpperCase()),
            priority: opts.priority,
            description: opts.description,
            parent_id: opts.parent ?? null,
          });
          if (opts.json) renderJson(task);
          else renderText(`${chalk.green('✓')} created ${chalk.bold(task.id)}: ${task.title}`);
        } finally {
          db.close();
        }
      },
    );
}
