import { Command } from 'commander';
import { openDatabase } from '../db/connection.js';
import { ProjectService } from '../services/projectService.js';
import { findProjectContext, removeProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { formatProjectsTable } from '../utils/format.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import chalk from 'chalk';

const SETTABLE_FIELDS = new Set(['name', 'description', 'tech_stack']);

export function buildProjectCommand(): Command {
  const cmd = new Command('project').description('Manage project metadata');

  cmd
    .command('list')
    .description('List all projects')
    .option('--json', 'machine-readable output')
    .action((opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new ProjectService(db);
        const projects = service.list();
        if (opts.json) renderJson(projects);
        else renderText(formatProjectsTable(projects));
      } finally {
        db.close();
      }
    });

  cmd
    .command('show')
    .description('Show project metadata (defaults to cwd-pinned project)')
    .argument('[id]', 'project id')
    .option('--json', 'machine-readable output')
    .action((id: string | undefined, opts: { json?: boolean }) => {
      const db = openDatabase();
      try {
        const service = new ProjectService(db);
        const targetId = id ?? findProjectContext()?.context.projectId;
        if (!targetId) throw new ValidationError('no project id given and no .arc/project.json found');
        const project = service.get(targetId);
        if (!project) throw new NotFoundError(`project '${targetId}' not found`);
        if (opts.json) renderJson(project);
        else {
          renderText(
            [
              `${chalk.bold(project.id)}  ${project.name}`,
              project.description ? `\n${project.description}` : '',
              project.tech_stack ? `\n${chalk.dim('tech:')} ${project.tech_stack}` : '',
              `\n${chalk.dim(`created ${project.created_at}, updated ${project.updated_at}`)}`,
            ].join(''),
          );
        }
      } finally {
        db.close();
      }
    });

  cmd
    .command('set')
    .description('Set a project field (name | description | tech_stack)')
    .argument('<field>', 'field name')
    .argument('<value...>', 'new value')
    .option('-p, --project <id>', 'project id (defaults to cwd-pinned)')
    .option('--json', 'machine-readable output')
    .action((field: string, valueParts: string[], opts: { project?: string; json?: boolean }) => {
      const db = openDatabase();
      try {
        if (!SETTABLE_FIELDS.has(field)) {
          throw new ValidationError(
            `field '${field}' is not settable. Use one of: ${[...SETTABLE_FIELDS].join(', ')}`,
          );
        }
        const targetId = opts.project ?? findProjectContext()?.context.projectId;
        if (!targetId) throw new ValidationError('no project id given and no .arc/project.json found');
        const value = valueParts.join(' ');
        const service = new ProjectService(db);
        const updated = service.update(targetId, { [field]: value });
        if (opts.json) renderJson(updated);
        else renderText(`${chalk.green('✓')} ${chalk.bold(updated.id)}.${field} updated`);
      } finally {
        db.close();
      }
    });

  cmd
    .command('delete')
    .description('Delete a project and all its tasks (use `.` for the cwd-pinned project)')
    .argument('<id>', "project id, or '.' to use the cwd-pinned project")
    .option('-y, --yes', 'skip confirmation')
    .option('--json', 'machine-readable output')
    .action((idArg: string, opts: { yes?: boolean; json?: boolean }) => {
      const db = openDatabase();
      try {
        const cwdCtx = findProjectContext();
        const targetId = idArg === '.' ? cwdCtx?.context.projectId : idArg;
        if (!targetId) {
          throw new ValidationError(
            "no .arc/project.json found in cwd; pass an explicit id instead of '.'",
          );
        }

        const service = new ProjectService(db);
        const project = service.get(targetId);
        if (!project) throw new NotFoundError(`project '${targetId}' not found`);

        const taskCount = service.countTasks(targetId);

        if (!opts.yes) {
          throw new ValidationError(
            `refusing to delete '${targetId}' (${project.name}) with ${taskCount} task(s) without --yes. ` +
              'Re-run with -y/--yes to confirm.',
          );
        }

        service.delete(targetId);

        let contextRemoved = false;
        if (cwdCtx && cwdCtx.context.projectId === targetId) {
          contextRemoved = removeProjectContext(cwdCtx.rootDir);
        }

        if (opts.json) {
          renderJson({ deleted: project, taskCount, contextRemoved });
          return;
        }
        renderText(
          `${chalk.green('✓')} deleted project ${chalk.bold(project.id)} (${project.name}); ${taskCount} task(s) removed`,
        );
        if (contextRemoved) renderText(chalk.dim('  removed .arc/project.json'));
      } finally {
        db.close();
      }
    });

  return cmd;
}
