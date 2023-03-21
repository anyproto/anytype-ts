import * as React from 'react';
import { DOM_EVENTS, OnboardStage } from './constants';

type Props = {
  state: OnboardStage;
  worker: Worker;
};

const CanvasWorkerBridge = (props: Props) => {
  const { worker } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const offscreen = canvasRef.current.transferControlToOffscreen();

    worker.postMessage(
      {
        type: 'init',
        payload: {
          props: props,
          drawingSurface: offscreen,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          pixelRatio: window.devicePixelRatio,
        },
      },
      [offscreen]
    );

    Object.values(DOM_EVENTS).forEach(([eventName, passive]) => {
      canvas.addEventListener(
        eventName,
        (event: any) => {
          worker.postMessage({
            type: 'dom_events',
            payload: {
              eventName,
              clientX: event.clientX,
              clientY: event.clientY,
              offsetX: event.offsetX,
              offsetY: event.offsetY,
              x: event.x,
              y: event.y,
            },
          });
        },
        { passive }
      );
    });

    const handleResize = () => {
      const dpr = window.devicePixelRatio;
      worker.postMessage({
        type: 'resize',
        payload: {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          dpr,
        },
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [worker]);

  React.useEffect(() => {
    if (!worker) return;
    worker.postMessage({
      type: 'props',
      payload: props,
    });
  }, [props]);

  return <canvas ref={canvasRef} />;
};

export default CanvasWorkerBridge;
