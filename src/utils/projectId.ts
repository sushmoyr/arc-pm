import { basename, resolve } from 'node:path';

const STOPWORDS = new Set(['the', 'of', 'and', 'a', 'an', 'to', 'in', 'on', 'for']);

/**
 * Derive an uppercase JIRA-like project id from a directory name.
 *
 * - "School Management System" → SMS
 * - On collision, extend by cycling through word initials starting at index 1:
 *   SMS taken → SMSM (M = first letter of word[1] = "Management")
 *   SMSM taken → SMSMS (S = word[2] = "System")
 *   SMSMS taken → SMSMSS (S = word[0] = "School")
 *
 * Falls back to "PROJECT" / "PROJECT2" / ... when the directory name has no
 * letter-starting words.
 */
export function deriveProjectId(
  dirName: string,
  isTaken: (id: string) => boolean,
): string {
  const words = tokenize(dirName);

  if (words.length === 0) {
    return uniqueWithSuffix('PROJECT', isTaken);
  }

  const initials = words.map((w) => w[0]!.toUpperCase()).join('');
  if (!isTaken(initials)) return initials;

  let id = initials;
  for (let k = 0; k < 100; k++) {
    const idx = (k + 1) % words.length;
    id += words[idx]![0]!.toUpperCase();
    if (!isTaken(id)) return id;
  }
  return uniqueWithSuffix(initials, isTaken);
}

export function projectIdFromCwd(
  cwd: string,
  isTaken: (id: string) => boolean,
): string {
  return deriveProjectId(basename(resolve(cwd)), isTaken);
}

function tokenize(name: string): string[] {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length > 0)
    .filter((w) => /^[a-zA-Z]/.test(w))
    .filter((w) => !STOPWORDS.has(w.toLowerCase()))
    .map((w) => w.toLowerCase());
}

function uniqueWithSuffix(base: string, isTaken: (id: string) => boolean): string {
  if (!isTaken(base)) return base;
  let i = 2;
  while (isTaken(`${base}${i}`)) i++;
  return `${base}${i}`;
}
