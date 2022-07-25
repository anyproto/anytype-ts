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
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
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
		return DataUtil.menuGetTextColors();
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