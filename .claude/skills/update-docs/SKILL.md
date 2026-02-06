---
name: update-docs
description: Update README documentation in the folder of changed components/abstractions to reflect code changes — keeps docs lean, precise, and in sync
---

# Update Docs Skill

Update README.md files in the folders where code was changed. Documentation lives next to the code it describes — each component/abstraction folder has its own README.

## When to Use

Activate this skill when:
- The user explicitly asks to update documentation after changes
- After completing a task that adds, removes, or significantly modifies files in a component/abstraction folder

## Principles

1. **Co-located** — Each README lives in the folder it documents
2. **Lean** — Only document what helps a developer understand the folder's purpose, structure, and patterns
3. **Precise** — Accurate file names, sizes, type counts, and descriptions
4. **Compact** — No verbose prose. Use tables, bullet points, and code snippets
5. **Delta-driven** — Only update sections affected by the change. Don't rewrite unrelated content

## README Structure Convention

Each folder's README follows this skeleton (sections included only when relevant):

```markdown
# folder-name/ - Short Purpose

One-sentence overview. Contains **N files**.

## Architecture
[Only if the folder has a non-obvious entry point, router, or coordination pattern]

## Components / Modules / Types
[Table or bullet list of files with one-line descriptions]

## Pattern
[Code snippet showing the common pattern, if one exists]
```

## What to Document

| Change Type | Documentation Action |
|---|---|
| New file added | Add entry to the file list with one-line description |
| File removed | Remove entry from the file list |
| File renamed | Update the entry |
| New pattern introduced | Add/update the Pattern section |
| Architecture change | Update the Architecture section |
| File count changed | Update the count in the overview line |
| New block/menu/popup type | Add to the relevant type list |

## What NOT to Document

- Implementation details that are obvious from reading the code
- Function-level API docs (that's what the code and types are for)
- Changelog/history of what changed when
- TODO items or future plans
- Descriptions longer than one sentence per file
- Redundant information already in CLAUDE.md

## Process

1. **Identify affected folders** — Determine which folders had files added, removed, or significantly changed
2. **Read existing README** — Check if a README.md exists in each affected folder
3. **Determine delta** — Compare the change against what the README currently says
4. **Apply minimal update** — Edit only the affected lines/sections
5. **Verify accuracy** — Ensure file names, counts, and descriptions match reality

## Scope Rules

- Only update READMEs in folders where code actually changed
- If a folder has no README yet and the change is significant (new subfolder, new abstraction layer), create one following the convention
- If the change is trivial (typo fix, minor logic tweak), skip documentation update
- Never update CLAUDE.md from this skill — that file has its own maintenance process

## Examples

### File added to block/
```
Change: Added `src/ts/component/block/ai.tsx`

Action: Edit `src/ts/component/block/README.md`
- Update file count in overview line
- Add entry under "Other Blocks":
  - `ai.tsx` - AI-generated content block
```

### New store added
```
Change: Added `src/ts/store/theme.ts`

Action: Edit `src/ts/store/README.md`
- Add row to the Stores table:
  | `theme.ts` | `S.Theme` | Theme management: color schemes, dark mode preferences |
```

### File removed from menu/
```
Change: Removed `src/ts/component/menu/legacySearch.tsx`

Action: Edit `src/ts/component/menu/README.md`
- Remove entry for legacySearch from the menu types list
- Update count if mentioned
```

### New subfolder created
```
Change: Created `src/ts/component/block/ai/` with index.tsx, toolbar.tsx, preview.tsx

Action: Create `src/ts/component/block/ai/README.md`:
  # ai/ - AI Content Block

  AI-generated content blocks with toolbar controls and preview. Contains **3 files**.

  ## Files
  - `index.tsx` - Main block component, renders AI content with edit/regenerate actions
  - `toolbar.tsx` - Prompt input and model selection toolbar
  - `preview.tsx` - Streaming preview of AI-generated content

Also update parent `src/ts/component/block/README.md` to reference the new subfolder.
```
