import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';

import { MenuItemVertical } from 'Component';
import * as I from 'Interface';

const MenuBlockStyle = forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const { rootId, blockId, blockIds, onSelect, activeStyle, allowedSections, allowedItems } = data;
	const block = S.Block.getLeaf(rootId, blockId);
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
	
	const getActive = (): I.TextStyle | I.DivStyle | I.FileStyle => {
		if (activeStyle !== undefined) {
			return activeStyle;
		};

		if (!block) {
			return 0;
		};

		const style = block.content.style;

		if (block.isFile()) {
			return style != I.FileStyle.Link ? I.FileStyle.Embed : I.FileStyle.Link;
		};

		return style;
	};
	
	const getSections = () => {
		const sections: any[] = [];
		const textStyleMap: any = {
			[I.TextStyle.Paragraph]: 'textStyleParagraph',
			[I.TextStyle.Header1]: 'textStyleHeader1',
			[I.TextStyle.Header2]: 'textStyleHeader2',
			[I.TextStyle.Header3]: 'textStyleHeader3',
		};

		const textChildren = U.Menu.getBlockText().map((it: any) => {
			if (textStyleMap[it.id] !== undefined) {
				const { iconParam, ...rest } = it;
				return { ...rest, className: [ it.className, textStyleMap[it.id] ].filter(Boolean).join(' ') };
			};
			return it;
		});

		const turnText = { id: 'turnText', name: translate('menuBlockStyleTurnText'), color: '', children: textChildren };
		const turnList = { id: 'turnList', name: translate('menuBlockStyleTurnList'), color: '', children: U.Menu.getBlockList() };
		const turnDiv = { id: 'turnDiv', name: translate('menuBlockStyleTurnDiv'), color: '', children: U.Menu.getTurnDiv() };
		const turnFile = { id: 'turnFile', name: translate('menuBlockStyleTurnFile'), color: '', children: U.Menu.getTurnFile() };

		let hasTurnText = true;
		let hasTurnList = true;
		let hasTurnDiv = true;
		let hasTurnFile = true;

		for (const id of blockIds) {
			const block = S.Block.getLeaf(rootId, id);
			if (!block) {
				continue;
			};

			if (!block.canTurnText())		 hasTurnText = false;
			if (!block.canTurnList())		 hasTurnList = false;
			if (!block.isDiv())				 hasTurnDiv = false;
			if (!block.isFile())			 hasTurnFile = false;
		};

		const allowed = allowedSections ? new Set(allowedSections) : null;

		if (hasTurnText && (!allowed || allowed.has('turnText')))	 sections.push(turnText);
		if (hasTurnList && (!allowed || allowed.has('turnList')))	 sections.push(turnList);
		if (hasTurnDiv && (!allowed || allowed.has('turnDiv')))		 sections.push(turnDiv);
		if (hasTurnFile && (!allowed || allowed.has('turnFile')))	 sections.push(turnFile);

		if (allowedItems) {
			const itemSet = new Set(allowedItems);
			for (const section of sections) {
				section.children = section.children.filter((c: any) => !c.isDiv && itemSet.has(c.id));
			};
		};

		return U.Menu.sectionsMap(sections);
	};
	
	const getItems = () => {
		const sections = getSections();

		let items: any[] = [];
		for (let i = 0; i < sections.length; i++) {
			if (i > 0) {
				items.push({ isDiv: true });
			};
			items = items.concat(sections[i].children);
		};
		return items;
	};
	
	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		const selection = S.Common.getRef('selectionProvider');
		
		close();
		onSelect(item);

		selection?.clear();
		analytics.event('ChangeBlockStyle', { type: item.type, style: item.itemId });
	};

	const items = getItems();
	const active = getActive();

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
			{items.map((action: any, i: number) => {
				return (
					<MenuItemVertical
						key={i}
						{...action}
						checkbox={action.itemId == active}
						onClick={e => onClick(e, action)}
						onMouseEnter={e => onOver(e, action)}
					/>
				);
			})}
		</div>
	);
	
});

export default MenuBlockStyle;
