import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { MenuItemVertical } from 'Component';
import * as I from 'Interface';

const MenuBlockHAlign = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, onKeyDown, close } = props;
	const { data } = param;
	const { rootId, onSelect } = data;
	const blockIds = data.blockIds || [];
	const restricted = [].concat(data.restricted || []);
	const value = Number(data.value || I.BlockHAlign.Left);
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
	
	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		close();
		onSelect?.(Number(item.id));
	};

	const items = getItems();

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
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

	return (
		<div>
			{items.map((action: any, i: number) => (
				<MenuItemVertical 
					key={i} 
					{...action} 
					onClick={e => onClick(e, action)} 
					onMouseEnter={e => onOver(e, action)} 
					checkbox={action.id == value}
				/>
			))}
		</div>
	);
	
});

export default MenuBlockHAlign;