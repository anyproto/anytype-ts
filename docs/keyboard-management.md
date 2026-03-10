# Keyboard Management System

## Overview

Anytype's keyboard management system provides full keyboard navigation throughout the application. It is built on two complementary layers:

1. **Zone-based routing** — A LIFO stack of keyboard zones that intercept key events in the **capturing phase** (before React handlers). Each zone's `onKeyDown` returns `true` to consume an event or `false` to pass it down.
2. **Panel/group navigation** — A spatial navigation system that manages focus across panels (Vault, Widget, Page) and keyboard groups within each panel. Groups contain navigable items found via CSS selectors.

The system handles three distinct interaction modes:
- **No focus** — No panel is active; global shortcuts apply.
- **Panel highlight** — A panel is focused; arrow keys and Tab navigate between groups and items with a visual `keyboardHighlight` CSS class.
- **Capture mode** — A text input within a group is focused; most keys pass through to the input, but Tab/Escape/boundary arrows exit.

## Architecture

### File Structure

```
src/ts/lib/keyboard/
├── router.ts      — KeyboardRouter: zone stack, panel cycling, event dispatch
├── navigation.ts  — KeyboardNavigation: group management, highlight, capture mode
├── zone.ts        — KeyboardZone interface and KeyboardZoneType enum
└── (keyboard.ts)  — Main keyboard handler (parent directory, ../keyboard.ts)

src/ts/hook/
└── useKeyboardGroup.ts — React hook for registering keyboard groups
```

### Event Flow

```
Window keydown (capturing phase)
  │
  ▼
KeyboardRouter.handleEvent()
  │
  ├─ Walk zone stack top-to-bottom
  │   Zone.onKeyDown(e) → true?  ──▶ Event consumed, stop
  │   Zone.onKeyDown(e) → false? ──▶ Continue to next zone
  │
  ├─ If focusedPanel is set:
  │   navigation.handle(panel, e) → true?  ──▶ Event consumed, stop
  │
  ▼
React bubbling-phase handlers (onChange, onKeyDown, etc.)
```

**Key insight:** The zone system uses `addEventListener('keydown', handler, true)` (capturing phase), while React event handlers use bubbling phase. Zone handlers fire **before** React handlers. This means a zone returning `true` will prevent React from ever seeing the event.

### Zone Types

```typescript
enum KeyboardZoneType {
  Global       // Always-present base zone (global shortcuts)
  Page         // Page-level shortcuts (editor, graph, etc.)
  Sidebar      // Sidebar-specific shortcuts
  Popup        // Modal popup shortcuts
  Menu         // Context menu shortcuts (highest priority when open)
  DataviewGrid // Dataview grid cell navigation
  Cell         // Individual cell editing
}
```

Zones are pushed/popped as UI layers open and close. Menus push `Menu` zones; popups push `Popup` zones; pages push `Page` zones. The topmost zone gets first chance at every key event.

### Panel Cycling

Tab (when no text input is focused and no panel is active) cycles through panels:

```
null → Vault → Widget (if present) → Page → null → Vault → ...
```

This is handled by `keyboard.ts` line ~334:
```typescript
if (!S.Menu.isOpen() && !S.Popup.isOpen() && !this.isEditing() && !this.router.focusedPanel && isMain) {
    this.shortcut('zoneCycle', e, () => {
        e.preventDefault();
        this.setFocus(false);
        this.router.cycleFocus();
    });
}
```

Conditions for Tab to trigger panel cycling:
- No menu is open
- No popup is open
- No text input is being edited (`isEditing()` checks `document.activeElement`)
- No panel is already focused (when a panel is focused, Tab moves between groups instead)
- User is on a main page (not auth)

### Keyboard Groups

Groups are registered via the `useKeyboardGroup` React hook. Each group defines:

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `panel` | Which panel this group belongs to (Vault, Widget, Page) |
| `direction` | `Horizontal` or `Vertical` — determines how arrow keys navigate |
| `getContainer` | Lazy function returning the DOM container element |
| `itemSelector` | CSS selector for navigable items within the container |
| `onEnter` | Optional custom Enter handler (return `true` to consume) |
| `onLeft` / `onRight` | Optional handlers for Left/Right in vertical groups |
| `getItemCount` | For virtualized lists: total item count (not just visible DOM) |
| `scrollToIndex` | For virtualized lists: scroll to bring item into view |
| `getItemElement` | For virtualized lists: get DOM element at index |

