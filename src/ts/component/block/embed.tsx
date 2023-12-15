import * as React from 'react';
import $ from 'jquery';
import Prism from 'prismjs';
import raf from 'raf';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { observer } from 'mobx-react';
import { Icon, Label, Editable } from 'Component';
import { I, C, keyboard, UtilCommon, UtilMenu, focus, Renderer, translate, UtilEmbed } from 'Lib';
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
		const { readonly, block } = this.props;
		const { processor } = block.content;
		const { isShowing, isEditing } = this.state;
		const cn = [ 'wrap', 'resizable', 'focusable', 'c' + block.id ];
		const menuItem: any = UtilMenu.getBlockEmbed().find(it => it.id == processor) || { name: '', icon: '' };
		const pcn = [ 'preview', menuItem.icon ];
		const text = String(block.content.text || '').trim();

		if (!text) {
			cn.push('isEmpty');
		};

		if (isEditing) {
			cn.push('isEditing');
		};

		let select = null;
		let button = null;
		let preview = null;
		let empty = '';
		let placeholder = '';

		switch (processor) {
			default: {
				button = <Icon className="source" onClick={this.onEdit} />;
				placeholder = UtilCommon.sprintf(translate('blockEmbedPlaceholder'), menuItem.name);

				if (!text) {
					empty = UtilCommon.sprintf(translate('blockEmbedEmpty'), menuItem.name);
				};

				if (!isShowing && text) {
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
				<div className={[ 'preview', menuItem.icon ].join(' ')} onClick={this.onPreview} />
				{select}
				{button}

				{empty ? <Label text={empty} className="label empty" onClick={this.onEdit} /> : ''}
				<div id="value" onClick={this.onEdit} />
				<div id={this.getContainerId()} />
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
		this.onScroll();
		this.rebind();
	};

	rebind () {
		const { block } = this.props;
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

		win.on(`scroll.${block.id}`, () => this.onScroll());
	};

	unbind () {
		const { block } = this.props;
		const events = [ 'mousedown', 'online', 'offline', 'scroll' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
	};

	onScroll () {
		if (!this._isMounted) {
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
		if (this.state.isEditing != isEditing) {
			this.setState({ isEditing }, () => {
				if (isEditing) {
					const length = this.text.length;
					this.setRange({ from: length, to: length });
				};
			});
		};
	};

	setShowing (isShowing: boolean) {
		if (this.state.isShowing != isShowing) {
			this.setState({ isShowing });
		};
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

		const lang = this.getLang();
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

	getLang () {
		const { block } = this.props;
		const { processor } = block.content;

		switch (processor) {
			default: return 'html';
			case I.EmbedProcessor.Latex: return 'latex';
			case I.EmbedProcessor.Mermaid: return 'yaml';
			case I.EmbedProcessor.Chart: return 'js';
		};
	};

	getEnvironmentContent (): { html: string; libs: string[] } {
		const { block } = this.props;
		const { processor } = block.content;

		let html = '';
		let libs = [];

		switch (processor) {
			case I.EmbedProcessor.Chart: {
				html = `<canvas id="chart"></canvas>`;
				libs.push('https://cdn.jsdelivr.net/npm/chart.js');
				break;
			};
		};

		return { html, libs };
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
		const node = $(this.node);
		const value = node.find('#value');

		if (!isShowing && !block.isEmbedLatex()) {
			value.html('');
			return;
		};

		this.setText(text);

		if (!this.text) {
			value.html('');
			return;
		};

		const { processor } = block.content;
		const win = $(window);

		switch (processor) {
			default: {
				let iframe = node.find('iframe');
				let text = this.text;

				const sandbox = [ 'allow-scripts' ];
				const allowSameOrigin = [ I.EmbedProcessor.Youtube, I.EmbedProcessor.Vimeo, I.EmbedProcessor.Soundcloud, I.EmbedProcessor.GoogleMaps, I.EmbedProcessor.Miro, I.EmbedProcessor.Figma ];
				const allowPresentation = [ I.EmbedProcessor.Youtube, I.EmbedProcessor.Vimeo ];
				const allowEmbedUrl = [ I.EmbedProcessor.Youtube, I.EmbedProcessor.Vimeo, I.EmbedProcessor.GoogleMaps, I.EmbedProcessor.Miro, I.EmbedProcessor.Figma ];
				const allowJs = [ I.EmbedProcessor.Chart ];
				const allowPopup = [];

				if (allowSameOrigin.includes(processor)) {
					sandbox.push('allow-same-origin');
				};

				if (allowPresentation.includes(processor)) {
					sandbox.push('allow-presentation');
				};

				if (allowPopup.includes(processor)) {
					sandbox.push('allow-popups');
				};

				const onLoad = () => {
					const iw = (iframe[0] as HTMLIFrameElement).contentWindow;
					const env = this.getEnvironmentContent();
					const data: any = { ...env, theme: commonStore.getThemeClass() };

					if (allowEmbedUrl.includes(processor) && !text.match(/<iframe/)) {
						text = UtilEmbed.getHtml(processor, UtilEmbed.getParsedUrl(text));
					};

					if (allowJs.includes(processor)) {
						data.js = text;
					} else {
						data.html = DOMPurify.sanitize(text, { 
							ADD_TAGS: [ 
								'iframe',
							],
							ADD_ATTR: [
								'frameborder', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy',
							],
						});
					};

					iw.postMessage(data, '*');
					win.off(`message.${block.id}`).on(`message.${block.id}`, () => {});
				};

				if (!iframe.length) {
					iframe = $('<iframe />', {
						id: 'receiver',
						src: this.fixAsarPath('./embed/iframe.html'),
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

	fixAsarPath (path: string): string {
		const origin = location.origin;
		
		let href = location.href;

		if (origin == 'file://') {
			href = href.replace('/app.asar/', '/app.asar.unpacked/');
			href = href.replace('/index.html', '/');
			path = href + path.replace(/^\.\//, '');
		};
		return path;
	};

});

export default BlockEmbed;