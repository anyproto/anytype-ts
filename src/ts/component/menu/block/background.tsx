import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

import { MenuItemVertical } from 'Component';
import * as I from 'Interface';

const MenuBlockColor = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const { onChange } = data;
	const value = String(data.value || '');
	const n = useRef(-1);

	const keydownHandler = useRef(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const getItems = () => {
		let id = 0;
		return U.Menu.prepareForSelect(U.Menu.getBgColors().map(it => ({ ...it, id: id++ })));
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
		onOver
	}), []);

	const items = getItems();
	
	return (
		<div>
			{items.map((action: any, i: number) => (
				<MenuItemVertical 
					{...action} 
					key={i} 
					iconParam={{ name: 'color' }}
					inner={<div className={`inner bgColor bgColor-${action.className}`} />} 
					checkbox={action.value == value} 
					onClick={e => onClick(e, action)} 
					onMouseEnter={e => onOver(e, action)} 
				/>
			))}
		</div>
	);

});

export default MenuBlockColor;