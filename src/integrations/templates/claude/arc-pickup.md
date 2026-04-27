---
name: arc-pickup
description: Pick the next ARC task (or a specific one), mark it IN_PROGRESS, and print a brief.
argument-hint: [task-id]
---

Argument (optional):
- $1 — task ID to pick up. If empty, automatically select the next available task via `arc next`.

Steps:

1. Determine the target task:
    - If $1 is provided, treat it as the task ID and skip to step 3.
    - Otherwise, run `arc next --json`.

2. If `arc next` returned `[]`, tell the user there are no unblocked tasks and stop. Otherwise, take the first task's ID.

3. Check the task's current state by running `arc show <id> --json` (or `--markdown` if JSON is unavailable) and inspect its status:
    - If status is `DONE` (or any other terminal/closed state), tell the user the task is already finished and ask whether to proceed anyway or abort. Stop unless they confirm.
    - If status is `IN_PROGRESS`, do NOT re-run `arc update`. Instead:
      a. Inform the user the task is already in progress.
      b. Inspect the codebase to assess current progress: read the task title and description from the `arc show` output, then search the repo for related files, recent commits, branches, or partial implementations that match the task's scope (use `git log`, `git status`, `git branch`, and Grep/Glob as appropriate).
      c. Summarize for the user: what looks done, what looks in-flight, and what appears untouched.
      d. Skip step 4 and go to step 5.
    - Otherwise (TODO, BLOCKED, or any non-terminal pre-start state), run `arc update <id> IN_PROGRESS`.

4. Run `arc show <id> --markdown` and present the brief to the user.

5. Wait for the user's next instruction. Do not start work until they confirm.