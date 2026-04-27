import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import type { Database as Db } from 'better-sqlite3';
import { openDatabase, closeDatabase } from '../../src/db/connection.js';
import { ProjectService } from '../../src/services/projectService.js';
import { TaskService } from '../../src/services/taskService.js';
import { StoreProvider } from '../../src/tui/store.js';
import { App } from '../../src/tui/App.js';
import { nextStatus, prevStatus, STATUS_CYCLE } from '../../src/tui/config/statusModel.js';
import { keymap, paletteActions } from '../../src/tui/config/keymap.js';

const flush = async (ticks = 8): Promise<void> => {
  for (let i = 0; i < ticks; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

describe('statusModel', () => {
  it('cycles forward and wraps', () => {
    const start = STATUS_CYCLE[0]!;
    let s = start;
    for (let i = 0; i < STATUS_CYCLE.length; i++) s = nextStatus(s);
    expect(s).toBe(start);
  });

  it('prevStatus is inverse of nextStatus', () => {
    for (const s of STATUS_CYCLE) {
      expect(prevStatus(nextStatus(s))).toBe(s);
    }
  });
});

describe('keymap registry', () => {
  it('every mode declares an esc/close binding (except browse, which has q quit)', () => {
    for (const mode of Object.keys(keymap) as (keyof typeof keymap)[]) {
      const bindings = keymap[mode];
      const hasExit =
        bindings.some((b) => b.keys.includes('esc')) ||
        bindings.some((b) => b.action === 'app.quit');
      expect(hasExit, `mode '${mode}' must expose an exit binding`).toBe(true);
    }
  });

  it('palette exposes core navigation actions', () => {
    const ids = paletteActions().map((b) => b.action);
    expect(ids).toContain('mode.search.open');
    expect(ids).toContain('help.toggle');
    expect(ids).toContain('entity.openEdit');
    expect(ids).toContain('undo');
  });
});

describe('TUI redesign behaviors', () => {
  let db: Db;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    const ps = new ProjectService(db);
    const ts = new TaskService(db);
    ps.create({ id: 'TST', name: 'Test' });
    ts.create({ project_id: 'TST', title: 'alpha', priority: 1 });
    ts.create({ project_id: 'TST', title: 'beta', priority: 2 });
    ts.create({ project_id: 'TST', title: 'gamma', priority: 3 });
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('? toggles help overlay', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    expect(lastFrame() ?? '').not.toContain('Help — Browse');
    stdin.write('?');
    await flush();
    expect(lastFrame() ?? '').toContain('Help — Browse');
    stdin.write('?');
    await flush();
    expect(lastFrame() ?? '').not.toContain('Help — Browse');
  });

  it('/ opens search and filters tasks live', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('/');
    await flush();
    expect(lastFrame() ?? '').toContain('Search tasks');
    stdin.write('beta');
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('beta');
    expect(frame).toContain('1 match');
  });

  it('cycle status emits a toast', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('s');
    await flush();
    expect(lastFrame() ?? '').toMatch(/TST-\d+ → IN_PROGRESS/);
  });

  it('undo reverts the last status change', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('s'); // TODO -> IN_PROGRESS
    await flush();
    expect(lastFrame() ?? '').toContain('IN_PROGRESS');
    stdin.write('u');
    await flush();
    // After undo, the status is back to TODO; the toast confirms it.
    expect(lastFrame() ?? '').toMatch(/→ TODO/);
  });

  it('Ctrl+P opens command palette', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('\x10'); // Ctrl+P
    await flush();
    expect(lastFrame() ?? '').toContain('Command palette');
  });

  it('opens project detail when projects pane is focused', async () => {
    const ps = new ProjectService(db);
    ps.update('TST', { description: 'Sample description', tech_stack: 'Node + Ink' });

    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('\t'); // tab — focus projects
    await flush();
    stdin.write('\r'); // enter
    await flush();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Sample description');
    expect(frame).toContain('Node + Ink');
  });

  it('edits project description and persists', async () => {
    const { lastFrame, stdin } = render(
      <StoreProvider db={db} initialProjectId="TST">
        <App />
      </StoreProvider>,
    );
    await flush();
    stdin.write('\t'); // focus projects
    await flush();
    stdin.write('e'); // open edit
    await flush();
    expect(lastFrame() ?? '').toContain('Edit project TST');
    // Field 0 (name) is focused; tab once to skip to description.
    stdin.write('\t');
    await flush();
    stdin.write('hello world');
    await flush();
    stdin.write('\x13'); // Ctrl+S to save
    await flush();
    // After save we land back in projectdetail with the new value rendered.
    expect(lastFrame() ?? '').toContain('hello world');
    // And it persisted to the DB.
    const ps = new ProjectService(db);
    expect(ps.get('TST')?.description).toBe('hello world');
  });
});
