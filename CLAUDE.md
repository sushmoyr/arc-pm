# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ARC is a local-first, AI-agent-optimized JIRA-lite CLI. It exposes a Commander-based CLI (`arc`) with both an Ink-based interactive TUI for humans and JSON outputs (`--json`) for LLM consumers. Storage is a single SQLite file (`better-sqlite3`) at a platform-appropriate config dir, overridable with `ARC_HOME`.

## Common commands

```bash
npm install                  # also runs build via "prepare" — required before `arc` works
npm run dev -- <args>        # run from source via tsx (e.g., `npm run dev -- list`)
npm run build                # tsc → dist/, then scripts/copy-assets.mjs copies migrations + templates
npm test                     # vitest run (all tests)
npm run test:watch           # vitest watch mode
npx vitest run tests/unit/taskService.test.ts   # run a single test file
npx vitest run -t "creates a task"              # run tests matching a name
npm link                     # makes `arc` globally available (uses ./dist/index.js)
```

Node ≥ 20 is required. There is no lint script — TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`) is the only static check.

Coverage thresholds (see `vitest.config.ts`): 80% lines/functions/statements, 70% branches. `src/index.ts` and `src/tui/**` are excluded from coverage.

## Architecture

Layered, with a strict dependency direction: `commands → services → repositories → db`. Cross-cutting concerns (validation schemas, formatting, project context) live in `types/` and `utils/`.

### Layers

- **`src/index.ts`** — CLI entry. Wires Commander subcommands; if no args, lazy-imports and launches the TUI.
- **`src/commands/*.ts`** — One file per subcommand (`add`, `list`, `init`, `next`, `update`, `log`, `link`, `import`, `export`, `project`, `schema`, `show`). Each exports a `build<Name>Command()` factory that returns a Commander `Command`. Commands open the DB, instantiate a service, and route output through `utils/output.ts` (`render(value, opts, prettyPrinter)` — `--json` is supported by every command).
- **`src/services/*.ts`** — `TaskService`, `ProjectService`, `ExportService`. Services validate inputs with Zod (`types/domain.ts`), enforce invariants (e.g., parent must belong to same project, no self-dependencies), wrap multi-statement work in `db.transaction`, and throw `ValidationError` / `NotFoundError` from `utils/errors.ts`.
- **`src/repositories/*.ts`** — `projectRepo`, `taskRepo`, `worklogRepo`, `dependencyRepo`. Pure SQL via `better-sqlite3` prepared statements. `taskRepo.findReady()` powers `arc next` (priority-ordered, dependency-unblocked tasks).
- **`src/db/connection.ts`** — Opens DB, sets `journal_mode = WAL` and `foreign_keys = ON`, runs migrations idempotently from `src/db/migrations/*.sql` tracked in a `_migrations` table. `:memory:` path is supported for tests. Migrations dir resolves relative to the compiled file, which is why `scripts/copy-assets.mjs` copies `src/db/migrations` → `dist/db/migrations` after `tsc`.
- **`src/types/domain.ts`** — Zod schemas are the source of truth for the domain (`Project`, `Task`, `Worklog`, `Dependency`, status/type/priority enums, ID regex). Always import types from here rather than redeclaring shapes.

### Project context (cwd scoping)

`utils/projectContext.ts` walks up from cwd looking for `.arc/project.json`, which pins a directory tree to a project ID. `arc init` writes this file and appends `.arc/` to `.gitignore` if one exists. Commands like `list` and `next` use this to auto-scope. The global SQLite DB still holds all projects — the marker just selects which one is "current."

### Project ID derivation

`utils/projectId.ts` — `arc init` (or `arc init .`) derives a JIRA-style acronym from the cwd: first letter of each word, stopwords dropped (`the`, `of`, `and`, `a`, `an`, `to`, `in`, `on`, `for`). On collision, cycles through words again starting at index 1 (`SMS` → `SMSM` → `SMSMS`).

### AI integrations

`src/integrations/` — `arc init --ai <claude|codex|gemini>` writes provider-specific files into the project directory from `src/integrations/templates/`. `claude.ts` writes `.claude/skills/arc-pm/SKILL.md` and `.claude/commands/arc-{pickup,finish,status,add}.md`; `codex.ts` writes `AGENTS.md`; `gemini.ts` writes `GEMINI.md`. Templates are copied to `dist/integrations/templates/` at build time. Existing files are preserved unless `--force`.

### TUI

`src/tui/` — Ink + React. `launch.tsx` is the entry; `App.tsx` is the root; `screens/`, `components/`, `primitives/`, `hooks/`, `store.tsx`, `config/` follow standard React layout. Tested with `ink-testing-library`. The TUI is excluded from coverage.

## Conventions specific to this codebase

- **NodeNext ESM, `.js` extensions in imports.** `tsconfig.json` uses `"module": "NodeNext"`, so all relative imports must use the `.js` suffix even in `.ts` source (`import { TaskService } from '../services/taskService.js'`). This is non-negotiable — TypeScript will not rewrite them.
- **Zod is the validation boundary.** Parse at service entry (`NewTaskInput.parse(raw)`, `TaskIdSchema.parse(id)`); below that layer, types are trusted. Don't add redundant runtime checks in repositories.
- **Every command supports `--json`.** When adding a new command, route output through `render()` / `renderJson()` / `renderText()` from `utils/output.ts`. Never `console.log` directly.
- **Errors are typed.** Throw `ValidationError` / `NotFoundError` from `utils/errors.ts`. The top-level `main().catch(exitWithError)` in `src/index.ts` formats them and sets the exit code — don't catch and re-print at the command level.
- **DB migrations are append-only SQL files.** Add `00N_description.sql` to `src/db/migrations/`; they're applied in lexical order and tracked in `_migrations`. Do not edit existing migrations.
- **Build assets.** If you add a new directory of runtime assets (templates, SQL, etc.), update `scripts/copy-assets.mjs` so they end up in `dist/` — `tsc` alone won't copy non-TS files.
- **Tests live in `tests/unit/`** and are included via `vitest.config.ts`'s `tests/**/*.test.{ts,tsx}` pattern. Use `openDatabase({ path: ':memory:' })` for service/repo tests instead of mocks.