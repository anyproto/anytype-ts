# workers/ - Web Worker Entry Points

Web Worker source files for off-main-thread processing.

## Files

- `pixi-worker-entry.ts` — PixiJS entry point for the graph web worker bundle. Imports PixiJS 8 components (`Application`, `Container`, `Graphics`, `Sprite`, `Texture`, `RenderTexture`, `Text`, `TextStyle`, `Circle`, `Rectangle`, `autoDetectRenderer`, `extensions`), sets up `WebWorkerAdapter` for OffscreenCanvas support, and exports a `PIXI` namespace to global scope.

## Build

Built via `bun run build:pixi` (uses `vite.worker.config.ts`). The output bundle lands at `dist/workers/lib/pixi.min.js` and is loaded by the graph worker (`dist/workers/graph.js`).

## Architecture

- The graph worker (`dist/workers/graph.js`) runs D3 force simulation + PixiJS WebGL rendering on an OffscreenCanvas
- Communicates with `component/graph/provider.tsx` via `postMessage`
- GPU-accelerated rendering happens entirely off the main thread
