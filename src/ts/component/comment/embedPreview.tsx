import React, { useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	processor: I.EmbedProcessor;
	text: string;
	onEdit?: () => void;
	onRemove?: () => void;
};

let _katex: any = null;
let _katexLoading: Promise<any> | null = null;

const getKatex = (): any => {
	if (_katex) return _katex;
	if (!_katexLoading) {
		_katexLoading = import('katex').then(m => {
			_katex = m.default || m;
			return import('katex/dist/contrib/mhchem');
		});
	};
	return null;
};

const EmbedPreview = ({ processor, text, onEdit, onRemove }: Props) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [ latexHtml, setLatexHtml ] = useState('');
	const processorName = I.EmbedProcessor[processor] || 'Embed';
	const isLatex = processor === I.EmbedProcessor.Latex;
	const hasContent = !!text;

	useEffect(() => {
		if (!isLatex || !text) {
			return;
		};

		const katex = getKatex();
		if (katex) {
			try {
				const html = katex.renderToString(text, { displayMode: true, throwOnError: false, strict: false });
				setLatexHtml(html);
			} catch (e) {
				setLatexHtml(`<span class="error">${U.String.sanitize(text)}</span>`);
			};
		} else {
			_katexLoading?.then(() => {
				try {
					const html = _katex.renderToString(text, { displayMode: true, throwOnError: false, strict: false });
					setLatexHtml(html);
				} catch (e) {
					setLatexHtml(`<span class="error">${U.String.sanitize(text)}</span>`);
				};
			});
		};
	}, [ text, isLatex ]);

	useEffect(() => {
		if (isLatex || !hasContent) {
			return;
		};

		const iframe = iframeRef.current;
		if (!iframe) {
			return;
		};

		const renderEmbed = async () => {
			let embedText = text;

			// For URL-based processors, convert raw URL to embed URL, then to HTML
			if (U.Embed.allowEmbedUrl(processor) && !embedText.match(/<(iframe|script)/)) {
				embedText = U.Embed.getHtml(processor, U.Embed.getParsedUrl(embedText));
			};

			if (!embedText) {
				return;
			};

			// Fix Bilibili schemeless urls
			if (processor === I.EmbedProcessor.Bilibili) {
				if (embedText.match(/src="\/\/player[^"]+"/)) {
					embedText = embedText.replace(/src="(\/\/player[^"]+)"/, 'src="https:$1"');
				};
				if (!/autoplay=/.test(embedText)) {
					embedText = embedText.replace(/(src="[^"]+)"/, `$1&autoplay=0"`);
				};
			};

			// Sketchfab: extract iframe only
			if ((processor === I.EmbedProcessor.Sketchfab) && embedText.match(/<(iframe|script)/)) {
				embedText = embedText.match(/<iframe.*?<\/iframe>/)?.[0] || '';
			};

			const sanitizeParam: any = {
				ADD_TAGS: [ 'iframe' ],
				ADD_ATTR: [ 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src' ],
			};

			let allowScript = false;

			if (processor === I.EmbedProcessor.GithubGist) {
				allowScript = !!embedText.match(/(?:src=")?(https:\/\/gist.github.com(?:[^"]+))"?/);
			};

			if (processor === I.EmbedProcessor.Telegram) {
				const m = embedText.match(/post="([^"]+)"/);
				allowScript = !!(m && m.length && embedText.match(/src="https:\/\/telegram.org([^"]+)"/));
			};

			if (allowScript) {
				sanitizeParam.FORCE_BODY = true;
				sanitizeParam.ADD_TAGS.push('script');
			};

			const onLoad = () => {
				try {
					const data: any = {
						processor,
						blockId: 'comment-embed',
						allowIframeResize: U.Embed.allowIframeResize(processor),
						insertBeforeLoad: U.Embed.insertBeforeLoad(processor),
						useRootHeight: U.Embed.useRootHeight(processor),
					};

					if (U.Embed.allowJs(processor)) {
						data.js = embedText;
					} else {
						let html = embedText.replace(/\r?\n/g, '');
						html = html.replace(/<iframe([^>]*)>.*?<\/iframe>/gi, '<iframe$1></iframe>');
						data.html = DOMPurify.sanitize(html, sanitizeParam).toString();
					};

					iframe.contentWindow?.postMessage(data, '*');
				} catch (e) {
					// ignore
				};
			};

			iframe.addEventListener('load', onLoad);
			iframe.src = './embed/iframe.html';

			return () => iframe.removeEventListener('load', onLoad);
		};

		let cleanup: (() => void) | undefined;
		renderEmbed().then(fn => { cleanup = fn; });

		return () => cleanup?.();
	}, [ text, processor, isLatex, hasContent ]);

	const cn = [ 'commentEmbedPreview', `is${processorName}` ];

	let content: React.ReactNode = null;

	if (!hasContent) {
		content = (
			<div className="empty" onClick={onEdit || undefined}>
				<span className="processorName">{processorName}</span>
				<span className="hint">{U.String.sprintf(translate('blockEmbedPlaceholder'), processorName)}</span>
			</div>
		);
	} else
	if (isLatex) {
		content = <div className="latexPreview" dangerouslySetInnerHTML={{ __html: latexHtml }} />;
	} else {
		content = (
			<iframe
				ref={iframeRef}
				className="embedIframe"
				sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
			/>
		);
	};

	return (
		<div className={cn.join(' ')} contentEditable={false}>
			{content}
			{(hasContent && (onEdit || onRemove)) ? (
				<div className="embedActions">
					{onEdit ? <Icon name="common/edit" className="edit" onClick={onEdit} /> : ''}
					{onRemove ? <Icon name="menu/action/remove" className="remove" onClick={onRemove} /> : ''}
				</div>
			) : ''}
		</div>
	);
};

export default EmbedPreview;
