import * as React from 'react';
import { I } from 'Lib';
import katex from 'katex';

interface Props extends I.Menu {};

class MenuPreviewLatex extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { text, example } = data;

		const math = katex.renderToString(String(text || ''), {
			displayMode: true,
			throwOnError: false,
			output: 'html',
			trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
		});

		return (
			<div>
				<div className="math" dangerouslySetInnerHTML={{ __html: math }} />
				{example ? <div className="example">Example: {text}</div> : ''}
			</div>
		);
	};

};

export default MenuPreviewLatex;
