import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, S, U, keyboard, analytics, translate } from 'Lib';

const MenuBlockStyle = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const { rootId, blockId, blockIds, onSelect } = data;
	const block = S.Block.getLeaf(rootId, blockId);
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};
	
	const getActive = (): I.TextStyle | I.DivStyle | I.FileStyle => {
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
		const turnText = { id: 'turnText', icon: '', name: translate('menuBlockStyleTurnText'), color: '', children: U.Menu.getBlockText() };
		const turnList = { id: 'turnList', icon: '', name: translate('menuBlockStyleTurnList'), color: '', children: U.Menu.getBlockList() };
		const turnDiv = { id: 'turnDiv', icon: '', name: translate('menuBlockStyleTurnDiv'), color: '', children: U.Menu.getTurnDiv() };
		const turnFile = { id: 'turnFile', icon: '', name: translate('menuBlockStyleTurnFile'), color: '', children: U.Menu.getTurnFile() };

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

		if (hasTurnText)	 sections.push(turnText);
		if (hasTurnList)	 sections.push(turnList);
		if (hasTurnDiv)		 sections.push(turnDiv);
		if (hasTurnFile)	 sections.push(turnFile);

		return U.Menu.sectionsMap(sections);
	};
	
	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
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
	
	const sections = getSections();
	const active = getActive();

	const Section = (item: any) => (
		<div className="section">
			{item.children.map((action: any, i: number) => (
				<MenuItemVertical 
					key={i} 
					{...action} 
					checkbox={action.itemId == active} 
					onClick={e => onClick(e, action)} 
					onMouseEnter={e => onOver(e, action)}  
				/>
			))}
		</div>
	);

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
			{sections.map((section: any, i: number) => {
				return <Section key={i} {...section} />;
			})}
		</div>
	);
	
}));

export default MenuBlockStyle;