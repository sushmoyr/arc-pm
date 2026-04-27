import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { findProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { formatTasksGrouped, formatTasksTable } from '../utils/format.js';
import { TaskStatus } from '../types/domain.js';
import { ValidationError } from '../utils/errors.js';

export function buildListCommand(): Command {
  return new Command('list')
    .description('List tasks (defaults to cwd-pinned project)')
    .option('-g, --grouped', 'group by project (implies cross-project)')
    .option('-p, --project <id>', 'filter by project id')
    .option('-s, --status <status>', 'filter by status')
    .option('--all', 'list across all projects')
    .option('--json', 'machine-readable output')
    .action(
      (opts: { grouped?: boolean; project?: string; status?: string; all?: boolean; json?: boolean }) => {
        const db = openDatabase();
        try {
          const service = new TaskService(db);
          let projectId: string | undefined = opts.project;
          if (!projectId && !opts.all && !opts.grouped) {
            const ctx = findProjectContext();
            projectId = ctx?.context.projectId;
          }
          let status: ReturnType<typeof TaskStatus.parse> | undefined;
          if (opts.status) {
            const parsed = TaskStatus.safeParse(opts.status.toUpperCase());
            if (!parsed.success) {
              throw new ValidationError(
                `invalid status '${opts.status}'. Expected one of: ${TaskStatus.options.join(', ')}`,
              );
            }
            status = parsed.data;
          }
          const tasks = service.list({ project_id: projectId, status });
          if (opts.json) {
            renderJson(tasks);
            return;
          }
          if (opts.grouped) renderText(formatTasksGrouped(tasks));
          else renderText(formatTasksTable(tasks));
        } finally {
          db.close();
        }
      },
    );
}
