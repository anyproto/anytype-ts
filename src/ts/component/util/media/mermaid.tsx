import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import mermaid from 'mermaid';
import { observer } from 'mobx-react';
import { J, S, U } from 'Lib';

interface Props {
	id?: string;
	chart: string;
};

const MediaMermaid = observer(forwardRef<HTMLDivElement, Props>(({
	id = '',
	chart = '',
}, ref) => {

	const nodeRef = useRef(null);
	const chartRef = useRef(null);
	const errorRef = useRef(null);
	const themeClass = S.Common.getThemeClass();

	const init = () => {
		const obj = $(chartRef.current);
		const themeVariables = (J.Theme[themeClass] || {}).mermaid || {};

		for (const k in themeVariables) {
			if (!themeVariables[k]) {
				delete(themeVariables[k]);
			};
		};

		obj.text(chart).removeAttr('data-processed');
		$(errorRef.current).text('');

		try {
			mermaid.initialize({ theme: 'base', themeVariables });
			mermaid.run({ 
				querySelector: `#${id} .mermaid`,
				postRenderCallback: () => {
					U.Common.renderLinks($(chartRef.current));
				}, 
			});
		} catch (e) { /**/ };
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

}));

export default MediaMermaid;