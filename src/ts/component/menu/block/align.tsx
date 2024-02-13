import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, keyboard, UtilMenu } from 'Lib';
import { blockStore } from 'Store';

class MenuBlockHAlign extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const value = Number(data.value || I.BlockHAlign.Left);
		const items = this.getItems();

		return (
			<div>
				{items.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						onClick={e => this.onClick(e, action)} 
						onMouseEnter={e => this.onOver(e, action)} 
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const blockIds = data.blockIds || [];
		
		let hasQuote = false;
		for (const id of blockIds) {
			const block = blockStore.getLeaf(rootId, id);
			if (block && block.isTextQuote()) {
				hasQuote = true;
			};
		};

		return UtilMenu.getAlign(hasQuote);
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

export default MenuBlockHAlign;