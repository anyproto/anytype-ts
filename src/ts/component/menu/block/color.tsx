import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, keyboard, UtilMenu } from 'Lib';

class MenuBlockColor extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const value = String(data.value || '');
		const items = this.getItems();

		let id = 0;
		return (
			<div>
				{items.map((action: any, i: number) => {
					const inner = <div className={'inner textColor textColor-' + action.className} />;
					return (
						<MenuItemVertical 
							id={id++} 
							key={i} 
							{...action} 
							icon="color" 
							inner={inner} 
							checkbox={action.value == value} 
							onClick={e => this.onClick(e, action)} 
							onMouseEnter={e => this.onOver(e, action)} 
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		return UtilMenu.getTextColors();
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

export default MenuBlockColor;