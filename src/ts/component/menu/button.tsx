import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I } from 'Lib';

const MenuButton = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	const { param, close } = props;
	const { data } = param;
	const { disabled, onSelect, noClose } = data;

	const getItems = () => {
		return props.param.data.options || [];
	};
	
	const onClick = (e: any, item: any) => {
		if (!noClose) {
			close();
		};
		
		if (!disabled && onSelect) {
			onSelect(e, item);
		};
	};

	const items = getItems();

	return (
		<div className="items">
			{items.map((item: any, i: number) => (
				<MenuItemVertical 
					key={i}
					{...item} 
					className={disabled ? 'disabled' : ''}
					onClick={e => onClick(e, item)} 
				/>
			))}
		</div>
	);
}));

export default MenuButton;