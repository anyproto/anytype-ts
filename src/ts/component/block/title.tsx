import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, keyboard, Key, focus, DataUtil, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';

interface Props {
	rootId: string;
	block: I.Block;
	onPaste? (e: any): void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockTitle extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
	};

	render (): any {
		const { rootId, block } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { id } = block;
		
		let { name } = details;
		if (name == Constant.default.name) {
			name = '';
		};
		
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
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const { rootId, block } = this.props;
		const { id } = block;
		const value = this.getValue();
		const length = value.length;
		const range = this.getRange();
		const platform = Util.getPlatform();

		let k = e.key.toLowerCase();

		// Ctrl + P and Ctrl + N on MacOs work like up/down arrows
		if ((platform == I.Platform.Mac) && e.ctrlKey) {
			if (k == Key.p) {
				k = Key.up;
				e.ctrlKey = false;
			};
			if (k == Key.n) {
				k = Key.down;
				e.ctrlKey = false;
			};
		};
		
		// Enter
		if (k == Key.enter) {
			e.preventDefault();
			
			const next = blockStore.getFirstBlock(rootId, 1, (it: any) => { return !it.isLayoutDiv() && !it.isPage() && !it.isTitle(); });
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
		};

		// Cursor keys
		if (k == Key.down) {
			if (commonStore.menuIsOpen()) {
				return;
			};

			let canFocus = range.to >= length;
			let next: any = null;

			if (canFocus) {
				e.preventDefault();

				if (e.ctrlKey || e.metaKey) {
					next = blockStore.getFirstBlock(rootId, -1, (item: any) => { return item.isFocusable(); });
					
					if (next) {
						const l = next.getLength();
						focus.set(next.id, { from: l, to: l });
						focus.apply();
					};
				} else {
					next = blockStore.getNextBlock(rootId, id, 1, (it: I.Block) => { return it.isFocusable(); });
					
					if (next) {
						const parent = blockStore.getLeaf(rootId, next.parentId);
						const l = next.getLength();
						
						// Auto-open toggle blocks 
						if (parent && parent.isToggle()) {
							node.find('#block-' + parent.id).addClass('isToggled');
						};
						
						focus.set(next.id, { from: l, to: l });
						focus.apply();
					};
				};
			};
			
		};
		
		if (!keyboard.isSpecial(k)) {
			this.placeHolderHide();
		};
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		//this.onChange(e);
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

		DataUtil.pageSetName(rootId, value);
	};
	
};

export default BlockTitle;