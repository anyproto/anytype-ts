import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, translate, Action, analytics } from 'Lib';

const MenuWidget = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, setActive, onKeyDown, position, getId, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { blockId, isPreview, target } = data;
	const { widgets } = S.Block;
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
				$(window).trigger(`updateWidgetData.${blockId}`);
			};
		};
	}, []);

	useEffect(() => {
		setActive();
		position();
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getSections = () => {
		const checked = checkState(layout, limit);
		const hasLimit = ![ I.WidgetLayout.Link ].includes(checked.layout);
		const canWrite = U.Space.canMyParticipantWrite();
		const layoutOptions = U.Menu.getWidgetLayoutOptions(target?.id, target?.layout, isPreview);
		const block = S.Block.getLeaf(widgets, blockId);
		const isSystem = U.Menu.isSystemWidget(target?.id);
		const isType = U.Object.isTypeLayout(target?.layout);

		if (!block) {
			return [];
		};

		const isPinned = block.content.section == I.WidgetSection.Pin;
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
			actionChildren.push({ id: 'pageLink', icon: 'pageLink', name: translate('commonCopyLink') });
		};

		if (canWrite && isPinned) {
			const name = isSystem ? translate('menuWidgetRemoveWidget') : translate('commonUnpin');
			const icon = isSystem ? 'remove' : 'unpin';

			actionChildren.push({ id: 'removeWidget', name, icon });
		};

		if (!isSystem && canWrite) {
			if (!isType) {
				actionChildren.push({ id: 'addCollection', icon: 'collection', name: translate('commonAddToCollection'), arrow: true });
			};

			const allowedArchive = S.Block.isAllowed(target?.restrictions, [ I.RestrictionObject.Delete ]);

			if (allowedArchive) {
				actionChildren.push({ id: 'archive', icon: 'remove', name: translate('commonMoveToBin') });
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
					{ id: 'newTab', icon: 'newTab', name: translate('menuObjectOpenInNewTab') },
					{ id: 'newWindow', icon: 'newWindow', name: translate('menuObjectOpenInNewWindow') },
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
		const block = S.Block.getLeaf(widgets, blockId);

		if (!block) {
			return;
		};

		const isSectionPin = block.content.section == I.WidgetSection.Pin;

		needUpdate.current = true;
		n.current = -1;

		switch (key) {
			case 'layout': {
				const { layout: newLayout } = checkState(Number(optionId), limit);

				setLayout(newLayout);
				S.Menu.updateData('select', { value: String(newLayout) });

				if (isSectionPin) {
					C.BlockWidgetSetLayout(widgets, blockId, newLayout);
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
					options: layoutOptions.map(it => ({ id: String(it.id), name: it.name, icon: it.icon })),
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

			case 'addCollection': {
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
							icon: 'warning-red',
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

}));

export default MenuWidget;
