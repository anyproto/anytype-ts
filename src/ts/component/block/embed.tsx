import * as React from 'react';
import $ from 'jquery';
import Prism from 'prismjs';
import raf from 'raf';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { observer } from 'mobx-react';
import { Icon, Label, Editable, Dimmer } from 'Component';
import { I, C, keyboard, UtilCommon, UtilMenu, focus, Renderer, translate, UtilEmbed, UtilData } from 'Lib';
import { menuStore, commonStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

interface State {
	isShowing: boolean;
	isEditing: boolean;
};

const BlockEmbed = observer(class BlockEmbed extends React.Component<I.BlockComponent, State> {
	
	_isMounted = false;
	text = '';
	timeout = 0;
	node = null;
	refEditable = null;
	state = {
		isShowing: false,
		isEditing: false,
	};

	constructor (props: I.BlockComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onFocusBlock = this.onFocusBlock.bind(this);
		this.onKeyDownInput = this.onKeyDownInput.bind(this);
		this.onKeyUpInput = this.onKeyUpInput.bind(this);
		this.onFocusInput = this.onFocusInput.bind(this);
		this.onBlurInput = this.onBlurInput.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onTemplate = this.onTemplate.bind(this);
	};

	render () {
		const { isShowing, isEditing } = this.state;
		const { readonly, block } = this.props;
		const { content, fields, hAlign } = block;
		const { processor } = content;
		const { width } = fields || {};
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const menuItem: any = UtilMenu.getBlockEmbed().find(it => it.id == processor) || { name: '', icon: '' };
		const text = String(content.text || '').trim();
		const css: any = {};

		if (width) {
			css.width = (width * 100) + '%';
		};

		if (!text) {
			cn.push('isEmpty');
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		let select = null;
		let source = null;
		let resize = null;
		let empty = '';
		let placeholder = '';

		if (UtilEmbed.allowBlockResize(processor)) {
			resize = <Icon className="resize" onMouseDown={e => this.onResizeStart(e, false)} />;
		};

		switch (processor) {
			default: {
				source = <Icon className="source" onClick={this.onEdit} />;
				placeholder = UtilCommon.sprintf(translate('blockEmbedPlaceholder'), menuItem.name);

				if (!text) {
					empty = UtilCommon.sprintf(translate('blockEmbedEmpty'), menuItem.name);
				};

				if (!isShowing && text && !UtilEmbed.allowAutoRender(processor)) {
					cn.push('withPreview');
				};
				break;
			};

			case I.EmbedProcessor.Latex: {
				placeholder = translate('blockEmbedLatexPlaceholder');
				select = (
					<div className="selectWrap">
						<div id="select" className="select" onMouseDown={this.onTemplate}>
							<div className="name">{translate('blockEmbedLatexTemplate')}</div>
							<Icon className="arrow light" />
						</div>
					</div>
				);

				if (!text) {
					empty = translate('blockEmbedLatexEmpty');
				};
				break;
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				tabIndex={0} 
				className={cn.join(' ')}
				onKeyDown={this.onKeyDownBlock} 
				onKeyUp={this.onKeyUpBlock} 
				onFocus={this.onFocusBlock}
			>
				<div className="valueWrap resizable" style={css}>
					<div className="preview" onClick={this.onPreview} />
					<div id="value" onClick={this.onEdit} />
					<div id={this.getContainerId()} />

					{empty ? <Label text={empty} className="label empty" onClick={this.onEdit} /> : ''}					
					{select}
					{source}
					{resize}

					<Dimmer />
				</div>

				<Editable 
					key={`block-${block.id}-editable`}
					ref={ref => this.refEditable = ref}
					id="input"
					readonly={readonly}
					placeholder={placeholder}
					onSelect={this.onSelect}
					onFocus={this.onFocusInput}
					onBlur={this.onBlurInput}
					onKeyUp={this.onKeyUpInput} 
					onKeyDown={this.onKeyDownInput}
					onInput={this.onChange}
					onPaste={this.onPaste}
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.init();
		this.onScroll();
	};

	componentDidUpdate () {
		this.init();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		$(`#d${this.getContainerId()}`).remove();
	};

	init () {
		const { block } = this.props;

		this.setText(block.content.text);
		this.setValue(this.text);
		this.setContent(this.text);
		this.rebind();
	};

	rebind () {
		const { block } = this.props;
		const { processor } = block.content;
		const { isEditing, isShowing } = this.state;
		const win = $(window);
		const node = $(this.node);

		this.unbind();

		win.on(`mousedown.${block.id}`, (e: any) => {
			if (!this._isMounted || !isEditing || menuStore.isOpen('blockLatex')) {
				return;
			};

			if ($(e.target).parents(`#block-${block.id}`).length > 0) {
				return;
			};

			e.stopPropagation();

			menuStore.close('blockLatex');
			window.clearTimeout(this.timeout);

			this.placeholderCheck();
			this.save(() => { 
				this.setEditing(false);
				menuStore.close('previewLatex');
			});
		});

		win.on(`online.${block.id} offline.${block.id}`, () => {
			if (isShowing && navigator.onLine) {
				node.find('#receiver').remove('');
				this.setContent(this.text);
			};
		});

		if (UtilEmbed.allowScroll(processor)) {
			win.on(`scroll.${block.id}`, () => this.onScroll());
		};

		win.on(`resize.${block.id}`, () => this.resize());
	};

	unbind () {
		const { block } = this.props;
		const events = [ 'mousedown', 'online', 'offline', 'scroll' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
	};

	onScroll () {
		const { block } = this.props;
		const { processor } = block.content;

		if (!this._isMounted || !UtilEmbed.allowScroll(processor) || UtilEmbed.allowAutoRender(processor)) {
			return;
		};

		const node = $(this.node);
		const win = $(window);
		const { wh } = UtilCommon.getWindowDimensions();
		const st = win.scrollTop();
		const { top } = node.offset();
		const bot = top + node.height();

		this.setShowing((bot > st) && (top < st + wh));
	};

	getContainerId () {
		return [ 'block', this.props.block.id, 'container' ].join('-');
	};

	setEditing (isEditing: boolean) {
		if (this.state.isEditing == isEditing) {
			return;
		};

		this.state.isEditing = isEditing;
		this.setState({ isEditing }, () => {
			if (isEditing) {
				const length = this.text.length;
				this.setRange({ from: length, to: length });
			};
		});
	};

	setShowing (isShowing: boolean) {
		if (this.state.isShowing == isShowing) {
			return;
		};

		this.state.isShowing = isShowing;
		this.setState({ isShowing });
	};

	onFocusBlock () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
		this.setRange({ from: 0, to: 0 });
	};

	onKeyDownBlock (e: any) {
		const { rootId, onKeyDown } = this.props;
		const node = $(this.node);
		const cmd = keyboard.cmdKey();
		const isEditing = node.hasClass('isEditing');

		if (isEditing) {
			// Undo
			keyboard.shortcut(`${cmd}+z`, e, () => {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor');
			});

			// Redo
			keyboard.shortcut(`${cmd}+shift+z, ${cmd}+y`, e, () => {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor');
			});
		};

		if (onKeyDown && !isEditing) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUpBlock (e: any) {
		const { onKeyUp } = this.props;
		const node = $(this.node);
		const isEditing = node.hasClass('isEditing');

		if (onKeyUp && !isEditing) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onKeyDownInput (e: any) {
		if (!this._isMounted) {
			return;
		};

		const { filter } = commonStore;
		const range = this.getRange();

		keyboard.shortcut('backspace', e, () => {
			if (range && (range.from == filter.from)) {
				menuStore.close('blockLatex');
			};
		});
	};

	onKeyUpInput (e: any) {
		if (!this._isMounted) {
			return;
		};

		const { block } = this.props;
		const value = this.getValue();
		const range = this.getRange();

		if (block.isEmbedLatex()) {
			const { filter } = commonStore;
			const symbolBefore = value[range?.from - 1];
			const menuOpen = menuStore.isOpen('blockLatex');

			if ((symbolBefore == '\\') && !keyboard.isSpecial(e)) {
				commonStore.filterSet(range.from, '');
				this.onMenu(e, 'input', false);
			};

			if (menuOpen) {
				const d = range.from - filter.from;
				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\\/, '');
					commonStore.filterSetText(part);
				};
			};
		};

		if (!keyboard.isArrow(e)) {
			this.setContent(value);
			this.save();
		};
	};

	onChange () {
		const value = this.getValue();

		this.setValue(value);
		this.setContent(value);
	};

	onPaste (e: any) {
		e.preventDefault();

		const range = this.getRange();
		if (!range) {
			return;
		};

		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = cb.getData('text/plain');
		const to = range.end + text.length;

		this.setValue(UtilCommon.stringInsert(this.getValue(), text, range.from, range.to));
		this.setRange({ from: to, to });
		this.save();
	};

	onFocusInput () {
		keyboard.setFocus(true);
	};

	onBlurInput () {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);

		this.save();
	};

	onTemplate (e: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};

		const range = this.getRange();
		if (!range) {
			return;
		};

		commonStore.filterSet(range.from, '');
		this.onMenu(e, 'select', true);
	};

	onMenu (e: any, element: string, isTemplate: boolean) {
		if (!this._isMounted) {
			return;
		};

		const { rootId, block } = this.props;
		const win = $(window);

		const recalcRect = () => {
			let rect = null;
			if (element == 'input') {
				rect = UtilCommon.getSelectionRect();
			};
			return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
		};

		const menuParam = {
			recalcRect,
			element: `#block-${block.id} #${element}`,
			offsetY: 4,
			offsetX: () => {
				const rect = recalcRect();
				return rect ? 0 : Constant.size.blockMenu;
			},
			commonFilter: true,
			className: (isTemplate ? 'isTemplate' : ''),
			subIds: Constant.menuIds.latex,
			onClose: () => {
				commonStore.filterSet(0, '');
			},
			data: {
				isTemplate: isTemplate,
				rootId: rootId,
				blockId: block.id,
				onSelect: (from: number, to: number, item: any) => {
					let text = item.symbol || item.comment;

					if (isTemplate) {
						text = ' ' + text;
					};

					const value = UtilCommon.stringInsert(this.getValue(), text, from, to);

					this.setValue(value);
					this.setRange({ from: to, to });
					this.save();
				},
			},
		};

		raf(() => menuStore.open('blockLatex', menuParam));
	};

	setText (text: string) {
		this.text = String(text || '').trim();
	};

	setValue (value: string) {
		if (!this._isMounted || !this.state.isEditing) {
			return;
		};

		const { block } = this.props;
		const { processor } = block.content;
		const lang = UtilEmbed.getLang(processor);
		const range = this.getRange();

		if (value && lang) {
			value = Prism.highlight(value, Prism.languages[lang], lang);
		};

		this.refEditable.setValue(value);
		this.placeholderCheck();

		if (range) {
			this.setRange(range);
		};
	};

	getValue (): string {
		return this.refEditable.getTextValue();
	};

	updateRect () {
		const rect = UtilCommon.getSelectionRect();
		if (!rect || !menuStore.isOpen('blockLatex')) {
			return;
		};

		menuStore.update('blockLatex', { 
			rect: { ...rect, y: rect.y + $(window).scrollTop() }
		});
	};

	setContent (text: string) {
		if (!this._isMounted) {
			return '';
		};

		const { isShowing } = this.state;
		const { block } = this.props;
		const { processor } = block.content;
		const node = $(this.node);
		const value = node.find('#value');

		if (!isShowing && !UtilEmbed.allowAutoRender(processor)) {
			value.html('');
			return;
		};

		this.setText(text);

		if (!this.text) {
			value.html('');
			return;
		};

		const win = $(window);

		switch (processor) {
			default: {
				const sandbox = [ 'allow-scripts' ];
				const allowIframeResize = UtilEmbed.allowIframeResize(processor);

				let iframe = node.find('iframe');
				let text = this.text;
				let allowScript = false;

				if (UtilEmbed.allowSameOrigin(processor)) {
					sandbox.push('allow-same-origin');
				};

				if (UtilEmbed.allowPresentation(processor)) {
					sandbox.push('allow-presentation');
				};

				if (UtilEmbed.allowPopup(processor)) {
					sandbox.push('allow-popups');
				};

				const onLoad = () => {
					const iw = (iframe[0] as HTMLIFrameElement).contentWindow;
					const sanitizeParam: any = { 
						ADD_TAGS: [ 'iframe' ],
						ADD_ATTR: [
							'frameborder', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy',
						],
					};

					const data: any = { 
						...UtilEmbed.getEnvironmentContent(processor), 
						allowIframeResize, 
						insertBeforeLoad: UtilEmbed.insertBeforeLoad(processor),
						useRootHeight: UtilEmbed.useRootHeight(processor),
						align: block.hAlign,
						processor,
						className: UtilData.blockEmbedClass(processor),
						blockId: block.id,
					};

					if (UtilEmbed.allowEmbedUrl(processor) && !text.match(/<(iframe|script)/)) {
						text = UtilEmbed.getHtml(processor, UtilEmbed.getParsedUrl(text));
					};

					if (processor == I.EmbedProcessor.Telegram) {
						const m = text.match(/post="([^"]+)"/);

						allowScript = !!(m && m.length && text.match(/src="https:\/\/telegram.org([^"]+)"/));
					};

					if (processor == I.EmbedProcessor.GithubGist) {
						allowScript = !!text.match(/src="https:\/\/gist.github.com([^"]+)"/);
					};

					if (allowScript) {
						sanitizeParam.FORCE_BODY = true;
						sanitizeParam.ADD_TAGS.push('script');
					};

					if (UtilEmbed.allowJs(processor)) {
						data.js = text;
					} else {
						data.html = DOMPurify.sanitize(text, sanitizeParam);
					};

					iw.postMessage(data, '*');

					if (allowIframeResize) {
						win.off(`message.${block.id}`).on(`message.${block.id}`, e => {
							const oe = e.originalEvent as any;
							const { height, blockId } = oe.data;

							if (blockId == block.id) {
								iframe.css({ height });
							};
						});
					};
				};

				if (!iframe.length) {
					iframe = $('<iframe />', {
						id: 'receiver',
						src: UtilCommon.fixAsarPath(`./embed/iframe.html?theme=${commonStore.getThemeClass()}`),
						frameborder: 0,
						scrolling: 'no',
						sandbox: sandbox.join(' '),
						allowtransparency: true,
					});

					iframe.off('load').on('load', onLoad);
					value.html('').append(iframe);
				} else {
					onLoad();
				};
				break;
			};

			case I.EmbedProcessor.Latex: {
				value.html(katex.renderToString(this.text, { 
					displayMode: true, 
					throwOnError: false,
					output: 'html',
					trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
				}));

				value.find('a').each((i: number, item: any) => {
					item = $(item);

					item.off('click').click((e: any) => {
						e.preventDefault();
						Renderer.send('urlOpen', item.attr('href'));
					});
				});

				this.updateRect();
				break;
			};

			case I.EmbedProcessor.Mermaid: {
				mermaid.mermaidAPI.render(this.getContainerId(), this.text).then(res => {
					value.html(res.svg || this.text);

					if (res.bindFunctions) {
						res.bindFunctions(value.get(0));
					};
				}).catch(e => {
					const error = $(`#d${this.getContainerId()}`).hide();
					
					value.html(error.html());
				});
				break;
			};
		};
	};

	placeholderCheck () {
		this.refEditable?.placeholderCheck();
	};

	onEdit (e: any) {
		const { readonly } = this.props;
		
		if (readonly) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		this.setEditing(true);
	};

	onPreview (e: any) {
		this.setShowing(true);
	};

	save (callBack?: (message: any) => void) {
		const { rootId, block, readonly } = this.props;
		
		if (readonly) {
			return;
		};

		const value = this.getValue().trim();

		blockStore.updateContent(rootId, block.id, { text: value });
		C.BlockLatexSetText(rootId, block.id, value, callBack);
	};

	getRange () {
		return UtilCommon.objectCopy(this.refEditable.getRange());
	};

	setRange (range: I.TextRange) {
		this.refEditable.setRange(range);
	};

	onSelect () {
		if (!this._isMounted) {
			return;
		};

		const win = $(window);

		keyboard.disableSelection(true);

		win.off('mouseup.embed').on('mouseup.embed', (e: any) => {	
			keyboard.disableSelection(false);
			win.off('mouseup.embed');
		});
	};

	onResizeStart (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, block } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(this.node);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.embed mouseup.embed');
		
		if (selection) {
			selection.hide();
		};

		keyboard.disableSelection(true);
		$(`#block-${block.id}`).addClass('isResizing');
		win.on('mousemove.embed', e => this.onResizeMove(e, checkMax));
		win.on('mouseup.embed', e => this.onResizeEnd(e, checkMax));
	};
	
	onResizeMove (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const wrap = node.find('.valueWrap');
		
		if (!wrap.length) {
			return;
		};

		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		wrap.css({ width: (w * 100) + '%' });
	};

	onResizeEnd (e: any, checkMax: boolean) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const { id } = block;
		const node = $(this.node);
		const wrap = node.find('.valueWrap');
		
		if (!wrap.length) {
			return;
		};

		const win = $(window);
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		win.off('mousemove.embed mouseup.embed');
		$(`#block-${block.id}`).removeClass('isResizing');
		keyboard.disableSelection(false);
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};

	getWidth (checkMax: boolean, v: number): number {
		const { block } = this.props;
		const { id, fields } = block;
		const width = Number(fields.width) || 1;
		const el = $(`#selectable-${id}`);

		if (!el.length) {
			return width;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		const w = Math.min(rect.width, Math.max(160, checkMax ? width * rect.width : v));
		
		return Math.min(1, Math.max(0, w / rect.width));
	};


	resize () {
	};

});

export default BlockEmbed;