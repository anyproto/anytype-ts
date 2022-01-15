import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuBlockAlign extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const items = this.getItems();
		return (
			<div>
				{items.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						onClick={(e: any) => { this.onClick(e, action); }} 
						onMouseEnter={(e: any) => { this.onOver(e, action); }} 
						checkbox={action.id == value}
					/>
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
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
			if (block && block.isTextQuote()) {
				hasQuote = true;
			};
		};

		return DataUtil.menuGetAlign(hasQuote);
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