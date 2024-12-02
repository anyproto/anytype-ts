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
	};

	async function drawDiagram () {
		const node = $(nodeRef.current);

		let svg: any = '';
		try {
			const res = await mermaid.render('mermaid-chart', chart);

			if (res.svg) {
				svg = res.svg;
			};
		} catch (e) {
			console.error('[Mermaid].drawDiagram', e);
			node.find('.error').text(e.message);
		};
		
		node.find('.mermaid').html(svg);
		U.Common.renderLinks(node);
	};

	useEffect(() => {
		init();
		mermaid.contentLoaded();
		U.Common.renderLinks($(nodeRef.current));
	});

	useEffect(() => {
		const node = $(nodeRef.current);

		node.find('.chart').removeAttr('data-processed');
		node.find('.error').text('');

		init();
		drawDiagram();
	}, [ themeClass, chart ]);

	return (
		<div ref={nodeRef} className="mermaidWrapper">
			<div className="error" />
			<div className="mermaid">{chart}</div>
		</div>
	);

}));

export default MediaMermaid;