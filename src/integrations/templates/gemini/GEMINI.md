# Gemini context

This repository uses ARC for task tracking. Project id: **{{projectId}}** (pinned in `.arc/project.json`).

## Standard workflow

```bash
arc next --json                    # highest-priority unblocked task
arc update <id> IN_PROGRESS
# ... do the work ...
arc log <id> "<short progress note>"
arc update <id> DONE
```

## Commands

| Command | Use |
| --- | --- |
| `arc list [--json] [-s STATUS]` | Board overview |
| `arc show <id> --markdown` | Task brief |
| `arc add "<title>" -P <1-5>` | Capture new work |
| `arc link <id> depends_on <target>` | Record dependency |
| `arc schema` | Dump DDL |

## Contract

- `--json` outputs one JSON document on stdout. Errors on stderr.
- Exit codes: `0` ok, `1` runtime, `2` not-found, `3` validation.
- Log to worklog often; the next agent reads it.
