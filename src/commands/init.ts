import { Command, Option } from 'commander';
import { openDatabase } from '../db/connection.js';
import { ProjectService } from '../services/projectService.js';
import { writeProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { projectIdFromCwd } from '../utils/projectId.js';
import { ProjectIdSchema } from '../types/domain.js';
import { ValidationError } from '../utils/errors.js';
import { AI_PROVIDERS, bootstrap, isAiProvider } from '../integrations/index.js';
import type { BootstrapResult } from '../integrations/index.js';
import chalk from 'chalk';

export function buildInitCommand(): Command {
  return new Command('init')
    .description('Initialize the current directory as an ARC project')
    .argument(
      '[id]',
      'project id; omit (or pass `.`) to derive from the current directory name',
    )
    .option('-n, --name <name>', 'human-readable project name')
    .option('-d, --description <desc>', 'project description', '')
    .option('-t, --tech-stack <stack>', 'tech stack (helpful for AI context)', '')
    .addOption(
      new Option('--ai <provider>', 'bootstrap AI agent configuration').choices(AI_PROVIDERS),
    )
    .option('--force', 'overwrite existing AI integration files')
    .option('--json', 'machine-readable output')
    .action(
      async (
        idArg: string | undefined,
        opts: {
          name?: string;
          description: string;
          techStack: string;
          ai?: string;
          force?: boolean;
          json?: boolean;
        },
      ) => {
        const db = openDatabase();
        try {
          const service = new ProjectService(db);
          const id = resolveProjectId(idArg, (candidate) => service.get(candidate) !== null);
          const project = service.create({
            id,
            name: opts.name ?? id,
            description: opts.description,
            tech_stack: opts.techStack,
          });
          const contextFile = writeProjectContext(process.cwd(), { projectId: project.id });

          let aiResult: BootstrapResult | null = null;
          if (opts.ai) {
            if (!isAiProvider(opts.ai)) {
              throw new ValidationError(
                `unknown --ai provider '${opts.ai}'. Expected: ${AI_PROVIDERS.join(', ')}`,
              );
            }
            aiResult = bootstrap(opts.ai, {
              project,
              cwd: process.cwd(),
              force: opts.force ?? false,
            });
          }

          if (opts.json) {
            renderJson({ project, contextFile, ai: aiResult });
            return;
          }

          renderText(`${chalk.green('✓')} created project ${chalk.bold(project.id)} (${project.name})`);
          renderText(chalk.dim(`  context: ${contextFile}`));
          if (aiResult) {
            renderText(chalk.bold(`  ${aiResult.provider} integration:`));
            for (const f of aiResult.filesWritten) renderText(chalk.green(`    + ${f}`));
            for (const f of aiResult.filesSkipped)
              renderText(chalk.yellow(`    · ${f} (exists — use --force to overwrite)`));
          }
        } finally {
          db.close();
        }
      },
    );
}

function resolveProjectId(arg: string | undefined, isTaken: (id: string) => boolean): string {
  const useCwd = arg === undefined || arg === '.';
  if (useCwd) {
    return projectIdFromCwd(process.cwd(), isTaken);
  }
  const parsed = ProjectIdSchema.safeParse(arg);
  if (!parsed.success) {
    throw new ValidationError(
      `invalid project id '${arg}'. Use uppercase letters/digits starting with a letter, or pass '.' to derive from the directory name.`,
    );
  }
  if (isTaken(parsed.data)) {
    throw new ValidationError(`project '${parsed.data}' already exists`);
  }
  return parsed.data;
}
