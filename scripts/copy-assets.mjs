import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const assets = [
  ['src/db/migrations', 'dist/db/migrations'],
  ['src/integrations/templates', 'dist/integrations/templates'],
];

for (const [src, dst] of assets) {
  const from = resolve(root, src);
  const to = resolve(root, dst);
  await mkdir(to, { recursive: true });
  await cp(from, to, { recursive: true });
  console.log(`copied ${src} → ${dst}`);
}
