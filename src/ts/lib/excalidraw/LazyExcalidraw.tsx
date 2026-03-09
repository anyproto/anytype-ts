import React, { Suspense, lazy } from 'react';
import type { ExcalidrawProps } from '@excalidraw/excalidraw/types/types';

const ExcalidrawInner = lazy(() =>
  import(/* webpackChunkName: "excalidraw" */ '@excalidraw/excalidraw').then(mod => ({ default: mod.Excalidraw }))
);

export const LazyExcalidraw: React.FC<ExcalidrawProps> = (props) => (
  <Suspense fallback={<div className='excalidraw-loading'>Loading drawing editor…</div>}>
    <ExcalidrawInner {...props} />
  </Suspense>
);
