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

## Features

- Drag-to-select with `THRESHOLD = 20` pixel detection
- Keyboard modifiers: Shift (range), Ctrl/Cmd (toggle)
- Node caching via `cacheNodeMap` and `cacheChildrenMap` refs
- Integrates with focus management system (`Lib/focus`)
- Popup-aware: rebinds listeners when popup list changes

## SelectionTarget

Wraps any block content with a `selectionTarget` div. Receives `id`, `type` (`I.SelectType`), and optional `onContextMenu`. Attaches `data-id` and `data-type` attributes via `U.Common.dataProps()`.
