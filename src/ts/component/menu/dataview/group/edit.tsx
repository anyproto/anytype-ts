import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, Dataview, keyboard, Relation, translate } from 'Lib';
import { MenuItemVertical } from 'Component';

const MenuDataviewGroupEdit = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, close } = props;
	const { data } = param;
	const { rootId, blockId, groupId, getView } = data;
	const view = getView();
	const n = useRef(0);
	const group = S.Record.getGroup(rootId, blockId, groupId);
	const colorRef = useRef(group?.bgColor);
	const isHiddenRef = useRef(group?.isHidden);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getSections = () => {
		const colors = U.Menu.getBgColors().filter(it => it.id != 'bgColor-default');
		const name = isHiddenRef.current ? translate('menuDataviewGroupEditShowColumn') : translate('menuDataviewGroupEditHideColumn');

		return [
			{ children: [ { id: 'hide', icon: 'hide', name } ] },
			{ children: colors },
		];
	};

	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	const onClick = (e: any, item: any) => {
		if (item.isBgColor) {
			colorRef.current = item.value;
		} else
		if (item.id == 'hide') {
			isHiddenRef.current = !isHiddenRef.current;
		};

		save();
		close();
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const save = () => {
		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		const groups = S.Record.getGroups(rootId, blockId);
		const update: any[] = [];

		groups.forEach((it: any, i: number) => {
			const item = { ...it, groupId: it.id, index: i };
			if (it.id == groupId) {
				item.bgColor = colorRef.current;
				item.isHidden = isHiddenRef.current;
			};
			update.push(item);
		});

		S.Record.groupsSet(rootId, blockId, update);
		Dataview.groupUpdate(rootId, blockId, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });

		if (!view.groupBackgroundColors && colorRef.current) {
			Dataview.viewUpdate(rootId, blockId, view.id, { groupBackgroundColors: true });
		};

		if ([ I.RelationType.MultiSelect, I.RelationType.Select ].includes(relation.format)) {
			const group = groups.find(it => it.id == groupId);
			const value = Relation.getArrayValue(group.value);

			if (value.length) {
				U.Object.setOptionColor(value[0], colorRef.current);
			};
		};
	};

	const sections = getSections();

	const Section = (item: any) => (
		<div className="section">
			<div className="items">
				{item.children.map((action: any, i: number) => {
					if (action.isBgColor) {
						action.inner = <div className={`inner isMultiSelect bgColor bgColor-${action.className}`} />;
						action.icon = 'color';
						action.checkbox = action.value == colorRef.current;
					};

					return (
						<MenuItemVertical 
							key={i} 
							{...action} 
							onClick={e => onClick(e, action)}
							onMouseEnter={e => onMouseEnter(e, action)}
						/>
					);
				})}
			</div>
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
	}), []);

	return (
		<>
			{sections.map((item: any, i: number) => (
				<Section key={i} {...item} />
			))}
		</>
	);

}));

export default MenuDataviewGroupEdit;