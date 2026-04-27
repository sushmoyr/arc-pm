\# PRD: ARC Project Orchestrator



\*\*Version:\*\* 1.0.0  

\*\*Status:\*\* Draft  

\*\*Focus:\*\* Local-first, AI-agent optimized project management.



\---



\## 1. Executive Summary

\*\*ARC\*\* is a CLI-based project management tool designed for the modern developer workflow. It serves two masters: the \*\*Human Developer\*\* (via a rich, interactive Ink-based TUI) and \*\*AI Agents\*\* (via structured SQL data and machine-readable CLI outputs). By adopting a JIRA-lite schema, ARC provides a standard mental model that AI agents can navigate to understand project context and execute tasks autonomously.



\## 2. Core Principles

\* \*\*Local-First:\*\* All data stays on the user's machine in a SQLite database.

\* \*\*Agent-Optimized:\*\* Commands provide clear, structured output (JSON/Markdown) for LLMs.

\* \*\*Low Friction:\*\* Minimal typing, high-speed interaction.

\* \*\*Zero-Config:\*\* Works out of the box with an `init` command.



\---



\## 3. Technical Stack

\* \*\*Runtime:\*\* Node.js (TypeScript)

\* \*\*UI Framework:\*\* \[Ink](https://github.com/vadimdemedes/ink) (React for CLI)

\* \*\*Database:\*\* SQLite via `better-sqlite3`

\* \*\*CLI Engine:\*\* `Commander.js` (for command parsing)

\* \*\*Global Installation:\*\* Symlinked via `npm link` for local development and global execution.



\---



\## 4. Data Architecture (JIRA-lite Schema)



\### 4.1. Projects

\* `id`: String (Slug, e.g., "ARC")

\* `name`: String

\* `description`: String

\* `tech\_stack`: String (Helpful for AI context)



\### 4.2. Tasks (The Core Entity)

\* `id`: String (Format: `PROJECT-INT`, e.g., `ARC-12`)

\* `parent\_id`: String (Reference to an \*\*Epic\*\* ID)

\* `type`: Enum (`EPIC`, `STORY`, `TASK`, `BUG`)

\* `title`: String

\* `description`: Markdown String

\* `status`: Enum (`BACKLOG`, `TODO`, `IN\_PROGRESS`, `REVIEW`, `DONE`)

\* `priority`: Integer (1-5, where 1 is highest)

\* `created\_at/updated\_at`: Timestamps



\### 4.3. Links \& Logs

\* \*\*Dependencies:\*\* `task\_id` -> `blocks/depends\_on` -> `target\_id`

\* \*\*Worklog:\*\* Simple thread of strings attached to a `task\_id` for agent notes.



\---



\## 5. Command Interface



\### 5.1. Global Shell Access

Users will install ARC by running `npm link` from the project root. This makes the `arc` command available system-wide.



\### 5.2. Command Map

| Command | Arguments | Description |

| :--- | :--- | :--- |

| `arc` | N/A | Launches the \*\*Interactive TUI\*\* (Ink Dashboard). |

| `arc init` | `\[name]` | Initializes the current directory as an ARC project. |

| `arc list` | `-g`, `--json` | Lists tasks (Grouped by project if `-g`). |

| `arc show` | `<id>` | Full detail view of a task and its worklog. |

| `arc update` | `<id> <status>` | Fast status switching for agents/humans. |

| `arc next` | `-n <count>` | Logic-based "Next Task" based on priority/deps. |

| `arc project` | `\[sub]` | Manage metadata like tech stack or project goals. |

| `arc log` | `<id> <msg>` | Add a comment/note to a specific task. |

| `arc schema` | N/A | Dumps the DB schema (for AI self-correction). |

| `arc import` | `<file>` | Batch import from JSON/CSV. |



\---



\## 6. User Experience (The "Ink" TUI)

When running the bare `arc` command:

1\.  \*\*Project Navigator:\*\* A sidebar or top-list to select active projects.

2\.  \*\*Task Board:\*\* A vertical list of tasks filtered by status.

3\.  \*\*Keybindings:\*\*

&#x20;   \* `j / k`: Navigate list.

&#x20;   \* `a`: Quick-add task.

&#x20;   \* `s`: Change status.

&#x20;   \* `q`: Quit.



\---



\## 7. Implementation Roadmap



\### Phase 1: Setup \& Persistence

\* \[ ] Configure `package.json` with `"bin": { "arc": "./dist/index.js" }`.

\* \[ ] Setup SQLite initialization in `\~/.config/arc/`.

\* \[ ] Implement the JIRA-lite schema migrations.



\### Phase 2: Headless CLI (Agent Layer)

\* \[ ] Build `commander` logic for all subcommands (`list`, `show`, `update`).

\* \[ ] Ensure `--json` flags return pure, valid JSON for agents.

\* \[ ] Implement `arc next` logic (Priority 1 + No blocking dependencies).



\### Phase 3: Interactive TUI (Human Layer)

\* \[ ] Build the `Ink` base component.

\* \[ ] Implement state management (React Hooks/Zustand) for the TUI.

\* \[ ] Add focus management between Project list and Task list.



\### Phase 4: Distribution

\* \[ ] Document `npm link` installation for local use.

\* \[ ] Create a `README.md` specifically for AI agents explaining how to use ARC to manage the project it is currently working on.



\---



\### How to use locally during development:

1\.  Clone the repo to `\~/projects/arc`.

2\.  Run `npm install` and `npm run build`.

3\.  Run `sudo npm link` (or `npm install -g .`).

4\.  Type `arc` anywhere in your terminal.

