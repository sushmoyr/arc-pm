import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import { formatTaskDetail, formatTaskMarkdown } from '../utils/format.js';

export function buildShowCommand(): Command {
  return new Command('show')
    .description('Show full detail of a task and its worklog')
    .argument('<id>', 'task id (e.g. ARC-12)')
    .option('--json', 'machine-readable output')
    .option('--markdown', 'markdown output (good for pasting into LLM context)')
    .action((id: string, opts: { json?: boolean; markdown?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new TaskService(db);
        const task = service.getWithWorklog(id);
        if (opts.json) {
          renderJson(task);
          return;
        }
        const { worklog, ...rest } = task;
        if (opts.markdown) renderText(formatTaskMarkdown(rest, worklog));
        else renderText(formatTaskDetail(rest, worklog));
      } finally {
        db.close();
      }
    });
}
