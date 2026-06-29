import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, MouseEvent } from 'react';
import { MenuItemVertical } from 'Component';
import * as I from 'Interface';

const MenuWidget = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, setActive, onKeyDown, position, getId, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { blockId, isPreview, target, rootId: blockRootId } = data;
	const { widgets } = S.Block;
	const effectiveRootId = blockRootId || widgets;
	const isPersonalWidget = !!blockRootId;
	const [ layout, setLayout ] = useState<I.WidgetLayout>(data.layout);
	const [ limit, setLimit ] = useState(data.limit);
	const nodeRef = useRef(null);
	const needUpdate = useRef(false);
	const n = useRef(-1);
	const route = analytics.route.widget;

	useEffect(() => {
		needUpdate.current = false;
		rebind();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.widget);

			if (needUpdate.current) {
				U.Dom.eventDispatch(window, 'updateWidgetData');
			};
		};
	}, []);

	useEffect(() => {
		setActive();
		position();
	});

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'keydown', onKeyDown);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};

	const getSections = () => {
		const checked = checkState(layout, limit);
		const hasLimit = ![ I.WidgetLayout.Link ].includes(checked.layout);
		const canWrite = U.Space.canMyParticipantWrite();
		const canModerate = U.Space.canMyParticipantModerate();
		const layoutOptions = U.Menu.getWidgetLayoutOptions(target?.id, target?.layout, isPreview);
		const block = S.Block.getLeaf(effectiveRootId, blockId);
		const isSystem = U.Menu.isSystemWidget(target?.id);
		const isType = U.Object.isTypeLayout(target?.layout);

		if (!block) {
			return [];
		};

		const isPinned = !isPersonalWidget && (block.content.section == I.WidgetSection.Pin);
		const currentLayout = layoutOptions.find(it => it.id == layout);
		const sections: any[] = [];

		// Section 1: Widget settings (View + Number of Objects)
		const settingsChildren: any[] = [];

		if (layoutOptions.length > 1) {
			settingsChildren.push({
				id: 'layout',
				name: translate('menuWidgetView'),
				caption: currentLayout?.name || '',
				arrow: true,
			});
		};

		if (hasLimit) {
			settingsChildren.push({
				id: 'limit',
				name: translate('menuWidgetNumberOfObjects'),
				caption: String(limit),
				arrow: true,
			});
		};

		if (settingsChildren.length) {
			sections.push({
				id: 'settings',
				name: translate('menuWidgetTitle'),
				children: settingsChildren,
			});
		};

		// Section 2: Actions
		const actionChildren: any[] = [];

		if (!isSystem) {
			actionChildren.push({ id: 'pageLink', iconParam: { name: 'menu/action/pageLink' }, name: translate('commonCopyLink') });
		};

		if (isSystem && isPinned && canWrite && canModerate) {
			actionChildren.push({
				id: 'removeWidget',
				iconParam: { name: 'menu/action/remove' },
				name: translate('menuWidgetRemoveWidget'),
			});
		};

		if (!isSystem && canWrite) {
			const personalId = U.Object.getPersonalWidgetsId();
			const isFavorite = target && S.Block.getWidgetsForTargetIn(target.id, personalId).length > 0;
			const isPinned = target && S.Block.getWidgetsForTargetIn(target.id, widgets).length > 0;

			actionChildren.push({
				id: isFavorite ? 'unfavorite' : 'favorite',
				iconParam: { name: isFavorite ? 'menu/action/unfav' : 'menu/action/fav' },
				name: translate(isFavorite ? 'menuWidgetUnfavorite' : 'menuWidgetFavorite'),
			});

			if (canModerate) {
				actionChildren.push({
					id: isPinned ? 'unpinFromChannel' : 'pinToChannel',
					iconParam: { name: 'menu/action/pin' },
					name: translate(isPinned ? 'menuWidgetUnpinFromChannel' : 'menuWidgetPinToChannel'),
				});
			};

			if (!isType) {
				actionChildren.push({ id: 'linkTo', iconParam: { name: 'menu/block/common/linkto' }, name: translate('commonLinkTo'), arrow: true });
				actionChildren.push({ id: 'addCollection', iconParam: { name: 'menu/action/collection' }, name: translate('commonAddToCollection'), arrow: true });
			};

			const allowedArchive = S.Block.isAllowed(target?.restrictions, [ I.RestrictionObject.Delete ]);

			if (allowedArchive) {
				actionChildren.push({ id: 'archive', iconParam: { name: 'menu/action/remove' }, name: translate('commonMoveToBin') });
			};
		};

		if (actionChildren.length) {
			sections.push({ id: 'actions', children: actionChildren });
		};

		// Section 3: Open in New Tab / New Window
		if (!isSystem) {
			sections.push({
				id: 'open',
				children: [
					{ id: 'newTab', iconParam: { name: 'menu/action/newTab' }, name: translate('menuObjectOpenInNewTab') },
					{ id: 'newWindow', iconParam: { name: 'menu/action/newWindow' }, name: translate('menuObjectOpenInNewWindow') },
				]
			});
		};

		return sections;
	};

	const checkState = (layout: number, limit: number) => {
		if (!target) {
			return;
		};

		const layoutOptions = U.Menu.getWidgetLayoutOptions(target.id, target.layout).map(it => it.id);
		const ret = {
			layout,
			limit,
		};

		if (U.Menu.isSystemWidget(target.id)) {
			if ((target.id != J.Constant.widgetId.bin) && [ null, I.WidgetLayout.Link ].includes(ret.layout)) {
				ret.layout = I.WidgetLayout.Compact;
			};
		} else {
			if ([ I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(ret.layout) && !U.Object.isInSetLayouts(target.layout)) {
				ret.layout = I.WidgetLayout.Tree;
			};

			if ((ret.layout == I.WidgetLayout.Tree) && U.Object.isInSetLayouts(target.layout)) {
				ret.layout = I.WidgetLayout.Compact;
			};
		};

		ret.layout = layoutOptions.includes(ret.layout) ? ret.layout : (layoutOptions.length ? layoutOptions[0] : null);

		const limitOptions = U.Menu.getWidgetLimitOptions(ret.layout).map(it => Number(it.id));

		ret.limit = limitOptions.includes(ret.limit) ? ret.limit : (limitOptions.length ? limitOptions[0] : null);

		return ret;
	};

	const getItems = () => {
		const sections = getSections();

		let items = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	const onMouseEnter = (e: MouseEvent, item): void => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};

	const onSelectOption = (key: string, optionId: string) => {
		const block = S.Block.getLeaf(effectiveRootId, blockId);

		if (!block) {
			return;
		};

		const isSectionPin = !isPersonalWidget && (block.content.section == I.WidgetSection.Pin);

		needUpdate.current = true;
		n.current = -1;

		switch (key) {
			case 'layout': {
				const { layout: newLayout } = checkState(Number(optionId), limit);

				setLayout(newLayout);
				S.Menu.updateData('select', { value: String(newLayout) });

				if (isSectionPin) {
					C.BlockWidgetSetLayout(widgets, blockId, newLayout);
				} else
				if (isPersonalWidget) {
					C.BlockWidgetSetLayout(effectiveRootId, blockId, newLayout);
				};

				analytics.event('ChangeWidgetLayout', { layout: newLayout, route: 'Inner', params: { target } });
				break;
			};

			case 'limit': {
				const { limit: newLimit } = checkState(layout, Number(optionId));

				setLimit(newLimit);
				S.Menu.updateData('select', { value: String(newLimit) });

				if (isSectionPin) {
					C.BlockWidgetSetLimit(widgets, blockId, newLimit);
				} else
				if (isPersonalWidget) {
					C.BlockWidgetSetLimit(effectiveRootId, blockId, newLimit);
				};

				analytics.event('ChangeWidgetLimit', { limit: newLimit, layout, route: 'Inner', params: { target } });
				break;
			};
		};
	};

	const onOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.widget);
			return;
		};

		const menuParam: any = {
			menuKey: item.id,
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			noAutoHover: true,
			className,
			classNameWrap,
			rebind,
			parentId: props.id,
			data: {},
		};

		let menuId = '';

		switch (item.id) {
			case 'layout': {
				const layoutOptions = U.Menu.getWidgetLayoutOptions(target?.id, target?.layout, isPreview);

				menuId = 'select';
				menuParam.data = {
					noClose: true,
					value: String(layout),
					options: layoutOptions.map(it => ({ id: String(it.id), name: it.name, iconParam: it.iconParam })),
					onSelect: (e: any, option: any) => onSelectOption('layout', option.id),
				};
				break;
			};

			case 'limit': {
				const limitOptions = U.Menu.getWidgetLimitOptions(layout);

				menuId = 'select';
				menuParam.data = {
					noClose: true,
					value: String(limit),
					options: limitOptions.map(it => ({ id: String(it.id), name: String(it.name) })),
					onSelect: (e: any, option: any) => onSelectOption('limit', option.id),
				};
				break;
			};

			case 'linkTo': {
				if (!target) {
					break;
				};

				menuId = 'searchObject';
				menuParam.data = {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
						{ relationKey: 'links', condition: I.FilterCondition.NotIn, value: [ target.id ] },
					],
					rootId: target.id,
					blockId: target.id,
					blockIds: [ target.id ],
					type: I.NavigationType.LinkTo,
					skipIds: [ target.id ],
					position: I.BlockPosition.Bottom,
					canAdd: true,
					onSelect: (el: any) => {
						close();
					},
				};
				break;
			};

			case 'addCollection': {
				if (!target) {
					break;
				};

				const collectionType = S.Record.getCollectionType();

				menuId = 'searchObject';
				menuParam.className = [ 'single', className ].join(' ');
				menuParam.data = {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Collection },
						{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					canAdd: true,
					addParam: {
						name: translate('blockDataviewCreateNewCollection'),
						nameWithFilter: translate('blockDataviewCreateNewCollectionWithName'),
						onClick: (details: any) => {
							C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, (message) => {
								Action.addToCollection(message.objectId, [ target.id ]);
								U.Object.openAuto(message.details);
							});
						},
					},
					onSelect: (el: any) => {
						Action.addToCollection(el.id, [ target.id ]);
						close();
					},
				};
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id) && !S.Menu.isAnimating(menuId)) {
			S.Menu.closeAll(J.Menu.widget, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: MouseEvent, item) => {
		if (item.arrow) {
			return;
		};

		const isSystem = U.Menu.isSystemWidget(target?.id);

		switch (item.id) {
			case 'removeWidget': {
				if (isSystem) {
					const param: Partial<I.MenuParam> = {
						data: {
							iconParam: { name: 'popup/header/warning', color: 'red' },
							title: translate('popupConfirmSystemWidgetRemoveTitle'),
							text: translate('popupConfirmSystemWidgetRemoveText'),
							textConfirm: translate('commonDelete'),
							colorConfirm: 'red',
							onConfirm: () => {
								Action.removeWidget(blockId, target);
							},
						},
					};

					if (target?.id == J.Constant.widgetId.favorite) {
						param.className = 'removeFavorite';
						param.data.title = translate('popupConfirmSystemWidgetRemoveFavoriteTitle');
						param.data.text = translate('popupConfirmSystemWidgetRemoveFavoriteText');
						param.data.icon = 'screenshot';
					};

					S.Popup.open('confirm', param);
				} else {
					Action.removeWidget(blockId, target);
				};
				break;
			};

			case 'pageLink': {
				const spaceview = U.Space.getSpaceview();
				U.Object.copyLink(target, spaceview, 'web', route);
				break;
			};

			case 'archive': {
				Action.archiveCheckType('', [ target.id ], route);
				break;
			};

			case 'favorite': {
				const personalId = U.Object.getPersonalWidgetsId();
				Action.createWidgetFromObjectIn(personalId, personalId, target.id, '', I.BlockPosition.InnerFirst, route);
				break;
			};

			case 'unfavorite': {
				const personalId = U.Object.getPersonalWidgetsId();
				const list = S.Block.getWidgetsForTargetIn(target.id, personalId);
				if (list.length) {
					C.BlockListDelete(personalId, list.map(it => it.id));
				};
				break;
			};

			case 'pinToChannel': {
				Action.createWidgetFromObjectIn(widgets, widgets, target.id, '', I.BlockPosition.InnerFirst, route);
				break;
			};

			case 'unpinFromChannel': {
				const list = S.Block.getWidgetsForTargetIn(target.id, widgets);
				if (list.length) {
					C.BlockListDelete(widgets, list.map(it => it.id));
				};
				break;
			};

			case 'newTab': {
				U.Object.openTab(target, route);
				break;
			};

			case 'newWindow': {
				U.Object.openWindow(target);
				break;
			};
		};

		close();
	};

	const sections = getSections();

	const Section = (item: any) => (
		<div id={`section-${item.id}`} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}

			{item.children.length ? (
				<div className="items">
					{item.children.map((action, i) => (
						<MenuItemVertical
							key={i}
							{...action}
							onMouseEnter={e => onMouseEnter(e, action)}
							onClick={e => onClick(e, action)}
						/>
					))}
				</div>
			) : ''}
		</div>
	);

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
		<div ref={nodeRef}>
			<div className="sections">
				{sections.map((item, i) => (
					<Section key={i} index={i} {...item} />
				))}
			</div>
		</div>
	);

});

export default MenuWidget;
