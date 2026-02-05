---
name: release-notes
description: Write and update release notes in whatsNew.ts with context-aware content generation
---

# Release Notes Skill

Write and update release notes in `src/ts/docs/help/whatsNew.ts`. This skill can generate release note content from conversation context, git branch changes, or Linear issues.

## Document Structure

The file `src/ts/docs/help/whatsNew.ts` exports a function that returns an array of block elements. Each release is a "page" with this structure:

```typescript
// Helper definitions at top of file (lines 1-24)
const hl = (t: string) => `<span class="highlight">${t}</span>`;
const text = (t: string) => block(I.TextStyle.Paragraph, t);
const h1 = (t: string) => block(I.TextStyle.Header1, t);
const h2 = (t: string) => block(I.TextStyle.Header2, t);
const bullet = (t: string) => block(I.TextStyle.Bulleted, t);
const img = (src: string) => text(`<img src="..." />`);
const link = (url: string, t: string) => `<a href="${url}">${t}</a>`;
const div = () => ({ type: I.BlockType.Div, style: I.DivStyle.Dot });

// Release pages start after helpers (~line 25)
return [
    { type: I.BlockType.IconPage, icon: '...' },

    title(`Catchy Release Title`),           // PAGE START
    h4(`<span>Release 0.XX.0</span>`),
    text(''),
    text('Intro paragraph...'),
    text(''),

    // Big Feature Sections (h2)
    h2(`Feature Name`),
    text(`Feature description...`),
    img(`XX/1.png`),
    text(``),

    // Quality of Life Improvements
    h2(`Quality of Life Improvements`),
    text(``),
    text(`<b>Improvement Name</b>`),
    text(`Description...`),
    text(``),

    // Bug Fixes
    h2(`Bug Fixes`),
    text(``),
    text(`<b>Category Name</b>`),
    bullet(`Fix description. Thanks to @${link('url', 'user')}!`),
    text(``),

    div(),                                   // PAGE END
    // --------------------------------------------//

    // Next release page...
];
```

## Commands

Parse the user's command to determine the action:

### `/release-notes feature "Title" [context]`
Add a big feature (h2 section) to the current release.

**Insertion point:** Before `h2(\`Quality of Life Improvements\`)`

**Format:**
```typescript
h2(`Feature Title`),
text(`Description paragraph 1.`),
text(`Description paragraph 2 if needed.`),
text(``),
```

### `/release-notes qol "Title" [context]`
Add a Quality of Life improvement.

**Insertion point:** After `h2(\`Quality of Life Improvements\`)`, before `h2(\`Bug Fixes\`)`

**Format:**
```typescript
text(`<b>Improvement Title</b>`),
text(`Description. Can mention shortcuts like ${hl('Cmd+V')}.`),
text(``),
```

**Ordering:** When adding multiple QoL items, sort them by impact — largest first, smallest last:

1. **Major new capabilities** — items that could almost be standalone features (e.g., Toggle Headings, Pinned Tabs, Spell Checking in Chat)
2. **New settings and preferences** — user-facing options that change workflows (e.g., File Block Default Style, Click to Edit Title toggle)
3. **Meaningful workflow improvements** — noticeably better experiences (e.g., full-text search in Collections, Jump to Message in Chat)
4. **Small but welcome polish** — minor UX wins (e.g., Fullscreen preview click-to-close, URL properties openable in header)
5. **Micro-fixes that feel like QoL** — tiny quality bumps (e.g., input field clearing, option sorting, clipboard edge cases)

Community-credited items can appear at any tier based on their impact — don't group them separately.

### `/release-notes fix "Category" [context]`
Add a bug fix under the specified category.

**Insertion point:** Under `h2(\`Bug Fixes\`)`, find or create the category

**Format:**
```typescript
text(`<b>Category Name</b>`),  // Only if category doesn't exist
bullet(`Fix description. Thanks to @${link('https://community.anytype.io/t/XXXXX', 'username')}!`),
```

**Existing categories:**
- Chat & Messaging
- Editor & Blocks
- UI & Rendering
- Objects & Views
- Queries & Views
- Widget Sidebar
- Navigation & Window Management
- Keyboard & Shortcuts
- Modal Window Mode
- Miscellaneous

### `/release-notes from-parent JS-XXXX`
Batch create entries from a Linear parent issue and its sub-issues.

1. Fetch parent issue and all sub-issues from Linear API
2. For each sub-issue, determine type from labels:
   - `bug` label → fix
   - `feature` label → feature
   - `improvement` label → qol
3. Create appropriate entries for each
4. If parent is a big feature, use its title for h2 section

