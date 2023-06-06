/* 
NOTE: this file is copy pasted from the JS-Onboard-Animation Repository
*/

import * as React from 'react';
import { DOM_EVENTS, OnboardStage } from './constants';

type Props = {
	state: OnboardStage;
};

const CanvasWorkerBridge = (props: Props) => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const worker = React.useRef<Worker | null>(null);

	React.useEffect(() => {
		if (!canvasRef.current) {
			return;
		};

		// NOTE: Change this next line to new Worker(`workers/onboard.js`) when copying over to JS-anytype
		worker.current = new Worker('workers/onboard.js');

		const canvas = canvasRef.current;
		const offscreen = canvasRef.current.transferControlToOffscreen();

		worker.current.postMessage(
			{
				type: 'init',
				payload: {
					props: props,
					drawingSurface: offscreen,
					width: canvas.clientWidth,
					height: canvas.clientHeight,
					pixelRatio: 0.5, //window.devicePixelRatio,
				},
			},
			[offscreen]
		);

		Object.values(DOM_EVENTS).forEach(([eventName, passive]) => {
			canvas.addEventListener(
				eventName,
				(event: any) => {
					if (!worker.current) return;
					worker.current.postMessage({
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
			if (!worker.current) return;
			worker.current.postMessage({
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
			worker.current?.terminate();
		};
	}, []);

	React.useEffect(() => {
		if (!worker.current) {
			return;
		};

		worker.current.postMessage({ type: 'props', payload: props });
	}, [ props ]);

	return <canvas ref={canvasRef} />;
};
	
export default CanvasWorkerBridge;