Groups are sorted by DOM order when determining navigation sequence.

### Capture Mode

When a text input (input, textarea, contenteditable) is focused within a keyboard group, the navigation system enters **capture mode**:

- **Tab / Shift+Tab** — Exits capture, moves to next/previous group. If no more groups in the panel, cycles to next panel via `router.cycleFocus()`.
- **Escape** — Exits capture, restores highlight on the previously active item.
- **Up/Down arrows** — For single-line inputs: exits capture. For multiline inputs (outside the block editor): exits only at content boundaries (first/last line). For editor blocks: never exits (editor handles its own navigation).
- **All other keys** — Pass through to the input normally.

The `isInsideEditor()` check (`element.closest('.editorWrapper')`) ensures the block editor retains full control over arrow keys in its contenteditable blocks.

### activateForElement

When a user clicks or focuses a text input inside a keyboard group, `activateForElement(element)` is called (from `input.tsx` and `editable.tsx` focus handlers). This:

1. Finds the group containing the element
2. Sets `router.focusedPanel` to that group's panel (directly, without dispatching events or blurring)
3. Sets the active group and item index
4. Enters capture mode
5. Removes any existing keyboard highlight

This bridges mouse/click interaction with keyboard navigation state.

## Registered Keyboard Groups

### Vault Panel (`FocusedPanel.Vault`)

| Group ID | Component | Direction | Item Selector | Description |
|----------|-----------|-----------|---------------|-------------|
| `vault-head` | `sidebar/page/vault.tsx` | Horizontal | `.icon, .name` | Header icons (create space, toggle) |
| `vault-filter` | `sidebar/page/vault.tsx` | Horizontal | `.filter .inner` | Filter/search input field |
| `vault-body` | `sidebar/page/vault.tsx` | Vertical | `.item` | Space list (virtualized with getItemCount/scrollToIndex/getItemElement) |
| `vault-footer` | `sidebar/page/vault.tsx` | Horizontal | `.appSettings, .icon, .help` | Bottom bar (profile settings, gallery, help) |

### Widget Panel (`FocusedPanel.Widget`)

| Group ID | Component | Direction | Item Selector | Description |
|----------|-----------|-----------|---------------|-------------|
| `widget-head` | `sidebar/page/widget.tsx` | Horizontal | `.side > .icon, .side > .sync` | Widget sidebar header icons (vault toggle, panel toggle, sync, clock) |
| `widget-{blockId}` | `widget/index.tsx` | Vertical | `.head .sides, #viewSelect .select, .body .item:not(.isSection), ...` | Individual widget items. Space widget uses `.buttons .item`. Tree widgets have onLeft/onRight for expand/collapse. |

### Page Panel (`FocusedPanel.Page`)

| Group ID | Component | Direction | Item Selector | Description |
|----------|-----------|-----------|---------------|-------------|
| `header` | `header/index.tsx` | Horizontal | `.side.left .icon, .side.center .tab, .side.right [id^="button-header-"], .side.right .icon, .side.right .btn` | Page header — all icons, tabs, and buttons |
| `control-buttons` | `page/elements/head/controlButtons.tsx` | Horizontal | `.btn` | Page control buttons (icon, cover, description, etc.) |
| `featured-relations` | `block/featured.tsx` | Horizontal/Vertical | `.cell` or `.block` (depends on layout) | Featured relations row below title |
| `chatForm` | `block/chat/form.tsx` | Horizontal | `.plus, #messageBox, .send, .emoji` | Chat input form toolbar |

## State Machine

```
                    Tab (no focus, no editing)
  ┌─────────────────────────────────────────────┐
  │                                             ▼
  │   ┌──────────┐    Tab pressed     ┌─────────────────┐
  │   │ No Focus │ ──────────────────▶│ Panel Highlight  │
  │   │          │                    │ (first group,    │
  │   │ Global   │                    │  first item)     │
  │   │ shortcuts│◀────── Escape ─────│                  │
  │   │ only     │                    │ Arrow keys move  │
  │   └──────────┘                    │ within/between   │
  │        ▲                          │ groups           │
  │        │                          └────────┬─────────┘
  │        │                                   │
  │        │                            Enter on input
  │        │                            or click/focus
  │        │                                   │
  │        │                                   ▼
  │        │                          ┌─────────────────┐
  │        │                          │ Capture Mode    │
  │        └──── Escape ──────────────│                 │
  │                                   │ Keys pass to    │
  │                                   │ input; Tab/Esc  │
  └────── Tab (overflow) ────────────│ exit capture    │
                                      └─────────────────┘
```

