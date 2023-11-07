import * as React from 'react';
import $ from 'jquery';
import Prism from 'prismjs';
import mermaid from 'mermaid';
import { observer } from 'mobx-react';
import { I, keyboard, UtilCommon, C, focus, translate } from 'Lib';
import { blockStore } from 'Store';
import { getRange, setRange } from 'selection-ranges';

const BlockMermaid = observer(class BlockLatex extends React.Component<I.BlockComponent> {
	
	_isMounted = false;
	range: any = { start: 0, end: 0 };
	text = '';
	timeout = 0;
	node: any = null;
	win: any = null;
	input: any = null;
	value: any = null;
	empty: any = null;

	constructor (props: I.BlockComponent) {
		super(props);

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
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { readonly, block } = this.props;
		const cn = [ 'wrap', 'resizable', 'focusable', 'c' + block.id ];

		return (
			<div 
				ref={node => this.node = node}
				tabIndex={0} 
				className={cn.join(' ')}
				onKeyDown={this.onKeyDownBlock} 
				onKeyUp={this.onKeyUpBlock} 
				onFocus={this.onFocusBlock}
			>
				<div id="value" onClick={this.onEdit} />
				<div id="empty" className="empty" onClick={this.onEdit}>
					placeholder
				</div>
				<div id={[ 'block', block.id, 'container' ].join('-')} />
				<div 
					id="input"
					contentEditable={!readonly}
					suppressContentEditableWarning={true}
					placeholder={translate('blockLatexPlaceholder')}
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

			window.clearTimeout(this.timeout);

			this.placeholderCheck(this.getValue());
			this.save(() => { 
				this.setEditing(false);
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
	};

	onKeyUpInput (e: any) {
		if (!this._isMounted) {
			return;
		};

		this.setContent(this.getValue());
		this.save();
	};

	onChange (e: any) {
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

	setValue (value: string) {
		if (!this._isMounted) {
			return '';
		};

		this.input.innerHTML = Prism.highlight(value, Prism.languages.yaml, 'yaml');
		this.setContent(value);
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};

		return String(this.input.innerText || '');
	};

	setContent (text: string) {
		if (!this._isMounted) {
			return '';
		};

		const { block } = this.props;
		const id = [ 'block', block.id, 'container' ].join('-');
		const node = $(this.node);
		const value = node.find('#value');

		this.text = String(text || '');

		if (this.text) {
			mermaid.mermaidAPI.render(id, this.text).then(res => {
				value.html(res.svg || this.text);

				if (res.bindFunctions) {
					res.bindFunctions(value.get(0));
				};
			});
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

		this.win.off('mouseup.latex').on('mouseup.latex', (e: any) => {	
			keyboard.disableSelection(false);
			this.win.off('mouseup.latex');
		});
	};

});

export default BlockMermaid;