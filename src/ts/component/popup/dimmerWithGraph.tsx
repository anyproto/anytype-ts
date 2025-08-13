import React, { useMemo, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { S } from 'Lib';
import OnboardingGraphWorker from './graph/OnboardingGraphWorker';
import 'scss/component/popup/dimmerWithGraph.scss';

interface DimmerWithGraphProps {
	onClick?: () => void;
}

const DimmerWithGraph = observer(({ onClick }: DimmerWithGraphProps) => {
	const { sparkOnboarding } = S;
	const [shouldRenderGraph, setShouldRenderGraph] = useState(false);
	
	// Delay graph rendering to improve initial load performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setShouldRenderGraph(true);
		}, 300); // Slightly faster load
		
		return () => clearTimeout(timer);
	}, []);
	
	// Calculate graph dimensions based on window size
	const graphWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
	const graphHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
	
	// Memoize the graph component to prevent unnecessary re-renders
	const graphComponent = useMemo(() => {
		if (!shouldRenderGraph) return null;
		
		return (
			<OnboardingGraphWorker 
				width={graphWidth}
				height={graphHeight}
				popupWidth={720}
				popupHeight={680}
			/>
		);
	}, [shouldRenderGraph, sparkOnboarding.graphNodes.length, sparkOnboarding.graphLinks.length, graphWidth, graphHeight]);
	
	return (
		<div className="dimmerWithGraph">
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