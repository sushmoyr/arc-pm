---
name: arc-pickup
description: Pick the next ARC task, mark it IN_PROGRESS, and print a brief.
---

Pick up the next available task.

1. Run `arc next --json`.
2. If the result is `[]`, tell the user there are no unblocked tasks and stop.
3. Otherwise, take the first task. Run `arc update <id> IN_PROGRESS`.
4. Run `arc show <id> --markdown` and present the brief to the user.
5. Wait for the user's next instruction. Do not start work until they confirm.
