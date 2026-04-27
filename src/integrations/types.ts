import type { Project } from '../types/domain.js';

export type AiProvider = 'claude' | 'codex' | 'gemini';

export interface BootstrapContext {
  project: Project;
  cwd: string;
  force: boolean;
}

export interface BootstrapResult {
  provider: AiProvider;
  filesWritten: string[];
  filesSkipped: string[];
}
