import * as React from 'react';
import { I, UtilCommon, translate } from 'Lib';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

class MenuPreviewLatex extends React.Component<I.Menu> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { text, example } = data;

		const math = katex.renderToString(String(text || ''), {
			displayMode: true,
			throwOnError: false,
			output: 'html',
			fleqn: true,
			trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
		});

		return (
			<div>
				<div className="math" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(math) }} />
				{example ? <div className="example">{UtilCommon.sprintf(translate('menuPreviewLatexExample'), text)}</div> : ''}
			</div>
		);
	};

};

export default MenuPreviewLatex;
