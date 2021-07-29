import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

class MenuBlockAlign extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();
		return (
			<div>
				{items.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						onClick={(e: any) => { this.onClick(e, action); }} 
						onMouseEnter={(e: any) => { this.onOver(e, action); }} 
					/>
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this.unbind();
		
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
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const blockIds = data.blockIds || [];
		
		let hasQuote = false;
		for (let id of blockIds) {
			let block = blockStore.getLeaf(rootId, id);
			if (block.isTextQuote())	{
				hasQuote = true;
			};
		};

		return DataUtil.menuGetAlign(hasQuote);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const { setActive } = this.props;
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
				setActive(null, true);
				break;
				
			case Key.down:
			case Key.right:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive(null, true);
				break;
			
			case Key.tab:
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
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.props.close();
		onSelect(item.id);
	};
	
};

export default MenuBlockAlign;