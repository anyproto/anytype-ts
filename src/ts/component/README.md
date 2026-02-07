# component/ - React UI Components

All React components that make up the Anytype desktop UI.

## Directory Structure

| Directory | Description |
|-----------|-------------|
| `block/` | Document block components (text, media, dataview, table, chat, embed, etc.) |
| `page/` | Full-page components (auth flow, editor, settings, graph, etc.) |
| `menu/` | Context menus and dropdowns (~50 menu types) |
| `popup/` | Modal dialogs (search, confirm, export, preview, etc.) |
| `sidebar/` | Left sidebar (vault, widgets) and right sidebar (object details, type config) |
| `widget/` | Dashboard widgets (list, gallery, board, calendar, graph, tree views) |
| `editor/` | Block-based document editor (`page.tsx` - ~2600 lines) |
| `cell/` | Inline editable cells for dataviews/tables |
| `form/` | Reusable form controls (input, button, checkbox, switch, pin, select) |
| `header/` | Page header components (auth, object, graph, settings, etc.) |
| `footer/` | Page footer components |
| `list/` | Object lists with pagination, sorting, columns |
| `graph/` | Knowledge graph visualization (D3 + PixiJS WebGL via Web Worker) |
| `drag/` | Drag-and-drop system (provider, layer, targets) |
| `selection/` | Multi-block selection with drag-select box |
| `notification/` | Toast notifications with actions |
| `preview/` | Object/link preview cards |
| `util/` | ~48 reusable small components (icons, loaders, tags, progress bars, media players) |

## Common Patterns

- `observer()` HOC from MobX for reactive rendering
- `forwardRef` + `useImperativeHandle` for imperative parent control
- jQuery for DOM manipulation and namespaced event handling
- `translate()` for all user-facing text
