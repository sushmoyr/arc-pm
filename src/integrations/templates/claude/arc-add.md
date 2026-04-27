---
name: arc-add
description: Capture a new task — title from natural language, description and priority via prompt.
argument-hint: <task title>
---

Argument:
- $ARGUMENTS — the natural-language task title. If empty, ask the user what task to add via the question answer tool.

Steps:

1. Derive the task title from $ARGUMENTS:
   - Strip leading verbs/phrases like "add a task to", "remind me to", "we need to", "create a task for".
   - Trim trailing punctuation. Keep under ~80 characters.
   - Preserve the user's wording where possible; do not paraphrase aggressively.

2. Infer the type from the original $ARGUMENTS text (case-insensitive):
   - `BUG` if it mentions bug, error, regression, crash, broken, fails, throws, exception, or "doesn't work"
   - `EPIC` if it mentions track, umbrella, initiative, roadmap, or describes scope spanning multiple deliverables
   - `STORY` if it describes user-visible behavior ("user can…", "as a…", "allow …ing", or feature framing)
   - `TASK` otherwise

3. Use the question/answer tool to ask the user TWO questions in a single call:

   **Question 1 — Priority** (single_select):
   - "P1 — Urgent / blocking"
   - "P2 — Soon / high"
   - "P3 — Normal (default)"
   - "P4 — Nice to have"
   - "P5 — Someday / backlog"

   **Question 2 — Description** (free-form via a follow-up message, since the Q&A tool is for selections):
   Actually, the Q&A tool only handles selections. So instead: after collecting priority via the tool, ask the user in plain text:
   "Give me a 1–3 sentence description for AI agent context. This should explain what the task involves, any relevant files/areas of the codebase, and the expected outcome. Reply 'skip' to leave it empty."

   Wait for both answers before continuing.

4. Show the user a one-line preview of what will be created:
   `→ <TYPE> · P<n> · "<title>"`
   `   <description, truncated to ~100 chars or "(no description)">`

5. Run:
   `arc add "<title>" -t <TYPE> -P <priority> -d "<description>" --json`
   - Properly escape any double quotes in the title and description.
   - Omit `-d` entirely if the user replied "skip".

6. Parse the JSON response and confirm:
   `Added <id> (<TYPE>, P<n>).`

7. If the create command fails, show the error and do not retry silently.