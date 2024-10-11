import * as React from 'react';
import $ from 'jquery';
import mermaid from 'mermaid';
import { observer } from 'mobx-react';
import { J, S } from 'Lib';

interface Props {
	chart: string;
};

const Mermaid = observer(class Mermaid extends React.Component<Props> {

	node = null;

	render () {
		const { theme } = S.Common;
		const { chart } = this.props;

		return (
			<div ref={ref => this.node = ref} className="mermaidWrapper">
				<div className="error" />
				<div className="mermaid">{chart}</div>
			</div>
		);
	};

	componentDidMount () {
		this.init();
		mermaid.contentLoaded();
	};

	async componentDidUpdate (prevProps: Props) {
		const node = $(this.node);

		this.init();
		node.find('.chart').removeAttr('data-processed');
		node.find('.error').text('');

		await this.drawDiagram();
	};

	init () {
		const theme = (J.Theme[S.Common.getThemeClass()] || {}).mermaid;

		if (theme) {
			for (const k in theme) {
				if (!theme[k]) {
					delete(theme[k]);
				};
			};

			mermaid.initialize({ theme: 'base', themeVariables: theme });
		};
	};

	async drawDiagram () {
		const node = $(this.node);
		const { chart } = this.props;

		let svg: any = '';

		try {
			const res = await mermaid.render('mermaid-chart', chart);
			if (res) {
				svg = res;
			};
		} catch (e) {
			console.error('[Mermaid].drawDiagram', e);
			node.find('.error').text(e.message);
		};
		
		node.find('.chart').html(svg);
    };

});

export default Mermaid;