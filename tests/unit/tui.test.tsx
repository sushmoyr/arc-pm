import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import type { Database as Db } from 'better-sqlite3';
import { openDatabase, closeDatabase } from '../../src/db/connection.js';
import { ProjectService } from '../../src/services/projectService.js';
import { TaskService } from '../../src/services/taskService.js';
import { StoreProvider } from '../../src/tui/store.js';
import { App } from '../../src/tui/App.js';

const flush = async (ticks = 5): Promise<void> => {
  for (let i = 0; i < ticks; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

describe('Ink TUI', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    const ps = new ProjectService(db);
    const ts = new TaskService(db);
    ps.create({ id: 'TST', name: 'Test' });
    ts.create({ project_id: 'TST', title: 'first', priority: 1 });
    ts.create({ project_id: 'TST', title: 'second', priority: 2 });
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('renders projects and tasks on boot', () => {
    const { lastFrame } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('TST');
    expect(frame).toContain('first');
    expect(frame).toContain('second');
  });

  it('cycles status with `s`', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('s');
    await flush();
    expect(lastFrame() ?? '').toContain('IN_PROGRESS');
  });

  it('moves cursor with `j`', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('j');
    await flush();
    const frame = lastFrame() ?? '';
    const lines = frame.split('\n').filter((l) => l.includes('TST-'));
    const secondLineHasCursor = lines.some((l) => l.includes('▶') && l.includes('TST-2'));
    expect(secondLineHasCursor).toBe(true);
  });
});
