# ARC: Local-First Project Orchestrator

ARC is a project management CLI designed for both humans and AI agents. It uses a JIRA-lite schema stored in a local SQLite database and provides an interactive TUI (built with Ink) as well as machine-readable JSON outputs for seamless integration with coding agents.

## Project Overview

- **Purpose:** Local-first, AI-agent-optimized project management.
- **Tech Stack:**
  - **Runtime:** Node.js (v20+)
  - **Language:** TypeScript
  - **TUI:** [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
  - **Database:** SQLite via `better-sqlite3`
  - **CLI Engine:** `Commander.js`
- **Architecture:**
  - `src/db`: Connection management and migrations.
  - `src/repositories`: Data access layer (CRUD operations for projects, tasks, etc.).
  - `src/services`: Business logic (task transitions, export logic).
  - `src/commands`: CLI command definitions.
  - `src/tui`: Ink-based interactive dashboard.
  - `src/integrations`: Bootstrap logic for AI agents (Claude, Codex, Gemini).

## Building and Running

### Development
- **Run from source:** `npm run dev -- <command>` (uses `tsx`)
- **Build:** `npm run build` (compiles TS to `dist/` and copies assets)
- **Test:** `npm test` (uses `vitest`)
- **Watch Tests:** `npm run test:watch`

### Global Installation
- **Local Link:** `npm link` (makes `arc` available globally)

## Development Conventions

### Coding Style
- **ESM:** The project uses Native ES Modules (`"type": "module"` in `package.json`).
- **Strict Typing:** TypeScript is used throughout with strict mode enabled.
- **Surgical Edits:** Prefer small, targeted changes to existing files.

### Database
- **Migrations:** SQL migrations are located in `src/db/migrations/`.
- **Transactions:** Use `db.transaction()` for multi-step database operations.

### TUI Development
- **React-based:** The TUI is built with React components via Ink.
- **State Management:** Uses a custom store pattern in `src/tui/store.tsx`.
- **Responsive:** The layout adapts to terminal size (narrow vs. wide).

### Testing
- **Vitest:** Primary testing framework.
- **Unit Tests:** Located in `tests/unit/`.
- **TUI Testing:** Uses `ink-testing-library` for TUI components.

## AI Agent Integration

ARC is specifically designed to be used by AI agents like yourself.
- **Machine-Readable:** Most commands support a `--json` flag.
- **Schema Discovery:** `arc schema` dumps the JSON Schema for imports.
- **Project Context:** ARC uses a `.arc/project.json` file in the project root to pin the CWD to a specific project ID.

### Key Agent Workflows
1. `arc next --json`: Identify the next high-priority task.
2. `arc show <id>`: Get full context on a task.
3. `arc update <id> <status>`: Update task progress.
4. `arc log <id> "note"`: Document findings or progress.
