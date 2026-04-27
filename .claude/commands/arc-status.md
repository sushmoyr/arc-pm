---
name: arc-status
description: Show a one-screen project status board.
---

Show the project board.

1. Run `arc list --json`.
2. Group by status. For each non-empty status, print: `STATUS (n)` then bullets of `<id> [P<priority>] <title>`.
3. End with: "next up: <output of `arc next --json` first item, or 'nothing unblocked'>".
4. Keep it terse — under 30 lines.
