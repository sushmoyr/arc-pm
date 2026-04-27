import { join } from 'node:path';
import type { AiProvider, BootstrapContext, BootstrapResult } from './types.js';
import { writeFileSafe } from './fs.js';
import { readTemplate, interpolate } from './templates.js';

export interface ManifestEntry {
  /** Template file under `src/integrations/templates/<provider>/`. */
  template: string;
  /** Destination path relative to the project cwd. */
  dest: string;
}

export function applyManifest(
  provider: AiProvider,
  entries: ManifestEntry[],
  ctx: BootstrapContext,
): BootstrapResult {
  const vars = { projectId: ctx.project.id };
  const written: string[] = [];
  const skipped: string[] = [];
  for (const entry of entries) {
    const raw = readTemplate(provider, entry.template);
    const content = interpolate(raw, vars);
    const dest = join(ctx.cwd, entry.dest);
    if (writeFileSafe(dest, content, ctx.force)) written.push(dest);
    else skipped.push(dest);
  }
  return { provider, filesWritten: written, filesSkipped: skipped };
}
