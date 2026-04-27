---
name: arc-finish
description: Log a completion note on the active task and mark it DONE.
---

Finish the task currently in progress.

1. Run `arc list -s IN_PROGRESS --json`.
2. If 0 tasks, tell the user nothing is in progress and stop.
3. If >1 task, ask the user which one to finish.
4. Ask the user for a one-line summary of what was completed (the worklog note).
5. Run `arc log <id> "<summary>"`, then `arc update <id> DONE`.
6. Run `arc next --json` and offer to pick it up next.
