---
name: release-notes
description: Write and update release notes in whatsNew.ts
---

Write or update release notes in `src/ts/docs/help/whatsNew.ts`.

## Instructions

1. Read the skill guidelines from `.claude/release-notes/SKILL.md`

2. Parse the user's command arguments: $ARGUMENTS

3. Determine the action:
   - `feature "Title" [context]` - Add big feature (h1 section)
   - `qol "Title" [context]` - Add QoL improvement
   - `fix "Category" [context]` - Add bug fix
   - `from-parent JS-XXXX` - Batch from Linear parent issue
   - `new "0.XX.0" "Title"` - Create new release page
   - `show` - Display current release notes

4. Resolve context if provided:
   - `today`/`session` - Summarize what was discussed/built in this conversation
   - `branch` - Analyze current git branch commits and changes
   - `JS-XXXX` - Fetch from Linear API (requires LINEAR_API_KEY)
   - Explicit text - Use as provided

5. Read `src/ts/docs/help/whatsNew.ts` to find the correct insertion point

6. Write the release note entry following the format and style guidelines in the skill file

7. Edit whatsNew.ts to insert the new entry at the correct location

8. Show the user what was added

## Context Awareness

If the user says "today" or "session", analyze this conversation to understand:
- What features were implemented
- What problems were solved
- What the user-facing benefits are

Write the release note from the user's perspective, not the developer's.
