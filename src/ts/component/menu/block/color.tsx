import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { blockStore } from 'ts/store';
import { I, keyboard, Key, DataUtil } from 'ts/lib';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuBlockColor extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const active = this.getActive();
		const items = this.getItems();
		
		let id = 0;
		return (
			<div>
				{items.map((action: any, i: number) => {
					let inner = <div className={'inner textColor textColor-' + action.className} />;
					return (
						<MenuItemVertical 
							id={id++} 
							key={i} 
							{...action} 
							icon="color" 
							inner={inner} 
							checkbox={action.value == active} 
							onClick={(e: any) => { this.onClick(e, action); }} 
							onMouseEnter={(e: any) => { this.onOver(e, action); }} 
						/>
					);
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
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getActive () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		return block ? block.content.color : 0;
	};
	
	setActive (item?: any, scroll?: boolean) {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		this.props.setHover(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
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
			case Key.right:
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
			
			case Key.left:	
			case Key.escape:
				this.props.close();
				break;
		};
	};
	
	getItems () {
		return DataUtil.menuGetTextColors();
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		close();
		onChange(item.value);
	};
	
};

export default MenuBlockColor;