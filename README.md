# ARC

Local-first, AI-agent-optimized project management — a JIRA-lite CLI with both an interactive TUI for humans and clean structured outputs for LLMs.

```
arc init                              # derive id from cwd: "School Management System" → SMS
arc init . --ai claude                # …and bootstrap Claude Code skill + slash commands
arc init MYPROJ                       # …or pass an explicit JIRA-style id
arc add "Implement login" -P 1        # priority-1 task
arc next --json                       # what should I work on?
arc update SMS-3 IN_PROGRESS
arc log SMS-3 "started"
arc                                   # interactive TUI
```

### `arc init` — id derivation

Pass `.` (or no argument) to derive the project id from the current directory name. ARC takes the first letter of each word as a JIRA-style acronym; on collision it cycles through the words again starting at index 1:

| Directory                  | First init | If taken | If still taken |
|----------------------------|------------|----------|----------------|
| `School Management System` | `SMS`      | `SMSM`   | `SMSMS`        |
| `Recipe Box`               | `RB`       | `RBB`    | `RBBB`         |

Common stopwords (`the`, `of`, `and`, `a`, `an`, `to`, `in`, `on`, `for`) are dropped. Pass an explicit uppercase id (`arc init MYPROJ`) any time you want full control.

### `arc init --ai <claude\|codex\|gemini>`

Bootstraps a coding-agent integration in the project directory:

| Provider | Files written                                                                          |
|----------|----------------------------------------------------------------------------------------|
| `claude` | `.claude/skills/arc-pm/SKILL.md`, `.claude/commands/arc-{pickup,finish,status,add}.md` |
| `codex`  | `AGENTS.md`                                                                            |
| `gemini` | `GEMINI.md`                                                                            |

Existing files are preserved unless `--force` is also passed.

## Install (development)

```bash
git clone <repo> arc-pm
cd arc-pm
npm install        # also runs the build via "prepare"
npm link           # makes `arc` globally available
arc --help
```

`npm install` builds native bindings for `better-sqlite3`. Prebuilt binaries cover most platforms; if yours isn't covered, `npm install --build-from-source`.

## Storage

A single SQLite file at the platform-appropriate config dir:

| Platform | Path                               |
|----------|------------------------------------|
| Linux    | `~/.config/arc/arc.db`             |
| macOS    | `~/Library/Preferences/arc/arc.db` |
| Windows  | `%APPDATA%\arc\arc.db`             |

Override with `ARC_HOME=/some/dir`.

Each directory you `arc init` gets a `.arc/project.json` marker that pins it to a project ID, so `arc list` / `arc next` auto-scope to the project you're sitting in.

## Commands

| Command                               | Description                                                    |
|---------------------------------------|----------------------------------------------------------------|
| `arc`                                 | Launch the Ink TUI                                             |
| `arc init [id]`                       | Create a project (defaults to dir-name acronym); pin cwd to it |
| `arc add <title...>`                  | Create a task                                                  |
| `arc list`                            | List tasks (cwd-scoped, or `-g` to group by project)           |
| `arc show <id>`                       | Full task detail + worklog                                     |
| `arc update <id> <status>`            | Change status                                                  |
| `arc next`                            | Highest-priority unblocked task(s)                             |
| `arc log <id> <msg>`                  | Append a worklog note                                          |
| `arc link <task> <kind> <target>`     | Add `blocks` / `depends_on`                                    |
| `arc project list\|show\|set\|delete` | Project metadata                                               |
| `arc schema [--example]`              | Dump JSON Schema for `arc import` files (or `--example`)       |
| `arc import <file>`                   | Batch import JSON                                              |
| `arc export`                          | Export current project to `json` / `md` / `csv`                |

Every command supports `--json` for machine-readable output.

### Generating import-ready payloads with an LLM

`arc schema` emits a JSON Schema (Draft 7) for the `arc import` file format, generated directly from the live Zod schemas so it never drifts. Pipe it into your prompt to make agents produce valid payloads on the first try:

```bash
arc schema           # JSON Schema for arc import files
arc schema --example # minimal sample payload, useful as a few-shot
arc schema --example > seed.json && arc import seed.json
```

## TUI

The TUI is responsive (single-pane below 80 cols, split layout above) and discoverable — press `?` at any time to see the keymap for the current mode, or `Ctrl+P` for a fuzzy command palette. Every mutating action emits a toast, and `u` undoes the last status change or edit.

### Browse

| Key       | Action                                                      |
|-----------|-------------------------------------------------------------|
| `j` / `k` | Move cursor (also `↓` / `↑`)                                |
| `Tab`     | Swap focus between Projects and Tasks                       |
| `Enter`   | Open detail (project or task, depending on focused pane)    |
| `e`       | Edit (project or task, depending on focused pane)           |
| `a`       | Quick-add task to the selected project                      |
| `s`       | Cycle task status (TODO → IN_PROGRESS → REVIEW → DONE → BACKLOG) |
| `Space`   | Toggle multi-select on a task                               |
| `/`       | Search / filter tasks by id, title, status, or type         |
| `?`       | Help overlay (always available)                             |
| `Ctrl+P`  | Command palette (always available)                          |
| `u`       | Undo last status change or edit                             |
| `q`       | Quit                                                        |

### Task detail

| Key            | Action                              |
|----------------|-------------------------------------|
| `e`            | Edit title, description, priority, type |
| `l`            | Log work (append a worklog message) |
| `b` / `d`      | Add a `blocks` / `depends_on` link  |
| `Esc` / `q`    | Close                               |

### Project detail

| Key            | Action                              |
|----------------|-------------------------------------|
| `e`            | Edit name, description, tech_stack  |
| `Esc` / `q`    | Close                               |

### Forms (edit, search, palette, etc.)

| Key            | Action                              |
|----------------|-------------------------------------|
| `Tab` / `Shift+Tab` | Move between fields            |
| `←` / `→`      | Cycle picker values (priority, type) |
| `Ctrl+S`       | Save                                |
| `Esc`          | Cancel                              |

## Development

```bash
npm run dev -- list               # run from source via tsx
npm run build                     # tsc → dist/
npm test                          # vitest
```

## License

MIT.
