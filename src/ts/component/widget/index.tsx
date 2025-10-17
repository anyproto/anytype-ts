import React, { forwardRef, useRef, useEffect, MouseEvent } from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Icon, ObjectName, DropTarget, IconObject, Button, ChatCounter } from 'Component';
import { C, I, S, U, J, translate, Storage, Action, analytics, Dataview, keyboard, Relation, scrollOnMove } from 'Lib';

import WidgetSpace from './space';
import WidgetView from './view';
import WidgetTree from './tree';

interface Props extends I.WidgetComponent {
	name?: string;
	icon?: string;
	disableContextMenu?: boolean;
	disableAnimation?: boolean;
	className?: string;
	onDragStart?: (e: MouseEvent, block: I.Block) => void;
	onDragOver?: (e: MouseEvent, block: I.Block) => void;
	onDrag?: (e: MouseEvent, block: I.Block) => void;
};

const WidgetIndex = observer(forwardRef<{}, Props>((props, ref) => {

	const { space } = S.Common;
	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const subId = useRef('');
	const timeout = useRef(0);
	const spaceview = U.Space.getSpaceview();
	const { block, isPreview, className, canEdit, canRemove, disableAnimation, getObject, onDragStart, onDragOver, onDrag, setPreview } = props;
	const { widgets } = S.Block;

	const getChild = (): I.Block => {
		const childrenIds = S.Block.getChildrenIds(widgets, block.id);
		const child = childrenIds.length ? S.Block.getLeaf(widgets, childrenIds[0]) : null;
		return child;
	};

	const child = getChild();
	const targetId = child?.getTargetObjectId();
	const object = getObject(targetId);
	const isSystemTarget = U.Menu.isSystemWidget(targetId);
	const isSectionType = block.content.section == I.WidgetSection.Type;
	const isChat = U.Object.isChatLayout(object?.layout);
	const isBin = targetId == J.Constant.widgetId.bin;

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
	const hasChild = ![ I.WidgetLayout.Space ].includes(layout);
	const canWrite = U.Space.canMyParticipantWrite();
	const cn = [ 'widget' ];
	const withSelect = !isSystemTarget && (!isPreview || !U.Common.isPlatformMac());
	const childKey = `widget-${child?.id}-${layout}`;
	const canDrop = object && !isSystemTarget && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);

	let counters = { mentionCounter: 0, messageCounter: 0 };
	if (isChat) {
		counters = S.Chat.getChatCounters(space, spaceview.chatId);
	};

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
		if (e.button) {
			return;
		};

		const rootId = getRootId();
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);

		S.Common.routeParam = { ref: 'widget', viewId: view?.id };
		U.Object.openEvent(e, object);
	};

	const onCreateClick = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		onCreate({ element: '.iconWrap.create', route: analytics.route.widget });
	};

	const onCreate = (param?: any): void => {
		param = param || {};

		if (!object) {
			return;
		};

		const node = $(nodeRef.current);
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

		if (!typeKey) {
			return;
		};

		const cb = newObject => {
			if (isCollection) {
				C.ObjectCollectionAdd(object.id, [ newObject.id ]);
			};

			if (childRef.current && childRef.current?.appendSearchIds) {
				childRef.current?.appendSearchIds([ newObject.id ]);
			};

			U.Object.openConfig(newObject);
			analytics.createObject(newObject.type, newObject.layout, route, 0);

			if (layout == I.WidgetLayout.Tree) {
				C.BlockCreate(object.id, '', I.BlockPosition.Bottom, U.Data.getLinkBlockParam(newObject.id, newObject.layout, true), (message: any) => {
					if (!message.error.code) {
						analytics.event('CreateLink');
					};
				});
			};
		};

		if (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout)) {
			const menuParam = {
				element: `#widget-${block.id} ${param.element}`,
				onOpen: () => node.addClass('active'),
				onClose: () => node.removeClass('active'),
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				offsetY: 4,
				data: { details },
			};

			if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
				U.Menu.onBookmarkMenu(menuParam, cb);
			} else 
			if (U.Object.isChatLayout(type.recommendedLayout)) {
				U.Menu.onChatMenu(menuParam, cb);
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

		const node = $(nodeRef.current);
		const { x, y } = keyboard.mouse.page;
		
		const menuParam: Partial<I.MenuParam> = {
			element: `#widget-${block.id} .iconWrap.more`,
			rect: { width: 0, height: 0, x, y: y + 14 },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {},
		};

		let menuId = '';

		if (isBin) {
			menuId = 'select';
			menuParam.data = Object.assign(menuParam.data, {
				options: [
					{ id: 'open', icon: 'expand', name: translate('commonOpen') },
					{ id: 'empty', icon: 'remove', name: translate('commonEmptyBin') },
				],
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'open': {
							U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
							break;
						};

						case 'empty': {
							Action.emptyBin(analytics.route.widget);
							break;
						};
					};
				},
			});
		} else {
			menuId = 'widget';
			menuParam.subIds = J.Menu.widget;
			menuParam.data = Object.assign(menuParam.data, {
				...param,
				target: object,
				blockId: block.id,
				isPreview,
			});
		};

		S.Menu.open(menuId, menuParam);
	};

	const getIsOpen = () => {
		return Storage.checkToggle('widget', block.id);
	};

	const initToggle = () => {
		const node = $(nodeRef.current);
		const innerWrap = node.find('#innerWrap');
		const icon = node.find('.icon.collapse');
		const isOpen = getIsOpen();

		if (!isPreview) {
			node.toggleClass('isClosed', !isOpen);
			icon.toggleClass('isClosed', !isOpen);

			isOpen ? innerWrap.show() : innerWrap.hide();
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
			const isOpen = getIsOpen();

			if (isOpen) {
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
			const isOpen = getIsOpen();

			if (!isOpen) {
				wrapper.css({ height: '' });
				innerWrap.hide();
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

		U.Subscription.subscribe({
			subId: subId.current,
			filters,
			sorts,
			limit,
			keys: J.Relation.sidebar,
			ignoreArchived,
			noDeps: true,
		}, () => {
			if (callBack) {
				callBack();
			};
		});
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

	const checkShowAllButton = (subId: string) => {
		const rootId = getRootId();
		if (!rootId) {
			return;
		};

		const node = $(nodeRef.current);
		const innerWrap = node.find('#innerWrap');
		
		let total = 0;
		let show = false;

		if (!isSystemTarget && block.isWidgetTree()) {
			if (!targetId) {
				return;
			};

			const object = S.Detail.get(S.Block.widgets, targetId);
			const total = Relation.getArrayValue(object.links).length;

			show = !isPreview && (total > limit);
		} else {
			const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
			const viewType = view?.type || I.ViewType.List;
			const isAllowedView = [ I.ViewType.Board, I.ViewType.List, I.ViewType.Grid, I.ViewType.Gallery ].includes(viewType);

			if (view && view.isBoard()) {
				total = Dataview.getGroups(rootId, J.Constant.blockId.dataview, viewId, false).length;
			} else {
				total = S.Record.getMeta(subId, '').total;
			};

			show = !isPreview && (total > limit) && isAllowedView;
		};

		if (show) {
			addShowAllButton();
		} else {
			node.find('#button-show-all').remove();
		};

		innerWrap.toggleClass('withShowAll', show);
	};

	const addShowAllButton = () => {
		const node = $(nodeRef.current);
		const innerWrap = node.find('#innerWrap');
		const wrapper = $('<div id="button-show-all"></div>');

		ReactDOM.render(<Button onClick={onSetPreview} text={translate('widgetSeeAll')} className="c28 showAll" color="blank" />, wrapper.get(0));

		innerWrap.find('#button-show-all').remove();
		innerWrap.append(wrapper);
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

	const onExpandHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isSystemTarget && !isBin) {
			onSetPreview();
		} else {
			onClick(e);
		};

		analytics.event('ClickWidgetTitle');
	};

	const onClickHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isSectionType && (layout != I.WidgetLayout.Link)) {
			onSetPreview();
		} else {
			onExpandHandler(e);
		};
	};

	const buttons = [];
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
		addGroupLabels,
		checkShowAllButton,
		onContext,
		onCreate,
		getContentParam,
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
	let isDraggable = canWrite;
	let collapse = null;
	let icon = null;

	if (isPreview) {
		isDraggable = false;
	} else {
		if (isSectionType) {
			buttons.push({ id: 'expand', icon: 'expand', tooltip: translate('commonOpenObject'), onClick: onExpandHandler });
		};

		if (canCreate) {
			buttons.push({ id: 'create', icon: 'plus', tooltip: translate('commonCreateNewObject'), onClick: onCreateClick });
		};

		collapse = (
			<div className="iconWrap collapse" onClick={onToggle}>
				<Icon className="collapse" />
			</div>
		);
	};

	if (buttons.length) {
		cn.push('withButtons');
	};

	if (hasChild) {
		if (object?.isSystem) {
			icon = <Icon className={[ 'headerIcon', object.icon ].join(' ')} />;
		} else {
			icon = <IconObject object={object} size={20} iconSize={20} className="headerIcon" />;
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
							<ChatCounter {...counters} mode={spaceview.notificationMode} />

							{buttons.length ? (
								<div className="buttons">
									{buttons.map(item => (
										<div key={item.id} className={[ 'iconWrap', item.id ].join(' ')} onClick={item.onClick}>
											<Icon className={item.icon} tooltipParam={{ text: item.tooltip }} />
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

		const node = $(nodeRef.current);

		let t1 = 0;
		let t2 = 0;

		if (!disableAnimation) {
			node.addClass('anim');
			t1 = window.setTimeout(() => {
				node.addClass('show');
				t2 = window.setTimeout(() => node.removeClass('anim'), 300);
			}, J.Constant.delay.widgetItem);
		} else {
			node.addClass('show');
		};

		return () => {
			unbind();

			window.clearTimeout(t1);
			window.clearTimeout(t2);
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		initToggle();

		$(nodeRef.current).addClass('show');
	});

	return (
		<div
			ref={nodeRef}
			id={`widget-${block.id}`}
			className={cn.join(' ')}
			draggable={isDraggable}
			onDragStart={e => onDragStart ? onDragStart(e, block) : null}
			onDragOver={e => onDragOver ? onDragOver(e, block) : null}
			onDrag={e => onDrag ? onDrag(e, block) : null}
			onDragEnd={onDragEnd}
			onContextMenu={onOptions}
		>
			{canRemove ? <Icon className="remove" inner={<div className="inner" />} onClick={onRemove} /> : ''}

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