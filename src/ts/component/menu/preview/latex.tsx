import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, U, translate } from 'Lib';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const MenuPreviewLatex = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
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
			<div className="math" dangerouslySetInnerHTML={{ __html: U.String.sanitize(math) }} />
			{example ? <div className="example">{U.String.sprintf(translate('menuPreviewLatexExample'), text)}</div> : ''}
		</div>
	);

}));

export default MenuPreviewLatex;