import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, keyboard, Key, focus, DataUtil, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';

interface Props extends I.BlockComponent {
	onPaste? (e: any): void;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockTitle extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeout: number = 0;
	composition: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onInput = this.onInput.bind(this);

		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionUpdate = this.onCompositionUpdate.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render (): any {
		const { rootId, block } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { id } = block;
		
		const name = this.checkName();
		const cv = [ 'value', 'focusable', 'c' + id ];
		
		return (
			<div className="rel">
				<div
					id="value"
					className={cv.join(' ')}
					contentEditable={true}
					suppressContentEditableWarning={true}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onPaste={this.onPaste}
					onSelect={this.onSelect}
					onInput={this.onInput}
					onCompositionStart={this.onCompositionStart}
					onCompositionUpdate={this.onCompositionUpdate}
					onCompositionEnd={this.onCompositionEnd}
				>{name}</div>
				<span className={[ 'placeHolder', 'c' + id ].join(' ')}>{Constant.default.name}</span>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentDidUpdate () {
		const { block } = this.props;
		const { id } = block;
		const { focused } = focus;
		
		if (focused == id) {
			focus.apply();
		};
	};
	
	componentWillUnmount () {
		this.save();
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onCompositionStart (e: any) {
		this.composition = true;
	};

	onCompositionUpdate (e: any) {
	};

	onCompositionEnd (e: any) {
		this.composition = false;
	};
	
	onFocus (e: any) {
		keyboard.setFocus(true);
		this.placeHolderCheck();
		
		commonStore.menuClose('blockContext');
	};
	
	onBlur (e: any) {
		keyboard.setFocus(false);
		this.placeHolderHide();
		this.save();
	};
	
	onSelect (e: any) {
		const { block } = this.props;
		const { id } = block;
		
		focus.set(id, this.getRange());
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted || this.composition) {
			return;
		};
		
		const { rootId, onKeyDown } = this.props;
		const platform = Util.getPlatform();
		const k = e.key.toLowerCase();	

		// Print or prev string
		keyboard.shortcut('ctrl+p, cmd+p', e, (pressed: string) => {
			if (platform == I.Platform.Mac) {
				if (pressed == 'cmd+p') {
					e.preventDefault();
					this.onPrint();
				};
				if (pressed == 'ctrl+p') {
					this.onArrow(Key.up);
				};
			} else {
				e.preventDefault();
				this.onArrow(Key.up);
			};
		});

		// Next string
		if (platform == I.Platform.Mac) {
			keyboard.shortcut('ctrl+n', e, (pressed: string) => {
				this.onArrow(Key.down);
			});
		};

		// Undo
		keyboard.shortcut('ctrl+z, cmd+z', e, (pressed: string) => {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		});

		// Redo
		keyboard.shortcut('ctrl+shift+z, cmd+shift+z', e, (pressed: string) => {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		});

		// Search
		keyboard.shortcut('ctrl+f, cmd+f', e, (pressed: string) => {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		});

		// Enter
		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			
			const next = blockStore.getFirstBlock(rootId, 1, (it: any) => { return !it.isLayoutDiv() && !it.isPage() && !it.isTextTitle(); });
			const param = {
				type: I.BlockType.Text,
				content: {
					style: I.TextStyle.Paragraph,
				},
			};
			
			DataUtil.pageSetName(rootId, this.getValue(), () => {
				C.BlockCreate(param, rootId, (next ? next.id : ''), I.BlockPosition.Top, (message: any) => {
					focus.set(message.blockId, { from: 0, to: 0 });
					focus.apply();
				});
			});
		});

		// Cursor keys
		keyboard.shortcut('ctrl+arrowdown, cmd+arrowdown', e, (pressed: string) => {
			e.preventDefault();

			const next = blockStore.getFirstBlock(rootId, -1, (item: any) => { return item.isFocusable(); });
			if (!next) {
				return;
			};

			const l = next.getLength();
			focus.set(next.id, { from: l, to: l });
			focus.apply();
		});

		keyboard.shortcut('arrowdown', e, (pressed: string) => {
			e.preventDefault();
			this.onArrow(Key.down);
		});
		
		if (!keyboard.isSpecial(k)) {
			this.placeHolderHide();
		};
	};

	onPrint () {
		window.print();
	};

	onArrow (pressed: string) {
		if (commonStore.menuIsOpen()) {
			return;
		};

		const { rootId, block } = this.props;
		const { id } = block;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = blockStore.getNextBlock(rootId, id, dir, (it: I.Block) => { return it.isFocusable(); });

		if (!next) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const parent = blockStore.getLeaf(rootId, next.parentId);
		const l = next.getLength();

		// Auto-open toggle blocks 
		if (parent && parent.isTextToggle()) {
			node.find('#block-' + parent.id).addClass('isToggled');
		};

		focus.set(next.id, { from: l, to: l });
		focus.apply();
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		this.placeHolderCheck();
	};
	
	onChange (e: any) {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const value = this.getValue();
		const details = blockStore.getDetails(rootId, rootId);
		
		details.name = value;
		
		const param = { 
			id: rootId,
			details: details,
		};
		blockStore.detailsUpdate(breadcrumbs, param);
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 1000);
	};
	
	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		return String(value.get(0).innerText || '');
	};
	
	onPaste (e: any) {
	};

	onInput (e: any) {
		this.placeHolderCheck();
	};
	
	getRange () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element);
		
		return range ? { from: range.start, to: range.end } : null;
	};
	
	placeHolderCheck () {
		const value = this.getValue();
		value.length ? this.placeHolderHide() : this.placeHolderShow();			
	};
	
	placeHolderHide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').hide();
	};
	
	placeHolderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').show();
	};
	
	save () {
		const { rootId } = this.props;
		const value = this.getValue();
		const name = this.checkName();

		if (value != name) {
			DataUtil.pageSetName(rootId, value);
		};
	};

	checkName () {
		const { rootId } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		let { name } = details;
		if (name == Constant.default.name) {
			name = '';
		};
		return name;
	};

};

export default BlockTitle;