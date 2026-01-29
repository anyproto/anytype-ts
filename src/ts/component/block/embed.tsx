import React, { forwardRef, useEffect, useState, useRef, memo } from 'react';
import { createRoot } from 'react-dom/client';
import $ from 'jquery';
import raf from 'raf';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import { instance as viz } from '@viz-js/viz';
import { observer } from 'mobx-react';
import { Icon, Label, Editable, Dimmer, Select, Error, MediaMermaid, MediaExcalidraw } from 'Component';
import { I, C, S, U, J, keyboard, focus, Action, translate } from 'Lib';

const katex = require('katex');
const pako = require('pako');

require('katex/dist/contrib/mhchem');

const BlockEmbed = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
	const { isOnline, filter, theme } = S.Common;
	const [ isShowing, setIsShowing ] = useState(false);
	const [ isEditing, setIsEditing ] = useState(false);
	const { rootId, block, readonly, isPopup, onKeyDown, onKeyUp } = props;
	const { content, fields, hAlign } = block;
	const { processor } = content;
	const { width, type } = fields || {};
	const cn = [ 'wrap', 'focusable', `c${block.id}` ];
	const menuItem: any = U.Menu.getBlockEmbed().find(it => it.id == processor) || { name: '', icon: '' };
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
	const isExcalidraw = block.isEmbedExcalidraw();

	if (width) {
		css.width = (width * 100) + '%';
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

	const init = () => {
		setText(block.content.text);
		setValue(text);
		setContent(text);
		onScroll();
		rebind();
	};

	const rebind = () => {
		const win = $(window);
		const node = $(nodeRef.current);
		const preview = node.find('#preview');

		unbind();

		if (isEditing) {
			win.on(`mousedown.${block.id}`, (e: any) => {
				if (S.Menu.isOpenList([ 'blockLatex', 'select' ])) {
					return;
				};

				if ($(e.target).parents(`#block-${block.id}`).length > 0) {
					return;
				};

				e.stopPropagation();

				S.Menu.close('blockLatex');

				placeholderCheck();
				save(true, () => { 
					setIsEditing(false);
					S.Menu.close('previewLatex');
				});
			});
		};

		node.find('#receiver').remove();

		if (![ I.EmbedProcessor.Latex, I.EmbedProcessor.Mermaid ].includes(processor)) {
			isOnline ? preview.hide() : preview.show();
		};

		if (isOnline && (isShowing || U.Embed.allowAutoRender(processor))) {
			setContent(text);
		};

		if (!U.Embed.allowAutoRender(processor)) {
			const container = U.Common.getScrollContainer(isPopup);
			container.on(`scroll.${block.id}`, () => onScroll());
		};

		win.on(`resize.${block.id}`, () => resize());

		node.on('resizeMove', (e: any, oe: any) => onResizeMove(oe, true));
		node.on('edit', e => onEdit(e));
	};

	const unbind = () => {
		const container = U.Common.getScrollContainer(isPopup);
		const events = [ 'mousedown', 'mouseup', 'online', 'offline', 'resize' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
		container.off(`scroll.${block.id}`);
	};

	const onScroll = () => {
		if (U.Embed.allowAutoRender(processor)) {
			return;
		};

		window.clearTimeout(timeoutScrollRef.current);
		timeoutScrollRef.current = window.setTimeout(() => {
			const container = U.Common.getScrollContainer(isPopup);
			const node = $(nodeRef.current);
			if (!node.length) {
				return;
			};

			const ch = container.height();
			const st = container.scrollTop();
			const rect = node.get(0).getBoundingClientRect() as DOMRect;
			const top = rect.top - container.offset().top;

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
		const node = $(nodeRef.current);
		const isEditing = node.hasClass('isEditing');

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
		const node = $(nodeRef.current);
		const isEditing = node.hasClass('isEditing');

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
		const value = getValue();

		setValue(value);
		setContent(value);
	};

	const onPaste = (e: any) => {
		e.preventDefault();

		const range = getRange();
		if (!range) {
			return;
		};

		const data = e.clipboardData || e.originalEvent.clipboardData;
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
		const win = $(window);

		const recalcRect = () => {
			const rect = element == 'input' ? U.Common.getSelectionRect() : null;
			return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
		};

		const menuParam = {
			classNameWrap: 'fromBlock',
			recalcRect,
			element: `#block-${block.id} #${element}`,
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

		if (value && lang) {
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
		const rect = U.Common.getSelectionRect();
		if (!rect || !S.Menu.isOpen('blockLatex')) {
			return;
		};

		S.Menu.update('blockLatex', { 
			rect: { ...rect, y: rect.y + $(window).scrollTop() }
		});
	};

	const setContent = (text: string) => {
		const node = $(nodeRef.current);
		const value = node.find('#value');
		const error = node.find('#error');

		error.text('').hide();

		if (isUnsupported) {
			value.html('');
			return;
		};

		if (!isShowing && !U.Embed.allowAutoRender(processor)) {
			value.html('');
			return;
		};

		setText(text);

		if (!text && !allowEmptyContent) {
			value.html('');
			return;
		};

		const win = $(window);
		const element = value.get(0) as HTMLElement;

		if ([ I.EmbedProcessor.Mermaid, I.EmbedProcessor.Excalidraw ].includes(processor) && !rootRef.current) {
			rootRef.current = createRoot(element);
		};

			switch (processor) {
			default: {
				const sandbox = [ 'allow-scripts', 'allow-same-origin', 'allow-popups' ];
				const allowIframeResize = U.Embed.allowIframeResize(processor);

				let iframe = node.find('#receiver');
				let allowScript = false;

				if (U.Embed.allowPresentation(processor)) {
					sandbox.push('allow-presentation');
				};

				const onLoad = () => {
					const iw = (iframe[0] as HTMLIFrameElement).contentWindow;
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

					if (U.Embed.allowJs(processor)) {
						data.js = text;
					} else {
						text = text.replace(/\r?\n/g, '');
						text = text.replace(/<iframe([^>]*)>.*?<\/iframe>/gi, '<iframe$1></iframe>');

						data.html = DOMPurify.sanitize(text, sanitizeParam).toString();
					};

					iw.postMessage(data, '*');

					win.off(`message.${block.id}`).on(`message.${block.id}`, e => {
						const oe = e.originalEvent as any;
						const { type, height, blockId, url } = oe.data;

						if (blockId != block.id) {
							return;
						};

						switch (type) {
							case 'resize': {
								if (allowIframeResize) {
									iframe.css({ height });
								};
								break;
							};

							case 'openUrl': {
								Action.openUrl(url);
								break;
							};
						};
					});
				};

				if (!iframe.length) {
					iframe = $('<iframe />', {
						id: 'receiver',
						src: U.Common.fixAsarPath(`./embed/iframe.html?theme=${S.Common.getThemeClass()}`),
						frameborder: 0,
						scrolling: 'no',
						sandbox: sandbox.join(' '),
						allowtransparency: true,
						referrerpolicy: 'strict-origin-when-cross-origin',
					});

					iframe.off('load').on('load', onLoad);
					value.html('').append(iframe);
				} else {
					onLoad();
				};
				break;
			};

			case I.EmbedProcessor.Latex: {
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
					if (e instanceof katex.ParseError) {
						html = `<div class="error">Error in LaTeX '${U.String.htmlSpecialChars(text)}': ${U.String.htmlSpecialChars(e.message)}</div>`;
					} else {
						console.error(e);
					};
				};

				value.html(html);

				value.find('a').each((i: number, item: any) => {
					item = $(item);

					item.off('click').click((e: any) => {
						e.preventDefault();
						Action.openUrl(item.attr('href'));
					});
				});

				updateRect();
				break;
			};

			case I.EmbedProcessor.Mermaid: {
				rootRef.current.render(<MediaMermaid id={`block-${block.id}-mermaid`} chart={text} />);
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
				);
				break;
			};

			case I.EmbedProcessor.Graphviz: {
				viz().then(res => {
					try {
						value.html(res.renderSVGElement(text));
					} catch (e) {
						console.error(e);
						error.text(e.toString()).show();
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
		if (readonly) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		if (processor != I.EmbedProcessor.Excalidraw) {
			setIsEditing(true);
		};
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
		const win = $(window);

		keyboard.disableSelection(true);
		rangeRef.current = getRange();

		win.off(`mouseup.${block.id}`).on(`mouseup.${block.id}`, () => {	
			keyboard.disableSelection(false);
			win.off(`mouseup.${block.id}`);
		});
	};

	const onResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		const win = $(window);
		const node = $(nodeRef.current);

		focus.set(block.id, { from: 0, to: 0 });
		win.off(`mousemove.${block.id} mouseup.${block.id}`);
		
		selection?.hide();

		keyboard.setResize(true);
		keyboard.disableSelection(true);

		node.addClass('isResizing');
		win.on(`mousemove.${block.id}`, e => onResizeMove(e, checkMax));
		win.on(`mouseup.${block.id}`, e => onResizeEnd(e, checkMax));
	};

	const onResizeMove = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		const node = $(nodeRef.current);
		const wrap = node.find('#valueWrap');
		
		if (!wrap.length) {
			return;
		};

		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));
		
		wrap.css({ width: (w * 100) + '%' });
	};

	const onResizeEnd = (e: any, checkMax: boolean) => {
		const node = $(nodeRef.current);
		const wrap = node.find('#valueWrap');
		
		if (!wrap.length) {
			return;
		};

		const iframe = node.find('#receiver');

		iframe.css({ height: 'auto' });

		const win = $(window);
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));
		
		keyboard.setResize(false);
		keyboard.disableSelection(false);

		win.off(`mousemove.${block.id} mouseup.${block.id}`);
		node.removeClass('isResizing');

		C.BlockListSetFields(rootId, [
			{ blockId: block.id, fields: { ...fields, width: w } },
		]);
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const { id, fields } = block;
		const width = Number(fields.width) || 1;
		const el = $(`#selectionTarget-${id}`);

		if (!el.length) {
			return width;
		};
		
		const ew = el.width();
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));
		
		return Math.min(1, Math.max(0, w / ew));
	};

	const resize = () => {
		onScroll();
	};

	let select = null;
	let source = null;
	let resizeIcon = null;
	let empty = '';
	let placeholder = '';

	if (U.Embed.allowBlockResize(processor) && text) {
		resizeIcon = <Icon className="resize" onMouseDown={e => onResizeStart(e, false)} />;
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
				<Icon className="arrow light" />
			</div>
		);
	} else {
		source = <Icon className="source" onMouseDown={onEdit} />;
		placeholder = U.String.sprintf(translate('blockEmbedPlaceholder'), menuItem.name);
		empty = !text && !allowEmptyContent ? U.String.sprintf(translate('blockEmbedEmpty'), menuItem.name) : '';

		if (!isShowing && text && !U.Embed.allowAutoRender(processor)) {
			cn.push('withPreview');
		};
	};

	useEffect(() => {
		resize();
		init();

		return () => {
			unbind();

			window.clearTimeout(timeoutScrollRef.current);
			window.clearTimeout(timeoutSaveRef.current);
		};
	}, []);

	useEffect(() => {
		init();
	}, [ block.content.text, isEditing, isShowing ]);

	useEffect(() => {
		if (isEditing) {
			const length = text.length;

			setRange({ from: length, to: length });
		} else {
			$(window).off(`mouseup.${block.id} mousedown.${block.id}`);
			keyboard.disableSelection(false);
		};
	}, [ isEditing ]);

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

			<div id="valueWrap" className="valueWrap resizable" style={css}>
				{select ? <div className="selectWrap">{select}</div> : ''}

				{isUnsupported ? (
					<div className="preview unsupported">
						<Icon className="iconEmbed" />
						<Label text={translate('blockEmbedUnsupported')} />
					</div>
				) : (
					<>
						<div id="preview" className={[ 'preview', U.Data.blockEmbedClass(processor) ].join(' ')} onClick={() => setIsShowing(true)}>
							<Label text={translate('blockEmbedOffline')} />
						</div>
						<div id="value" onMouseDown={onEdit} />

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
				/>
			) : ''}
		</div>
	);

}));

export default memo(BlockEmbed);