import React, { useEffect, useState } from 'react';
import * as Prism from 'prismjs';

interface Props {
	text: string;
	lang?: string;
	className?: string;
};

// Lazy per-language Prism grammar chunks (one chunk per language, same as the editor).
const prismLangModules = import.meta.glob([
	'/node_modules/prismjs/components/prism-*.js',
	'!/node_modules/prismjs/components/prism-*.min.js',
]);

const loadGrammar = async (lang: string): Promise<boolean> => {
	let loaded = false;

	for (const dep of U.Prism.getDependencies(lang)) {
		if (Prism.languages[dep]) {
			continue;
		};

		const loader = prismLangModules[`/node_modules/prismjs/components/prism-${dep}.js`];
		if (loader) {
			try {
				await loader();
				loaded = true;
			} catch (e) { /**/ };
		};
	};

	return loaded;
};

/**
 * Read-only code block with Prism syntax highlighting and a language label.
 * Shared by chat messages and object discussions so both render code identically.
 * Loads its own grammar on demand (a chat-only view doesn't mount the editor),
 * then re-renders; the Prism color theme is imported globally in app.tsx.
 */
const CodeBlock: React.FC<Props> = ({ text, lang, className = 'codeBlock' }) => {
	const code = String(text || '');
	const resolved = (lang ? (U.Prism.aliasMap[lang] || lang) : 'plain') || 'plain';
	const [ , forceRender ] = useState(0);

	useEffect(() => {
		let cancelled = false;

		if ((resolved != 'plain') && !Prism.languages[resolved]) {
			loadGrammar(resolved).then(loaded => {
				if (loaded && !cancelled) {
					forceRender(n => n + 1);
				};
			});
		};

		return () => { cancelled = true; };
	}, [ resolved ]);

	const grammar = Prism.languages[resolved];
	const highlighted = grammar ? Prism.highlight(code, grammar, resolved) : U.String.sanitize(code);

	const titles = U.Prism.getTitles();
	const langTitle = titles.find((t: any) => t.id === resolved);
	const langLabel = langTitle ? langTitle.name : (resolved != 'plain' ? resolved : '');

	return (
		<pre className={className}>
			{langLabel ? <div className="codeLang">{langLabel}</div> : null}
			<code dangerouslySetInnerHTML={{ __html: highlighted }} />
		</pre>
	);
};

export default CodeBlock;
