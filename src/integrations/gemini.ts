import { applyManifest, type ManifestEntry } from './manifest.js';
import type { BootstrapContext, BootstrapResult } from './types.js';

const MANIFEST: ManifestEntry[] = [{ template: 'GEMINI.md', dest: 'GEMINI.md' }];

export function bootstrapGemini(ctx: BootstrapContext): BootstrapResult {
  return applyManifest('gemini', MANIFEST, ctx);
}
