import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import chalk from 'chalk';

export function buildLogCommand(): Command {
  return new Command('log')
    .description('Append a worklog entry to a task')
    .argument('<id>', 'task id')
    .argument('<message...>', 'note text')
    .option('--json', 'machine-readable output')
    .action((id: string, messageParts: string[], opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        const message = messageParts.join(' ');
        const entry = service.log(id, message);
        if (opts.json) renderJson(entry);
        else renderText(`${chalk.green('✓')} logged on ${chalk.bold(id)}: ${entry.message}`);
      } finally {
        db.close();
      }
    });
}
