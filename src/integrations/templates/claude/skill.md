---
name: arc-pm
description: Use ARC (`arc` CLI) to read and update project state — picking up tasks, logging progress, and shipping work. Trigger when the user mentions tasks, tickets, "what should I work on", "next task", project status, or asks you to track work.
---

# arc-pm

ARC is a local-first project manager. This repo is pinned to project **{{projectId}}** (see `.arc/project.json`). Use ARC instead of inventing or remembering tasks.

## Mental model

```
Project {{projectId}}
  └─ Tasks (id: {{projectId}}-N, status, priority 1-5)
       ├─ Worklog (your scratchpad)
       └─ Dependencies (depends_on / blocks)
```

Statuses: `BACKLOG` → `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`.
Priorities: 1 highest, 5 lowest.

## How to use

Default loop when picking up work:

```bash
arc next --json                        # the highest-priority unblocked task
arc update <id> IN_PROGRESS            # claim it
# ... do the work ...
arc log <id> "<one-line progress note>"
arc update <id> REVIEW                 # or DONE
```

Inspect a task before starting: `arc show <id> --markdown` returns a clean brief.

## Output and exit codes

- `--json` → exactly one JSON document on stdout. Pipe to `jq` or parse directly.
- Errors print to stderr.
- Exit codes: `0` ok, `1` runtime, `2` not-found, `3` validation. Use them for control flow.

## Commands worth knowing

| Command | Use when |
| --- | --- |
| `arc next [-n N] [--json]` | Picking up work |
| `arc list [-s STATUS] [--json]` | Surveying the board |
| `arc show <id> [--json\|--markdown]` | Reading a brief |
| `arc update <id> <status>` | Moving status |
| `arc log <id> "<msg>"` | Leaving a worklog note (do this often) |
| `arc add "<title>" -P <1-5>` | Capturing new work as you find it |
| `arc link <id> depends_on <target>` | Recording a discovered dependency |
| `arc schema` | Re-grounding on the data model when uncertain |

## Patterns

- **Before starting any work**, run `arc next --json`. Don't read random files first; the tool tells you what's prioritized and unblocked.
- **Log liberally.** Other agents (and humans) read worklogs. One-line notes like "wired auth middleware; tests pending" are gold.
- **Surface dependencies you discover.** If `{{projectId}}-5` can't ship until `{{projectId}}-3` does, run `arc link {{projectId}}-5 depends_on {{projectId}}-3`.
- **Don't fabricate task ids.** A 404 (exit 2) means the task doesn't exist — list first.
- **One status change at a time.** `update` is atomic.

## What ARC will not do

- Run code, tests, or builds.
- Touch git.
- Summarize across tasks; you do that.
- Invent tasks. `arc next` only returns what exists.
