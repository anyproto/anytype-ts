/* 
NOTE: this file is copy pasted from the JS-Onboard-Animation Repository
*/

import * as React from 'react';
import { DOM_EVENTS, OnboardStage, statsVisible } from './constants';
//import Stats from 'stats.js';

type Props = {
	state: OnboardStage;
};

const CanvasWorkerBridge = (props: Props) => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const worker = React.useRef<Worker | null>(null);

	React.useEffect(() => {
		// NOTE: Change this next line to new Worker(`workers/onboard.js`) when copying over to JS-anytype
		worker.current = new Worker('workers/onboard.js');

		if (!canvasRef.current) {
			return;
		};

		const canvas = canvasRef.current;
		const offscreen = canvasRef.current.transferControlToOffscreen();

		worker.current.postMessage(
			{
				type: 'init',
				payload: {
					props,
					drawingSurface: offscreen,
					width: canvas.clientWidth,
					height: canvas.clientHeight,
					pixelRatio: 1, //window.devicePixelRatio,
				},
			},
			[offscreen]
		);

		Object.values(DOM_EVENTS).forEach(([eventName, passive]) => {
			canvas.addEventListener(
				eventName,
				(event: any) => {
					if (!worker.current) {
						return;
					};

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
			if (!worker.current) {
				return;
			};

			worker.current.postMessage({
				type: 'resize',
				payload: {
					width: canvas.clientWidth,
					height: canvas.clientHeight,
					dpr: 1,
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

	/*
	React.useEffect(() => {
		if (!statsVisible) {
			return;
		};

		const stats = new Stats();

		document.body.appendChild(stats.dom);
		requestAnimationFrame(function loop() {
			stats.update();
			requestAnimationFrame(loop);
		});
	}, []);
	*/

	return <canvas ref={canvasRef} />;
};

export default CanvasWorkerBridge;
