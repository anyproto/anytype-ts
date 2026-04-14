# graph/ - Knowledge Graph Visualization

Interactive force-directed graph for visualizing object relationships. **2 files**.

## Architecture

- `provider.tsx` - React component managing D3 zoom/drag, image loading, and worker communication
- `timeline.tsx` - Timeline playback control for temporal graph animation

Worker: `dist/workers/graph.js` - D3 force simulation + PixiJS WebGL rendering (separate from this directory).

Uses **OffscreenCanvas** transferred to a Web Worker for off-main-thread rendering. PixiJS 8 provides GPU-accelerated WebGL rendering.

## Provider (`provider.tsx`)

Props: `id`, `isPopup`, `rootId`, `data: { nodes, edges }`, `storageKey`, `load`

Ref methods:
- `init()`, `resize()`, `addNewNode()`, `forceUpdate()`
- `timelineStart(speed)`, `timelinePause()`, `timelineSeek(position)`, `timelineReset()`

## Timeline (`timeline.tsx`)

Playback control overlay for temporal graph visualization. Features:
- Play/pause button
- Speed control (1x, 2x, 4x cycle)
- Horizontal drag slider for seeking
- Animated date display using `@number-flow/react` (NumberFlow)
- Listens to `timelineUpdate.{id}` and `timelineComplete.{id}` window events from the worker
- Throttled date updates (300ms) during playback for performance
- Conditionally rendered based on `settings.timeline` graph setting

## Communication

Provider and worker communicate via `postMessage`:

**Provider -> Worker**: `init`, `updateSettings`, `image`, `onZoom`, `onClick`, `onSelect`, `onMouseMove`, `onDragStart/Move/End`, `setRootId`, `resize`, `updateTheme`

**Worker -> Provider**: `onClick`, `onSelect`, `onMouseMove`, `onContextMenu`, `onTransform`, `setRootId`

## Usage

- `component/page/main/graph.tsx` - Global graph page
- `component/block/dataview/view/graph.tsx` - Dataview graph view
- `component/widget/view/graph/index.tsx` - Widget graph
