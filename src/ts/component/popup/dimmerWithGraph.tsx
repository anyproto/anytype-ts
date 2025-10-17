import React, { useMemo, useState, useEffect, useRef } from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import OnboardingGraphWorker from './graph/OnboardingGraphWorker';

interface DimmerWithGraphProps {
	onClick?: () => void;
};

const DimmerWithGraph = observer(({ onClick }: DimmerWithGraphProps) => {

	const [ shouldRenderGraph, setShouldRenderGraph ] = useState(false);
	const [ graphDimensions, setGraphDimensions ] = useState({
		width: typeof window !== 'undefined' ? window.innerWidth : 1200,
		height: typeof window !== 'undefined' ? window.innerHeight : 800,
	});
	
	// Track render frequency
	const renderCount = useRef(0);
	const lastRenderLog = useRef(Date.now());
	
	renderCount.current++;

	const now = Date.now();
	if (now - lastRenderLog.current > 1000) {
		if (renderCount.current > 1) {
			console.log(`[DimmerWithGraph] Rendered ${renderCount.current} times/sec`);
		};

		renderCount.current = 0;
		lastRenderLog.current = now;
	};
	
	// Delay graph rendering to improve initial load performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldRenderGraph(true);
		}, 300); // Slightly faster load
		
		return () => clearTimeout(timer);
	}, []);
	
	// Handle window resize with animation frame
	useEffect(() => {
		let animationFrame: number;
		
		const handleResize = () => {
			// Cancel any pending animation frame
			if (animationFrame) {
				raf.cancel(animationFrame);
			};
			
			// Use requestAnimationFrame for smooth updates synchronized with browser repaints
			animationFrame = raf(() => {
				const newWidth = window.innerWidth;
				const newHeight = window.innerHeight;
				
				// Only update if dimensions actually changed
				setGraphDimensions(prev => {
					if ((prev.width !== newWidth) || (prev.height !== newHeight)) {
						return { width: newWidth, height: newHeight };
					};

					return prev;
				});
			});
		};
		
		// Add resize listener
		window.addEventListener('resize', handleResize);
		
		// Cleanup
		return () => {
			if (animationFrame) {
				raf.cancel(animationFrame);
			};

			window.removeEventListener('resize', handleResize);
		};
	}, []);
	
	// Memoize the graph component to prevent unnecessary re-renders
	const graphComponent = useMemo(() => {
		if (!shouldRenderGraph) {
			return null;
		};
		
		return (
			<OnboardingGraphWorker 
				width={graphDimensions.width}
				height={graphDimensions.height}
				popupWidth={720}
				popupHeight={680}
			/>
		);
	}, [ shouldRenderGraph, graphDimensions.width, graphDimensions.height ]);
	
	return (
		<div className="dimmer withGraph">
			{/* Standard dimmer */}
			<div className="dimmer" onClick={onClick} />
			
			{/* Graph overlay on top of dimmer but behind popup */}
			<div className="graphOverlay">
				{graphComponent}
				
				{/* Invisible blocker for popup area to prevent graph interactions there */}
				<div 
					className="popupBlocker"
					onClick={(e) => e.stopPropagation()}
				/>
			</div>
		</div>
	);

});

export default DimmerWithGraph;