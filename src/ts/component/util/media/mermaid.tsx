import React, { forwardRef, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import elkLayouts from '@mermaid-js/layout-elk';

mermaid.registerLayoutLoaders(elkLayouts);

interface Props {
	id?: string;
	chart: string;
};

const MediaMermaid = forwardRef<HTMLDivElement, Props>(({
	id = '',
	chart = '',
}, ref) => {

	const nodeRef = useRef(null);
	const chartRef = useRef(null);
	const errorRef = useRef(null);
	const themeClass = S.Common.getThemeClass();

	const init = async () => {
		const themeVariables = (J.Theme[themeClass] || {}).mermaid || {};

		for (const k in themeVariables) {
			if (!themeVariables[k]) {
				delete(themeVariables[k]);
			};
		};

		if (chartRef.current) {
			chartRef.current.textContent = chart;
			chartRef.current.removeAttribute('data-processed');
		};
		if (errorRef.current) {
			errorRef.current.textContent = '';
		};

		try {
			mermaid.initialize({ theme: 'base', themeVariables });
			
			await mermaid.run({ 
				querySelector: `#${id} .mermaid`,
				postRenderCallback: () => {
					U.Dom.renderLinks(chartRef.current);
				},
			});
		} catch (e) {
			console.error(e);
		};
	};

	useEffect(() => {
		init();
	});

	return (
		<div id={id} ref={nodeRef} className="mermaidWrapper">
			<div ref={errorRef} className="error" />
			<div ref={chartRef} className="mermaid" />
		</div>
	);

});

export default MediaMermaid;