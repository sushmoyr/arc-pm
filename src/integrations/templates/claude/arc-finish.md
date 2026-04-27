---
name: arc-finish
description: Log a completion note on the active task and mark it DONE.
argument-hint: [task-id] [worklog-note]
---

Arguments (both optional):
- $1 — task ID to finish. If empty, find the task currently IN_PROGRESS.
- $2 — worklog note. If empty, infer a one-line summary from the task's title and description.

Steps:

1. Determine the target task:
    - If $1 is provided, use it as the task ID.
    - Otherwise, run `arc list -s IN_PROGRESS --json`.
        - If 0 tasks, tell the user nothing is in progress and stop.
        - If exactly 1 task, use its ID.
        - If more than 1, list them and ask the user which to finish.

2. Determine the worklog summary:
    - If $2 is provided, use it verbatim.
    - Otherwise, run `arc show <id> --markdown` and write a one-line summary of the completed work based on the title and description.

3. Run `arc log <id> '<summary>'` (use single quotes; escape any single quotes in the summary). Then run `arc update <id> DONE`.

4. Run `arc next --json`. Show the next task to the user and ask whether to start it. If yes, run `arc update <next-id> IN_PROGRESS`.