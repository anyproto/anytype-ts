import * as React from 'react';
import $ from 'jquery';
import Prism from 'prismjs';
import { observer } from 'mobx-react';
import { blockStore, menuStore } from 'Store';
import { I, C, keyboard, focus } from 'Lib';
import { getRange, setRange } from 'selection-ranges';

import BlockEmbedLatex from './latex';
import BlockEmbedMermaid from './mermaid';

const BlockEmbedIndex = observer(class BlockEmbedIndex extends React.Component<I.BlockComponent> {
	
	_isMounted = false;
	node = null;
	refChild = null;
	range = { start: 0, end: 0 };
	text = '';
	timeout = 0;
	win = null;
	input = null;
	value = null;
	empty = null;

	constructor (props: I.BlockComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { block } = this.props;
		const { processor } = block.content;
		const cn = [ 'wrap', 'resizable', 'focusable', 'c' + block.id ];
		const setRef = ref => this.refChild = ref;
		const childProps = {
			onSelect: this.onSelect,
		};

		let content = null;

		switch (processor) {
			case I.EmbedProcessor.Latex: {
				content = <BlockEmbedLatex ref={setRef} {...this.props} {...childProps} />;
				break;
			};

			case I.EmbedProcessor.Mermaid: {
				content = <BlockEmbedMermaid ref={setRef} {...this.props} {...childProps} />;
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
				{content}
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

			if (block.isEmbedLatex()) {
				menuStore.close('blockLatex');
			};

			this.placeholderCheck(this.getValue());
			this.save(() => { 
				this.setEditing(false);

				if (block.isEmbedLatex()) {
					menuStore.close('previewLatex');
				};
			});
		});
	};

	unbind () {
		this.win.off(`click.c${this.props.block.id}`);
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

	onFocusBlock () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
		this.focus();
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

	focus () {
		if (this._isMounted && this.range) {
			setRange(this.input, this.range);
		};
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

	setEditing (v: boolean) {
		const node = $(this.node);
		v ? node.addClass('isEditing') : node.removeClass('isEditing');
	};

	setValue (value: string) {
		if (!this._isMounted) {
			return '';
		};

		this.input.innerHTML = Prism.highlight(value, Prism.languages.latex, 'latex');
		this.refChild.setContent(value);
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};

		return String(this.input.innerText || '');
	};

	placeholderCheck (value: string) {
		value.trim().length > 0 ? this.empty.hide() : this.empty.show();
	};

});

export default BlockEmbedIndex;