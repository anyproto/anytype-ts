import React, { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, analytics, keyboard, Key, translate, Dataview } from 'Lib';
import { InputWithLabel, MenuItemVertical } from 'Component';

const MenuViewSettings = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, getId, setActive, setHover, onKeyDown, getSize } = props;
	const { data } = param;
	const { rootId, blockId, onSave, readonly, loadData, getView, getSources, onSelect, isInline, getTarget } = data;
	const nameRef = useRef(null);
	const n = useRef(-1);
	const preventSaveOnClose = useRef(false);
	const view = data.view.get();
	const block = S.Block.getLeaf(rootId, blockId);
	const nameValue = useRef(view.name);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
			if (!preventSaveOnClose.current) {
				save();
			};

			S.Menu.closeAll(J.Menu.viewEdit);
		};
	}, []);

	useEffect(() => {
		setName();
		focus();
		setActive();
	});

	const focus = () => {
		window.setTimeout(() => nameRef.current?.focus(), 15);
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const setName = () => {
		let n = view.name;

		for (const i in I.ViewType) {
			if (n == Dataview.defaultViewName(Number(i))) {
				n = '';
				break;
			};
		};

		nameRef.current?.setValue(n);
	};
	
	const onKeyDownHandler = (e: any) => {
		let ret = false;

		if (nameRef.current?.isFocused()) {
			keyboard.shortcut('arrowdown', e, () => {
				nameRef.current?.blur();
				n.current = 0;
			});

			keyboard.shortcut('enter', e, () => {
				save();
				ret = true;
				window.setTimeout(() => close(), 100);
			});
		} else 
		if (!n.current) {
			keyboard.shortcut('arrowup', e, () => {
				nameRef.current?.focus();
				n.current = -1;
			});
		};

		if (ret) {
			return;
		};

		onKeyDown(e);
	};

	const onKeyUp = () => {
		nameValue.current = nameRef.current?.getValue();
	};

	const onNameFocus = () => {
		n.current = -1;
		setActive();
		S.Menu.closeAll(J.Menu.viewEdit);
	};
	
	const onNameBlur = () => {
		save();
	};

	const onNameEnter = () => {
		if (!keyboard.isMouseDisabled) {
			n.current = -1;
			setHover(null, false);
			S.Menu.closeAll(J.Menu.viewEdit);
		};
	};

	const save = () => {
		if (isReadonly || !block || !view) {
			return;
		};

		Dataview.viewUpdate(rootId, blockId, view.id, { ...view, name: nameValue.current }, onSave);
	};

	const getSections = () => {
		const views = S.Record.getViews(rootId, blockId);
		const view = data.view.get();
		const isBoard = view.type == I.ViewType.Board;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => S.Record.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;
		const relations = view.getVisibleRelations().map(it => it.relation.name).filter(it => it);
		const relationCnt = relations.slice(0, 2);

		if (relations.length > 2) {
			relationCnt.push(`+${relations.length - 2}`);
		};

		const layoutSettings = [
			{ id: 'layout', name: translate('menuDataviewObjectTypeEditLayout'), subComponent: 'dataviewViewLayout', caption: Dataview.defaultViewName(view.type) },
			isBoard ? { id: 'group', name: translate('libDataviewGroups'), subComponent: 'dataviewGroupList' } : null,
			{ id: 'relations', name: translate('commonRelations'), subComponent: 'dataviewRelationList', caption: relationCnt.join(', ') },
		];
		const tools = [
			{ id: 'filter', name: translate('menuDataviewViewFilter'), subComponent: 'dataviewFilterList', caption: filterCnt ? U.String.sprintf(translate('menuDataviewViewApplied'), filterCnt) : '' },
			{ id: 'sort', name: translate('menuDataviewViewSort'), subComponent: 'dataviewSort', caption: sortCnt ? U.String.sprintf(translate('menuDataviewViewApplied'), sortCnt) : '' }
		];

		let sections: any[] = [
			{ id: 'layoutSettings', name: '', children: layoutSettings },
			{ id: 'tools', name: '', children: tools }
		].filter(it => it);

		if (view.id && !isReadonly) {
			sections.push({
				id: 'actions', children: [
					{ id: 'copy', icon: 'copy', name: translate('menuDataviewViewEditDuplicateView') },
					(views.length > 1 ? { id: 'remove', icon: 'remove', name: translate('menuDataviewViewEditRemoveView') } : null),
				]
			});
		};

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		}).filter(s => !!s.children.length);

		return sections;
	};

	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onMouseLeave = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setHover(null, false);
		};
	};

	const onClick = (e: any, item: any) => {
		const view = data.view.get();
		const current = getView();
		const sources = getSources();
		const object = getTarget();

		if (readonly || item.arrow) {
			return;
		};

		if (item.subComponent) {
			const addParam = {
				component: item.subComponent,
				title: item.name,
				withBack: true,
				width: getSize().width,
				data,
				noAnimation: true,
			};

			if (item.data) {
				addParam.data = Object.assign(addParam.data, item.data);
			};

			S.Menu.replace(props.id, item.subComponent, Object.assign(param, addParam));
			return;
		};

		if (view.id) {
			preventSaveOnClose.current = true;
			close();

			switch (item.id) {
				case 'copy': {
					Dataview.duplicateView(rootId, blockId, { ...view, name: nameValue.current }, sources, (message: any) => {
						onSave?.();
						loadData(message.viewId, 0);

						analytics.event('DuplicateView', {
							type: view.type,
							objectType: object.type,
							embedType: analytics.embedType(isInline),
						});
					});
					break;
				};

				case 'remove': {
					const views = S.Record.getViews(rootId, blockId);
					const idx = views.findIndex(it => it.id == view.id);
					const filtered = views.filter(it => it.id != view.id);
					
					let next = idx >= 0 ? filtered[idx] : filtered[0];
					if (!next) {
						next = filtered[filtered.length - 1];
					};

					if (next) {
						C.BlockDataviewViewDelete(rootId, blockId, view.id, () => {
							if (current.id == view.id) {
								loadData(next.id, 0);
							};

							analytics.event('RemoveView', {
								objectType: object.type,
								embedType: analytics.embedType(isInline)
							});
						});
					};
					break;
				};
			};
		};

		onSelect?.();
	};

	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const sections = getSections();

	const Section = (item: any) => (
		<div id={`section-${item.id}`} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						icon={action.icon}
						onMouseEnter={e => onMouseEnter(e, action)}
						onMouseLeave={e => onMouseLeave(e, action)}
						onClick={e => onClick(e, action)} 
					/>
				))}
			</div>
		</div>
	);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		getFilterRef: () => nameRef.current,
	}), []);

	return (
		<div>
			<div className="filter isName">
				<InputWithLabel
					ref={nameRef}
					value={view.name}
					label={translate('menuDataviewViewName')}
					readonly={isReadonly}
					placeholder={Dataview.defaultViewName(view.type)}
					maxLength={32}
					onFocus={onNameFocus}
					onBlur={onNameBlur}
					onMouseEnter={onNameEnter}
					onKeyUp={onKeyUp}
				/>
			</div>

			{sections.map((item: any, i: number) => (
				<Section key={i} index={i} {...item} />
			))}
		</div>
	);

}));

export default MenuViewSettings;