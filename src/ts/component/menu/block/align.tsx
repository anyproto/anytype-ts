import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, S, U, keyboard } from 'Lib';

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
		const restricted = [].concat(data.restricted || []);
		
		for (const id of blockIds) {
			const block = S.Block.getLeaf(rootId, id);
			if (!block) {
				continue;
			};

			if (!block.isText()) {
				restricted.push(I.BlockHAlign.Justify);
			};
			if (block.isTextQuote()) {
				restricted.push(I.BlockHAlign.Center);
			};
		};

		return U.Menu.prepareForSelect(U.Menu.getHAlign(restricted));
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		close();
		onSelect(Number(item.id));
	};
	
};

export default MenuBlockHAlign;