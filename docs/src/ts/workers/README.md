# workers/ - Web Worker Entry Points

Web Worker source files for off-main-thread processing.

## Workers

The main worker is the graph visualization worker:
- Source: `dist/workers/graph.js` - D3 force simulation + PixiJS WebGL rendering
- Built from: `rspack.pixi.config.js` via `npx rspack --config rspack.pixi.config.js`
- Uses OffscreenCanvas for GPU-accelerated rendering in a worker thread
- Communicates with `component/graph/provider.tsx` via postMessage
