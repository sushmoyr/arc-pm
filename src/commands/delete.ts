import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import chalk from 'chalk';

export function buildDeleteCommand(): Command {
  return new Command('delete')
    .description('Delete a task')
    .argument('<id>', 'task id')
    .option('-y, --yes', 'skip confirmation')
    .option('--json', 'machine-readable output')
    .action((id: string, opts: { yes?: boolean; json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        const task = service.get(id);

        if (!opts.yes) {
          renderText(chalk.yellow(`! are you sure you want to delete ${task.id}?`));
          renderText(chalk.dim('  re-run with -y/--yes to confirm.'));
          return;
        }

        service.delete(id);
        if (opts.json) renderJson({ deleted: id });
        else renderText(`${chalk.green('✓')} deleted ${chalk.bold(id)}`);
      } finally {
        db.close();
      }
    });
}
