import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { openDatabase } from '../db/connection.js';
import { ProjectService } from '../services/projectService.js';
import { TaskService } from '../services/taskService.js';
import { renderJson, renderText } from '../utils/output.js';
import { ValidationError } from '../utils/errors.js';
import { ImportFile } from '../types/importSchema.js';
import chalk from 'chalk';

export function buildImportCommand(): Command {
  return new Command('import')
    .description('Batch import from JSON ({ projects: [], tasks: [] })')
    .argument('<file>', 'path to JSON file')
    .option('--json', 'machine-readable output')
    .action((file: string, opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const ext = extname(file).toLowerCase();
        if (ext !== '.json') {
          throw new ValidationError(`only .json import is supported (got '${ext}')`);
        }
        const raw = readFileSync(resolve(file), 'utf8');
        const parsed = ImportFile.parse(JSON.parse(raw));
        const projectService = new ProjectService(db);
        const taskService = new TaskService(db);

        const result = db.transaction(() => {
          let projectsCreated = 0;
          let tasksCreated = 0;
          let depsCreated = 0;
          for (const p of parsed.projects) {
            if (!projectService.get(p.id)) {
              projectService.create(p);
              projectsCreated++;
            }
          }
          for (const t of parsed.tasks) {
            taskService.create(t);
            tasksCreated++;
          }
          for (const d of parsed.dependencies) {
            taskService.addDependency(d.task, d.target, d.kind);
            depsCreated++;
          }
          return { projectsCreated, tasksCreated, depsCreated };
        })();

        if (opts.json) renderJson(result);
        else
          renderText(
            `${chalk.green('✓')} imported ${result.projectsCreated} project(s), ${result.tasksCreated} task(s), ${result.depsCreated} dependencies`,
          );
      } finally {
        db.close();
      }
    });
}
