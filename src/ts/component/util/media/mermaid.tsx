import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import mermaid from 'mermaid';
import { observer } from 'mobx-react';
import { J, S, U } from 'Lib';

interface Props {
	chart: string;
};

const MediaMermaid = observer(forwardRef<HTMLDivElement, Props>(({
	chart = '',
}, ref) => {

	const nodeRef = useRef(null);
	const chartRef = useRef(null);
	const errorRef = useRef(null);
	const themeClass = S.Common.getThemeClass();

	const init = () => {
		const themeVariables = (J.Theme[themeClass] || {}).mermaid;
		if (!themeVariables) {
			return;
		};

		for (const k in themeVariables) {
			if (!themeVariables[k]) {
				delete(themeVariables[k]);
			};
		};

		mermaid.initialize({ theme: 'base', themeVariables });
		mermaid.contentLoaded();

		U.Common.renderLinks($(chartRef.current));
	};

	useEffect(() => {
		init();
	});

	useEffect(() => {
		$(chartRef.current).removeAttr('data-processed');
		$(errorRef.current).text('');
		init();
	}, [ themeClass, chart ]);

	return (
		<div ref={nodeRef} className="mermaidWrapper">
			<div ref={errorRef} className="error" />
			<div ref={chartRef} className="mermaid">{chart}</div>
		</div>
	);

}));

export default MediaMermaid;