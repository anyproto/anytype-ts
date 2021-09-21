import * as React from 'react';
import { I } from 'ts/lib';

import 'katex/dist/katex.min.css';

interface Props extends I.Menu {};

const katex = require('katex');

class MenuPreviewLatex extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { text } = data;

		const math = katex.renderToString(String(text || ''), {
			displayMode: true, 
			throwOnError: false,
			output: 'html',
		});

		return (
			<div className="math" dangerouslySetInnerHTML={{ __html: math }} />
		);
	};

};

export default MenuPreviewLatex;
