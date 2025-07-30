import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, S, U, keyboard } from 'Lib';
import { observer } from 'mobx-react';

const MenuBlockHAlign = observer(forwardRef<{}, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const value = Number(data.value || I.BlockHAlign.Left);

	const getItems = useCallback(() => {
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
	}, [ data ]);

	const items = getItems();

	const rebind = useCallback(() => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	}, [ onKeyDown, setActive ]);
	
	const unbind = useCallback(() => {
		$(window).off('keydown.menu');
	}, []);

	const onOver = useCallback((e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	}, [ setActive ]);
	
	const onClick = useCallback((e: any, item: any) => {
		const { onSelect } = data;
		
		close();
		onSelect(Number(item.id));
	}, [ data, close ]);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, [ rebind, unbind ]);

	useImperativeHandle(ref, () => ({}));

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

}));

export default MenuBlockHAlign;