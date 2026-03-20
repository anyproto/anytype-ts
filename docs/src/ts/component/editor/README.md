# editor/ - Block-Based Document Editor

The main document editor component.

## Files

- `page.tsx` (~2,600 lines) - Complete editor implementation

## Responsibilities

- Block creation, deletion, merging, splitting
- Text formatting and rich text markup
- Keyboard shortcuts (copy, undo/redo, indent, navigation)
- Paste handling (HTML, plain text, files, URLs)
- Block selection and focus management
- Toolbar button management

## Key Handlers

- `onKeyDownBlock` / `onKeyDownEditor` - Keyboard event dispatching
- `onPaste` - Multi-format paste (HTML/text/files/URLs)
- `onBackspace` / `onDelete` - Block merging logic
- `onEnter` - Block splitting / new block creation

## Integration

- Uses `S.Block` store for block data
- Commands via `C.*` gRPC calls for all mutations
- Focus management via `focus.set()` / `focus.clear()`
- Selection via `selectionProvider` ref
