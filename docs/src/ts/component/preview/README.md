# preview/ - Object Preview Cards

Inline and popup preview components for objects and links. **5 files** (excluding stories).

## Files

- `index.tsx` - Preview dispatcher by type (`I.PreviewType`). Handles positioning, polygon-based mouse tracking, click routing, and mark editing
- `default.tsx` - Standard object preview card
- `link.tsx` - Link/bookmark preview with URL display and edit/unlink actions
- `object.tsx` - Object-specific preview with icon and metadata
- `tab.tsx` - Tab preview showing space icon/name and object details, used for browser-like tab hover previews. Loads object and type data asynchronously with load-ID tracking

## Key Patterns

- `PreviewIndex` reads from `S.Common.preview` store for type, target, position, and marks
- Supports `I.PreviewType.Link`, `I.PreviewType.Object`, `I.PreviewType.Default`, and tab previews
- Polygon-based hover area prevents preview from closing when moving mouse between trigger and preview card
