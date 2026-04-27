import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import chalk from 'chalk';

export function buildUpdateCommand(): Command {
  return new Command('update')
    .description('Update a task status (BACKLOG | TODO | IN_PROGRESS | REVIEW | DONE)')
    .argument('<id>', 'task id')
    .argument('<status>', 'new status')
    .option('--json', 'machine-readable output')
    .action((id: string, status: string, opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        const task = service.updateStatus(id, status.toUpperCase());
        if (opts.json) renderJson(task);
        else renderText(`${chalk.green('✓')} ${chalk.bold(task.id)} → ${chalk.cyan(task.status)}`);
      } finally {
        db.close();
      }
    });
}
