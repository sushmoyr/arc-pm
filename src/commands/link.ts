import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import { DependencyKind } from '../types/domain.js';
import chalk from 'chalk';

export function buildLinkCommand(): Command {
  return new Command('link')
    .description('Add a dependency between two tasks')
    .argument('<task>', 'task id (e.g. ARC-2)')
    .argument('<kind>', 'blocks | depends_on')
    .argument('<target>', 'target task id (e.g. ARC-1)')
    .option('--json', 'machine-readable output')
    .action((task: string, kind: string, target: string, opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const parsedKind = DependencyKind.parse(kind);
        const service = new TaskService(db);
        service.addDependency(task, target, parsedKind);
        const result = { task, kind: parsedKind, target };
        if (opts.json) renderJson(result);
        else renderText(`${chalk.green('✓')} ${chalk.bold(task)} ${parsedKind} ${chalk.bold(target)}`);
      } finally {
        db.close();
      }
    });
}
