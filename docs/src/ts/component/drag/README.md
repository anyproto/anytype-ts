# drag/ - Drag and Drop System

Comprehensive drag-and-drop for blocks, relations, records, views, and widgets. **4 files**.

## Files

- `provider.tsx` - Main drag provider with drop zone detection and position calculation. Wraps the app and manages global drag state. Uses refs for `hoverData`, `position`, `objectData` Map, `dragActive`, and coordinate tracking.
- `layer.tsx` - Visual drag preview layer. Clones dragged elements for the ghost preview.
- `target.tsx` - Drop target wrapper component. Accepts `dropType`, `canDropMiddle`, `isTargetTop/Bottom/Column`, and position props.
- `box.tsx` - Drag box component for reorderable lists. Handles mouse-based drag with index tracking and `onDragEnd(oldIndex, newIndex)` callback.

## Features

- RAF-based animation for performance
- Complex position calculation (Top/Bottom/Left/Right/Inner)
- Integrates with selection provider and keyboard system via `focus` service
- Linux-specific bug fixes for drag event coordinates
- Provider exposes ref via `I.DragProviderRefProps` interface
- `DropTarget` is a functional component (`FC`) accepting children
- `DragBox` uses mouse events (not native drag) for reordering
