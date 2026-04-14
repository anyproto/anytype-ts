# component/ - React UI Components

All React components that make up the Anytype desktop UI. Exports are centralized in `index.ts`.

## Directory Structure

| Directory | Description |
|-----------|-------------|
| `block/` | Document block components (text, media, dataview, table, chat, embed, help, etc.) — 62 TSX files |
| `page/` | Full-page components (auth flow, editor, settings, graph, etc.) — 67 TSX files |
| `menu/` | Context menus and dropdowns — 71 TSX files across 15 subdirectories |
| `popup/` | Modal dialogs (search, confirm, export, preview, etc.) — 33 TSX files |
| `sidebar/` | Left sidebar (vault, widgets) and right sidebar (object details, type config) |
| `widget/` | Dashboard widgets (list, gallery, board, calendar, graph, tree views) |
| `editor/` | Block-based document editor (`page.tsx` — ~2,825 lines) |
| `cell/` | Inline editable cells for dataviews — checkbox, file, object, select, text + item/object |
| `comment/` | Comment system — threaded discussions with form, list, post, reply, section, render, embedPreview |
| `form/` | Reusable form controls (input, button, checkbox, switch, pin, select, phrase, filter, tabSwitch, textarea, editable, commentEditor, drag) |
| `header/` | Page header components — auth (index, logout), main (object, graph, settings, chat, history, navigation, archive, empty), banner |
| `footer/` | Page footer components — auth (index, email, disclaimer), main (object) |
| `list/` | Object lists — popup, menu, notification, children, object, objectManager, banner |
| `graph/` | Knowledge graph visualization — provider (D3 + PixiJS WebGL via Web Worker) + timeline |
| `drag/` | Drag-and-drop system — provider, layer, box, target |
| `selection/` | Multi-block selection — provider, target |
| `notification/` | Toast notifications |
| `preview/` | Object/link preview cards — index, default, link, object, tab |
| `util/` | Reusable small components (icons, loaders, tags, progress bars, media players, etc.) |

## Common Patterns

- `observer()` HOC from MobX for reactive rendering
- `forwardRef` + `useImperativeHandle` for imperative parent control
- `U.Dom` helpers for DOM manipulation (no raw `querySelector`/`getElementById`, no jQuery)
- `translate()` for all user-facing text
- Storybook stories co-located as `*.stories.tsx` files
