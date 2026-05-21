import React, { Suspense, forwardRef, useEffect, useState, useRef, memo } from 'react';
import { createRoot } from 'react-dom/client';
import raf from 'raf';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import { Icon, Label, Editable, Dimmer, Select, Error, Loader } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const MediaMermaid = React.lazy(() => import('Component/util/media/mermaid'));
const MediaExcalidraw = React.lazy(() => import('Component/util/media/excalidraw'));

let _katex: any = null;
let _katexLoading: Promise<any> | null = null;
let _pako: any = null;
let _pakoLoading: Promise<any> | null = null;
let _viz: any = null;
let _vizLoading: Promise<any> | null = null;

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


const getPako = async (): Promise<any> => {
	if (_pako) return _pako;
	if (!_pakoLoading) {
		_pakoLoading = import('pako').then(m => { _pako = m.default || m; return _pako; });
	};
	return _pakoLoading;
};

const getViz = async (): Promise<any> => {
	if (_viz) return _viz;
	if (!_vizLoading) {
		_vizLoading = import('@viz-js/viz').then(m => {
			_viz = m.instance;
			return _viz;
		});
	};
	return _vizLoading;
};

const BlockEmbed = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
	const { isOnline, filter, theme } = S.Common;
	const [ isShowing, setIsShowing ] = useState(false);
	const [ isEditing, setIsEditing ] = useState(false);
	const [ isFullScreen, setIsFullScreen ] = useState(false);
	const { rootId, block, isPopup, onKeyDown, onKeyUp } = props;
	const { content, fields, hAlign } = block;
	const { processor } = content;
	const isExcalidrawProcessor = processor == I.EmbedProcessor.Excalidraw;
	const readonly = props.readonly || isExcalidrawProcessor;
	const { width, type, height: fieldHeight } = fields || {};
	const cn = [ 'wrap', 'focusable', `c${block.id}` ];
	const menuItem: any = U.Menu.getBlockEmbed().find(it => it.id == processor) || { name: '' };
	const embedIconName = `embed/${U.String.toCamelCase(`-${I.EmbedProcessor[processor]}`)}` || 'embed/default';
	const text = String(content.text || '');
	const isUnsupported = I.EmbedProcessor[processor] === undefined;
	const css: any = {};
	const nodeRef = useRef(null);
	const editableRef = useRef(null);
	const typeRef = useRef(null);
	const timeoutScrollRef = useRef(0);
	const timeoutSaveRef = useRef(0);
	const textRef = useRef('');
	const rangeRef = useRef<I.TextRange>(null);
	const selection = S.Common.getRef('selectionProvider');
	const allowEmptyContent = U.Embed.allowEmptyContent(processor);
	const rootRef = useRef(null);
	const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
	const scrollTopRef = useRef(0);
	const mouseUpHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
	const mouseMoveHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
	const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);
	const isExcalidraw = block.isEmbedExcalidraw();

	let appHtmlContent = '';
	let appStateText = '';
	let appStateBlockId = '';
	if (processor === I.EmbedProcessor.AnytypeMiniApp) {
		const parent = S.Block.getParentLeaf(rootId, block.id);
		if (parent) {
			const codeSiblings = S.Block.getChildren(rootId, parent.id, (b: I.Block) => {
				return b && (b.id !== block.id) && b.isTextCode();
			});
			const htmlBlock = codeSiblings.find((b: any) => {
				const lang = String(b.fields?.lang || '').toLowerCase();
				return (lang === 'html') || (lang === 'markup');
			});
			const jsonBlock = codeSiblings.find((b: any) => {
				return String(b.fields?.lang || '').toLowerCase() === 'json';
			});
			appHtmlContent = String(htmlBlock?.content?.text || '');
			appStateText = String(jsonBlock?.content?.text || '');
			appStateBlockId = String(jsonBlock?.id || '');
		};
	};

	const excalidrawCss: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	if (isExcalidraw) {
		if (fieldHeight) {
			excalidrawCss.height = Math.max(200, fieldHeight);
		} else {
			const el = U.Dom.get(`selectionTarget-${block.id}`);
			const containerWidth = el ? U.Dom.contentWidth(el) : 600;
			excalidrawCss.height = Math.max(200, containerWidth * (width || 1) * 9 / 16);
		};
	};

	if (!text) {
		cn.push('isEmpty');
	};

	if (isEditing) {
		cn.push('isEditing');
	};

	if (isUnsupported) {
		cn.push('isUnsupported');
	};

	if (isFullScreen) {
		cn.push('isFullScreen');
	};

	const init = async () => {
		setText(block.content.text);
		setValue(text);
		setContent(text);
		onScroll();
		rebind();
	};

	const scrollHandlerRef = useRef<(() => void) | null>(null);
	const mouseDownHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);

	const rebind = () => {
		const node = nodeRef.current;
		const preview = node ? U.Dom.select('#preview', node) : null;

		unbind();

		if (isEditing) {
			mouseDownHandlerRef.current = (e: globalThis.MouseEvent) => {
				if (S.Menu.isOpenList([ 'blockLatex', 'select' ])) {
					return;
				};

				if ((e.target as HTMLElement)?.closest(`#block-${U.Common.esc(block.id)}`)) {
					return;
				};

				e.stopPropagation();

				S.Menu.close('blockLatex');

				placeholderCheck();
				save(true, () => {
					setIsEditing(false);
					S.Menu.close('previewLatex');
				});
			};
			U.Dom.addEvent(window, 'mousedown', mouseDownHandlerRef.current);
		};

		if (node) {
			const receiver = U.Dom.select('#receiver', node);
			if (receiver && processor !== I.EmbedProcessor.AnytypeMiniApp) {
				receiver.remove();
			};
		};

		if (![ I.EmbedProcessor.Latex, I.EmbedProcessor.Mermaid ].includes(processor)) {
			if (preview) {
				U.Dom.css(preview, { display: isOnline ? 'none' : '' });
			};
		};

		if (isOnline && (isShowing || U.Embed.allowAutoRender(processor))) {
			setContent(text);
		};

		if (!U.Embed.allowAutoRender(processor)) {
			const container = U.Dom.getScrollContainer(isPopup);
			scrollHandlerRef.current = () => onScroll();
			if (container) {
				U.Dom.addEvent(container, 'scroll', scrollHandlerRef.current);
			};
		};
	};

	const unbind = () => {
		const container = U.Dom.getScrollContainer(isPopup);

		if (mouseDownHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousedown', mouseDownHandlerRef.current);
			mouseDownHandlerRef.current = null;
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			mouseUpHandlerRef.current = null;
		};
		if (messageHandlerRef.current) {
			U.Dom.removeEvent(window, 'message', messageHandlerRef.current);
			messageHandlerRef.current = null;
		};
		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
			mouseMoveHandlerRef.current = null;
		};

		if (scrollHandlerRef.current && container) {
			U.Dom.removeEvent(container, 'scroll', scrollHandlerRef.current);
			scrollHandlerRef.current = null;
		};
	};

	const onScroll = () => {
		if (U.Embed.allowAutoRender(processor)) {
			return;
		};

		window.clearTimeout(timeoutScrollRef.current);
		timeoutScrollRef.current = window.setTimeout(() => {
			const container = U.Dom.getScrollContainer(isPopup);
			const node = nodeRef.current;
			if (!node || !container) {
				return;
			};

			const ch = container.clientHeight;
			const st = container.scrollTop;
			const rect = U.Dom.getElementRect(node);
			const containerRect = container.getBoundingClientRect();
			const top = rect.top - containerRect.top;

			if (top <= st + ch) {
				setIsShowing(true);
			};
		}, 50);
	};

	const onFocusBlock = () => {
		const range = rangeRef.current || { from: 0, to: 0 };

		focus.set(block.id, range);
		setRange(range);
	};

	const onKeyDownBlock = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		const node = nodeRef.current;
		const isEditing = node ? U.Dom.hasClass(node, 'isEditing') : false;

		if (isEditing) {
			// Undo
			keyboard.shortcut('undo', e, () => {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor');
			});

			// Redo
			keyboard.shortcut('redo', e, () => {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor');
			});

			keyboard.shortcut('tab', e, () => {
				e.preventDefault();
			});
		};

		if (onKeyDown && !isEditing) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const onKeyUpBlock = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		const node = nodeRef.current;
		const isEditing = node ? U.Dom.hasClass(node, 'isEditing') : false;

		if (onKeyUp && !isEditing) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const onKeyDownInput = (e: any) => {
		const range = getRange();

		keyboard.shortcut('backspace', e, () => {
			if (range && (range.from == filter.from)) {
				S.Menu.close('blockLatex');
			};
		});
	};

	const onKeyUpInput = (e: any) => {
		const value = getValue();
		const range = getRange();

		if (block.isEmbedLatex()) {
			const { filter } = S.Common;
			const symbolBefore = value[range?.from - 1];
			const menuOpen = S.Menu.isOpen('blockLatex');

			if ((symbolBefore == '\\') && !keyboard.isSpecial(e)) {
				S.Common.filterSet(range.from, '');
				onLatexMenu(e, 'input', false);
			};

			if (menuOpen) {
				const d = range.from - filter.from;
				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\\/, '');
					S.Common.filterSetText(part);
				};
			};
		};

		if (!keyboard.isArrow(e)) {
			setContent(value);
			save(false);
		};
	};

	const onChange = () => {
		if (keyboard.isComposition) {
			return;
		};

		const value = getValue();

		setValue(value);
		setContent(value);
	};

	const onCompositionEndInput = () => {
		const value = getValue();

		setValue(value);
		setContent(value);
	};

	const onPaste = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const range = getRange();
		if (!range) {
			return;
		};

		const data = e.clipboardData;
		const text = String(data.getData('text/plain') || '');
		const to = range.to + text.length;
		const value = U.String.insert(getValue(), text, range.from, range.to);

		const cb = () => {
			setValue(value);
			setRange({ from: to, to });
			save(true);
		};

		if (block.isEmbedKroki()) {
			const type = U.Embed.getKrokiType(value);
			if (type && (type != fields.type)) {
				onKrokiTypeChange(type, cb);
			} else {
				cb();
			};
		} else {
			cb();
		};
	};

	const onBlurInput = () => {
		save(true);
	};

	const onKrokiTypeChange = (type: string, callBack?: () => void) => {
		C.BlockListSetFields(rootId, [
			{ blockId: block.id, fields: { ...fields, type } },
		], callBack);
	};

	const onLatexTemplate = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		rangeRef.current = getRange();

		if (rangeRef.current) {
			S.Common.filterSet(rangeRef.current.from, '');
		};
		onLatexMenu(e, 'select', true);
	};

	const onLatexMenu = (e: any, element: string, isTemplate: boolean) => {
		const recalcRect = () => {
			const rect = element == 'input' ? U.Dom.getSelectionRect() : null;
			return rect ? { ...rect, y: rect.y + window.scrollY } : null;
		};

		const menuParam = {
			classNameWrap: 'fromBlock',
			recalcRect,
			element: `#block-${U.Common.esc(block.id)} #${element}`,
			offsetY: 4,
			offsetX: () => {
				const rect = recalcRect();
				return rect ? 0 : J.Size.blockMenu;
			},
			commonFilter: true,
			className: (isTemplate ? 'isTemplate' : ''),
			subIds: J.Menu.latex,
			onClose: () => S.Common.filterSet(0, ''),
			data: {
				isTemplate: isTemplate,
				rootId: rootId,
				blockId: block.id,
				onSelect: (from: number, to: number, item: any) => {
					let text = item.symbol || item.comment;

					if (isTemplate) {
						text = ` ${text}`;
					};

					const value = U.String.insert(getValue(), text, from, to);

					to += text.length;

					setValue(value);
					setRange({ from: to, to });
					save(true);
				},
			},
		};

		raf(() => S.Menu.open('blockLatex', menuParam));
	};

	const setText = (text: string) => {
		textRef.current = String(text || '');
	};

	const setValue = (value: string) => {
		if (!isEditing) {
			return;
		};

		const lang = U.Embed.getLang(processor);
		const range = getRange();

		if (value && lang && Prism.languages[lang]) {
			value = Prism.highlight(value, Prism.languages[lang], lang);
		};

		editableRef.current?.setValue(value);
		placeholderCheck();

		if (range) {
			setRange(range);
		};
	};

	const getValue = (): string => {
		return String(editableRef.current?.getTextValue() || '');
	};

	const updateRect = () => {
		const rect = U.Dom.getSelectionRect();
		if (!rect || !S.Menu.isOpen('blockLatex')) {
			return;
		};

		S.Menu.update('blockLatex', {
			rect: { ...rect, y: rect.y + window.scrollY }
		});
	};

	const setContent = (text: string) => {
		const node = nodeRef.current;
		const value = node ? U.Dom.select('#value', node) : null;
		const error = node ? U.Dom.select('#error', node) : null;

		if (error) {
			error.textContent = '';
			U.Dom.css(error, { display: 'none' });
		};

		if (isUnsupported) {
			if (value) value.innerHTML = '';
			return;
		};

		if (!isShowing && !U.Embed.allowAutoRender(processor)) {
			if (value) value.innerHTML = '';
			return;
		};

		setText(text);

		if (!text && !allowEmptyContent) {
			if (value) value.innerHTML = '';
			return;
		};

		const element = value as HTMLElement;

		if ([ I.EmbedProcessor.Mermaid, I.EmbedProcessor.Excalidraw ].includes(processor) && !rootRef.current) {
			rootRef.current = createRoot(element);
		};

			switch (processor) {
			default: {
				const sandbox = [ 'allow-scripts', 'allow-same-origin', 'allow-popups' ];
				const allowIframeResize = U.Embed.allowIframeResize(processor);

				let iframe = node ? U.Dom.select('#receiver', node) as HTMLIFrameElement : null;
				let allowScript = false;

				if (U.Embed.allowPresentation(processor)) {
					sandbox.push('allow-presentation');
				};

				const onLoad = async () => {
					const iw = (iframe as HTMLIFrameElement).contentWindow;
					const sanitizeParam: any = { 
						ADD_TAGS: [ 'iframe', 'div', 'a' ],
						ADD_ATTR: [
							'frameborder', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy', 'src',
						],
						ALLOWED_URI_REGEXP: /^(?:(?:ftp|https?|mailto|tel|callto|sms|cid|xmpp|xxx|anytype):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
					};

					const data: any = { 
						allowIframeResize, 
						insertBeforeLoad: U.Embed.insertBeforeLoad(processor),
						useRootHeight: U.Embed.useRootHeight(processor),
						align: block.hAlign,
						processor,
						className: U.Data.blockEmbedClass(processor),
						blockId: block.id,
					};
					// Fix Bilibili schemeless urls and autoplay
					if (block.isEmbedBilibili()) {
						if (text.match(/src="\/\/player[^"]+"/)) {
							text = text.replace(/src="(\/\/player[^"]+)"/, 'src="https:$1"');
						};

						if (!/autoplay=/.test(text)) {
							text = text.replace(/(src="[^"]+)"/, `$1&autoplay=0"`);
						};
					};

					// If content is Kroki code pack the code into SVG url
					if (block.isEmbedKroki() && !text.match(/^https:\/\/kroki.io/)) {
						const pako = await getPako();
						const compressed = pako.deflate(new TextEncoder().encode(text), { level: 9 });
						const result = btoa(U.Common.uint8ToString(compressed)).replace(/\+/g, '-').replace(/\//g, '_');
						const type = fields.type || U.Embed.getKrokiOptions()[0].id;

						text = `https://kroki.io/${type}/svg/${result}`;
						typeRef.current?.setValue(type);
					};

					if (U.Embed.allowEmbedUrl(processor) && !text.match(/<(iframe|script)/)) {
						text = U.Embed.getHtml(processor, U.Embed.getParsedUrl(text));
					};

					if (block.isEmbedSketchfab() && text.match(/<(iframe|script)/)) {
						text = text.match(/<iframe.*?<\/iframe>/)?.[0] || '';
					};

					if (block.isEmbedGithubGist()) {
						allowScript = !!text.match(/(?:src=")?(https:\/\/gist.github.com(?:[^"]+))"?/);
					};

					if (block.isEmbedTelegram()) {
						const m = text.match(/post="([^"]+)"/);
						allowScript = !!(m && m.length && text.match(/src="https:\/\/telegram.org([^"]+)"/));
					};

					if (block.isEmbedDrawio()) {
						sanitizeParam.ADD_TAGS.push('svg', 'foreignObject', 'switch', 'g', 'text');

						allowScript = !!text.match(/https:\/\/(?:viewer|embed|app)\.diagrams\.net\/\?[^"\s>]*/);
					};

					if (allowScript) {
						sanitizeParam.FORCE_BODY = true;
						sanitizeParam.ADD_TAGS.push('script');
					};

					if (processor === I.EmbedProcessor.AnytypeMiniApp) {
						let parsedState: any = null;
						if (appStateText) {
							try {
								parsedState = JSON.parse(appStateText);
							} catch (e) {
								console.warn('AnytypeMiniApp: invalid JSON state', e);
							};
						};

						data.anytypeMiniApp = {
							html: appHtmlContent,
							state: parsedState,
						};
					} else
					if (U.Embed.allowJs(processor)) {
						data.js = text;
					} else {
						text = text.replace(/\r?\n/g, '');
						text = text.replace(/<iframe([^>]*)>.*?<\/iframe>/gi, '<iframe$1></iframe>');

						data.html = DOMPurify.sanitize(text, sanitizeParam).toString();
					};

					iw.postMessage(data, '*');

					if (messageHandlerRef.current) {
						U.Dom.removeEvent(window, 'message', messageHandlerRef.current);
					};
					messageHandlerRef.current = (e: MessageEvent) => {
						const { type, height, blockId, url } = e.data || {};

						if (blockId != block.id) {
							return;
						};

						switch (type) {
							case 'resize': {
								if (allowIframeResize) {
									U.Dom.css(iframe as HTMLElement, { height: height + 'px' });
								};
								break;
							};

							case 'openUrl': {
								Action.openUrl(url);
								break;
							};

							case 'anytypeMiniAppState': {
								if (!appStateBlockId) {
									break;
								};
								let serialized = '';
								try {
									serialized = JSON.stringify(e.data.state, null, 2);
								} catch (err) {
									console.warn('AnytypeMiniApp: failed to serialize state', err);
									break;
								};
								S.Block.updateContent(rootId, appStateBlockId, { text: serialized });
								C.BlockTextSetText(rootId, appStateBlockId, serialized, [], { from: 0, to: 0 });
								break;
							};
						};
					};
					U.Dom.addEvent(window, 'message', messageHandlerRef.current);
				};

				if (!iframe) {
					iframe = document.createElement('iframe');
					iframe.id = 'receiver';
					iframe.src = U.Common.fixAsarPath(`./embed/iframe.html?theme=${S.Common.getThemeClass()}`);
					iframe.setAttribute('frameborder', '0');
					iframe.setAttribute('scrolling', 'no');
					iframe.setAttribute('sandbox', sandbox.join(' '));
					iframe.setAttribute('allowtransparency', 'true');
					iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

					iframe.onload = () => onLoad();
					if (value) {
						value.innerHTML = '';
						value.appendChild(iframe);
					};
				} else {
					onLoad();
				};
				break;
			};

			case I.EmbedProcessor.Latex: {
				const katex = getKatex();
				if (!katex) {
					_katexLoading?.then(() => init());
					break;
				};

				let html = '';

				try {
					html = katex.renderToString(text, {
						displayMode: true,
						strict: false,
						throwOnError: true,
						output: 'html',
						fleqn: true,
						trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
					});
				} catch (e) {
					const message = (e as Error)?.message || String(e);
					html = `<div class="error">Error in LaTeX '${U.String.htmlSpecialChars(text)}': ${U.String.htmlSpecialChars(message)}</div>`;

					if (!(e instanceof katex.ParseError)) {
						console.error(e);
					};
				};

				if (value) value.innerHTML = html;

				if (value) {
					const links = U.Dom.selectAll('a', value);
					links.forEach((item: HTMLAnchorElement) => {
						item.onclick = (e: Event) => {
							e.preventDefault();
							Action.openUrl(item.getAttribute('href'));
						};
					});
				};

				updateRect();
				break;
			};

			case I.EmbedProcessor.Mermaid: {
				rootRef.current.render(
					<Suspense fallback={<Loader />}>
						<MediaMermaid id={`block-${block.id}-mermaid`} chart={text} />
					</Suspense>
				);
				break;
			};

			case I.EmbedProcessor.Excalidraw: {
				let data = null;
				try {
					data = JSON.parse(text || '{}');
				} catch (e) {
					console.warn('Invalid Excalidraw data:', e);
				};

				rootRef.current.render(
					<Suspense fallback={<Loader />}>
						<MediaExcalidraw
							data={data}
							onChange={(elements, appState, files) => {
								window.clearTimeout(timeoutSaveRef.current);
								timeoutSaveRef.current = window.setTimeout(() => {
									C.BlockLatexSetText(rootId, block.id, JSON.stringify({ elements, appState }));
								}, 1000);
							}}
							readonly={readonly}
						/>
					</Suspense>
				);
				break;
			};

			case I.EmbedProcessor.Graphviz: {
				getViz().then(instance => {
					return instance();
				}).then(res => {
					try {
						if (value) {
							value.innerHTML = '';
							value.appendChild(res.renderSVGElement(text));
						};
					} catch (e) {
						console.error(e);
						if (error) {
							error.textContent = e.toString();
							U.Dom.css(error, { display: 'block' });
						};
					};
				});
				break;
			};

		};
	};

	const placeholderCheck = () => {
		editableRef.current?.placeholderCheck();
	};

	const onEdit = (e: any) => {
		if (isExcalidrawProcessor) {
			e.preventDefault();
			e.stopPropagation();
			Preview.toastShow({ text: translate('blockEmbedExcalidrawReadonly') });
			return;
		};

		if (readonly) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		setIsEditing(true);
	};

	const save = (update: boolean, callBack?: (message: any) => void) => {
		if (readonly) {
			return;
		};

		const value = getValue();

		if (update) {
			S.Block.updateContent(rootId, block.id, { text: value });
		};
		C.BlockLatexSetText(rootId, block.id, value, callBack);
	};

	const getRange = (): I.TextRange => {
		return U.Common.objectCopy(editableRef.current.getRange());
	};

	const setRange = (range: I.TextRange) => {
		rangeRef.current = range;
		editableRef.current.setRange(range);
	};

	const onSelect = () => {
		keyboard.disableSelection(true);
		rangeRef.current = getRange();

		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
		};
		mouseUpHandlerRef.current = () => {
			keyboard.disableSelection(false);
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			mouseUpHandlerRef.current = null;
		};
		U.Dom.addEvent(window, 'mouseup', mouseUpHandlerRef.current);
	};

	const onResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;

		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
		};

		selection?.clear();
		selection?.hide();

		keyboard.setResize(true);
		keyboard.disableSelection(true);

		if (isExcalidraw) {
			const media = node ? U.Dom.select('.mediaExcalidraw', node) : null;
			resizeStartRef.current = {
				x: e.pageX,
				y: e.pageY,
				w: Number(fields.width) || 1,
				h: media ? U.Dom.contentHeight(media) : 400,
			};
		};

		U.Dom.addClass(node, 'isResizing');
		mouseMoveHandlerRef.current = (e: globalThis.MouseEvent) => onResizeMove(e, checkMax);
		mouseUpHandlerRef.current = (e: globalThis.MouseEvent) => onResizeEnd(e, checkMax);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandlerRef.current],
			['mouseup', mouseUpHandlerRef.current],
		]);
	};

	const onResizeMove = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		const wrap = node ? U.Dom.select('#valueWrap', node) : null;

		if (!wrap) {
			return;
		};

		const rect = U.Dom.getElementRect(wrap);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		U.Dom.css(wrap, { width: (w * 100) + '%' });

		if (isExcalidraw) {
			const start = resizeStartRef.current;
			const dy = e.pageY - start.y;
			const newHeight = Math.max(200, start.h + dy);
			const valueEl = node ? U.Dom.select('#value', node) : null;

			if (valueEl) {
				U.Dom.css(valueEl, { height: newHeight + 'px' });
			};
		};
	};

	const onResizeEnd = (e: any, checkMax: boolean) => {
		const node = nodeRef.current;
		const wrap = node ? U.Dom.select('#valueWrap', node) : null;

		if (!wrap) {
			return;
		};

		const iframe = node ? U.Dom.select('#receiver', node) : null;
		if (iframe) {
			U.Dom.css(iframe, { height: 'auto' });
		};

		const rect = U.Dom.getElementRect(wrap);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		keyboard.setResize(false);
		keyboard.disableSelection(false);

		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
			mouseMoveHandlerRef.current = null;
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			mouseUpHandlerRef.current = null;
		};
		U.Dom.removeClass(node, 'isResizing');

		const newFields: any = { ...fields, width: w };

		if (isExcalidraw) {
			const start = resizeStartRef.current;
			const dy = e.pageY - start.y;
			newFields.height = Math.max(200, start.h + dy);
		};

		C.BlockListSetFields(rootId, [
			{ blockId: block.id, fields: newFields },
		]);
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const { id, fields } = block;
		const width = Number(fields.width) || 1;
		const el = U.Dom.get(`selectionTarget-${id}`);

		if (!el) {
			return width;
		};

		const ew = U.Dom.contentWidth(el);
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const resize = () => {
		onScroll();
	};

	let select = null;
	let source = null;
	let resizeIcon = null;
	let expandIcon = null;
	let empty = '';
	let placeholder = '';

	if (U.Embed.allowBlockResize(processor) && (text || isExcalidraw)) {
		resizeIcon = <Icon name="common/resize" className="resize" onMouseDown={e => onResizeStart(e, false)} />;
	};

	if (isExcalidraw) {
		expandIcon = <Icon name="common/expand" className="expand" withBackground={true} onMouseDown={() => setIsFullScreen(!isFullScreen)} />;
	};

	if (block.isEmbedKroki()) {
		select = (
			<Select 
				id={`block-${block.id}-select`} 
				ref={typeRef}
				value={type} 
				options={U.Embed.getKrokiOptions()} 
				arrowClassName="light" 
				onChange={onKrokiTypeChange}
				showOn="mouseDown"
			/>
		);
	};

	if (block.isEmbedLatex()) {
		placeholder = translate('blockEmbedLatexPlaceholder');
		empty = !text ? translate('blockEmbedLatexEmpty') : '';
		select = (
			<div id="select" className="select" onMouseDown={onLatexTemplate}>
				<div className="name">{translate('blockEmbedLatexTemplate')}</div>
				<Icon name="arrow/button" size={8} className="arrow light" />
			</div>
		);
	} else {
		source = <Icon name="menu/action/source" className="source" onMouseDown={onEdit} />;
		placeholder = U.String.sprintf(translate('blockEmbedPlaceholder'), menuItem.name);
		empty = !text && !allowEmptyContent ? U.String.sprintf(translate('blockEmbedEmpty'), menuItem.name) : '';

		if (!isShowing && text && !U.Embed.allowAutoRender(processor)) {
			cn.push('withPreview');
		};
	};

	useEffect(() => {
		resize();
		init();

		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			unbind();

			window.clearTimeout(timeoutScrollRef.current);
			window.clearTimeout(timeoutSaveRef.current);

			resizeObserver.disconnect();
		};
	}, []);

	useEffect(() => {
		init();
	}, [ block.content.text, isEditing, isShowing, appHtmlContent, appStateText ]);

	useEffect(() => {
		if (isEditing) {
			const length = text.length;

			setRange({ from: length, to: length });
		} else {
			if (mouseUpHandlerRef.current) {
				U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
				mouseUpHandlerRef.current = null;
			};
			if (mouseDownHandlerRef.current) {
				U.Dom.removeEvent(window, 'mousedown', mouseDownHandlerRef.current);
				mouseDownHandlerRef.current = null;
			};
			keyboard.disableSelection(false);
			keyboard.setComposition(false);
		};
	}, [ isEditing ]);

	useEffect(() => {
		const container = U.Dom.getScrollContainer(isPopup);

		if (isFullScreen) {
			scrollTopRef.current = container?.scrollTop ?? 0;
		};

		const onEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				setIsFullScreen(false);
			};
		};

		if (isFullScreen) {
			U.Dom.addEvent(window, 'keydown', onEscape, true);
		};

		return () => {
			U.Dom.removeEvent(window, 'keydown', onEscape, true);

			if (isFullScreen && container) {
				container.scrollTop = scrollTopRef.current;
			};
		};
	}, [ isFullScreen ]);

	let tabIndex = -1;
	let onKeyDownProp;
	let onKeyUpProp;
	let onFocusProp;

	if (!isExcalidraw) {
		tabIndex = 0;
		onKeyDownProp = onKeyDownBlock;
		onKeyUpProp = onKeyUpBlock;
		onFocusProp = onFocusBlock;
	};

	return (
		<div 
			ref={nodeRef}
			tabIndex={tabIndex} 
			className={cn.join(' ')}
			onKeyDown={onKeyDownProp} 
			onKeyUp={onKeyUpProp} 
			onFocus={onFocusProp}
		>
			{source}
			{expandIcon}

			<div id="valueWrap" className="valueWrap" style={css}>
				{select ? <div className="selectWrap">{select}</div> : ''}

				{isUnsupported ? (
					<div className="preview unsupported">
						<Icon name="embed/default" size={40} className="iconEmbed" />
						<Label text={translate('blockEmbedUnsupported')} />
					</div>
				) : (
					<>
						<div id="preview" className={[ 'preview', U.Data.blockEmbedClass(processor) ].join(' ')} onClick={() => setIsShowing(true)}>
							<Icon name={embedIconName} size={40} className="iconEmbed" />
							<Label text={translate('blockEmbedOffline')} />
						</div>
						<div id="value" style={excalidrawCss} onMouseDown={onEdit} />

						{empty ? <Label text={empty} className="label empty" onMouseDown={onEdit} /> : ''}
						{resizeIcon}
					</>
				)}

				<Error id="error" />
				<Dimmer />
			</div>

			{!isUnsupported ? (
				<Editable
					key={`block-${block.id}-editable`}
					ref={editableRef}
					id="input"
					readonly={readonly}
					placeholder={placeholder}
					onSelect={onSelect}
					onBlur={onBlurInput}
					onKeyUp={onKeyUpInput}
					onKeyDown={onKeyDownInput}
					onInput={onChange}
					onPaste={onPaste}
					onMouseDown={onSelect}
					onCompositionEnd={onCompositionEndInput}
				/>
			) : ''}
		</div>
	);

});

export default memo(BlockEmbed);