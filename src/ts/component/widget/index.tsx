import React, { forwardRef, useRef, useEffect, useState, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, ObjectName, DropTarget, IconObject } from 'Component';
import { C, I, S, U, J, translate, Storage, Action, analytics, Dataview, keyboard, Relation, sidebar } from 'Lib';

import WidgetSpace from './space';
import WidgetView from './view';
import WidgetTree from './tree';

interface Props extends I.WidgetComponent {
	name?: string;
	icon?: string;
	disableContextMenu?: boolean;
	className?: string;
	onDragStart?: (e: React.MouseEvent, blockId: string) => void;
	onDragOver?: (e: React.MouseEvent, blockId: string) => void;
};

const WidgetIndex = observer(forwardRef<{}, Props>((props, ref) => {

	const { block, isPreview, isEditing, className, setEditing, onDragStart, onDragOver, setPreview } = props;
	const { viewId } = block.content;
	const { root, widgets } = S.Block;
	const childrenIds = S.Block.getChildrenIds(widgets, block.id);
	const child = childrenIds.length ? S.Block.getLeaf(widgets, childrenIds[0]) : null;
	const targetId = child ? child.getTargetObjectId() : '';
	const isSystemTarget = child ? U.Menu.isSystemWidget(child.getTargetObjectId()) : false;

	const getObject = () => {
		if (!child) {
			return null;
		};

		let object = null;
		if (U.Menu.isSystemWidget(targetId)) {
			object = U.Menu.getSystemWidgets().find(it => it.id == targetId);
		} else {
			object = S.Detail.get(widgets, targetId);
		};
		return object;
	};

	const getLimit = ({ limit, layout }): number => {
		if (isPreview) {
			return J.Constant.limit.menuRecords;
		};

		const options = U.Menu.getWidgetLimitOptions(layout).map(it => Number(it.id));

		if (!limit || !options.includes(limit)) {
			limit = options[0];
		};

		return limit;
	};

	const object = getObject();
	const limit = getLimit(block.content);
	const [ dummy, setDummy ] = useState(0);
	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const subId = useRef('');
	const timeout = useRef(0);
	const isFavorite = targetId == J.Constant.widgetId.favorite;

	let favCnt = 0;
	let layout = block.content.layout;

	if (isFavorite) {
		favCnt = S.Record.getRecords(subId.current).filter(it => !it.isArchived && !it.isDeleted).length;
	};

	if (object) {
		const layoutOptions = U.Menu.getWidgetLayoutOptions(object.id, object.layout).map(it => it.id);

		if (layoutOptions.length && !layoutOptions.includes(layout)) {
			layout = layoutOptions[0];
		};
	};

	const hasChild = ![ I.WidgetLayout.Space ].includes(layout);
	const canWrite = U.Space.canMyParticipantWrite();
	const cn = [ 'widget' ];
	const withSelect = !isSystemTarget && (!isPreview || !U.Common.isPlatformMac());
	const childKey = `widget-${child?.id}-${layout}`;
	const canDrop = object && !isSystemTarget && !isEditing && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);

	const unbind = () => {
		const events = [ 'updateWidgetData', 'updateWidgetViews' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);

		unbind();

		win.on(`updateWidgetData.${block.id}`, () => childRef.current?.updateData && childRef.current?.updateData());
		win.on(`updateWidgetViews.${block.id}`, () => childRef.current?.updateViews && childRef.current?.updateViews());
	};

	const onRemove = (e: MouseEvent): void => {
		e.stopPropagation();
		Action.removeWidget(block.id, object);
	};

	const onClick = (e: MouseEvent): void => {
		if (!e.button) {
			U.Object.openEvent(e, { ...object, _routeParam_: { viewId: block.content.viewId } });
		};
	};

	const onCreateClick = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		onCreate({ route: analytics.route.widget });
	};

	const onCreate = (param?: any): void => {
		param = param || {};

		if (!object) {
			return;
		};

		const route = param.route || analytics.route.widget;
		const isFavorite = object.id == J.Constant.widgetId.favorite;

		let details: any = Object.assign({}, param.details || {});
		let flags: I.ObjectFlag[] = [];
		let typeKey = '';
		let templateId = '';
		let isCollection = false;

		if (U.Object.isInSetLayouts(object.layout)) {
			const rootId = getRootId();
			if (!rootId) {
				return;
			};

			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
			const typeId = Dataview.getTypeId(rootId, J.Constant.blockId.dataview, object.id, viewId);
			const type = S.Record.getTypeById(typeId);

			if (!type) {
				return;
			};

			details = Object.assign(Dataview.getDetails(rootId, J.Constant.blockId.dataview, object.id, viewId), details);
			flags = flags.concat([ I.ObjectFlag.SelectTemplate ]);
			typeKey = type.uniqueKey;
			templateId = view?.defaultTemplateId || type.defaultTemplateId;
			isCollection = U.Object.isCollectionLayout(object.layout);
		} else {
			switch (object.id) {
				default:
				case J.Constant.widgetId.favorite: {
					const type = S.Record.getTypeById(S.Common.type);

					if (!type) {
						return;
					};

					details.layout = type.recommendedLayout;
					flags = flags.concat([ I.ObjectFlag.SelectTemplate ]);
					typeKey = type.uniqueKey;
					templateId = type.defaultTemplateId;
					break;
				};

			};
		};

		if (!typeKey) {
			return;
		};

		if ((layout != I.WidgetLayout.Tree) && ![ J.Constant.typeKey.type ].includes(typeKey)) {
			flags.push(I.ObjectFlag.DeleteEmpty);
		};

		C.ObjectCreate(details, flags, templateId, typeKey, S.Common.space, true, (message: any) => {
			if (message.error.code) {
				return;
			};

			const newObject = message.details;

			if (isFavorite) {
				Action.setIsFavorite([ newObject.id ], true, route);
			};

			if (isCollection) {
				C.ObjectCollectionAdd(object.id, [ newObject.id ]);
			};

			U.Object.openConfig(newObject);
			analytics.createObject(newObject.type, newObject.layout, route, message.middleTime);

			if (layout == I.WidgetLayout.Tree) {
				C.BlockCreate(object.id, '', I.BlockPosition.Bottom, U.Data.getLinkBlockParam(newObject.id, newObject.layout, true), (message: any) => {
					if (!message.error.code) {
						analytics.event('CreateLink');
					};
				});
			};
		});
	};

	const onOptions = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		if (!U.Space.canMyParticipantWrite()) {
			return;
		};

		if (!object || object._empty_) {
			return;
		};

		const node = $(nodeRef.current);
		const { x, y } = keyboard.mouse.page;

		S.Menu.open('widget', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			subIds: J.Menu.widget,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				...block.content,
				target: object,
				isEditing: true,
				blockId: block.id,
				setEditing,
			}
		});
	};

	const initToggle = () => {
		const node = $(nodeRef.current);
		const innerWrap = node.find('#innerWrap');
		const icon = node.find('.icon.collapse');
		const isClosed = Storage.checkToggle('widget', block.id);

		if (!isPreview) {
			node.toggleClass('isClosed', isClosed);
			icon.toggleClass('isClosed', isClosed);

			isClosed ? innerWrap.hide() : innerWrap.show();
		};
	};

	const onToggle = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const isClosed = Storage.checkToggle('widget', block.id);

		isClosed ? open() : close();
		Storage.setToggle('widget', block.id, !isClosed);
	};

	const open = () => {
		const node = $(nodeRef.current);
		const icon = node.find('.icon.collapse');
		const innerWrap = node.find('#innerWrap').show().css({ height: '', opacity: 0 });
		const wrapper = node.find('#wrapper').css({ height: 'auto' });
		const height = wrapper.outerHeight();
		const minHeight = getMinHeight();

		node.addClass('isClosed');
		icon.removeClass('isClosed');
		wrapper.css({ height: minHeight });

		if (childRef.current?.onOpen) {
			childRef.current?.onOpen();
		};

		raf(() => { 
			wrapper.css({ height }); 
			innerWrap.css({ opacity: 1 });
		});

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => { 
			const isClosed = Storage.checkToggle('widget', block.id);

			if (!isClosed) {
				node.removeClass('isClosed');
				wrapper.css({ height: 'auto' });
			};
		}, J.Constant.delay.widget);
	};

	const close = () => {
		const node = $(nodeRef.current);
		const icon = node.find('.icon.collapse');
		const innerWrap = node.find('#innerWrap');
		const wrapper = node.find('#wrapper');
		const minHeight = getMinHeight();

		wrapper.css({ height: wrapper.outerHeight() });
		icon.addClass('isClosed');
		innerWrap.css({ opacity: 0 });

		raf(() => { 
			node.addClass('isClosed'); 
			wrapper.css({ height: minHeight });
		});

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			const isClosed = Storage.checkToggle('widget', block.id);

			if (isClosed) {
				wrapper.css({ height: '' });
				innerWrap.hide();
			};
		}, J.Constant.delay.widget);
	};

	const getMinHeight = () => {
		return [ I.WidgetLayout.List, I.WidgetLayout.Compact, I.WidgetLayout.Tree ].includes(block.content.layout) ? 8 : 0;
	};

	const getData = (subscriptionId: string, callBack?: () => void) => {
		if (!child) {
			return;
		};

		subId.current = subscriptionId;

		const space = U.Space.getSpaceview();
		const sorts = [];
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it)) },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
		];
		let limit = getLimit(block.content);
		let ignoreArchived = true;

		if (targetId != J.Constant.widgetId.recentOpen) {
			sorts.push({ relationKey: 'lastModifiedDate', type: I.SortType.Desc });
		};

		switch (targetId) {
			case J.Constant.widgetId.favorite: {
				filters.push({ relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				limit = 0;
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				filters.push({ relationKey: 'lastModifiedDate', condition: I.FilterCondition.Greater, value: space.createdDate + 3 });
				break;
			};

			case J.Constant.widgetId.recentOpen: {
				filters.push({ relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 });
				sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
				break;
			};

			case J.Constant.widgetId.bin: {
				filters.push({ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true });
				ignoreArchived = false;
				break;
			};
		};

		U.Data.searchSubscribe({
			subId: subId.current,
			filters,
			sorts,
			limit,
			keys: J.Relation.sidebar,
			ignoreArchived,
		}, () => {
			if (callBack) {
				callBack();
			};
		});
	};

	const sortFavorite = (records: string[]): string[] => {
		const ids = S.Block.getChildren(root, root, it => it.isLink()).
			map(it => it.getTargetObjectId()).
			map(id => S.Detail.get(root, id)).
			filter(it => !it.isArchived && !it.isDeleted).map(it => it.id);

		let sorted = U.Common.objectCopy(records || []).sort((c1: string, c2: string) => {
			const i1 = ids.indexOf(c1);
			const i2 = ids.indexOf(c2);

			if (i1 > i2) return 1;
			if (i1 < i2) return -1;
			return 0;
		});

		if (!isPreview) {
			sorted = sorted.slice(0, getLimit(block.content));
		};

		return sorted;
	};

	const onSetPreview = () => {
		if (!child) {
			return;
		};

		const data: any = { view: 'Widget' };

		let blockId = '';
		let event = 'ScreenHome';

		if (!isPreview) {
			blockId = block.id;
			event = 'SelectHomeTab';
			data.tab = isSystemTarget ? object.name : analytics.typeMapper(object.type);
		};

		setPreview(blockId);
		analytics.event(event, data);
	};

	const onDragEnd = () => {
		analytics.event('ReorderWidget', {
			layout,
			params: { target: object }
		});
	};

	const canCreateHandler = (): boolean => {
		if (!object || isEditing || !U.Space.canMyParticipantWrite()) {
			return false;
		};

		const layoutWithPlus = [ I.WidgetLayout.List, I.WidgetLayout.Tree, I.WidgetLayout.Compact, I.WidgetLayout.View ].includes(layout);
		const isRestricted = [ J.Constant.widgetId.recentOpen, J.Constant.widgetId.recentEdit, J.Constant.widgetId.bin ].includes(targetId);

		if (isRestricted || !layoutWithPlus) {
			return false;
		};

		if (U.Object.isInSetLayouts(object.layout)) {
			const rootId = getRootId();
			const typeId = Dataview.getTypeId(rootId, J.Constant.blockId.dataview, object.id);
			const type = S.Record.getTypeById(typeId);
			const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Participant);
			const setOf = Relation.getArrayValue(object.setOf);
			const isCollection = U.Object.isCollectionLayout(object.layout);

			if (!setOf.length && !isCollection) {
				return false;
			};

			if (type) {
				if (layouts.includes(type.recommendedLayout) || (type.uniqueKey == J.Constant.typeKey.template)) {
					return false;
				};
			};
		} else
		if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
			return false;
		};

		return true;
	};

	const getRootId = (): string => {
		return child ? [ targetId, 'widget', child.id ].join('-') : '';
	};

	const getTraceId = (): string => {
		return child ? [ 'widget', child.id ].join('-') : '';
	};

	const addGroupLabels = (records: any[], widgetId: string) => {
		let relationKey;
		if (widgetId == J.Constant.widgetId.recentOpen) {
			relationKey = 'lastOpenedDate';
		};
		if (widgetId == J.Constant.widgetId.recentEdit) {
			relationKey = 'lastModifiedDate';
		};
		return U.Data.groupDateSections(records, relationKey, { type: '', links: [] });
	};

	const onContext = (param: any) => {
		const { node, element, withElement, subId, objectId, data } = param;

		const menuParam: any = {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ objectId ],
				subId,
				noRelation: true,
			},
		};

		menuParam.data = Object.assign(menuParam.data, data || {});

		if (withElement) {
			menuParam.element = element;
			menuParam.vertical = I.MenuDirection.Center;
			menuParam.offsetX = 32;
		} else {
			const { x, y } = keyboard.mouse.page;
			menuParam.rect = { width: 0, height: 0, x: x + 4, y };
		};

		S.Menu.open('objectContext', menuParam);
	};

	const canCreate = canCreateHandler();
	const childProps = {
		...props,
		ref: childRef,
		key: childKey,
		parent: block,
		block: child,
		canCreate,
		isSystemTarget,
		getData,
		getLimit,
		getTraceId,
		sortFavorite,
		addGroupLabels,
		onContext,
		onCreate,
	};

	if (className) {
		cn.push(className);
	};

	if (isPreview) {
		cn.push('isPreview');
	};

	if (withSelect) {
		cn.push('withSelect');
	};

	let head = null;
	let content = null;
	let back = null;
	let buttons = null;
	let targetTop = null;
	let targetBot = null;
	let isDraggable = canWrite;
	let collapse = null;

	if (isPreview) {
		back = (
			<div className="iconWrap back">
				<Icon
					className="back"
					onClick={() => {
						setPreview('');
						analytics.event('ScreenHome', { view: 'Widget' });
					}}
				/>
			</div>
		);

		isDraggable = false;
	} else {
		buttons = (
			<div className="buttons">
				<div className="iconWrap more" onClick={onOptions}>
					<Icon className="options" tooltipParam={{ text: translate('widgetOptions') }} />
				</div>
				{canCreate ? (
					<div className="iconWrap create" onClick={onCreateClick}>
						<Icon className="plus" tooltipParam={{ text: translate('commonCreateNewObject') }} />
					</div>
				) : ''}
			</div>
		);

		collapse = (
			<div className="iconWrap collapse">
				<Icon className="collapse" onClick={onToggle} />
			</div>
		);
	};

	if (hasChild) {
		const onClickHandler = (e: any) => {
			e.preventDefault();
			e.stopPropagation();

			if (targetId == J.Constant.widgetId.bin) {
				U.Object.openAuto({ layout: I.ObjectLayout.Archive });
			} else 
			if (targetId == J.Constant.widgetId.allObject) {
				sidebar.leftPanelSetState({ page: 'object' });
			} else 
			if (isSystemTarget) {
				onSetPreview();
			} else {
				onClick(e);
			};

			analytics.event('ClickWidgetTitle', { widgetType: analytics.getWidgetType(block.content.autoAdded) });
		};

		let icon = null;
		if (object?.isSystem) {
			icon = <Icon className={[ 'headerIcon', object.icon ].join(' ')} />;
		} else {
			icon = <IconObject object={object} size={18} iconSize={18} className="headerIcon" />;
		};

		head = (
			<div className="head" onClick={onClickHandler}>
				<div className="sides">
					<div className="side left">
						{back}
						<div className="clickable">
							{collapse}
							{icon}
							<ObjectName object={object} withPlural={true} />
							{favCnt > limit ? <span className="count">{favCnt}</span> : ''}
						</div>
					</div>
					<div className="side right">{buttons}</div>
				</div>
			</div>
		);

		if (canDrop) {
			head = (
				<DropTarget
					cacheKey={[ block.id, object.id ].join('-')}
					id={object.id}
					rootId={targetId}
					targetContextId={object.id}
					dropType={I.DropType.Menu}
					canDropMiddle={true}
					className="targetHead"
				>
					{head}
				</DropTarget>
			);
		};

		targetTop = (
			<DropTarget 
				{...props} 
				isTargetTop={true} 
				rootId={S.Block.widgets} 
				id={block.id} 
				dropType={I.DropType.Widget} 
				canDropMiddle={false} 
				onClick={onClickHandler}
			/>
		);

		targetBot = (
			<DropTarget 
				{...props} 
				isTargetBottom={true} 
				rootId={S.Block.widgets} 
				id={block.id} 
				dropType={I.DropType.Widget} 
				canDropMiddle={false} 
			/>
		);
	};

	switch (layout) {
		case I.WidgetLayout.Space: {
			cn.push('widgetSpace');
			content = <WidgetSpace {...childProps} />;

			isDraggable = false;
			break;
		};

		case I.WidgetLayout.Link: {
			cn.push('widgetLink');
			break;
		};

		case I.WidgetLayout.Tree: {
			cn.push('widgetTree');
			content = <WidgetTree {...childProps} />;
			break;
		};

		case I.WidgetLayout.List:
		case I.WidgetLayout.Compact:
		case I.WidgetLayout.View: {
			cn.push('widgetView');
			content = <WidgetView {...childProps} />;
			break;
		};

	};

	useEffect(() => {
		rebind();
		setDummy(dummy + 1);

		return () => {
			unbind();
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => initToggle());

	return (
		<div
			ref={nodeRef}
			id={`widget-${block.id}`}
			className={cn.join(' ')}
			draggable={isDraggable}
			onDragStart={e => onDragStart(e, block.id)}
			onDragOver={e => onDragOver ? onDragOver(e, block.id) : null}
			onDragEnd={onDragEnd}
			onContextMenu={onOptions}
		>
			<Icon className="remove" inner={<div className="inner" />} onClick={onRemove} />

			{head}

			<div id="wrapper" className="contentWrapper">
				{content}
			</div>

			<div className="dimmer" />

			{targetTop}
			{targetBot}
		</div>
	);

}));

export default WidgetIndex;