---
name: arc-add
description: Capture a new task from a natural-language line.
---

Add a task to ARC.

1. Take the user's line as the task title.
2. Infer:
   - **type**: `BUG` if the line mentions a bug/error/regression/crash; `EPIC` if it mentions "track" or "umbrella" or is too broad; `STORY` if it describes a user-visible behavior; otherwise `TASK`.
   - **priority**: 1 if "urgent/asap/blocking", 2 if "soon", 4 if "nice to have", else 3.
3. Run `arc add "<title>" -t <TYPE> -P <priority> --json`.
4. Print the new task id and confirm.
