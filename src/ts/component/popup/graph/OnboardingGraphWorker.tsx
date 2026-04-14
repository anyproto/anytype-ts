import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { reaction } from 'mobx';
import { getIconSvg } from 'Component/util/icons';

interface OnboardingGraphWorkerProps {
	width: number;
	height: number;
	popupWidth?: number;
	popupHeight?: number;
}

const OnboardingGraphWorker = ({ 
	width, 
	height, 
	popupWidth = 720,
	popupHeight = 680 
}: OnboardingGraphWorkerProps) => {

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const workerRef = useRef<Worker | null>(null);
	const loadedImages = useRef<Set<string>>(new Set());
	const { SparkOnboarding: sparkOnboarding } = S;
	const [ isInitialized, setIsInitialized ] = useState(false);
	const [ isDragging, setIsDragging ] = useState(false);
	const theme = S.Common.getThemeClass();
	const themeColors = J.Theme[theme].sparkOnboarding;

	// Load icon images and send to worker
	const loadIconImages = async (nodes: any[]) => {
		if (!workerRef.current) {
			return;
		};

		for (const node of nodes) {
			if (node.iconName && (node.type == 'type') && !loadedImages.current.has(node.iconName)) {
				const src = U.Common.updateSvg(getIconSvg(`type/${node.iconName}`), {
					id: node.iconName,
					size: 70,
					fill: theme === 'dark'
						? themeColors.node.type.fill
						: 'hsla(155, 76%, 57%, 1)',
				});

				if (!src) {
					continue;
				};

				const img = new Image();

				img.src = src;

				await new Promise((resolve) => {
					img.onload = async () => {
						const bitmap = await createImageBitmap(img);
						workerRef.current?.postMessage({
							id: 'image',
							src: node.iconName,
							bitmap
						}, [ bitmap ]);

						loadedImages.current.add(node.iconName);
						resolve(true);
					};
					img.onerror = () => resolve(false);
				});
			};
		};
	};

	// Handle mouse events
	const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		const rect = U.Dom.getElementRect(canvasRef.current);
		if (!rect) {
			return;
		};
		
		setIsDragging(true);
		
		workerRef.current.postMessage({
			id: 'onMouseDown',
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	// Throttle mouse move events to reduce message overhead
	const lastMouseMoveRef = useRef<number>(0);
	
	const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		// Throttle to max 30 events per second
		const now = Date.now();
		if (now - lastMouseMoveRef.current < 33) {
			return;
		};

		lastMouseMoveRef.current = now;
		
		const rect = U.Dom.getElementRect(canvasRef.current);
		if (!rect) {
			return;
		};
		
		workerRef.current.postMessage({
			id: 'onMouseMove',
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		const rect = U.Dom.getElementRect(canvasRef.current);
		if (!rect) {
			return;
		};

		setIsDragging(false);
		
		workerRef.current.postMessage({
			id: 'onMouseUp',
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	const handleMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
		// When mouse leaves canvas (e.g., goes over popup), release any dragged node
		if (!workerRef.current || !isDragging) {
			return;
		};
		
		setIsDragging(false);
		
		workerRef.current.postMessage({ id: 'onMouseLeave' });
	};

	// Initialize worker
	useEffect(() => {
		// Don't initialize if already initialized
		if (!canvasRef.current || workerRef.current) {
			return;
		};

		const canvas = canvasRef.current;
		const offscreen = canvas.transferControlToOffscreen();
		
		// Create worker with our custom onboarding graph worker
		workerRef.current = new Worker('workers/onboardingGraph.js');
		
		// Calculate blocking area for the popup
		const centerX = width / 2;
		const centerY = height / 2;
		const blockingArea = {
			x: centerX - popupWidth / 2,
			y: centerY - popupHeight / 2,
			width: popupWidth,
			height: popupHeight
		};

		// Initialize worker with canvas and blocking area
		
		workerRef.current.postMessage({
			id: 'init',
			canvas: offscreen,
			width,
			height,
			density: window.devicePixelRatio || 1,
			blockingAreas: [blockingArea],
			nodeStyle: {
				defaultRadius: 25,
				centerColor: themeColors.canvas.nodeCenter,
				edgeColor: themeColors.node.type.fill,
				glowColor: themeColors.canvas.nodeGlow,
			},
			colors: {
				bg: 'transparent',
				text: themeColors.node.type.text,
				textShadow: themeColors.node.type.textShadow,
				node: themeColors.node.type.fill,
				link: themeColors.link.stroke,
				arrow: themeColors.link.stroke,
				highlight: themeColors.link.strokeHover,
				selected: theme === 'dark' ? 'rgba(100, 140, 180, 0.7)' : J.Theme[theme].color.ice,
			},
			settings: {
				icon: false,
				label: true,
				marker: false,
				link: true,
				relation: false,
				orphan: true,
				showBlockingAreas: false, // Set to true for debugging
			},
			theme: theme || 'light',
			rootId: '',
		}, [ offscreen ]);

		setIsInitialized(true);
		
		// Don't send initial resize here - it's handled by the resize effect

		// Cleanup
		return () => {
			if (workerRef.current) {
				workerRef.current.postMessage({ id: 'destroy' });
				workerRef.current.terminate();
				workerRef.current = null;
			};
		};
	}, []); // Only run once on mount

	// Update graph data when nodes/links change using MobX reaction
	useEffect(() => {
		if (!isInitialized || !workerRef.current) {
			return;
		};

		// Use MobX reaction to properly track observable changes
		const dispose = reaction(
			() => ({
				nodes: sparkOnboarding.graphNodes.slice(), // Create a copy to ensure reaction triggers
				links: sparkOnboarding.graphLinks.slice(),
				nodesLength: sparkOnboarding.graphNodes.length,
				linksLength: sparkOnboarding.graphLinks.length,
			}),
			(data) => {
				if (!workerRef.current) {
					return;
				};
				
				// Calculate available space
				const horizontalSpace = (width - popupWidth) / 2;
				const verticalSpace = (height - popupHeight) / 2;
				const useHorizontal = horizontalSpace > verticalSpace;
				const nodes = data.nodes.map((node, index) => {
					let nodeX, nodeY;
			
					// Use predefined positions if available
					if (node.x !== undefined && node.y !== undefined) {
						nodeX = node.x;
						nodeY = node.y;
					} else {
						// Position nodes based on available space
						if (useHorizontal) {
							// Distribute on left and right sides
							const side = index % 2 === 0 ? -1 : 1; // Alternate sides
							const verticalIndex = Math.floor(index / 2);
							const verticalSpacing = height / (Math.ceil(data.nodesLength / 2) + 1);
							
							nodeX = width / 2 + side * (popupWidth / 2 + 100 + Math.random() * 50);
							nodeY = verticalSpacing * (verticalIndex + 1);
						} else {
							// Distribute on top and bottom
							const side = index % 2 === 0 ? -1 : 1; // Alternate top/bottom
							const horizontalIndex = Math.floor(index / 2);
							const horizontalSpacing = width / (Math.ceil(data.nodesLength / 2) + 1);
							
							nodeX = horizontalSpacing * (horizontalIndex + 1);
							nodeY = height / 2 + side * (popupHeight / 2 + 100 + Math.random() * 50);
						};
					};

					return {
						id: node.id,
						label: node.label,
						shortName: node.label,
						type: node.type,
						// Pass iconName directly - it will be used as key for loaded images
						iconName: node.iconName,
						layout: node.type === 'type' ? 4 : 0, // 4 is Type layout
						x: nodeX,
						y: nodeY,
						// Custom styling per node type
						customRadius: node.type === 'space' ? 30 : (node.type === 'type' ? 25 : 20),
						centerColor: themeColors.canvas.nodeCenter,
						edgeColor: node.type === 'type'
							? themeColors.node.type.fill
							: node.type === 'space'
								? themeColors.node.space.fill
								: themeColors.node.object.fill,
						glowColor: node.type === 'type'
							? themeColors.node.type.glow
							: node.type === 'space'
								? themeColors.node.space.glow
								: themeColors.node.object.glow
					};
				});

				// Convert links
				const edges = data.links.map(link => ({
					source: link.source,
					target: link.target,
					type: 0, // Link type
					name: '',
					opacity: link.opacity || 0.3,
				}));

				// Send data to worker
				workerRef.current.postMessage({ id: 'setData', nodes, edges });
				
				// Load icon images for type nodes
				loadIconImages(nodes);
			},
			{ fireImmediately: true } // Run immediately and on changes
		);

		return () => dispose(); // Cleanup reaction
	}, [isInitialized]); // Only recreate when initialization changes

	// Handle resize
	useEffect(() => {
		if (!workerRef.current || !isInitialized) {
			return;
		};

		// Update blocking area on resize
		const centerX = width / 2;
		const centerY = height / 2;
		const blockingArea = {
			x: centerX - popupWidth / 2,
			y: centerY - popupHeight / 2,
			width: popupWidth,
			height: popupHeight
		};

		workerRef.current.postMessage({
			id: 'setBlockingAreas',
			areas: [blockingArea],
		});

		workerRef.current.postMessage({
			id: 'resize',
			width,
			height,
			density: window.devicePixelRatio || 1,
		});
	}, [ width, height, popupWidth, popupHeight, isInitialized ]);

	return (
		<div 
			className="onboardingGraphWorkerContainer"
			style={{ 
				width: `${width}px`,
				height: `${height}px`,
			}}
		>
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				style={{
					width: `${width}px`,
					height: `${height}px`,
				}}
			/>
		</div>
	);

};

export default OnboardingGraphWorker;