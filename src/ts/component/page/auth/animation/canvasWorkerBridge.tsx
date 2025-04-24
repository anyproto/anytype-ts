import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { DOM_EVENTS, OnboardStage, statsVisible } from './constants';

interface Props {
	state: OnboardStage;
};

interface RefProps {
	create: () => void;
	destroy: () => void;
};

const CanvasWorkerBridge = forwardRef<RefProps, Props>((props, ref) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const worker = useRef<Worker | null>(null);
	const [ isDestroyed, setIsDestroyed ] = useState(false);

	useEffect(() => {
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
					pixelRatio: 1,
				},
			},
			[ offscreen ]
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
	}, [ isDestroyed ]);

	useEffect(() => {
		if (!worker.current) {
			return;
		};

		worker.current.postMessage({ type: 'props', payload: props });
	}, [ props ]);

	/*
	useEffect(() => {
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

	useImperativeHandle(ref, () => ({
		create: () => {
			setIsDestroyed(false);
		},

		destroy: () => {
			worker.current.terminate();
			setIsDestroyed(true);
		},
	}));

	return isDestroyed ? null : <canvas id="mainAnimation" ref={canvasRef} />;
});

export default CanvasWorkerBridge;