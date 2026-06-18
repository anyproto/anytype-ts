import React from 'react';
import * as Prism from 'prismjs';

interface Props {
	text: string;
	lang?: string;
	className?: string;
};

/**
 * Read-only code block with Prism syntax highlighting and a language label.
 * Shared by chat messages and object discussions so both render code identically.
 * Grammars are loaded globally by the editor (text.tsx) and the Prism theme by app.tsx.
 */
const CodeBlock: React.FC<Props> = ({ text, lang, className = 'codeBlock' }) => {
	const code = String(text || '');
	const resolved = (lang ? (U.Prism.aliasMap[lang] || lang) : 'plain') || 'plain';
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
