import * as React from 'react';
import $ from 'jquery';
import Prism from 'prismjs';
import raf from 'raf';
import mermaid from 'mermaid';
import { observer } from 'mobx-react';
import { Icon, Label, Button } from 'Component';
import { I, keyboard, UtilCommon, C, focus, Renderer, translate, UtilEmbed } from 'Lib';
import { menuStore, commonStore, blockStore } from 'Store';
import { getRange, setRange } from 'selection-ranges';
import Constant from 'json/constant.json';

const katex = require('katex');
require('katex/dist/contrib/mhchem');

const BlockEmbed = observer(class BlockEmbedIndex extends React.Component<I.BlockComponent> {
	
	_isMounted = false;
	range = { start: 0, end: 0 };
	text = '';
	timeout = 0;
	node = null;
	win = null;
	input = null;
	value = null;
	empty = null;
	container = null;

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
		this.onMenu = this.onMenu.bind(this);
		this.onTemplate = this.onTemplate.bind(this);
	};

	render () {
		const { readonly, block } = this.props;
		const { processor } = block.content;
		const cn = [ 'wrap', 'resizable', 'focusable', 'c' + block.id ];

		let select = null;
		let empty = '';
		let button = null;

		switch (processor) {
			case I.EmbedProcessor.Latex: {
				select = (
					<div className="selectWrap">
						<div id="select" className="select" onClick={this.onTemplate}>
							<div className="name">{translate('blockEmbedLatexTemplate')}</div>
							<Icon className="arrow light" />
						</div>
					</div>
				);

				empty = translate('blockEmbedLatexEmpty');
				break;
			};

			case I.EmbedProcessor.Mermaid: {
				break;
			}; 
		};

		if (processor != I.EmbedProcessor.Latex) {
			button = <Button className="source c28" text={translate('blockEmbedSource')} onClick={this.onEdit} />;
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
				{select}
				{button}

				<div id="value" onClick={this.onEdit} />
				<Label id="empty" className="empty" text={empty} onClick={this.onEdit} />
				<div id={this.getContainerId()} />
				<div 
					id="input"
					contentEditable={!readonly}
					suppressContentEditableWarning={true}
					placeholder={translate('blockEmbedLatexPlaceholder')}
					onSelect={this.onSelect}
					onFocus={this.onFocusInput}
					onBlur={this.onBlurInput}
					onKeyUp={this.onKeyUpInput} 
					onKeyDown={this.onKeyDownInput}
					onChange={this.onChange}
					onPaste={this.onPaste}
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { block } = this.props;
		const node = $(this.node);

		this.win = $(window);
		this.text = String(block.content.text || '');
		this.empty = node.find('#empty');
		this.value = node.find('#value');
		this.input = node.find('#input').get(0);
		this.container = node.find(`#${this.getContainerId()}`);

		const length = this.text.length;

		this.setRange({ start: length, end: length });
		this.setValue(this.text);
	};

	componentDidUpdate () {
		const { block } = this.props;

		this.text = String(block.content.text || '');
		this.unbind();
		this.setValue(this.text);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		const { block } = this.props;

		this.unbind();
		this.win.on(`click.c${block.id}`, (e: any) => {
			if (!this._isMounted) {
				return;
			};

			if ($(e.target).parents(`#block-${block.id}`).length > 0) {
				return;
			};

			menuStore.close('blockLatex');
			window.clearTimeout(this.timeout);

			this.placeholderCheck(this.getValue());
			this.save(() => { 
				this.setEditing(false);
				menuStore.close('previewLatex');
			});
		});
	};

	unbind () {
		this.win.off(`click.c${this.props.block.id}`);
	};

	focus () {
		if (this._isMounted && this.range) {
			setRange(this.input, this.range);
		};
	};

	getContainerId () {
		return [ 'block', this.props.block.id, 'container' ].join('-');
	};

	setEditing (v: boolean) {
		const node = $(this.node);
		v ? node.addClass('isEditing') : node.removeClass('isEditing');
	};

	onFocusBlock () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
		this.focus();
	};

	onKeyDownBlock (e: any) {
		const { rootId, onKeyDown } = this.props;
		const cmd = keyboard.cmdKey();
		const node = $(this.node);
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
		const range = getRange(this.input);

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (range && (range.start == filter.from)) {
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

		if (block.isEmbedLatex()) {
			const { filter } = commonStore;
			const range = getRange(this.input);
			const symbolBefore = value[range?.start - 1];
			const menuOpen = menuStore.isOpen('blockLatex');

			if ((symbolBefore == '\\') && !keyboard.isSpecial(e)) {
				commonStore.filterSet(range.start, '');
				this.onMenu(e, 'input', false);
			};

			if (menuOpen) {
				const d = range.start - filter.from;
				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\\/, '');
					commonStore.filterSetText(part);
				};
			};
		};

		if (!keyboard.isSpecial(e)) {
			this.setContent(value);
			this.save();
		};
	};

	updateRect () {
		const rect = UtilCommon.getSelectionRect();
		if (!rect || !menuStore.isOpen('blockLatex')) {
			return;
		};

		menuStore.update('blockLatex', { 
			rect: { ...rect, y: rect.y + this.win.scrollTop() }
		});
	};

	onChange () {
		this.setValue(this.getValue());
	};

	onPaste (e: any) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();

		const range = getRange(this.input);
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = cb.getData('text/plain');
		const to = range.end + text.length;

		this.setValue(UtilCommon.stringInsert(this.getValue(), text, range.start, range.end));
		this.setRange({ start: to, end: to });
		this.focus();
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
		if (!this._isMounted) {
			return;
		};

		const range = getRange(this.input);

		commonStore.filterSet(range?.start, '');
		this.onMenu(e, 'select', true);
	};

	onMenu (e: any, element: string, isTemplate: boolean) {
		if (!this._isMounted) {
			return;
		};

		const { rootId, block } = this.props;
		const recalcRect = () => {
			let rect = null;
			if (element == 'input') {
				rect = UtilCommon.getSelectionRect();
			};
			return rect ? { ...rect, y: rect.y + this.win.scrollTop() } : null;
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
					
					this.setValue(UtilCommon.stringInsert(this.getValue(), text, from, to));
					this.save();
					this.setRange({ start: to, end: to });
					this.focus();
				},
			},
		};

		raf(() => menuStore.open('blockLatex', menuParam));
	};

	setValue (value: string) {
		if (!this._isMounted) {
			return '';
		};

		const lang = this.getLang();
		
		if (lang) {
			this.input.innerHTML = Prism.highlight(value, Prism.languages[lang], lang);
		} else {
			this.input.innerText = value;
		};
		this.setContent(value);
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};

		return String(this.input.innerText || '');
	};

	getLang () {
		const { block } = this.props;
		const { processor } = block.content;

		switch (processor) {
			default: break;
			case I.EmbedProcessor.Latex: return 'latex';
			case I.EmbedProcessor.Mermaid: return 'yaml';
			case I.EmbedProcessor.Chart: return 'js';
			case I.EmbedProcessor.Youtube:
			case I.EmbedProcessor.Vimeo: return 'html';
		};
	};

	getEnvironmentContent (): { html: string; libs: string[] } {
		const { block } = this.props;
		const { processor } = block.content;

		let html = '';
		let libs = [];

		switch (processor) {
			case I.EmbedProcessor.Chart: {
				html = `
					<canvas id="chart"></canvas>
				`;

				libs.push('./chart/chart.umd.js');
				break;
			};
		};

		return { html, libs };
	};

	setContent (text: string) {
		if (!this._isMounted) {
			return '';
		};

		this.text = String(text || '');

		if (!this.text) {
			this.value.html('');
			return;
		};

		const { block } = this.props;
		const { processor } = block.content;
		const node = $(this.node);
		const win = $(window);

		switch (processor) {
			default: {
				let iframe = node.find('iframe');
				let text = this.text;

				const sandbox = [ 'allow-scripts' ];
				const allowSameOrigin = [ I.EmbedProcessor.Youtube, I.EmbedProcessor.Vimeo, I.EmbedProcessor.Soundcloud ];

				if (allowSameOrigin.includes(processor)) {
					sandbox.push('allow-same-origin');
				};

				const onLoad = () => {
					const iw = (iframe[0] as HTMLIFrameElement).contentWindow;
					const env = this.getEnvironmentContent();
					const data: any = { ...env, theme: commonStore.getThemeClass() };

					if ([ I.EmbedProcessor.Youtube, I.EmbedProcessor.Vimeo ].includes(processor)) {
						if (!text.match(/<iframe/)) {
							text = UtilEmbed.getHtml(processor, UtilEmbed.getParsedUrl(text));
						};
					};

					if (processor == I.EmbedProcessor.Chart) {
						data.js = text;
					} else {
						data.html = text;
					};

					iw.postMessage(data, '*');
					win.off(`message.${block.id}`).on(`message.${block.id}`, () => {});
				};

				if (!iframe.length) {
					iframe = $('<iframe />', {
						id: 'receiver',
						src: './embed/iframe.html',
						frameborder: 0,
						sandbox: sandbox.join(' '),
						allowtransparency: true,
					});

					iframe.off('load').on('load', onLoad);
					this.value.html('').append(iframe);
				} else {
					onLoad();
				};
				break;
			};

			case I.EmbedProcessor.Latex: {
				this.value.html(katex.renderToString(this.text, { 
					displayMode: true, 
					throwOnError: false,
					output: 'html',
					trust: (context: any) => [ '\\url', '\\href', '\\includegraphics' ].includes(context.command),
				}));

				this.value.find('a').each((i: number, item: any) => {
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
					this.value.html(res.svg || this.text);

					if (res.bindFunctions) {
						res.bindFunctions(this.value.get(0));
					};
				});
				break;
			};
		};

		this.placeholderCheck(this.text);
	};

	placeholderCheck (value: string) {
		value.trim().length > 0 ? this.empty.hide() : this.empty.show();
	};

	onEdit (e: any) {
		const { readonly } = this.props;
		
		if (readonly) {
			return;
		};

		e.stopPropagation();

		$('.block.blockEmbed .focusable.isEditing').removeClass('isEditing');

		this.setEditing(true);
		this.focus();
		this.rebind();
	};

	save (callBack?: (message: any) => void) {
		const { rootId, block, readonly } = this.props;
		
		if (readonly) {
			return;
		};

		const value = this.getValue();

		blockStore.updateContent(rootId, block.id, { text: value });
		C.BlockEmbedSetText(rootId, block.id, value, callBack);
	};

	setRange (range: any) {
		this.range = range || { start: 0, end: 0 };
	};

	onSelect () {
		if (!this._isMounted) {
			return;
		};

		this.setRange(getRange(this.input));
		keyboard.disableSelection(true);

		this.win.off('mouseup.embed').on('mouseup.embed', (e: any) => {	
			keyboard.disableSelection(false);
			this.win.off('mouseup.embed');
		});
	};

});

export default BlockEmbed;