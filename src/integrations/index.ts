import type { AiProvider, BootstrapContext, BootstrapResult } from './types.js';
import { bootstrapClaude } from './claude.js';
import { bootstrapCodex } from './codex.js';
import { bootstrapGemini } from './gemini.js';

export const AI_PROVIDERS: AiProvider[] = ['claude', 'codex', 'gemini'];

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as string[]).includes(value);
}

export function bootstrap(provider: AiProvider, ctx: BootstrapContext): BootstrapResult {
  switch (provider) {
    case 'claude':
      return bootstrapClaude(ctx);
    case 'codex':
      return bootstrapCodex(ctx);
    case 'gemini':
      return bootstrapGemini(ctx);
  }
}

export type { AiProvider, BootstrapContext, BootstrapResult };
