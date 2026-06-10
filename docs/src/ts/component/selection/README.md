# selection/ - Block Selection System

Multi-block selection with keyboard and mouse support. **2 files**.

## Files

- `provider.tsx` - Selection provider with drag-select rectangle
- `target.tsx` - Selectable block wrapper

## SelectionProvider

Imperative ref API (`SelectionRefProps`):
- `get(type)` / `set(type, ids)` - Get/set selected IDs by `I.SelectType`
- `getForClick(id, withChildren, save)` - Resolve selection for a click event
- `clear()` / `hide()` - Clear selection state and visuals
- `scrollToElement(id, dir)` - Scroll to a selected block
- `renderSelection()` - Apply `.isSelected` class to target elements
- `isSelecting()` / `setIsSelecting(v)` - Track active drag-select state
- `rebind()` - Re-attach mouse/keyboard event listeners
- `setContextMenuHandler(handler)` - Register context menu callback
- `getTextSelection()` - Cross-block text selection state (`{ from, to }` endpoints with per-block `I.TextRange`), or `null`
- `clearTextSelection()` - Dissolve the cross-block text selection and restore the blocks wrapper
- `isCrossSelecting()` - Whether a cross-block text drag is in progress

## Features

- Drag-to-select with `THRESHOLD = 20` pixel detection
- Keyboard modifiers: Shift (range), Ctrl/Cmd (toggle)
- Node caching via `cacheNodeMap` and `cacheChildrenMap` refs
- Integrates with focus management system (`Lib/focus`)
- Popup-aware: rebinds listeners when popup list changes

## Cross-Block Text Selection

A drag that starts inside a text block's editable and leaves the block produces a native text selection spanning blocks (instead of whole-block selection):

- On crossing, the `.blocks` wrapper temporarily becomes `contenteditable` so all blocks form a single editing host (Chromium confines drag selection to one host otherwise)
- The native drag re-bases its anchor after the host change, so the selection is re-applied from the saved anchor on every mousemove (rAF-scheduled, after the native update)
- On mouseup, the DOM range is mapped to per-block model ranges (`getCrossCoverage`): partial ranges for the edge blocks, full coverage in between; a selection inside one block converts back to the standard `focus` flow
- While the selection persists, the wrapper stays editable (reverting clamps the native selection); `beforeinput`/`cut`/`dragstart` are prevented, and a `selectionchange` listener remaps state on native extension (Shift+Arrow / Shift+Click)
- Editor page consumes the state for copy/cut (`Action.copyTextSelection` → `Block.Copy`/`Block.Cut` with `selectedTextRange` + `selectedTextRangeLastBlock`, edge blocks trimmed by the middleware), delete/typing replacement (`deleteTextSelection`), and caret collapse on arrows
- Right click on the selection opens a minimal context menu (Copy / Cut / Quote in discussion) handled in `component/block/index.tsx`

## SelectionTarget

Wraps any block content with a `selectionTarget` div. Receives `id`, `type` (`I.SelectType`), and optional `onContextMenu`. Attaches `data-id` and `data-type` attributes via `U.Common.dataProps()`.
