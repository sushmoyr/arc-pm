import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';
import { ProjectIdSchema } from '../types/domain.js';

const ProjectContextFile = z.object({
  projectId: ProjectIdSchema,
});
export type ProjectContext = z.infer<typeof ProjectContextFile>;

const FILE_NAME = join('.arc', 'project.json');

export function findProjectContext(startDir: string = process.cwd()): {
  context: ProjectContext;
  rootDir: string;
} | null {
  let dir = resolve(startDir);
  while (true) {
    const candidate = join(dir, FILE_NAME);
    if (existsSync(candidate)) {
      const raw = readFileSync(candidate, 'utf8');
      const parsed = ProjectContextFile.parse(JSON.parse(raw));
      return { context: parsed, rootDir: dir };
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function writeProjectContext(targetDir: string, context: ProjectContext): string {
  const validated = ProjectContextFile.parse(context);
  const filePath = join(targetDir, FILE_NAME);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(validated, null, 2)}\n`, 'utf8');
  ensureArcInGitignore(targetDir);
  return filePath;
}

export function removeProjectContext(rootDir: string): boolean {
  const filePath = join(rootDir, FILE_NAME);
  if (!existsSync(filePath)) return false;
  rmSync(filePath, { force: true });
  const arcDir = dirname(filePath);
  try {
    if (existsSync(arcDir) && readdirSync(arcDir).length === 0) {
      rmSync(arcDir, { recursive: true, force: true });
    }
  } catch {
    // best-effort cleanup
  }
  return true;
}

function ensureArcInGitignore(targetDir: string): void {
  const gitignorePath = join(targetDir, '.gitignore');
  if (!existsSync(gitignorePath)) return;

  const contents = readFileSync(gitignorePath, 'utf8');
  const hasArcEntry = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === '.arc' || line === '.arc/' || line === '/.arc' || line === '/.arc/');
  if (hasArcEntry) return;

  const needsLeadingNewline = contents.length > 0 && !contents.endsWith('\n');
  const appended = `${needsLeadingNewline ? '\n' : ''}.arc/\n`;
  writeFileSync(gitignorePath, contents + appended, 'utf8');
}
