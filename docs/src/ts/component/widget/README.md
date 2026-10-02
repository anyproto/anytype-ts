# widget/ - Dashboard Widgets

Customizable widget system for the sidebar dashboard. **28 files**.

## Entry Point (`index.tsx`)

Main widget wrapper component. Handles:
- Layout dispatch (Space, Object, Tree, Link, View)
- Toggle open/close with animated expand/collapse
- Widget head with icon, name, collapse button, create button
- Drag-and-drop reordering
- Context menu (`widget` menu)
- Drop targets for widget-level drag
- Data subscriptions for system widgets (favorite, recentEdit, recentOpen, bin)
- Object row context menu via `U.Menu.widgetObjectContext`
- Chat counter display for chat-layout objects

## Widget Types

- `object.tsx` - Single object display
- `space.tsx` - Space browser

## Tree Widget (`tree/`)

- `tree/index.tsx` - Recursive tree/hierarchy view with virtual scrolling (react-virtualized). Takes nodes from an `I.WidgetTreeSource` (links of the target by default). Supports search/filter in preview mode, per-node subscriptions (`subscribeIds` in id order, or `subscribe` with sorts + limit), per-level paging with "Show more" rows, depth limiting (max 15), and "See all" when `onSetPreview` is passed. `isSidebarSection` mode: always shown, no drop targets, no set icon on leaf sets, node subscriptions and records dropped on unmount.
- `tree/item.tsx` - Individual tree node with expand/collapse toggle, drop target (`canDrop`), set icon for sets/collections that can't expand (`withSetIcon`), context menu, chat counter. Exports `getTreePaddingLeft`.
- `tree/more.tsx` - "Show more" row closing a paged level.
- `tree/section.tsx` - The Tree sidebar section: the space's created-in hierarchy rendered by `tree/index.tsx` (mounted only while the section is open).
- `tree/source/links.ts` - `createLinksTreeSource(object)`: roots from the target's `links`, children from each node's `links`; sets (and optionally files) don't expand.
- `tree/source/created.ts` - `useCreatedTreeSource({ sort, showBookmarks })`: "edges" (objects with `createdInContext`) and "parents" (live top-level contexts) subscriptions, bookmarks filtered out unless shown, forest built by `buildCreatedForest` in one MobX computed; roots sorted by `orderId` then name, children in the parent's `links` order.

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

Widgets are organized into sections: Pin, Type, Unread, RecentEdit, Bin, MyFavorites, Tree.

## Patterns

- `AnimatePresence` + `motion.div` for widget enter/exit animations
- `Storage.checkToggle` / `Storage.setToggle` for open/close persistence
- System widget IDs: `favorite`, `recentEdit`, `recentOpen`, `bin`, `tree`
- Group date sections for recent widgets via `U.Data.groupDateSections`
- `forwardRef` + `useImperativeHandle` for parent-child communication (`updateData`, `resize`, `setSearchIds`, etc.)
