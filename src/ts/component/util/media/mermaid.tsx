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
			<div ref={ref => this.node = ref} className="mermaid">{chart}</div>
		);
	};

	componentDidMount () {
		this.init();
		mermaid.contentLoaded();
	};

	async componentDidUpdate (prevProps: Props) {
		this.init();
		$(this.node).removeAttr('data-processed');
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
		const { svg } = await mermaid.render('mermaid-chart', chart);
		
		node.html(svg);
    };

});

export default Mermaid;