import envPaths from 'env-paths';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const ENV_OVERRIDE = 'ARC_HOME';

export interface ArcPaths {
  configDir: string;
  dbPath: string;
}

export function resolvePaths(): ArcPaths {
  const override = process.env[ENV_OVERRIDE];
  const configDir = override ?? envPaths('arc', { suffix: '' }).config;
  mkdirSync(configDir, { recursive: true });
  return {
    configDir,
    dbPath: join(configDir, 'arc.db'),
  };
}