### State Transitions

| From | Trigger | To | Action |
|------|---------|-----|--------|
| No Focus | Tab | Panel Highlight | `cycleFocus()` → highlights first item of first group in panel |
| Panel Highlight | Arrow keys | Panel Highlight | Move within or between groups; highlight follows |
| Panel Highlight | Tab | Panel Highlight (next group) | `tabBetweenGroups()` → next group's first item |
| Panel Highlight | Tab (last group) | Panel Highlight (next panel) | `cycleFocus()` to next panel |
| Panel Highlight | Enter (on input) | Capture Mode | `enterCapture()` → focus input, remove highlight |
| Panel Highlight | Escape | No Focus | `clearFocus()` |
| Capture Mode | Tab | Panel Highlight (next group) | `exitCapture()` + `tabBetweenGroups()` |
| Capture Mode | Escape | Panel Highlight | `exitCapture()` → restore highlight |
| Capture Mode | Up/Down (boundary) | Panel Highlight | `exitCapture()` + `moveBetweenGroups()` |
| Any | Click on input in group | Capture Mode | `activateForElement()` from focus handler |

---

## Per-Page Keyboard Navigation

This section documents the keyboard behavior for every combination of sidebar page, header, and main page. For each, it lists:
- Which keyboard groups are active
- Which zones are on the stack
- The expected Tab navigation sequence
- Interactive elements and their keyboard behavior
- Current implementation status (implemented vs missing)

---

### Sidebar: Vault

**File:** `src/ts/component/sidebar/page/vault.tsx`
**Zone:** `sidebar:vault` (KeyboardZoneType.Sidebar) — handles `prevSpace`/`nextSpace` shortcuts (Ctrl+Tab / Ctrl+Shift+Tab)
**Panel:** `FocusedPanel.Vault`

**Keyboard groups (4):**

| Order | Group | Elements | Status |
|-------|-------|----------|--------|
| 1 | `vault-head` | Create space icon, toggle sidebar icon, "Spaces" name label | Implemented |
| 2 | `vault-filter` | Search/filter input (`.filter .inner`) | Implemented |
| 3 | `vault-body` | Space list items (virtualized, supports scrollToIndex) | Implemented |
| 4 | `vault-footer` | Profile settings button, gallery icon, help button | Implemented |

**Tab sequence:** vault-head → vault-filter → vault-body → vault-footer → (cycle to Widget panel)

**Navigation flow:**
- Tab from null: highlights first icon in vault-head
- Down arrow from vault-head: moves to vault-filter
- Down arrow from vault-filter: moves to vault-body first item
- Enter on vault-body item: opens space
- Tab from vault-footer: cycles to Widget (or Page if no Widget)
- Ctrl+Tab / Ctrl+Shift+Tab: switches spaces (via sidebar zone)

**Known issues:**
- Non-minimal vault may skip filter input if it's not visible
- `vault-filter` group selector `.filter .inner` needs the filter to be rendered

**Minimal vault mode:**
- Only vault-body and vault-footer visible (head is 8px, filter hidden)
- Profile icon in footer should have `border-radius: 50%` when highlighted (`.appSettings.keyboardHighlight`)

---

### Sidebar: Widget

**File:** `src/ts/component/sidebar/page/widget.tsx`
**Zone:** None (no sidebar zone pushed)
**Panel:** `FocusedPanel.Widget`

**Keyboard groups (1 + N widgets):**

| Order | Group | Elements | Status |
|-------|-------|----------|--------|
| 1 | `widget-head` | Vault toggle icon, widget panel toggle icon, sync component, recently-open clock icon | Implemented |
| 2..N | `widget-{blockId}` | Per-widget: head sides, view selector, body items, show-all button. Space widget: `.buttons .item`. Tree widgets: onLeft/onRight for expand/collapse. | Implemented |

**Tab sequence:** widget-head → widget-{first} → widget-{second} → ... → (cycle to Page panel)

**Navigation flow:**
- Tab from Vault overflow: enters widget-head, highlights first icon
- Down from widget-head: moves to first widget
- Within each widget: vertical navigation through items
- Enter on tree item: opens object; Right arrow: expands; Left arrow: collapses
- Tab from last widget: cycles to Page panel

