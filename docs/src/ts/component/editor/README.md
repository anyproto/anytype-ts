# editor/ - Block-Based Document Editor

The main document editor component.

## Files

- `page.tsx` (~2,825 lines) - Complete editor implementation

## Architecture

Functional component using `forwardRef` with hooks (`useRef`, `useEffect`, `useState`). No MobX `observer` — relies on imperative updates and event-driven re-renders.

## Responsibilities

- Block creation, deletion, merging, splitting
- Text formatting and rich text markup
- Keyboard shortcuts (copy, undo/redo, indent, navigation)
- Paste handling (HTML, plain text, files, URLs)
- Block selection and focus management
- Toolbar button management (add button positioning)
- Scroll handling with throttled updates
- Hover detection for drag/drop block insertion

## Key Handlers

- `onKeyDownBlock` / `onKeyDownEditor` - Keyboard event dispatching
- `onPaste` - Multi-format paste (HTML/text/files/URLs)
- `onBackspace` / `onDelete` - Block merging logic
- `onEnter` - Block splitting / new block creation
- `deleteTextSelection` - Removes a cross-block text selection: trims the edge blocks, deletes the blocks in between, merges the kept head/tail (optionally inserting typed text); used by Backspace/Delete, typing replacement and paste-over-selection
- `onCopy` - Copies/cuts block selection or cross-block text selection (`Action.copyTextSelection`; the middleware trims/cuts the edge blocks via `selectedTextRange` + `selectedTextRangeLastBlock`)

## Integration

- Uses `S.Block` store for block data
- Commands via `C.*` gRPC calls for all mutations
- Focus management via `focus.set()` / `focus.clear()`
- Selection via `selectionProvider` ref
- Renders `PageHeadEditor`, `Children`, `TableOfContents`, `EditorControls`, `CommentSection` sub-components
- `DropTarget` for drag-and-drop block reordering
