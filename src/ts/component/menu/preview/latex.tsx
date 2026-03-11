import React, { forwardRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { I, U, translate } from 'Lib';

let _katex: any = null;
let _katexLoading: Promise<any> | null = null;
const getKatex = (): any => {
	if (_katex) return _katex;
	if (!_katexLoading) {
		_katexLoading = import('katex').then(m => {
			_katex = m.default || m;
			return import('katex/dist/contrib/mhchem');
		}).then(() => _katex);
	};
	return null;
};

const MenuPreviewLatex = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
	const { data } = param;
	const { text, example } = data;
	const [ katexLoaded, setKatexLoaded ] = useState(!!getKatex());

	useEffect(() => {
		if (!katexLoaded) {
			const katex = getKatex();
			if (katex) {
				setKatexLoaded(true);
			} else {
				_katexLoading?.then(() => setKatexLoaded(true));
			};
		};
	}, []);

	const katex = getKatex();
	const math = katex ? katex.renderToString(String(text || ''), {
		displayMode: true,
		throwOnError: false,
		output: 'html',
		fleqn: true,
		trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
	}) : '';

	return (
		<div>
			<div className="math" dangerouslySetInnerHTML={{ __html: U.String.sanitize(math) }} />
			{example ? <div className="example">{U.String.sprintf(translate('menuPreviewLatexExample'), text)}</div> : ''}
		</div>
	);

}));

export default MenuPreviewLatex;
