import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, keyboard, MenuUtil } from 'Lib';

class MenuBlockBackground extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const items = this.getItems();

		let id = 0;
		return (
			<div>
				{items.map((action: any, i: number) => {
					let inner = <div className={'inner bgColor bgColor-' + action.className} />;
					return (
						<MenuItemVertical 
							id={id++} 
							key={i} 
							{...action} 
							icon="color" 
							inner={inner} 
							checkbox={action.value == value} 
							onClick={(e: any) => { this.onClick(e, action); }} 
							onMouseEnter={(e: any) => { this.onOver(e, action); }} 
						/>
					);
				})}
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
		$(window).off('keydown.menu');
	};

	getItems () {
		return MenuUtil.getBgColors();
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
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

export default MenuBlockBackground;