import { Command } from 'commander';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ImportExample, ImportFile } from '../types/importSchema.js';
import { renderJson } from '../utils/output.js';

export function buildSchemaCommand(): Command {
  return new Command('schema')
    .description('Dump the JSON Schema for `arc import` files (for AI agents to generate valid payloads)')
    .option('--example', 'print a minimal sample import file instead of the schema')
    .option('--json', 'no-op: output is already JSON')
    .action((opts: { example?: boolean }) => {
      if (opts.example) {
        renderJson(ImportExample);
        return;
      }
      const schema = zodToJsonSchema(ImportFile, {
        name: 'ArcImportFile',
        $refStrategy: 'root',
      });
      renderJson(schema);
    });
}
