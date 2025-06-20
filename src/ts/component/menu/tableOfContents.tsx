import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { observer } from 'mobx-react';
import { Label, MenuItemVertical } from 'Component';
import { I, S, U, keyboard, translate, sidebar } from 'Lib';

const MenuTableOfContents = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setActive, close, onKeyDown } = props;
	const { data } = param;
	const { rootId, isPopup, blockId } = data;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);

		$(`#${getId()}`).on('mouseleave', () => close());
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
		$(`#${getId()}`).off('mouseleave')
	};

	const getItems = () => {
		return S.Block.getTableOfContents(rootId).concat([
			{ isDiv: true },
			{
				id: 'sidebar',
				icon: 'openSidebar',
				name: translate('sidebarOpen'),
				depth: 0,
				isCommon: true,
			},
		]);
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'sidebar') {
			sidebar.rightPanelToggle(true, isPopup, 'object/tableOfContents', { rootId });
			close();
		} else {
			U.Common.scrollToHeader(item.id, isPopup);
		};
	};

	const Item = (item: any) => {
		const name = !item.isDiv && !item.isCommon ? <Label text={U.Common.getLatex(item.text)} /> : item.name;

		return (
			<MenuItemVertical 
				{...item}
				name={name}
				onClick={e => onClick(e, item)}
				onMouseEnter={e => onMouseEnter(e, item)}
				style={{ paddingLeft: 8 + item.depth * 16 }}
			/>
		);
	};

	const items = getItems();

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => {
		setActive(items.find(it => it.id == blockId), true);
	}, [ blockId ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<div className="items">
			{items.map((item: any, i: number) => <Item key={i} {...item} />)}
		</div>
	);

}));

export default MenuTableOfContents;