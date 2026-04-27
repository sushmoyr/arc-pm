import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { findProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { formatTasksTable } from '../utils/format.js';

export function buildNextCommand(): Command {
  return new Command('next')
    .description('Show the next task(s) to pick up (priority + unblocked)')
    .option('-n, --count <n>', 'how many tasks to return', (v) => parseInt(v, 10), 1)
    .option('--all', 'consider tasks across all projects')
    .option('--json', 'machine-readable output')
    .action((opts: { count: number; all?: boolean; json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        let projectId: string | undefined;
        if (!opts.all) {
          const ctx = findProjectContext();
          projectId = ctx?.context.projectId;
        }
        const tasks = service.next({ project_id: projectId, limit: opts.count });
        if (opts.json) renderJson(tasks);
        else renderText(formatTasksTable(tasks));
      } finally {
        db.close();
      }
    });
}
