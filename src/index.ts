#!/usr/bin/env node
import { Command } from 'commander';
import { exitWithError } from './utils/errors.js';
import { buildInitCommand } from './commands/init.js';
import { buildAddCommand } from './commands/add.js';
import { buildListCommand } from './commands/list.js';
import { buildShowCommand } from './commands/show.js';
import { buildUpdateCommand } from './commands/update.js';
import { buildNextCommand } from './commands/next.js';
import { buildLogCommand } from './commands/log.js';
import { buildProjectCommand } from './commands/project.js';
import { buildSchemaCommand } from './commands/schema.js';
import { buildImportCommand } from './commands/import.js';
import { buildExportCommand } from './commands/export.js';
import { buildLinkCommand } from './commands/link.js';
import { buildDeleteCommand } from './commands/delete.js';

async function main() {
  const program = new Command();
  program
    .name('arc')
    .description('ARC: Local-first, AI-agent-optimized project management.')
    .version('0.1.0')
    .showHelpAfterError();

  program.addCommand(buildInitCommand());
  program.addCommand(buildAddCommand());
  program.addCommand(buildListCommand());
  program.addCommand(buildShowCommand());
  program.addCommand(buildUpdateCommand());
  program.addCommand(buildNextCommand());
  program.addCommand(buildLogCommand());
  program.addCommand(buildProjectCommand());
  program.addCommand(buildSchemaCommand());
  program.addCommand(buildImportCommand());
  program.addCommand(buildExportCommand());
  program.addCommand(buildLinkCommand());
  program.addCommand(buildDeleteCommand());

  if (process.argv.length <= 2) {
    const { launchTui } = await import('./tui/launch.js');
    await launchTui();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch(exitWithError);
