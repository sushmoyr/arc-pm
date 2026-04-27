import { applyManifest, type ManifestEntry } from './manifest.js';
import type { BootstrapContext, BootstrapResult } from './types.js';

const MANIFEST: ManifestEntry[] = [
  { template: 'skill.md', dest: '.claude/skills/arc-pm/SKILL.md' },
  { template: 'arc-pickup.md', dest: '.claude/commands/arc-pickup.md' },
  { template: 'arc-finish.md', dest: '.claude/commands/arc-finish.md' },
  { template: 'arc-status.md', dest: '.claude/commands/arc-status.md' },
  { template: 'arc-add.md', dest: '.claude/commands/arc-add.md' },
];

export function bootstrapClaude(ctx: BootstrapContext): BootstrapResult {
  return applyManifest('claude', MANIFEST, ctx);
}
