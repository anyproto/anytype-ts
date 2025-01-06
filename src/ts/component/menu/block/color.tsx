import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, U, keyboard } from 'Lib';

const MenuBlockColor = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const { onChange } = data;
	const value = String(data.value || '');
	const n = useRef(-1);

	const rebind = () => {
		unbind();

		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		let id = 0;
		return U.Menu.prepareForSelect(U.Menu.getTextColors().map(it => ({ ...it, id: id++ })));
	};
	
	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		close();
		onChange(item.value);
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), []);

	const items = getItems();

	return (
		<div>
			{items.map((action: any, i: number) => (
				<MenuItemVertical 
					{...action} 
					key={i} 
					icon="color" 
					inner={<div className={`inner textColor textColor-${action.className}`} />} 
					checkbox={action.value == value} 
					onClick={e => onClick(e, action)} 
					onMouseEnter={e => onOver(e, action)} 
				/>
			))}
		</div>
	);

});

export default MenuBlockColor;