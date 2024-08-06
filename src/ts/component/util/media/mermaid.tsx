import * as React from 'react';
import $ from 'jquery';
import mermaid from 'mermaid';
import { J, S } from 'Lib';

interface Props {
	chart: string;
};

class Mermaid extends React.Component<Props> {

	node = null;

	render () {
		return (
			<div ref={ref => this.node = ref} className="mermaid">{this.props.chart}</div>
		);
	};

	componentDidMount () {
		const theme = (J.Theme[S.Common.getThemeClass()] || {}).mermaid;

		if (theme) {
			for (const k in theme) {
				if (!theme[k]) {
					delete(theme[k]);
				};
			};

			mermaid.initialize({ theme: 'base', themeVariables: theme });
		};

		mermaid.contentLoaded();
	};

	componentDidUpdate (prevProps: Props) {
		if (prevProps.chart !== this.props.chart) {
			$(this.node).removeAttr('data-processed');
			mermaid.contentLoaded();
		};
	};

};

export default Mermaid;