import React, { useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { reaction } from 'mobx';
import { S, U, J } from 'Lib';

interface OnboardingGraphWorkerProps {
	width: number;
	height: number;
	popupWidth?: number;
	popupHeight?: number;
}

const OnboardingGraphWorker = observer(({ 
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
		console.log('[OnboardingGraphWorker]: loadIconImages called with nodes:', nodes.map(n => ({ 
			id: n.id, 
			type: n.type, 
			iconName: n.iconName,
			label: n.label 
		})));
		
		if (!workerRef.current) {
			console.log('[OnboardingGraphWorker]: No worker ref, skipping icon loading');
			return;
		};
		
		for (const node of nodes) {
			if (node.iconName && (node.type == 'type') && !loadedImages.current.has(node.iconName)) {
				console.log('[OnboardingGraphWorker]: Loading icon for:', node.iconName);
				
				// Use the same pattern as in graph.ts - direct require without try/catch
				// Use regular updateSvg with theme-appropriate fill matching node colors
				const src = U.Common.updateSvg(require(`img/icon/type/default/${node.iconName}.svg`), { 
					id: node.iconName, 
					size: 70, // 30% smaller (was 100)
					fill: theme === 'dark' 
						? themeColors.node.type.fill // Use theme color for dark mode
						: 'hsla(155, 76%, 57%, 1)', // Green matching type nodes for light mode
				});
				
				if (!src) {
					console.warn('[OnboardingGraphWorker]: No src generated for icon:', node.iconName);
					continue;
				}
				
				console.log('[OnboardingGraphWorker]: Created src for icon:', node.iconName);
				
				// Create image and convert to bitmap
				const img = new Image();

				img.src = src;
				
				await new Promise((resolve) => {
					img.onload = async () => {
						console.log('[OnboardingGraphWorker]: Icon image loaded:', node.iconName);
						const bitmap = await createImageBitmap(img);
						workerRef.current?.postMessage({
							id: 'image',
							src: node.iconName, // Use iconName as key
							bitmap
						}, [ bitmap ]);

						loadedImages.current.add(node.iconName);
						console.log('[OnboardingGraphWorker]: Sent icon bitmap to worker:', node.iconName);
						resolve(true);
					};
					img.onerror = () => {
						console.warn('[OnboardingGraphWorker]: Failed to load icon image:', node.iconName);
						resolve(false);
					};
				});
			} else {
				if (loadedImages.current.has(node.iconName)) {
					console.log('[OnboardingGraphWorker]: Icon already loaded:', node.iconName);
				};
			};
		};
	};

	// Handle mouse events
	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		const rect = canvasRef.current?.getBoundingClientRect();
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
	
	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		// Throttle to max 30 events per second
		const now = Date.now();
		if (now - lastMouseMoveRef.current < 33) {
			return;
		};

		lastMouseMoveRef.current = now;
		
		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) {
			return;
		};
		
		workerRef.current.postMessage({
			id: 'onMouseMove',
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
	};

	const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!workerRef.current) {
			return;
		};
		
		const rect = canvasRef.current?.getBoundingClientRect();
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

	const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
		// When mouse leaves canvas (e.g., goes over popup), release any dragged node
		if (!workerRef.current || !isDragging) {
			return;
		};
		
		console.log('Mouse left canvas while dragging, releasing node');
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
				
				// Reaction frequency tracking removed for production
				
				console.log('[OnboardingGraphWorker]: Sending nodes to worker:', data.nodesLength);
		
				// Calculate available space
				const horizontalSpace = (width - popupWidth) / 2;
				const verticalSpace = (height - popupHeight) / 2;
				const useHorizontal = horizontalSpace > verticalSpace;
		
				// Convert sparkOnboarding nodes to worker format
				console.log('[OnboardingGraphWorker]: Nodes from store:', data.nodes.map(n => ({ id: n.id, type: n.type, iconName: n.iconName })));
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

});

export default OnboardingGraphWorker;