### `/release-notes new "0.XX.0" "Title"`
Create a new release page at the top of the file.

**Insert after:** The IconPage block and before the first `title()` call

**Format:**
```typescript
title(`Catchy Title`),
h4(`<span>Release 0.XX.0</span>`),
text(''),
text('Intro paragraph describing the release highlights.'),
text(''),

h2(`Quality of Life Improvements`),
text(``),

h2(`Bug Fixes`),
text(``),

div(),
// --------------------------------------------//
```

### `/release-notes all JS-XXXX`
Generate a complete release notes page from a root Linear issue (typically a sprint/milestone issue).

**How it works:**

1. Fetch the root issue and all its direct children from Linear API:
```bash
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"query{issue(id:\"JS-XXXX\"){title description labels{nodes{name}}children{nodes{identifier title description state{name}labels{nodes{name}}children{nodes{identifier title description state{name}labels{nodes{name}}}}}}}}"}' | jq .
```

2. Classify each child by its labels:

| Child labels | Classification | Action |
|---|---|---|
| `📁 folder` + `🐛 bug` | Bug folder | Process like `from-parent`: fetch grandchildren, categorize into bug fix categories, write bullet entries |
| `📁 folder` + `👌 quality` | QoL folder | Process like `from-parent`: fetch grandchildren, write QoL entries. Items with `💫 feature` label become h2 features instead |
| `💫 feature` (no folder) | Standalone feature | Write as h2 feature section |
| `📈 analytics` only | Analytics (internal) | **Skip entirely** — not user-facing |

3. Create the release page structure (if not already present):
   - `new` page with version and title
   - All h2 feature sections
   - All QoL entries under `h2('Quality of Life Improvements')`
   - All bug fixes under `h2('Bug Fixes')` organized by category
   - Intro paragraph via `intro`

4. For grandchildren (sub-issues of folder issues), apply the same label-based rules:
   - `🐛 bug` → bug fix bullet
   - `👌 quality` → QoL entry
   - `💫 feature` → h2 feature or QoL depending on scope
   - `📈 analytics` only → skip
   - No relevant label → infer from parent folder type
   - `👨‍💻 feedback` → community-reported, extract username and link from description

5. Order of operations:
   1. Create new release page (if needed)
   2. Insert features (h2 sections)
   3. Insert QoL improvements
   4. Insert bug fixes by category
   5. Write intro paragraph

**Community credits:** When a sub-issue has `👨‍💻 feedback` label, look for community links in the description (`https://community.anytype.io/t/XXXXX`) and extract the reporter's name. Add `Thanks to @${link('url', 'name')}!` to the entry.

**Example:**
```
User: /release-notes all JS-8500

Root issue "Sprint 18" has children:
  JS-8574 "Bugs | 18"         [📁 folder, 🐛 bug]     → process 37 bug sub-issues
  JS-8573 "Quality | 18"      [📁 folder, 👌 quality]  → process 25 QoL sub-issues
  JS-292  "[epic] Tabs"        [💫 feature]             → h2 feature
  JS-4551 "[epic] Filters"    [💫 feature]             → h2 feature
  JS-8725 "Chat Search"       [💫 feature]             → h2 feature
  JS-8703 "Transfer Ownership" [💫 feature]            → h2 feature

Result: Complete release page with features, QoL, bug fixes, and intro.
```

### `/release-notes intro`
Write or update the intro paragraph for the current release.

**How it works:**
1. Read the current release page in whatsNew.ts
2. Identify all h2 feature sections
3. Write 2–3 sentences that highlight the essence of the main features
4. Replace the empty intro `text('')` lines between `h4(...)` and the first `h2(...)`

**Insertion point:** The `text('')` lines between the `h4(<span>Release ...</span>)` and the first content section

**Format:**
```typescript
text('Intro sentence one. Intro sentence two.'),
text('Intro sentence three if needed.'),
```

**Style:**
- 2–3 sentences, concise and enthusiastic but not over the top
- Mention the biggest features by name
- Focus on what users can now do, not implementation details
- Match the tone of previous release intros in the file

### `/release-notes show`
Display the current release notes (first page in the file).

## Context Resolution

When user provides a context hint instead of explicit text:

### `today` or `session`
1. Analyze the current conversation history
2. Identify what features/changes were discussed or implemented
3. Extract key benefits for users
4. Write description in release notes style

### `branch`
1. Run `git log main..HEAD --oneline` to see commits
2. Run `git diff main --stat` to see changed files
3. Analyze branch name for context (e.g., `feature/JS-8826-advanced-filters`)
4. Generate description based on the changes

