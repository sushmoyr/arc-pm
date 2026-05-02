import { Command, Option } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService, type TaskUpdateInput } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import { TaskType, Priority } from '../types/domain.js';
import chalk from 'chalk';

export function buildEditCommand(): Command {
  return new Command('edit')
    .description('Edit a task (title, description, priority, type, parent)')
    .argument('<id>', 'task id (e.g. ARC-12)')
    .option('-t, --title <text>', 'new title')
    .option('-d, --description <text>', 'new description')
    .addOption(new Option('-p, --priority <n>', 'new priority (1-5)').argParser((v) => parseInt(v, 10)))
    .addOption(new Option('--type <type>', 'new type (EPIC|STORY|TASK|BUG)').choices(['EPIC', 'STORY', 'TASK', 'BUG']))
    .option('--parent <id>', 'new parent task id (or "null" to clear)')
    .option('--json', 'machine-readable output')
    .action(async (id: string, opts: {
      title?: string;
      description?: string;
      priority?: number;
      type?: string;
      parent?: string;
      json?: boolean;
    }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        const update: TaskUpdateInput = {};
        
        if (opts.title !== undefined) update.title = opts.title;
        if (opts.description !== undefined) update.description = opts.description;
        if (opts.priority !== undefined) update.priority = Priority.parse(opts.priority);
        if (opts.type !== undefined) update.type = TaskType.parse(opts.type);
        if (opts.parent !== undefined) {
          update.parent_id = opts.parent.toLowerCase() === 'null' ? null : opts.parent;
        }

        if (Object.keys(update).length === 0) {
          renderText(chalk.yellow('! no fields provided to update'));
          return;
        }

        const task = service.update(id, update);
        
        if (opts.json) {
          renderJson(task);
        } else {
          renderText(`${chalk.green('✓')} updated ${chalk.bold(task.id)}`);
          if (update.title) renderText(`  title: ${task.title}`);
          if (update.priority) renderText(`  priority: P${task.priority}`);
        }
      } finally {
        db.close();
      }
    });
}
