import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePaths } from '../utils/paths.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, 'migrations');

let cached: DatabaseType | null = null;

export interface OpenOptions {
  /** Override path; if omitted, uses ARC_HOME/env-paths. Pass ':memory:' for tests. */
  path?: string;
}

export function openDatabase(opts: OpenOptions = {}): DatabaseType {
  const dbPath = opts.path ?? resolvePaths().dbPath;
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

export function getDatabase(): DatabaseType {
  if (!cached) cached = openDatabase();
  return cached;
}

export function closeDatabase(): void {
  if (cached) {
    cached.close();
    cached = null;
  }
}

function runMigrations(db: DatabaseType): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r) => (r as { name: string }).name),
  );
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const insert = db.prepare('INSERT INTO _migrations (name) VALUES (?)');
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      insert.run(file);
    })();
  }
}
