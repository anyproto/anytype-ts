import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, focus } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {
	history?: any;
};

const $ = require('jquery');

@observer
class MenuBlockMore extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();

		return (
			<div>
				{items.map((action: any, i: number) => {
					return <MenuItemVertical key={i} {...action} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }} />;
				})}
			</div>
		);
	};
	
	componentDidMount () {
		this.unbind();
		this.setActive();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		Util.menuSetActive(this.props.id, items[this.n], 12, scroll);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.enter:
			case Key.space:
				if (item) {
					this.onClick(e, item);
				};
				break;
			
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return [];
		};
		
		let items = [];
		
		if (block.type == I.BlockType.Page) {
			items = [
				{ id: 'undo', icon: 'undo', name: 'Undo' },
				{ id: 'redo', icon: 'redo', name: 'Redo' },
				//{ id: 'remove', icon: 'remove', name: 'Delete' },
			];
		} else {
			items = [
				{ id: 'remove', icon: 'remove', name: 'Delete' },
				//{ id: 'move', icon: 'move', name: 'Move to' },
				//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			];
		};
		
		return items;
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.mouse) {
			return;
		};
		this.setActive(item, false);
	};
	
	onClick (e: any, item: any) {
		const { param, history } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, onSelect } = data;
		const { blocks, root } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		const length = String(block.content.text || '').length;
		
		let close = true;
		
		if (onSelect) {
			onSelect(item);
		};
		
		focus.clear();
		
		switch (item.id) {
			case 'undo':
				C.BlockUndo(rootId);
				close = false;
				break;
				
			case 'redo':
				C.BlockRedo(rootId);
				close = false;
				break;
			
			case 'move':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'move', 
						rootId: root,
						onConfirm: (id: string) => {
							console.log('Move', id);
						},
					}, 
				});
				break;
				
			case 'copy':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'copy', 
						rootId: root,
						onConfirm: (id: string) => {
							C.BlockListDuplicate(rootId, [ blockId ], blockId, I.BlockPosition.Bottom, (message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						},
					}, 
				});
				break;
				
			case 'remove':
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (block.type == I.BlockType.Page) {
						history.push('/main/index');
					};
				});
				break;
		};
		
		if (close) {
			commonStore.menuClose(this.props.id);
		};
	};

};

export default MenuBlockMore;