### `JS-XXXX` (Linear issue)
1. Fetch issue from Linear API using:
```bash
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"query{issue(id:\"JS-XXXX\"){title description state{name}priority labels{nodes{name}}}}"}' | jq .
```
2. Extract title and description
3. Use labels to determine category if not specified
4. Format for release notes

### Explicit text
Use the provided text directly, but ensure it follows the style guidelines.

## Writing Style Guidelines

### Tone
- Concise but informative
- Explain WHAT changed AND WHY it matters to users
- Active voice: "You can now..." not "It is now possible to..."
- Focus on user benefits, not implementation details

### Feature Titles
Action-oriented, clear names:
- "Direct Channels"
- "Advanced Filters"
- "Manual Sorting in Queries"
- "Updated Navigation"

### Descriptions
- Start with the user benefit or problem solved
- Mention keyboard shortcuts using `${hl('Cmd+V')}` syntax
- Keep paragraphs focused on single ideas
- Use `<b>bold</b>` for emphasis within text

### Community Credits
When fixing user-reported issues:
```typescript
bullet(`Fix description. Thanks to @${link('https://community.anytype.io/t/12345', 'username')}!`)
```

### What to Avoid
- Technical jargon (API, refactor, component names)
- Implementation details (file names, function names)
- Passive voice
- Vague descriptions ("improved performance")

## Workflow

1. **Parse command** - Determine action type and arguments
2. **Resolve context** - Generate content from conversation/branch/Linear/explicit
3. **Read whatsNew.ts** - Find the current release and insertion point
4. **Format entry** - Apply correct TypeScript syntax and style
5. **Insert entry** - Edit the file at the correct location
6. **Confirm** - Show the user what was added

## Examples

### Adding a feature from session context
```
User: /release-notes feature "Advanced Filters" today

Action:
1. Review conversation - user worked on advanced filters with AND/OR logic
2. Find insertion point before h2(`Quality of Life Improvements`)
3. Insert:
   h2(`Advanced Filters`),
   text(`Need more control over what shows in your Views? You can now create Advanced Filters that combine multiple conditions using AND or OR logic. Group related rules together to build precise queries – like finding all tasks that are either high priority or due this week.`),
   text(``),
```

### Adding a QoL improvement
```
User: /release-notes qol "Filter Bar Redesign" branch

Action:
1. Analyze git changes on current branch
2. Find insertion point after h2(`Quality of Life Improvements`)
3. Insert:
   text(`<b>Filter Bar Redesign</b>`),
   text(`Filters and Sorts in Queries and Collections got a fresh look. Active filters now appear in a dedicated bar above your View, showing the property name, condition, and value at a glance.`),
   text(``),
```

### Adding a bug fix
```
User: /release-notes fix "Objects & Views" "Filter items now show correct active state"

Action:
1. Find h2(`Bug Fixes`)
2. Find text(`<b>Objects & Views</b>`) category (or create if missing)
3. Insert bullet after category header:
   bullet(`Filter items now show correct active state.`),
```

### Writing the release intro
```
User: /release-notes intro

Action:
1. Read whatsNew.ts — find h2 feature sections: "Tabs", "Advanced Filters", "Chat Search", "Transfer Channel Ownership"
2. Write 2–3 sentences covering the highlights
3. Replace empty text('') lines after h4(`<span>Release 0.54.0</span>`):
   text('This release brings Tabs to Anytype — open multiple Objects side by side and pin the ones you use most. Advanced Filters let you combine conditions with AND/OR logic, Chat Search helps you find any message instantly, and Channel Owners can now transfer ownership to another member.'),
```

### Generating all release notes from a root issue
```
User: /release-notes all JS-8500

Action:
1. Fetch root issue JS-8500 — "Sprint 18" with 6 children
2. Classify children:
   - JS-8574 [📁 + 🐛] → bug folder, fetch 37 grandchildren → bug fixes
   - JS-8573 [📁 + 👌] → QoL folder, fetch 28 grandchildren → QoL entries + features
   - JS-292  [💫]       → standalone feature "Tabs"
   - JS-4551 [💫]       → standalone feature "Advanced Filters"
   - JS-8725 [💫]       → standalone feature "Chat Search"
   - JS-8703 [💫]       → standalone feature "Transfer Ownership"
3. Create new release page with `new "0.54.0" "Focus & Flow"`
4. Insert 4 feature h2 sections
5. Insert 25 QoL entries
6. Insert 37 bug fixes across 7 categories
7. Write intro paragraph
```