**Elements NOT in keyboard groups (missing):**
- Widget "Edit" button (`.widgetSettings`) in footer — not in any group
- Widget section "More" buttons (`.more` icon) — not directly navigable, part of widget head
- "Create type" button in section headers — not in any group

---

### Sidebar: Type Editor

**File:** `src/ts/component/sidebar/page/type.tsx`
**Zone:** None
**Panel:** None (no keyboard groups registered)

**Interactive elements (all missing keyboard navigation):**

| Element | Description | Status |
|---------|-------------|--------|
| Cancel button | `.side.right .button` in head | Not in any group |
| Save/Create button | `.side.right .button` in head | Not in any group |
| Section tabs | Dynamic sections rendered in body | Not in any group |
| Section content | Editables, selects, toggles within sections | Not in any group |

**Special Tab handling:** The `title.tsx` section has local Tab/Shift+Tab handling that moves between editable fields (name, plural, description) using jQuery DOM traversal — NOT the keyboard group system.

**Recommended implementation:**
- Register head buttons as a horizontal group (panel: Page)
- Register each section as a vertical group
- Let `activateForElement` handle capture mode for editables
- Current local Tab handler in title.tsx can coexist with group navigation

---

### Sidebar: Settings Index

**File:** `src/ts/component/sidebar/page/settings/index.tsx`
**Zone:** None
**Panel:** None (no keyboard groups registered)

**Interactive elements (all missing keyboard navigation):**

| Element | Description | Status |
|---------|-------------|--------|
| Back icon | `.icon.back` in head | Not in any group |
| Settings list items | Virtualized list of menu items | Not in any group |
| Account item | Profile icon + name at top of list | Not in any group |
| Logout button | At bottom of list | Not in any group |

**Recommended implementation:**
- Register head as horizontal group with back icon
- Register body list as vertical group (virtualized)

---

### Sidebar: Settings Library

**File:** `src/ts/component/sidebar/page/settings/library.tsx`
**Zone:** None
**Panel:** None (no keyboard groups registered)

**Interactive elements (all missing keyboard navigation):**

| Element | Description | Status |
|---------|-------------|--------|
| Back icon | `.icon.back` in head | Not in any group |
| More icon | `.icon.more` in head | Not in any group |
| Filter input | Search input for types/relations | Not in any group |
| Create button | Add new type/relation | Not in any group |
| Library list items | Virtualized list of types/relations | Not in any group |

**Recommended implementation:**
- Register head as horizontal group (back, more)
- Register filter + create as horizontal group
- Register list as vertical group (virtualized)

---

### Sidebar: Object Relations

**File:** `src/ts/component/sidebar/page/object/relation.tsx`
**Zone:** None
**Panel:** None (no keyboard groups registered)

**Interactive elements (all missing keyboard navigation):**

| Element | Description | Status |
|---------|-------------|--------|
| "Set Up" button | In head right side (conditional) | Not in any group |
| Section toggles | Expandable section headers | Not in any group |
| Plus icon | Add relation button per section | Not in any group |
| Relation items | Individual relation cells | Not in any group |

---

### Sidebar: Table of Contents

**File:** `src/ts/component/sidebar/page/object/tableOfContents.tsx`
**Zone:** None
**Panel:** None (no keyboard groups registered)

**Interactive elements (all missing keyboard navigation):**

| Element | Description | Status |
|---------|-------------|--------|
| Close icon | `.icon.close` in head | Not in any group |
| TOC items | Heading links in the section | Not in any group |

---

## Headers

All headers share a single keyboard group `header` registered in `header/index.tsx` with `FocusedPanel.Page`.

**Item selector:** `.side.left .icon, .side.center .tab, .side.right [id^="button-header-"], .side.right .icon, .side.right .btn`

Each header type renders different elements within this shared group:

### Header: mainObject

**File:** `src/ts/component/header/main/object.tsx`
**Used by:** PageMainEdit, PageMainSet, PageMainDate, PageMainRelation

**Navigable elements (left to right):**

| Side | Element | Selector Match | Description |
|------|---------|---------------|-------------|
| Left | Vault toggle | `.side.left .icon` | Toggle left sidebar |
| Left | Widget panel | `.side.left .icon` | Open widget subpage |
| Left | Expand | `.side.left .icon` | Open object in new window |
| Left | Back arrow | `.side.left .icon` | Navigate back |
| Left | Forward arrow | `.side.left .icon` | Navigate forward |
| Left | Graph icon | `.side.left .icon` | Open graph view |
| Right | Share | `[id^="button-header-"]` | Open publish menu |
| Right | Pin | `[id^="button-header-"]` | Toggle widget pin |
| Right | Relation | `[id^="button-header-"]` | Toggle relation sidebar |
| Right | More | `[id^="button-header-"]` | Open context menu |

