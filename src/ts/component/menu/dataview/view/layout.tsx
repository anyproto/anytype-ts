import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, analytics, keyboard, translate, Dataview, Relation } from 'Lib';
import { Label, Icon, MenuItemVertical } from 'Component';

const MenuViewLayout = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { config } = S.Common;
	const { param, setActive, onKeyDown, getId, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, readonly, onSave, onSelect, isInline, getTarget } = data;
	const view = data.view.get();
	const n = useRef(-1);
	const menuContext = useRef(null);
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const block = S.Block.getLeaf(rootId, blockId);
	const saveParam = useRef<any>({});
	const { type } = saveParam.current;
	const [ dummy, setDummy ] = useState(0);

	useEffect(() => {
		saveParam.current = U.Common.objectCopy(data.view.get());
		setDummy(dummy + 1);
		rebind();

		return () => {
			unbind();
			save();
			menuClose();
		};
	}, []);

	useEffect(() => {
		rebind();
		setActive();
	});

	const rebind = () => {
		unbind();

		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};
	
	const onKeyDownHandler = (e: any) => {
		const item = getItems()[n.current];

		let ret = false;

		keyboard.shortcut('space', e, () => {
			if ([ 'hideIcon', 'coverFit', 'wrapContent' ].includes(item.id)) {
				e.preventDefault();

				onSwitch(e, item.id, !view[item.id]);
				ret = true;
			};
		});

		if (ret) {
			return;
		};

		onKeyDown(e);
	};

	const save = (withName?: boolean) => {
		if (!block || !view || isReadonly) {
			return;
		};
	
		const isBoard = saveParam.current.type == I.ViewType.Board;
		const isCalendar = saveParam.current.type == I.ViewType.Calendar;
		const clearGroups = isBoard && saveParam.current.groupRelationKey && (view.groupRelationKey != saveParam.current.groupRelationKey);

		if (isBoard || isCalendar) {
			const groupOptions = Relation.getGroupOptions(rootId, blockId, saveParam.current.type);
			if (!groupOptions.map(it => it.id).includes(saveParam.current.groupRelationKey)) {
				saveParam.current.groupRelationKey = Relation.getGroupOption(rootId, blockId, saveParam.current.type, saveParam.current.groupRelationKey)?.id;
			};
		};

		if (withName) {
			saveParam.current.name = getViewName();
			view.name = saveParam.current.name;
		};

		Dataview.viewUpdate(rootId, blockId, view.id, saveParam.current, () => {
			if (clearGroups) {
				Dataview.groupUpdate(rootId, blockId, view.id, []);
				C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: [] }, onSave);
			} else 
			if (onSave) {
				onSave();
			};
		});

		setDummy(dummy + 1);
	};

	const getSections = () => {
		const { type, coverRelationKey, cardSize, coverFit, wrapContent, groupRelationKey, endRelationKey, groupBackgroundColors, hideIcon, pageLimit } = saveParam.current;
		const isGrid = type == I.ViewType.Grid;
		const isGallery = type == I.ViewType.Gallery;
		const isBoard = type == I.ViewType.Board;
		const isCalendar = type == I.ViewType.Calendar;
		const isGraph = type == I.ViewType.Graph;
		const isTimeline = type == I.ViewType.Timeline;
		const coverOption = Relation.getCoverOptions(rootId, blockId).find(it => it.id == coverRelationKey);

		let settings: any[] = [];

		if (isGrid) {
			settings.push({ 
				id: 'wrapContent', name: translate('menuDataviewViewEditWrapContent'), withSwitch: true, switchValue: wrapContent,
				onSwitch: (e: any, v: boolean) => onSwitch(e, 'wrapContent', v),
			});
		};

		if (isGallery) {
			const sizeOption = Relation.getSizeOptions().find(it => it.id == cardSize);

			settings = settings.concat([
				{ id: 'cardSize', name: translate('menuDataviewViewEditCardSize'), caption: (sizeOption ? sizeOption.name : translate('commonSelect')), arrow: true },
			]);
		};

		if (isBoard || isGallery) {
			settings = settings.concat([
				{ id: 'coverRelationKey', name: translate('menuDataviewViewEditCover'), caption: (coverOption ? coverOption.name : translate('commonSelect')), arrow: true },
				{ 
					id: 'coverFit', name: translate('menuDataviewViewEditFitMedia'), withSwitch: true, switchValue: coverFit,
					onSwitch: (e: any, v: boolean) => onSwitch(e, 'coverFit', v),
				}
			]);
		};

		if (isBoard || isCalendar || isTimeline) {
			const groupOption = Relation.getGroupOption(rootId, blockId, type, groupRelationKey);

			let name = '';
			if (isBoard)	 name = translate('menuDataviewViewEditGroupBy');
			if (isCalendar)	 name = translate('menuDataviewViewEditDate');
			if (isTimeline)	 name = translate('menuDataviewViewEditStartDate');	

			settings.push({ 
				id: 'groupRelationKey', 
				name, 
				caption: (groupOption ? groupOption.name : translate('commonSelect')), 
				arrow: true,
			});
		};

		if (isTimeline) {
			const endOption = Relation.getGroupOption(rootId, blockId, type, endRelationKey);

			settings.push({
				id: 'endRelationKey',
				name: translate('menuDataviewViewEditEndDate'),
				caption: (endOption ? endOption.name : translate('commonSelect')),
				arrow: true,
			});
		};

		if (isBoard) {
			settings.push({ 
				id: 'groupBackgroundColors', 
				name: translate('menuDataviewViewEditColorColumns'), 
				withSwitch: true, 
				switchValue: groupBackgroundColors,
				onSwitch: (e: any, v: boolean) => onSwitch(e, 'groupBackgroundColors', v),
			});
		};

		if (!isGraph) {
			settings.push({
				id: 'hideIcon', name: translate('menuDataviewViewEditShowIcon'), withSwitch: true, switchValue: !hideIcon,
				onSwitch: (e: any, v: boolean) => onSwitch(e, 'hideIcon', !v),
			});
		} else {
			settings.push({ id: 'graphSettings', name: translate('commonSettings'), arrow: true });
		};

		if (isInline || isBoard || isGallery) {
			const options = Relation.getPageLimitOptions(type, isInline);
			settings.push({ id: 'pageLimit', name: translate('menuDataviewViewEditPageLimit'), caption: (pageLimit || options[0].id), arrow: true });
		};

		let sections: any[] = [ 
			{ id: 'settings', name: '', children: settings }
		];

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
			onOver(e, item);
			props.setActive(item, false);
		};
	};

	const getGroupOptions = () => {
		const { type } = saveParam.current;

		let options = Relation.getGroupOptions(rootId, blockId, type);

		if (!isReadonly) {
			options = options.concat([
				{ isDiv: true },
				{ id: 'addRelation', icon: 'plus', name: translate('commonAddRelation') },
			]);
		};

		return options;
	};

	const onOver = (e: any, item: any) => {
		if (!item.arrow || isReadonly) {
			S.Menu.closeAll(J.Menu.viewEdit);
			return;
		};

		const { type, groupRelationKey } = saveParam.current;
		const element = `#${getId()} #item-${item.id}`;
		const groupOptions = getGroupOptions();

		const menuParam: I.MenuParam = { 
			menuKey: item.id,
			className, 
			classNameWrap,
			element,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			onOpen: context => {
				$(element).addClass('active');
				menuContext.current = context;
			},
			onClose: () => {
				$(element).removeClass('active');
				menuContext.current = null;
			},
			rebind,
			parentId: props.id,
			data: {
				value: saveParam.current[item.id],
				noClose: true,
				onSelect: (e: any, el: any) => {
					if (el.id == 'addRelation') {
						onAddRelation(item.id);
					} else {
						saveParam.current[item.id] = (el.id == 'none' ? '' : el.id);
						save();
						menuContext.current?.close();
					};
				},
			},
		};

		let menuId = '';

		switch (item.id) {
			case 'coverRelationKey': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getCoverOptions(rootId, blockId),
				});
				break;
			};

			case 'groupRelationKey': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					value: Relation.getGroupOption(rootId, blockId, type, groupRelationKey)?.id,
					options: groupOptions,
				});
				break;
			};

			case 'endRelationKey': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					value: Relation.getGroupOption(rootId, blockId, type, saveParam.current.endRelationKey)?.id,
					options: groupOptions,
				});
				break;
			};

			case 'pageLimit': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getPageLimitOptions(type, isInline),
				});
				break;
			};

			case 'cardSize': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					value: String(saveParam.current.cardSize),
					options: Relation.getSizeOptions(),
				});
				break;
			};

			case 'graphSettings': {
				menuId = 'graphSettings';
				menuParam.subIds = J.Menu.graphSettings;
				menuParam.data = Object.assign(menuParam.data, {
					storageKey: J.Constant.graphId.dataview,
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.viewEdit, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onAddRelation = (id: string) => {
		if (!menuContext.current) {
			return;
		};

		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const object = S.Detail.get(rootId, rootId);
		const { getId, getSize, close } = menuContext.current;
		const types = Relation.getGroupTypes(type);

		S.Menu.open('relationSuggest', { 
			className, 
			classNameWrap,
			element: `#${getId()} #item-addRelation`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Top,
			offsetY: 36,
			noAnimation: true,
			noFlipY: true,
			data: {
				...data,
				menuIdEdit: 'dataviewRelationEdit',
				filter: '',
				ref: 'dataview',
				types,
				skipKeys: relations.map(it => it.relationKey),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, relations.length, (message: any) => {
						saveParam.current[id] = relation.relationKey;
						save();
						close();
						onChange?.(message);
					});
				},
			}
		});
	};

	const onSwitch = (e: any, key: string, v: boolean) => {
		saveParam.current[key] = v;
		save();
	};

	const onClick = (e: any, item: any) => {
		if (isReadonly || item.arrow) {
			return;
		};

		if (item.sectionId == 'type') {
			let withName = false;

			if (saveParam.current.name == Dataview.defaultViewName(saveParam.current.type)) {
				saveParam.current.name = Dataview.defaultViewName(item.id);
				withName = true;
			};

			saveParam.current.type = item.id;
			n.current = -1;
			save(withName);

			const object = getTarget();

			analytics.event('ChangeViewType', {
				type: item.id,
				objectType: object.type,
				embedType: analytics.embedType(isInline),
			});
		}

		onSelect?.();
	};

	const getViewName = (name?: string) => {
		return (name || saveParam.current.name || Dataview.defaultViewName(saveParam.current.type)).trim();
	};

	const menuClose = () => {
		S.Menu.closeAll(J.Menu.viewEdit);
	};

	const sections = getSections();
	const layouts = U.Menu.getViews().map((it: any) => {
		it.sectionId = 'type';
		it.icon = `view c${it.id}`;
		return it;
	});

	const Layout = (item: any) => {
		const cn = [ 'layout' ];

		if (type == item.id) {
			cn.push('active');
		};
		if (isReadonly) {
			cn.push('isReadonly');
		};

		return (
			<div 
				className={cn.join(' ')}
				onClick={e => onClick(e, item)}
				onMouseEnter={menuClose}
			>
				<Icon className={item.icon} />
				<Label text={item.name} />
			</div>
		);
	};

	const Section = (item: any) => (
		<div id={`section-${item.id}`} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						icon={action.icon}
						readonly={isReadonly}
						onMouseEnter={e => onMouseEnter(e, action)}
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
		onSwitch,
	}), []);

	return (
		<div>
			<div className="layouts">
				{layouts.map((item: any, i: number) => (
					<Layout key={i} {...item} />
				))}
			</div>
			{sections.map((item: any, i: number) => (
				<Section key={i} index={i} {...item} />
			))}
		</div>
	);

}));

export default MenuViewLayout;