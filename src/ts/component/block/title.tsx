import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Input } from 'ts/component';
import { I, C, keyboard, Key, focus } from 'ts/lib';
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
		const details = blockStore.getDetail(rootId, rootId);
		const { id } = block;
		
		let { name } = details;
		if (name == Constant.default.name) {
			name = '';
		};
		
		const cv = [ 'value', 'focusable', 'c' + id ];
		
		return (
			<div>
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
		this._isMounted = false;
	};
	
	onFocus (e: any) {
		keyboard.setFocus(true);
		this.placeHolderCheck();
	};
	
	onBlur (e: any) {
		keyboard.setFocus(false);
		this.placeHolderHide();
	};
	
	onSelect (e: any) {
		const { block } = this.props;
		const { id } = block;
		
		focus.set(id, this.getRange());
	};
	
	onKeyDown (e: any) {
		const k = e.which;
		const { rootId } = this.props;
		
		if (k == Key.enter) {
			e.preventDefault();
			
			const next = blockStore.getFirstBlock(rootId, 1, (it: any) => { return !it.isLayoutDiv() && !it.isPage(); });
			const param = {
				type: I.BlockType.Text,
				content: {
					style: I.TextStyle.Paragraph,
				},
			};
			
			C.BlockSetDetails(rootId, [ { key: 'name', value: this.getValue() } ], () => {
				C.BlockCreate(param, rootId, (next ? next.id : ''), I.BlockPosition.Top, (message: any) => {
					focus.set(message.blockId, { from: 0, to: 0 });
					focus.apply();
				});
			});
		};
		
		if (!keyboard.isSpecial(k)) {
			this.placeHolderHide();
		};
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		this.onChange(e);
		this.placeHolderCheck();
	};
	
	onChange (e: any) {
		const { rootId } = this.props;
		const value = this.getValue();
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			C.BlockSetDetails(rootId, [ { key: 'name', value: this.getValue() } ]);
		}, 500);
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
		e.preventDefault();
		this.props.onPaste(e);
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
	
};

export default BlockTitle;