**Note:** Center `.path` div is clickable (opens search) but NOT matched by the item selector — not keyboard navigable.

### Header: mainChat

**File:** `src/ts/component/header/main/chat.tsx`
**Used by:** PageMainChat

**Navigable elements:**
- Same left icons as mainObject
- Right: Search icon, Pin, Relation, More

### Header: mainGraph

**File:** `src/ts/component/header/main/graph.tsx`
**Used by:** PageMainGraph

**Navigable elements:**
- Left: Vault toggle, widget panel, back/forward (no expand, no graph)
- Center: Tab buttons (`.side.center .tab`) — switches between graph views
- Right: Search icon, Filter icon (hidden), Settings icon

### Header: mainHistory

**File:** `src/ts/component/header/main/history.tsx`
**Used by:** PageMainHistory

**Navigable elements:**
- Left: Same as mainObject
- Center: Display only (version date, not interactive)
- Right: Share, Relation, More

### Header: mainNavigation

**File:** `src/ts/component/header/main/navigation.tsx`
**Used by:** PageMainNavigation

**Navigable elements:**
- Left: Vault toggle, widget panel, expand
- Center: Tab buttons (`.side.center .tab`) — switches navigation views

### Header: mainSettings

**File:** `src/ts/component/header/main/settings.tsx`
**Used by:** PageMainSettingsIndex (and all settings subpages)

**Navigable elements:**
- Left: Widget panel icon (conditional)
- Center: Identity badge (display only, not interactive)
- Right: Transfer ownership (conditional), One-to-one icon (conditional), More icon (conditional)

### Header: mainEmpty

**File:** `src/ts/component/header/main/empty.tsx`
**Used by:** PageMainArchive

**Navigable elements:**
- Left: Vault toggle, widget panel, expand, back/forward, graph
- Center/Right: Empty

### Header: authIndex

**File:** `src/ts/component/header/auth/index.tsx`
**Used by:** Auth pages

