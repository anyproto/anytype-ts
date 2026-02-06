# menu/ - Context Menus and Dropdowns

Comprehensive menu system with **~50 menu types** across 8 categories.

## Architecture

`index.tsx` (1,108 lines) is the main menu controller handling:
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
`blockContext`, `blockAdd`, `blockStyle`, `blockColor`, `blockBackground`, `blockCover`, `blockAlign`, `blockLink`, `blockMention`, `blockLayout`, `blockLatex`, `blockLinkSettings`, `blockAction`, `blockRelationEdit`

### Dataview Menus (`dataview/`)
~15 menus for database views: `dataviewRelationList/Edit`, `dataviewGroupList/Edit`, `dataviewObjectList`, `dataviewFilterList/Advanced/Values`, `dataviewSort` (drag-and-drop), `dataviewViewList/Settings/Layout`, `dataviewOptionList/Edit`, `dataviewSource`

### Search Menus (`search/`)
`searchText` (full-page text), `searchObject` (object finder), `searchChat`

### Graph Menus (`graph/`)
`graphSettings` - graph visualization controls

### Other Menus
- `smile.tsx` - Emoji/icon picker with tabs and search
- `select.tsx` - Generic virtualized selection menu
- `object.tsx` - Object context menu with sections and permissions
- `help.tsx` - Help/documentation links
- `calendar/` - Date picker
- `preview/` - Object and LaTeX previews
- `widget/` - Widget management
- `relation/` - Relation suggestions
- `type/` - Type suggestions

## Item Component

`item/vertical.tsx` renders individual menu items with support for icons, arrows (sub-menus), checkboxes, switches, descriptions, and more.

## Key Libraries

- `react-virtualized` for large item lists (AutoSizer, InfiniteLoader, List)
- `@dnd-kit` for sortable items (dataview sort)
