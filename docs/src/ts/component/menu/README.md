# menu/ - Context Menus and Dropdowns

Comprehensive menu system with **72 TSX files** across 15 subdirectories.

## Architecture

`index.tsx` (~1,178 lines) is the main menu controller handling:
- Positioning (auto-flip to avoid going off-screen)
- Animation (show/hide transitions)
- Keyboard navigation (arrow keys, enter, escape)
- Mouse handling (hover, click, active states)
- Sub-menu management (polygon connector)
- Dimmer overlay

Each menu component exposes a `MenuRef` interface via `useImperativeHandle`:
```typescript
{ rebind, unbind, getItems, getIndex, setIndex, onClick, onOver, getListRef, ... }
```

## Menu Categories

### Block Menus (`block/`)
`context`, `add`, `style`, `color`, `background`, `cover`, `align`, `link` (with `link/settings`), `mention`, `layout`, `latex`, `action`, `emoji`, `embedKroki`, `relation/edit`

### Dataview Menus (`dataview/`)
- **Relations**: `relation/list`, `relation/edit`
- **Groups**: `group/list`, `group/edit`
- **Objects**: `object/list`, `object/values`
- **Filters**: `filter/list`, `filter/advanced`, `filter/values`
- **Options**: `option/list`, `option/edit`
- **Views**: `view/list`, `view/settings`, `view/layout`
- **Templates**: `template/list`, `template/context`
- **Files**: `file/list`, `file/values`
- **Other**: `sort` (drag-and-drop), `source`, `new`, `text`, `create/bookmark`

### Search Menus (`search/`)
`text` (full-page text search), `object` (object finder), `chat` (chat search)

### Graph Menus (`graph/`)
`settings` - graph visualization controls

### Chat Menus (`chat/`)
`create` - chat creation, `text` - chat text formatting

### Comment Menus (`comment/`)
`toolbar` - comment toolbar actions

### Sync Status Menus (`syncStatus/`)
`info` - sync status information display

### Smile/Emoji (`smile/`)
`smile.tsx` - Emoji/icon picker with tabs and search (top-level)
`color.tsx` - Color picker for emoji

### Other Top-Level Menus
- `select.tsx` - Generic virtualized selection menu
- `object.tsx` - Object context menu (top-level, with `object/context.tsx` for detailed context)
- `help.tsx` - Help/documentation links
- `calendar.tsx` - Date picker (with `calendar/day.tsx`)
- `identity.tsx` - Identity/profile menu
- `onboarding.tsx` - Onboarding menu
- `oneToOne.tsx` - One-to-one chat menu
- `participant.tsx` - Participant menu
- `publish.tsx` - Publish menu
- `changeOwner.tsx` - Change owner menu
- `tableOfContents.tsx` - Table of contents menu
- `widget.tsx` - Widget menu (with `widget/section.tsx`)
- `preview/object.tsx` - Object preview, `preview/latex.tsx` - LaTeX preview
- `relation/suggest.tsx` - Relation suggestions
- `type/suggest.tsx` - Type suggestions

## Item Component

`item/vertical.tsx` renders individual menu items with support for icons, arrows (sub-menus), checkboxes, switches, descriptions, and more. `item/filter.tsx` renders filter items.

## Key Libraries

- `react-virtualized` for large item lists (AutoSizer, InfiniteLoader, List)
- `@dnd-kit` for sortable items (dataview sort)