**Navigable elements (NOT in keyboard group — auth pages don't use panel navigation):**
- Back arrow icon
- Language select dropdown
- Settings icon

---

## Main Pages

### PageMainEdit (Document Editor)

**File:** `src/ts/component/page/main/edit.tsx`
**Header:** `mainObject`
**Zone:** None (page zone is from editor component)
**Overflow:** Registers `navigation.registerOverflow(FocusedPanel.Page)` — when Down arrow overflows past last Page group, focuses first editor block.

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |
| 2 | `control-buttons` | Icon, cover, description buttons (visible on hover) |
| 3 | `featured-relations` | Featured relation cells below title |

**Tab sequence:** header → control-buttons → featured-relations → (Tab overflows: cycles to Vault)
**Down arrow overflow:** Focuses first editor block (via overflow handler), clears panel highlight.

**Editor blocks:** NOT part of keyboard group navigation. The editor has its own navigation:
- Arrow keys move between blocks
- Tab indents blocks
- Enter creates new blocks
- The editor manages its own focus via `focus.ts`

**What's missing:** Nothing critical — editor intentionally excluded from group navigation.

---

### PageMainSet (Set / Collection / Dataview)

**File:** `src/ts/component/page/main/set.tsx`
**Header:** `mainObject`
**Zone:** `keydown.set{ns}` (KeyboardZoneType.Page) — handles searchText, createObject, selectAll, delete, history shortcuts

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |
| 2 | `control-buttons` | Page control buttons |
| 3 | `featured-relations` | Featured relation cells |

**Zone shortcuts:**
- Cmd+F: Opens dataview filter/search
- Cmd+N: Creates new record
- Cmd+A: Selects all records
- Backspace/Delete: Archives selected
- Cmd+Y: Opens history

**What's missing:**
- Dataview grid cells — the DataviewGrid zone handles cell navigation (arrow keys, Tab between cells), but the grid view selector tabs, sort/filter buttons, and view toolbar are NOT in keyboard groups
- Board view columns and cards
- Gallery view cards
- Calendar view cells

---

### PageMainDate

**File:** `src/ts/component/page/main/date.tsx`
**Header:** `mainObject`
**Zone:** None

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |

**What's missing:**
- Category tabs (relation selector buttons) — not in any group
- Object list items — not in any group
- Calendar/date selector — not in any group

---

### PageMainChat

**File:** `src/ts/component/page/main/chat.tsx`
**Header:** `mainChat`
**Zone:** `keydown.chat{ns}` (KeyboardZoneType.Page) — handles Cmd+M (attach file)

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |
| 2 | `chatForm` | Plus (attach), message box, send button, emoji button |

**Tab sequence:** header → chatForm → (cycle to Vault)

**What's missing:**
- Message list (scrollable) — not in any group (messages are not navigable by keyboard)
- No group for the message reactions/actions that appear on hover

---

### PageMainGraph

**File:** `src/ts/component/page/main/graph.tsx`
**Header:** `mainGraph`
**Zone:** `keydown.global` (KeyboardZoneType.Page) — handles Cmd+F (search)

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and tabs (graph view tabs in center) |

**What's missing:**
- Graph timeline slider — not in any group
- Graph canvas interaction (nodes) — WebGL, not DOM-based, cannot use keyboard groups

---

### PageMainNavigation

**File:** `src/ts/component/page/main/navigation.tsx`
**Header:** `mainNavigation`
**Zone:** `keydown.navigation` (KeyboardZoneType.Page) — has its own complete keyboard navigation (arrow keys for items, left/right for panels, enter/space to open)

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and tabs |

**Note:** This page implements its own keyboard navigation in the page zone handler, separate from the keyboard group system. The three-panel layout (left, center, right) with virtualized lists is managed entirely within the zone's onKeyDown.

---

### PageMainHistory

**File:** `src/ts/component/page/main/history.tsx`
**Header:** `mainHistory` (in left panel)
**Zone:** `keydown.history{ns}` (KeyboardZoneType.Page) — handles Cmd+C/Cmd+X for copying blocks

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |

**What's missing:**
- Version timeline list (right panel) — not in any group; version items, expand/collapse sections, cancel/restore buttons are all mouse-only
- Editor blocks in left panel are read-only

---

### PageMainRelation

**File:** `src/ts/component/page/main/relation.tsx`
**Header:** `mainObject`
**Zone:** None

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons and buttons |

**What's missing:**
- Relation name editable (HeadSimple) — not in any group
- Relation options list (for select/multi-select types) — not in any group
- "Add" and "More" icon buttons — not in any group
- Linked objects list (ListObject) — not in any group

---

### PageMainArchive (Bin)

**File:** `src/ts/component/page/main/archive.tsx`
**Header:** `mainEmpty`
**Zone:** `keydown.archive` (KeyboardZoneType.Page) — handles Cmd+F (search/filter)

**Keyboard groups in Page panel:**

| Order | Group | Elements |
|-------|-------|----------|
| 1 | `header` | Header icons |

**What's missing:**
- Archive list items (object cards) — not in any group
- Restore/Delete buttons — not in any group

---

### PageMainVoid (Empty/Error State)

**File:** `src/ts/component/page/main/void.tsx`
**Header:** None
**Zone:** None

**What's missing:**
- Vault toggle icon — not in any group
- "Create Space" button (in error state) — not in any group

---

### PageMainImport / PageMainInvite / PageMainMembership / PageMainOneToOne

**Files:** `import.tsx`, `invite.tsx`, `membership.tsx`, `oneToOne.tsx`
**Header:** None (or minimal)
**Zone:** None

These are transitional/redirect pages with minimal or no interactive elements. Keyboard navigation not needed.

---

## Settings Pages

All settings pages render inside `PageMainSettingsIndex` which uses header `mainSettings` (or `mainEmpty`). Settings pages are displayed in the sidebar settings view.

### Settings: Account

**File:** `src/ts/component/page/main/settings/account.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Avatar | IconObject with canEdit — opens icon menu |
| Name input | Text input for account name |
| Description input | Text input for description |
| Global name | Read-only display |
| Account ID | Copy-on-click |

---

### Settings: Personal Preferences

**File:** `src/ts/component/page/main/settings/personal.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Theme buttons | Light / Dark / System selector |
| Vault style select | Dropdown |
| Sidebar select | Dropdown |
| Font size select | Dropdown |
| Various switches | Boolean toggles for settings |
| Checkbox groups | Multi-option selections |

---

### Settings: Recovery Phrase

**File:** `src/ts/component/page/main/settings/phrase.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Phrase component | Hidden/show toggle for recovery words |
| Copy button | Copies phrase to clipboard |
| QR reveal button | Requires PIN verification |
| Delete account link | Navigates to delete page |

---

### Settings: Space Settings

**File:** `src/ts/component/page/main/settings/space/index.tsx`
**Zone:** `keydown.settingsSpace` (KeyboardZoneType.Page) — Enter saves, Escape cancels when editing

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Space icon | IconObject with canEdit |
| Space name | Editable contenteditable |
| Dashboard selector | Opens menu |
| Default type selector | Opens typeSuggest menu |
| Settings selects | Various dropdowns |
| Member count | Display with click to open share |

---

### Settings: Space Share

**File:** `src/ts/component/page/main/settings/space/share.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Invite link input | Copyable text input |
| Link type menu | Editor/Viewer/Manual selector |
| Copy link button | Copies invite link |
| Remove link button | Removes invite link |
| Members list | List of space members |

---

### Settings: Storage

**File:** `src/ts/component/page/main/settings/space/storage.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Synced/Not Synced tabs | Tab selector |
| File list | ListObjectManager with file items |

---

### Settings: API Tokens

**File:** `src/ts/component/page/main/settings/api.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Add button | Creates new API token |
| Token table rows | Copy key, copy MCP config, revoke icons |

---

### Settings: PIN Pages

**Files:** `settings/pin/index.tsx`, `settings/pin/select.tsx`, `settings/pin/confirm.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Turn on PIN button | Enables PIN |
| PIN timeout select | Dropdown |
| Pin component | Numeric keypad (has its own keyboard handling) |

---

### Settings: Import Pages

**Files:** `settings/import/index.tsx`, `settings/import/notion.tsx`, `settings/import/csv.tsx`, `settings/import/obsidian.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| App format icons | Clickable grid items (Notion, Obsidian, etc.) |
| Token input | Text input (Notion) |
| Import button | Triggers import |
| Mode/delimiter selects | Dropdowns (CSV) |
| Switches | Boolean toggles (CSV) |

---

### Settings: Export Pages

**Files:** `settings/export/index.tsx`, `settings/export/markdown.tsx`, `settings/export/protobuf.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Format items | Clickable list (Markdown, Protobuf) |
| Switches | Zip, include files, include archived |
| Format select | JSON/Protobuf dropdown |
| Export button | Triggers export |

---

### Settings: Data Management

**Files:** `settings/data/index.tsx`, `settings/data/publish.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Offload files button | Opens confirm dialog |
| Auto-download select | Dropdown |
| Published objects table | View/Copy/Unpublish icons per row |

---

### Settings: Delete Account

**File:** `src/ts/component/page/main/settings/delete.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Confirmation checkbox | Must check before delete |
| Delete button | Red, triggers deletion |

---

### Settings: Language

**File:** `src/ts/component/page/main/settings/language.tsx`
**Zone:** None

**Interactive elements (all missing keyboard navigation):**

| Element | Description |
|---------|-------------|
| Spelling language select | Multi-select dropdown |
| Interface language select | Dropdown |
| Date/time format selects | Dropdowns |
| First day of week select | Dropdown |
| Show relative dates switch | Toggle |

---

### Settings: Membership

**File:** `src/ts/component/page/main/settings/membership/index.tsx`
**Zone:** None

Renders sub-components (intro, purchased, loader). Minimal interactive elements depending on membership state.

---

## Integration Points

### Form Components

Both `input.tsx` and `editable.tsx` call `keyboard.router.navigation.activateForElement()` in their focus handlers. This ensures clicking into a text field correctly sets the navigation state.

Both components also clean up on unmount:
```typescript
useEffect(() => {
    return () => {
        if (isFocused.current) {
            keyboard.setFocus(false);
            keyboard.disableSelection(false);
        };
    };
}, []);
```

### isEditing() vs isFocused

Two mechanisms detect whether the user is editing text:

- **`keyboard.isFocused`** — Boolean flag set via `keyboard.setFocus()`. Can become stale if a component unmounts without cleaning up.
- **`keyboard.isEditing()`** — DOM-based check that inspects `document.activeElement`. More reliable but slightly more expensive.

The zoneCycle condition uses `isEditing()` to avoid intercepting Tab from text inputs. The navigation system uses `isFocused` as an early-out to avoid processing keys when text is being edited without active keyboard navigation.

### Sidebar Type Editor (title.tsx)

The type editor in the right sidebar has special Tab handling that navigates between editable fields (name, plural name, description) using jQuery DOM traversal rather than the keyboard group system:

```typescript
keyboard.shortcut('indent, outdent', e, () => {
    e.preventDefault();
    const body = $(nameRef.current?.getNode()).parents('#body');
    const editables = body.find('.editableWrap .editable');
    // ... find current, focus next/prev
});
```

This is a local override that works within a single component, separate from the global group system.

## Visual Feedback

The `keyboardHighlight` CSS class is added to the currently highlighted element. Components should style this class to provide visible focus indication. Example patterns:

```scss
// Button/icon highlight
.button.keyboardHighlight,
.icon.keyboardHighlight {
    background-color: var(--color-shape-secondary);
}

// List item highlight (uses ::before pseudo-element)
.item.keyboardHighlight::before {
    opacity: 1;
}
```

## Known Limitations and Edge Cases

### Focus Restoration
When `activateForElement()` is called from a click/focus, it sets `router.focusedPanel` directly (without dispatching `focusPanelChange` event). This avoids blurring the just-focused input but means the panel indicator may not update immediately.

### Editor Blocks
The block editor (`editorWrapper`) is excluded from arrow-key capture exit. The editor manages its own block-level navigation. Tab within the editor triggers indentation, not group navigation.

### Virtualized Lists
Groups with `scrollToIndex` use `retrySetHighlight()` with up to 4 `requestAnimationFrame` retries to wait for the virtual DOM to render the target item after scrolling.

### Menu/Popup Override
When a menu or popup zone is on the stack, navigation.handle() returns early without processing. Menus and popups have their own keyboard handling.

### Settings Pages
No settings pages currently have keyboard group navigation. All interactive elements (inputs, selects, switches, buttons) are mouse-only. Settings pages render in the sidebar (not the main area), so they would need groups registered under a sidebar-specific panel or repurpose the existing panel system.

### Navigation Page
The navigation page (`navigation.tsx`) implements its own keyboard handling in its page zone, separate from the group system. Arrow keys navigate items in three panels; left/right switches panels; enter opens items. This is a standalone implementation.

## Adding Keyboard Navigation to New Components

1. **Add the `useKeyboardGroup` hook** to your component:
   ```typescript
   import { useKeyboardGroup } from 'Hook';
   import { GroupDirection } from 'Lib/keyboard/navigation';
   import { FocusedPanel } from 'Lib/keyboard/router';

   const MyComponent = () => {
       const containerRef = useRef(null);

       useKeyboardGroup(containerRef, {
           id: 'my-component',
           panel: FocusedPanel.Page,
           direction: GroupDirection.Vertical,
           itemSelector: '.item',
       });

       return <div ref={containerRef}>...</div>;
   };
   ```

2. **Add `keyboardHighlight` styles** for your navigable items.

3. **For text inputs inside groups**, ensure the focus handler calls `activateForElement()` (already done in `input.tsx` and `editable.tsx`).

4. **For custom Enter behavior**, provide `onEnter` callback returning `true` to prevent default click behavior.

5. **For virtualized lists**, provide `getItemCount`, `scrollToIndex`, and `getItemElement`.

## Coverage Summary

| Area | Groups Registered | Status |
|------|------------------|--------|
| Vault sidebar | 4 groups | Fully implemented |
| Widget sidebar | 1 + N groups | Fully implemented |
| Type editor sidebar | 0 groups | Local Tab handler only, no groups |
| Settings sidebar | 0 groups | Not implemented |
| Library sidebar | 0 groups | Not implemented |
| Object relations sidebar | 0 groups | Not implemented |
| Table of contents sidebar | 0 groups | Not implemented |
| Header (all pages) | 1 group | Fully implemented |
| Control buttons | 1 group | Implemented (editor/set pages) |
| Featured relations | 1 group | Implemented (editor/set pages) |
| Chat form | 1 group | Implemented |
| Editor blocks | N/A (own system) | Own focus/navigation system |
| Dataview grid | N/A (own zone) | DataviewGrid zone for cells |
| Navigation page | N/A (own zone) | Own zone-based navigation |
| All settings pages | 0 groups | Not implemented |
| Archive page | 0 groups (beyond header) | Not implemented |
| Date page | 0 groups (beyond header) | Not implemented |
| Relation page | 0 groups (beyond header) | Not implemented |
| History page | 0 groups (beyond header) | Not implemented |
| Graph page | 0 groups (beyond header) | Not implemented |
