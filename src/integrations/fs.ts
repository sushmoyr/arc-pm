import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function writeFileSafe(path: string, content: string, force: boolean): boolean {
  if (existsSync(path) && !force) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
  return true;
}
