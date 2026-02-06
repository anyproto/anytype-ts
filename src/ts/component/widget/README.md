# widget/ - Dashboard Widgets

Customizable widget system for the sidebar dashboard. **15 files**.

## Widget Types

- `object.tsx` - Single object display
- `space.tsx` - Space browser
- `tree.tsx` - Tree/hierarchy view

## View Layouts (`view/`)

`view/index.tsx` dispatches to layout-specific renderers:
- `view/list/` - List layout (index.tsx, item.tsx)
- `view/gallery/` - Gallery layout (index.tsx, item.tsx)
- `view/board/` - Kanban board layout (index.tsx, group.tsx, item.tsx)
- `view/calendar/` - Calendar layout (index.tsx)
- `view/graph/` - Force-directed graph layout (index.tsx)

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
