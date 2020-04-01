import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Input } from 'ts/component';
import { I, C, keyboard, Key, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import getInputSelection from 'get-input-selection';

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
		
		return (
			<React.Fragment>
				<Input 
					placeHolder={Constant.default.name} 
					value={name} 
					onChange={this.onChange}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onSelect={this.onSelect}  
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onPaste={this.onPaste}
					className={'focusable c' + id} 
				/>
			</React.Fragment>
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
	};
	
	onBlur (e: any) {
		keyboard.setFocus(false);
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
			
			const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
			const blocks = blockStore.unwrapTree(tree);
			const first = blocks[0];

			const param = {
				type: I.BlockType.Text,
				content: {
					style: I.TextStyle.Paragraph,
				},
			};
			
			C.BlockCreate(param, rootId, (first ? first.id : ''), I.BlockPosition.Top, (message: any) => {
				focus.set(message.blockId, { from: 0, to: 0 });
				focus.apply();
			});
		};
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		const k = e.which;
		const { rootId } = this.props;
	};
	
	onChange (e: any, value: string) {
		const { rootId } = this.props;
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			C.BlockSetDetails(rootId, [ { key: 'name', value: value } ]);
		}, 500);
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
		const range = getInputSelection(node.get(0) as Element);
		
		return range ? { from: range.start, to: range.end } : null;
	};
	
};

export default BlockTitle;