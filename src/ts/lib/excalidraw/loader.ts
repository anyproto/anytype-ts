let ExcalidrawModule: typeof import('@excalidraw/excalidraw') | null = null;

export async function loadExcalidraw() {
  if (!ExcalidrawModule) {
    ExcalidrawModule = await import(/* webpackChunkName: "excalidraw" */ '@excalidraw/excalidraw');
  }
  return ExcalidrawModule;
}
