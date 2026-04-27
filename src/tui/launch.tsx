import React from 'react';
import { render } from 'ink';
import { openDatabase, closeDatabase } from '../db/connection.js';
import { ProjectService } from '../services/projectService.js';
import { findProjectContext } from '../utils/projectContext.js';
import { StoreProvider } from './store.js';
import { App } from './App.js';

export async function launchTui(): Promise<void> {
  const db = openDatabase();
  const projects = new ProjectService(db).list();
  if (projects.length === 0) {
    process.stdout.write(
      "No projects yet. Run `arc init <ID>` (e.g. `arc init ARC`) to create one.\n",
    );
    db.close();
    return;
  }
  const ctx = findProjectContext();
  const initialProjectId = ctx?.context.projectId ?? projects[0]?.id ?? null;

  const app = render(
    <StoreProvider db={db} initialProjectId={initialProjectId}>
      <App />
    </StoreProvider>,
  );
  await app.waitUntilExit();
  db.close();
  closeDatabase();
}
