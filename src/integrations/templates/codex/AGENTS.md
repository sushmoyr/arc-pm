# Agent guide

This repository uses ARC for task tracking. The current project id is **{{projectId}}** (pinned in `.arc/project.json`).

## Pick up work

```bash
arc next --json                    # highest-priority unblocked task
arc update <id> IN_PROGRESS
# ... do the work ...
arc log <id> "<short progress note>"
arc update <id> DONE
```

## Useful commands

- `arc list [--json] [-s STATUS]` — board overview
- `arc show <id> --markdown` — task brief, paste-ready into context
- `arc add "<title>" -P <1-5> [-t TASK|BUG|STORY|EPIC]` — capture new work
- `arc link <id> depends_on <target>` — record a discovered dependency
- `arc schema` — dump DDL when uncertain about the data model

## Output contract

- `--json` is the agent-facing surface: one valid JSON document on stdout, nothing else.
- Errors go to stderr. Exit codes: `0` ok, `1` runtime, `2` not-found, `3` validation.

## Conventions

- Log liberally. Worklogs are how the next agent picks up where you left off.
- Don't invent task ids; `arc list --json` first if in doubt.
- Surface dependencies as you discover them with `arc link`.
