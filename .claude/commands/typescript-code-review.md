---
name: typescript-code-review
description: Review TypeScript code for type safety, best practices, and code quality
---

Review the TypeScript changes in this branch following these steps:

1. Get list of changed TS files with: git diff main --name-only -- '*.ts' '*.tsx'

2. Read the skill guidelines from .claude/typescript-code-review/SKILL.md

3. For each changed file, review the diff using: git diff main -- [file]

4. Provide structured feedback with:
   - Summary
   - Critical Issues
   - Important Improvements
   - Suggestions
   - Positive Observations

Use the reference files in .claude/typescript-code-review/references/ as needed.
