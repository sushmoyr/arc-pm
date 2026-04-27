import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import chalk from 'chalk';
import { openDatabase } from '../db/connection.js';
import { ExportService } from '../services/exportService.js';
import {
  exportToCsvFiles,
  exportToJson,
  exportToMarkdown,
} from '../utils/exportFormatters.js';
import { findProjectContext } from '../utils/projectContext.js';
import { renderJson, renderText } from '../utils/output.js';
import { ValidationError } from '../utils/errors.js';

const FORMATS = ['json', 'md', 'csv'] as const;
type Format = (typeof FORMATS)[number];

interface ExportOptions {
  project?: string;
  format?: string;
  out?: string;
  json?: boolean;
}

interface ExportResult {
  project_id: string;
  format: Format;
  files: string[];
  task_count: number;
  worklog_count: number;
  dependency_count: number;
}

export function buildExportCommand(): Command {
  return new Command('export')
    .description('Export a project (metadata + tasks + worklogs + dependencies)')
    .option('-p, --project <id>', 'project id (defaults to cwd-pinned project)')
    .option(`-f, --format <format>`, `output format: ${FORMATS.join('|')}`, 'json')
    .option('-o, --out <dir>', 'output directory (defaults to <project-root>/.arc/export)')
    .option('--json', 'machine-readable summary on stdout')
    .action((opts: ExportOptions) => {
      const format = parseFormat(opts.format);
      const ctx = findProjectContext();
      const projectId = opts.project ?? ctx?.context.projectId;
      if (!projectId) {
        throw new ValidationError(
          'no project id given and cwd is not pinned — pass -p <id> or run inside an `arc init` project',
        );
      }

      const outDir = resolveOutDir(opts.out, ctx?.rootDir);
      mkdirSync(outDir, { recursive: true });

      const db = openDatabase();
      try {
        const service = new ExportService(db);
        const payload = service.buildProjectExport(projectId);
        const stamp = timestamp(payload.exported_at);
        const baseName = `${payload.project.id}-export-${stamp}`;

        const files: string[] = [];
        if (format === 'json') {
          const file = join(outDir, `${baseName}.json`);
          writeFileSync(file, exportToJson(payload), 'utf8');
          files.push(file);
        } else if (format === 'md') {
          const file = join(outDir, `${baseName}.md`);
          writeFileSync(file, exportToMarkdown(payload), 'utf8');
          files.push(file);
        } else {
          const dir = join(outDir, baseName);
          mkdirSync(dir, { recursive: true });
          for (const f of exportToCsvFiles(payload)) {
            const file = join(dir, f.name);
            writeFileSync(file, f.contents, 'utf8');
            files.push(file);
          }
        }

        const result: ExportResult = {
          project_id: payload.project.id,
          format,
          files,
          task_count: payload.tasks.length,
          worklog_count: payload.worklogs.length,
          dependency_count: payload.dependencies.length,
        };

        if (opts.json) {
          renderJson(result);
          return;
        }
        const lines = [
          `${chalk.green('✓')} exported ${chalk.bold(payload.project.id)} as ${format}`,
          `  ${result.task_count} task(s), ${result.worklog_count} worklog(s), ${result.dependency_count} dependency(ies)`,
          ...files.map((f) => `  ${chalk.dim('→')} ${f}`),
        ];
        renderText(lines.join('\n'));
      } finally {
        db.close();
      }
    });
}

function parseFormat(value: string | undefined): Format {
  const v = (value ?? 'json').toLowerCase();
  if (!FORMATS.includes(v as Format)) {
    throw new ValidationError(
      `invalid format '${value}'. Expected one of: ${FORMATS.join(', ')}`,
    );
  }
  return v as Format;
}

function resolveOutDir(out: string | undefined, projectRoot: string | undefined): string {
  if (out) return isAbsolute(out) ? out : resolve(process.cwd(), out);
  const root = projectRoot ?? process.cwd();
  return join(root, '.arc', 'export');
}

function timestamp(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
}
