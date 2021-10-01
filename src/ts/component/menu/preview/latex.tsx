import * as React from 'react';
import { I } from 'ts/lib';

import 'katex/dist/katex.min.css';

interface Props extends I.Menu {};

const katex = require('katex');

class MenuPreviewLatex extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { text, example } = data;

		const math = katex.renderToString(String(text || ''), {
			displayMode: true,
			throwOnError: false,
			output: 'html',
		});

		if (example) {
			return (
				<div>
					<div className="math" dangerouslySetInnerHTML={{ __html: math }} />
					<div className="item">Example: { text }</div>
				</div>
			);
		}

		return (
			<div>
				<div className="math" dangerouslySetInnerHTML={{ __html: math }} />
			</div>
		);
	};

};

export default MenuPreviewLatex;
