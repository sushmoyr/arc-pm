import { applyManifest, type ManifestEntry } from './manifest.js';
import type { BootstrapContext, BootstrapResult } from './types.js';

const MANIFEST: ManifestEntry[] = [{ template: 'AGENTS.md', dest: 'AGENTS.md' }];

export function bootstrapCodex(ctx: BootstrapContext): BootstrapResult {
  return applyManifest('codex', MANIFEST, ctx);
}
