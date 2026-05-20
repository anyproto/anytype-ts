# widget/ - Dashboard Widgets

Customizable widget system for the sidebar dashboard. **15 files**.

## Entry Point (`index.tsx`)

Main widget wrapper component. Handles:
- Layout dispatch (Space, Object, Tree, Link, View)
- Toggle open/close with animated expand/collapse
- Widget head with icon, name, collapse button, create button
- Drag-and-drop reordering
- Context menu (`widget` menu)
- Drop targets for widget-level drag
- Data subscriptions for system widgets (favorite, recentEdit, recentOpen, bin)
- Chat counter display for chat-layout objects

## Widget Types

- `object.tsx` - Single object display
- `space.tsx` - Space browser

## Tree Widget (`tree/`)

- `tree/index.tsx` - Recursive tree/hierarchy view with virtual scrolling (react-virtualized). Supports search/filter in preview mode, subscription-based child node loading, depth limiting (max 15), and "show all" button.
- `tree/item.tsx` - Individual tree node with expand/collapse toggle, drop target, context menu, chat counter.

## View Layouts (`view/`)

`view/index.tsx` dispatches to layout-specific renderers based on view type. Manages dataview subscriptions, view switching (Swiper), search/filter in preview mode.

- `view/list/index.tsx` - List layout
- `view/list/item.tsx` - List item
- `view/gallery/index.tsx` - Gallery layout
- `view/gallery/item.tsx` - Gallery item
- `view/board/index.tsx` - Kanban board layout
- `view/board/group.tsx` - Board group column
- `view/board/item.tsx` - Board item
- `view/calendar/index.tsx` - Calendar layout
- `view/graph/index.tsx` - Force-directed graph layout

## Widget Layouts (enum)

- `Link` (0) - Simple link
- `Tree` (1) - Expandable tree
- `List` (2) - Item list
- `Compact` (3) - Compact list
- `View` (4) - Dataview-based
- `Space` (100) - Space widget
- `Object` (101) - Object widget

## Sections

Widgets are organized into sections: Pin, Type, Unread, RecentEdit, Bin.

## Patterns

- `AnimatePresence` + `motion.div` for widget enter/exit animations
- `Storage.checkToggle` / `Storage.setToggle` for open/close persistence
- System widget IDs: `favorite`, `recentEdit`, `recentOpen`, `bin`
- Group date sections for recent widgets via `U.Data.groupDateSections`
- `forwardRef` + `useImperativeHandle` for parent-child communication (`updateData`, `resize`, `setSearchIds`, etc.)
