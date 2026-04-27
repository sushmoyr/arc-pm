import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(here, 'templates');

export function readTemplate(provider: string, file: string): string {
  return readFileSync(join(TEMPLATES_DIR, provider, file), 'utf8');
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    if (!(key in vars)) {
      throw new Error(`unknown template variable: {{${key}}}`);
    }
    return vars[key]!;
  });
}
