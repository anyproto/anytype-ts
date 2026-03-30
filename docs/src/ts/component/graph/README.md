# graph/ - Knowledge Graph Visualization

Interactive force-directed graph for visualizing object relationships.

## Architecture

- `provider.tsx` - React component managing D3 zoom/drag and image loading
- Worker: `dist/workers/graph.js` - D3 force simulation + PixiJS WebGL rendering

Uses **OffscreenCanvas** transferred to a Web Worker for off-main-thread rendering. PixiJS 8 provides GPU-accelerated WebGL rendering.

## Communication

Provider and worker communicate via `postMessage`:

**Provider → Worker**: `init`, `updateSettings`, `image`, `onZoom`, `onClick`, `onSelect`, `onMouseMove`, `onDragStart/Move/End`, `setRootId`, `resize`, `updateTheme`

**Worker → Provider**: `onClick`, `onSelect`, `onMouseMove`, `onContextMenu`, `onTransform`, `setRootId`

## Usage

- `component/page/main/graph.tsx` - Global graph page
- `component/block/dataview/view/graph.tsx` - Dataview graph view
- `component/widget/view/graph/index.tsx` - Widget graph

## API

Props: `id`, `rootId`, `data: { nodes, edges }`, `storageKey`, `load`
Ref methods: `init()`, `resize()`, `addNewNode()`, `forceUpdate()`
