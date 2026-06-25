import React, { forwardRef, useRef, useEffect, MouseEvent } from 'react';

import raf from 'raf';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, ObjectName, DropTarget, IconObject, ChatCounter } from 'Component';

import WidgetSpace from './space';
import WidgetObject from './object';
import WidgetView from './view';
import WidgetTree from './tree';
import * as I from 'Interface';
import Storage from 'Lib/storage';

interface Props extends I.WidgetComponent {
	name?: string;
	icon?: string;
	disableContextMenu?: boolean;
	className?: string;
	onDragStart?: (e: MouseEvent, block: I.Block) => void;
	onDragOver?: (e: MouseEvent, block: I.Block) => void;
	onDrag?: (e: MouseEvent, block: I.Block) => void;
};

const WidgetIndex = forwardRef<{}, Props>((props, ref) => {

	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const subId = useRef('');
	const { block, isPreview, className, canEdit, getObject, onDragStart, onDragOver, onDrag, setPreview, index } = props;
	const { widgets } = S.Block;
	const blockRootId = props.rootId || widgets;
	const timeoutOpen = useRef(0);

	const getChild = (): I.Block => {
		const childrenIds = S.Block.getChildrenIds(blockRootId, block.id);
		const child = childrenIds.length ? S.Block.getLeaf(blockRootId, childrenIds[0]) : null;
		return child;
	};

	const child = getChild();
	const targetId = child?.getTargetObjectId();
	const object = getObject(targetId);
	const isSystemTarget = U.Menu.isSystemWidget(targetId);
	const isChat = U.Object.isChatLayout(object?.layout);
	const hasDiscussion = !isChat && !!object?.discussionId;
	const counterTargetId = isChat ? object?.id : (hasDiscussion ? object?.discussionId : '');
	const hasUnreadSection = S.Common.checkWidgetSection(I.WidgetSection.Unread);

	const getContentParam = (): { layout: I.WidgetLayout, limit: number, viewId: string } => {
		return U.Data.widgetContentParam(object, block);
	};

	const param = getContentParam();
	const { viewId } = param;

	const getLimit = (): number => {
		if (isPreview) {
			return 1000;
		};

		const options = U.Menu.getWidgetLimitOptions(param.layout).map(it => Number(it.id));

		let { limit } = param;

		if (!limit || !options.includes(limit)) {
			limit = options[0];
		};

		return limit;
	};

	const getLayout = (): I.WidgetLayout => {
		let layout = param.layout;

		const object = getObject(targetId);
		if (!object) {
			return layout;
		};

		const options = U.Menu.getWidgetLayoutOptions(object.id, object.layout).map(it => it.id);

		if (options.length && !options.includes(layout)) {
			layout = options[0];
		};

		return layout;
	};

	const limit = getLimit();
	const layout = getLayout();
	const hasChild = ![ I.WidgetLayout.Space, I.WidgetLayout.Object ].includes(layout);
	const canWrite = U.Space.canMyParticipantWrite();
	const cn = [ 'widget' ];
	const withSelect = !isSystemTarget && (!isPreview || !U.Common.isPlatformMac());
	const childKey = `widget-${child?.id}-${layout}`;
	const canDrop = object && !isSystemTarget && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);

	const updateDataHandler = useRef<() => void>(() => childRef.current?.updateData?.());
	const updateViewsHandler = useRef<() => void>(() => childRef.current?.updateViews?.());

	const unbind = () => {
		U.Dom.removeEvent(window, 'updateWidgetData', updateDataHandler.current);
		U.Dom.removeEvent(window, 'updateWidgetViews', updateViewsHandler.current);
	};

	const rebind = () => {
		unbind();

		updateDataHandler.current = () => childRef.current?.updateData?.();
		updateViewsHandler.current = () => childRef.current?.updateViews?.();

		U.Dom.addEvents(window, [
			['updateWidgetData', updateDataHandler.current],
			['updateWidgetViews', updateViewsHandler.current],
		]);
	};

	const onCreateClick = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		onCreate(e, { element: '.iconWrap.create', route: analytics.route.widget });
	};

	const onCreate = (e: any, param?: any): void => {
		param = param || {};

		if (!object) {
			return;
		};

		const node = nodeRef.current;
		const route = param.route || analytics.route.widget;

		let details: any = Object.assign({}, param.details || {});
		let flags: I.ObjectFlag[] = [];
		let typeKey = '';
		let templateId = '';
		let isCollection = false;
		let type = null;

		if (U.Object.isInSetLayouts(object.layout)) {
			const rootId = getRootId();
			if (!rootId) {
				return;
			};

			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
			const typeId = Dataview.getTypeId(rootId, J.Constant.blockId.dataview, object.id, viewId);
			type = S.Record.getTypeById(typeId);

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
					type = S.Record.getTypeById(S.Common.type);

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

		if ((layout == I.WidgetLayout.Tree) && !U.Object.isSetLayout(object.layout)) {
			details.createdInContext = object.id;
		};

		if (!typeKey) {
			return;
		};

		const cb = newObject => {
			if (isCollection) {
				C.ObjectCollectionAdd(object.id, [ newObject.id ]);
			};

			if (childRef.current && childRef.current.appendSearchIds) {
				const ids = childRef.current.getSearchIds ? childRef.current.getSearchIds() : [];

				if (ids) {
					childRef.current.appendSearchIds([ newObject.id ]);
				};
			};

			U.Object.openEvent(e, newObject);
			analytics.createObject(newObject.type, newObject.layout, route, 0);

			if (layout == I.WidgetLayout.Tree) {
				C.BlockCreate(object.id, '', I.BlockPosition.Bottom, U.Data.getLinkBlockParam(newObject.id, newObject.layout, true), (message: any) => {
					if (!message.error.code) {
						analytics.event('CreateLink');
					};
				});
			};
		};

		if (U.Object.getFileLayouts().includes(type.recommendedLayout)) {
			U.Menu.onFileUploadPopup(type.recommendedLayout, isCollection ? object.id : '', details, (objectIds) => {
				if (objectIds?.length) {
					const object = S.Detail.get(S.Common.space, objectIds[0]);
					if (object) {
						cb(object);
					};
				};
			}, analytics.route.uploadTypeWidget);
			return;
		};

		if (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout)) {
			const menuParam = {
				element: `#widget-${U.Common.esc(block.id)} ${param.element}`,
				onOpen: () => U.Dom.addClass(node, 'active'),
				onClose: () => U.Dom.removeClass(node, 'active'),
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				offsetY: 4,
				data: { details },
			};

			if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
				U.Menu.onBookmarkMenu(menuParam, cb);
			} else
			if (U.Object.isChatLayout(type.recommendedLayout)) {
				U.Menu.onChatMenu(menuParam, route, cb);
			};
			return;
		};

		if (typeKey == J.Constant.typeKey.type) {
			U.Object.createType({}, false);
			return;
		};

		if ((layout != I.WidgetLayout.Tree) && ![ J.Constant.typeKey.type ].includes(typeKey)) {
			flags.push(I.ObjectFlag.DeleteEmpty);
		};

		C.ObjectCreate(details, flags, templateId, typeKey, S.Common.space, (message: any) => {
			if (!message.error.code) {
				cb(message.details);
			};
		});
	};

	const onOptions = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		if (!object || object._empty_ || !canEdit) {
			return;
		};

		const node = nodeRef.current;
		const { x, y } = keyboard.mouse.page;

		S.Menu.open('widget', {
			element: `#widget-${U.Common.esc(block.id)} .iconWrap.more`,
			rect: { width: 0, height: 0, x, y: y + 14 },
			subIds: J.Menu.widget,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			onOpen: () => U.Dom.addClass(node, 'active'),
			onClose: () => U.Dom.removeClass(node, 'active'),
			data: {
				...param,
				target: object,
				blockId: block.id,
				isPreview,
				rootId: props.rootId,
			},
		});
	};

	const getIsOpen = () => {
		return Storage.checkToggle('widget', block.id);
	};

	const initToggle = () => {
		if ([ I.WidgetLayout.Space, I.WidgetLayout.Object ].includes(layout)) {
			return;
		};

		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const innerWrap = U.Dom.select('#innerWrap', node);
		const icon = U.Dom.select('.icon.collapse', node);
		const isOpen = getIsOpen();

		if (!isPreview) {
			U.Dom.toggleClass(node, 'isClosed', !isOpen);
			U.Dom.toggleClass(icon, 'isClosed', !isOpen);

			if (innerWrap) {
				U.Dom.css(innerWrap, { display: isOpen ? '' : 'none' });
			};
		};
	};

	const onToggle = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const isOpen = getIsOpen();

		isOpen ? close() : open();
		Storage.setToggle('widget', block.id, !isOpen);
	};

	const open = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const icon = U.Dom.select('.icon.collapse', node);
		const innerWrap = U.Dom.select('#innerWrap', node);
		const wrapper = U.Dom.select('#wrapper', node);
		const minHeight = getMinHeight();

		if (innerWrap) {
			U.Dom.css(innerWrap, { display: 'block', height: '', opacity: '0' });
		};

		if (wrapper) {
			U.Dom.css(wrapper, { height: 'auto' });
		};

		const height = wrapper?.offsetHeight ?? 0;

		U.Dom.addClass(node, 'isClosed');
		U.Dom.removeClass(icon, 'isClosed');

		if (wrapper) {
			U.Dom.css(wrapper, { height: `${minHeight}px` });
		};

		if (childRef.current?.onOpen) {
			childRef.current?.onOpen();
		};

		raf(() => {
			if (wrapper) {
				U.Dom.css(wrapper, { height: `${height}px` });
			};
			if (innerWrap) {
				U.Dom.css(innerWrap, { opacity: '1' });
			};
		});

		window.clearTimeout(timeoutOpen.current);
		timeoutOpen.current = window.setTimeout(() => {
			const isOpen = getIsOpen();

			if (isOpen) {
				U.Dom.removeClass(node, 'isClosed');
				if (wrapper) {
					U.Dom.css(wrapper, { height: 'auto' });
				};
			};
		}, J.Constant.delay.widget);
	};

	const close = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const icon = U.Dom.select('.icon.collapse', node);
		const innerWrap = U.Dom.select('#innerWrap', node);
		const wrapper = U.Dom.select('#wrapper', node);
		const minHeight = getMinHeight();

		if (wrapper) {
			U.Dom.css(wrapper, { height: `${wrapper.offsetHeight}px` });
		};
		U.Dom.addClass(icon, 'isClosed');
		if (innerWrap) {
			U.Dom.css(innerWrap, { opacity: '0' });
		};

		raf(() => {
			U.Dom.addClass(node, 'isClosed');
			if (wrapper) {
				U.Dom.css(wrapper, { height: `${minHeight}px` });
			};
		});

		window.clearTimeout(timeoutOpen.current);
		timeoutOpen.current = window.setTimeout(() => {
			const isOpen = getIsOpen();

			if (!isOpen) {
				if (wrapper) {
					U.Dom.css(wrapper, { height: '' });
				};
				if (innerWrap) {
					U.Dom.css(innerWrap, { display: 'none' });
				};
			};
		}, J.Constant.delay.widget);
	};

	const getMinHeight = () => {
		return [ I.WidgetLayout.List, I.WidgetLayout.Compact, I.WidgetLayout.Tree ].includes(layout) ? 8 : 0;
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
		const keys = J.Relation.sidebar;

		let limit = getLimit();
		let ignoreArchived = true;

		if (targetId != J.Constant.widgetId.recentOpen) {
			sorts.push({ relationKey: 'lastModifiedDate', type: I.SortType.Desc });
		};

		if (childRef.current?.getFilter && childRef.current?.getSearchIds) {
			const filter = childRef.current?.getFilter();
			const searchIds = childRef.current?.getSearchIds();

			if (filter) {
				filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds });
			};
		};

		switch (targetId) {
			case J.Constant.widgetId.favorite: {
				filters.push({ relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true });
				limit = 0;
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				filters.push({ relationKey: 'lastModifiedDate', condition: I.FilterCondition.Greater, value: space.createdDate + 10, includeTime: true });
				keys.push('lastModifiedDate');
				break;
			};

			case J.Constant.widgetId.recentOpen: {
				filters.push({ relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0, includeTime: true });
				sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
				keys.push('lastOpenedDate');
				break;
			};

			case J.Constant.widgetId.bin: {
				filters.push({ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true });
				ignoreArchived = false;
				break;
			};
		};

		U.Subscription.destroyList([ subId.current ], false, () => {
			U.Subscription.subscribe({
				subId: subId.current,
				filters,
				sorts,
				limit,
				keys,
				ignoreArchived,
				noDeps: true,
			}, callBack);
		});
	};

	const onSetPreview = () => {
		if (!child || !setPreview) {
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

	const onDragEnd = (e: any) => {
		scrollOnMove.onMouseUp();

		analytics.event('ReorderWidget', {
			layout,
			params: { target: object }
		});
	};

	const canCreateHandler = (): boolean => {
		if (!object || !U.Space.canMyParticipantWrite()) {
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
			const layouts = [ I.ObjectLayout.Participant ];
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
		return child ? [ targetId, getTraceId() ].join('-') : '';
	};

	const getTraceId = (): string => {
		return child ? [ 'widget', child.id ].join('-') : '';
	};

	const addGroupLabels = (records: any[], widgetId: string) => {
		let relationKey = '';

		if (widgetId == J.Constant.widgetId.recentOpen) {
			relationKey = 'lastOpenedDate';
		};
		if (widgetId == J.Constant.widgetId.recentEdit) {
			relationKey = 'lastModifiedDate';
		};

		return relationKey ? U.Data.groupDateSections(records, relationKey, { type: '', links: [] }) : records;
	};

	const checkShowAllButton = (subId: string) => {
		const rootId = getRootId();
		if (!rootId) {
			return;
		};

		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const innerWrap = U.Dom.select('#innerWrap', node);
		const button = innerWrap ? U.Dom.select('#button-show-all', innerWrap) : null;

		let total = 0;
		let show = false;

		if (!isSystemTarget && block.isWidgetTree()) {
			if (!targetId) {
				return;
			};

			const treeObject = getObject(targetId);
			const total = Relation.getArrayValue(treeObject?.links).length;

			show = !isPreview && (total > limit);
		} else {
			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
			const viewType = view?.type || I.ViewType.List;
			const isAllowedView = [ I.ViewType.Board, I.ViewType.List, I.ViewType.Grid, I.ViewType.Gallery ].includes(viewType);

			if (isAllowedView) {
				if (view && view.isBoard()) {
					total = Dataview.getGroups(rootId, J.Constant.blockId.dataview, viewId, false).length;
				} else {
					total = S.Record.getMeta(subId, '').total;
				};
			};

			show = !isPreview && (total > limit) && isAllowedView;
		};

		if (button) {
			U.Dom.css(button, { display: show ? 'flex' : 'none' });
		};
	};

	const onContext = (param: any) => {
		const { node, element, withElement, subId, objectId, data } = param;

		const menuParam: any = {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => U.Dom.addClass(node, 'active'),
			onClose: () => U.Dom.removeClass(node, 'active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ objectId ],
				subId,
				allowedNewTab: true,
				openAfterDuplicate: true,
				allowedCollection: true,
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

	const onClickHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		if (isSystemTarget) {
			onSetPreview();
		} else {
			const rootId = getRootId();
			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);

			S.Common.routeParam = { ref: 'widget', viewId: view?.id };
			U.Object.openEvent(e, object);
		};
	};

	const buttons = [];
	const canCreate = canCreateHandler();
	const childProps = {
		...props,
		ref: childRef,
		parent: block,
		block: child,
		canCreate,
		isSystemTarget,
		getData,
		getLimit,
		getTraceId,
		getRootId,
		addGroupLabels,
		checkShowAllButton,
		onContext,
		onCreate,
		getContentParam,
		onSetPreview,
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

	if (canEdit) {
		cn.push('isEditable');
	};

	let head = null;
	let content = null;
	let targetTop = null;
	let targetBot = null;
	let isDraggable = canWrite && !props.rootId;
	let collapse = null;
	let icon = null;

	if (isPreview) {
		isDraggable = false;
	} else {
		if (canCreate) {
			buttons.push({ id: 'create', iconParam: { name: 'plus/menu' }, tooltip: translate('commonCreateNewObject'), onClick: onCreateClick });
		};

		collapse = (
			<div className="iconWrap collapse" onClick={onToggle}>
				<Icon name="widget/collapse" className="collapse" />
			</div>
		);
	};

	if (buttons.length) {
		cn.push('withButtons');
	};

	if (hasChild) {
		if (object?.isSystem) {
			icon = <Icon name={object.iconName} className={[ 'headerIcon', object.icon ].join(' ')} />;
		} else {
			icon = (
				<IconObject 
					object={object} 
					size={20} 
					iconSize={20} 
					className="headerIcon" 
					canEdit={U.Object.isTaskLayout(object?.layout)} 
					onClick={e => e.stopPropagation()}
				/>
			);
		};

		if (!isPreview) {
			head = (
				<div className="head" onClick={onClickHandler}>
					<div className="sides">
						<div className="side left">
							<div className="clickable">
								<div className="iconAnimationWrapper">
									{collapse}
									{icon}
								</div>
								<ObjectName object={object} withPlural={true} />
							</div>
						</div>
						<div className="side right">
							{counterTargetId && !hasUnreadSection ? (
								<ChatCounter
									chatId={counterTargetId}
									mode={hasDiscussion ? U.Object.getDiscussionNotificationMode(U.Space.getSpaceview(), object.id) : undefined}
								/>
							) : ''}

							{buttons.length ? (
								<div className="buttons">
									{buttons.map(item => (
										<div key={item.id} className={[ 'iconWrap', item.id ].join(' ')} onClick={item.onClick}>
											<Icon {...(item.iconParam || {})} className={item.icon} tooltipParam={{ text: item.tooltip }} />
										</div>
									))}
								</div>
							) : ''}
						</div>
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

			if (!props.rootId) {
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
		};
	};

	switch (layout) {
		case I.WidgetLayout.Space: {
			cn.push('widgetSpace');
			content = <WidgetSpace key={childKey} {...childProps} />;

			isDraggable = false;
			break;
		};

		case I.WidgetLayout.Object: {
			cn.push('widgetObject');
			content = <WidgetObject key={childKey} {...childProps} />;

			isDraggable = false;
			break;
		};

		case I.WidgetLayout.Link: {
			cn.push('widgetLink');
			break;
		};

		case I.WidgetLayout.Tree: {
			cn.push('widgetTree');
			content = <WidgetTree key={childKey} {...childProps} />;
			break;
		};

		case I.WidgetLayout.List:
		case I.WidgetLayout.Compact:
		case I.WidgetLayout.View: {
			cn.push('widgetView');
			content = <WidgetView key={childKey} {...childProps} />;
			break;
		};

	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
			window.clearTimeout(timeoutOpen.current);
		};
	}, []);

	useEffect(() => {
		initToggle();
	});

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef}
				id={`widget-${block.id}`}
				className={cn.join(' ')}
				draggable={isDraggable}
				onDragStart={(e: any) => onDragStart?.(e, block)}
				onDragOver={(e: any) => onDragOver?.(e, block)}
				onDrag={(e: any) => onDrag?.(e, block)}
				onDragEnd={onDragEnd}
				onContextMenu={onOptions}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: index * 0.025 },
				})}
			>
				{head}

				<div id="wrapper" className="contentWrapper">
					{content}
				</div>

				<div className="dimmer" />

				{targetTop}
				{targetBot}
			</motion.div>
		</AnimatePresence>	
	);

});

export default WidgetIndex;
