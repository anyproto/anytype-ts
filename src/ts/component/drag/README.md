# drag/ - Drag and Drop System

Comprehensive drag-and-drop for blocks, relations, records, views, and widgets. **4 files**.

## Files

- `provider.tsx` - Main drag provider with drop zone detection and position calculation
- `layer.tsx` - Visual drag preview layer
- `target.tsx` - Drop target wrapper component
- `box.tsx` - Drop box component

## Features

- RAF-based animation for performance
- Complex position calculation (Top/Bottom/Left/Right/Inner)
- Integrates with selection provider and keyboard system
- Linux-specific bug fixes for drag event coordinates
- Uses refs to maintain drag state (`hoverData`, `position`, `objectData` Map)
