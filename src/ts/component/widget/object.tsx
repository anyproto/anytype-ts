import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, ChatCounter, Icon } from 'Component';
import * as I from 'Interface';

interface WidgetObjectItemProps {
	item: any;
	canDrag: boolean;
	canWrite: boolean;
	realId: string;
	isUnread: boolean;
	hasUnreadSection: boolean;
	isAllowedObject: (type: any) => boolean;
	onCreate: (e: any, type: any) => void;
	onContextHandler: (e: any, item: any, withElement: boolean) => void;
};

/**
 * Module-level row component. Kept out of WidgetObject's body so its component
 * identity stays stable across re-renders — otherwise every WidgetObject render
 * would remount all rows (and their IconObjects), forcing icon images to refetch.
 */
const WidgetObjectItem = (props: WidgetObjectItemProps) => {
	const { item, canDrag, canWrite, realId, isUnread, hasUnreadSection, isAllowedObject, onCreate, onContextHandler } = props;
	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id, disabled: item._isDisabled || !canDrag });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	const isChat = U.Object.isChatLayout(item.layout);
	const hasDiscussion = !isChat && !!item.discussionId;
	const counterTargetId = isChat ? item.id : (hasDiscussion ? item.discussionId : '');
	const showCounter = !!counterTargetId && (!hasUnreadSection || isUnread);
	const canAdd = canWrite && (realId == J.Constant.widgetId.type) && isAllowedObject(item);
	const spaceview = U.Space.getSpaceview();
	const itemCn = [ 'item' ];

	if (isChat && (U.Object.getChatNotificationMode(spaceview, item.id) == I.NotificationMode.Nothing)) {
		itemCn.push('isMuted');
	};

	let icon = null;
	if (item.iconParam) {
		icon = <Icon {...item.iconParam} />;
	} else {
		icon = (
			<IconObject
				object={item}
				canEdit={!item.isReadonly && U.Object.isTaskLayout(item.layout)}
				iconSize={20}
			/>
		);
	};

	return (
		<div
			id={`item-${item.id}`}
			className={itemCn.join(' ')}
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			style={style}
			onClick={e => U.Object.openEvent(e, item)}
			onAuxClick={e => U.Object.openEvent(e, item)}
			onContextMenu={e => onContextHandler(e, item, false)}
		>
			<div className="side left">
				{icon}
				<ObjectName object={item} withPlural={true} />
			</div>
			<div className="side right">
				{showCounter ? (
					<ChatCounter
						chatId={counterTargetId}
						mode={hasDiscussion ? U.Object.getDiscussionNotificationMode(spaceview, item.id) : undefined}
					/>
				) : ''}
				{canAdd ? (
					<div className="buttons">
						<Icon
							name="plus/menu"
							className="plus"
							tooltipParam={{ text: translate('commonCreateNewObject') }}
							onClick={e => onCreate(e, item)}
						/>
					</div>
				) : ''}
			</div>
		</div>
	);
};

const WidgetObject = forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent, onContext } = props;
	const { space, sidebarView } = S.Common;
	const isLinksView = sidebarView == I.SidebarView.Links;
	const [ , setDummy ] = useState(0);
	const forceUpdate = () => setDummy(v => v + 1);
	const nodeRef = useRef(null);
	const hasUnreadSection = S.Common.checkWidgetSection(I.WidgetSection.Unread);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const realId = parent.id.replace(`${space}-`, '');
	const isUnread = realId == J.Constant.widgetId.unread;
	const isBin = realId == J.Constant.widgetId.bin;
	const isRecent = realId == J.Constant.widgetId.recentEdit;
	const isPersonalWidgets = realId == J.Constant.widgetId.personalWidgets;
	const personalSubId = `${parent.id}-objects`;
	const canWrite = U.Space.canMyParticipantWrite();
	const home = U.Space.getDashboard();

	const getPersonalTargetIds = (): string[] => {
		const personalRootId = U.Object.getPersonalWidgetsId();
		return S.Block.getChildrenIds(personalRootId, personalRootId)
			.map(widgetId => {
				const wb = S.Block.getLeaf(personalRootId, widgetId);
				if (!wb?.isWidget()) {
					return null;
				};

				const innerIds = S.Block.getChildrenIds(personalRootId, wb.id);
				if (!innerIds.length) {
					return null;
				};

				const inner = S.Block.getLeaf(personalRootId, innerIds[0]);
				return inner?.getTargetObjectId() || null;
			})
			.filter(Boolean);
	};

	const getSubId = () => {
		let subId = '';

		switch (realId) {
			case J.Constant.widgetId.unread: {
				subId = U.Subscription.spaceSubId(J.Constant.subId.chat);
				break;
			};

			case J.Constant.widgetId.type: {
				subId = U.Subscription.spaceSubId(J.Constant.subId.type);
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				subId = U.Subscription.getRecentSubId();
				break;
			};

			case J.Constant.widgetId.personalWidgets: {
				subId = personalSubId;
				break;
			};
		};

		return subId;
	};

	const updateData = () => {
		if (!isPersonalWidgets) {
			return;
		};

		const ids = getPersonalTargetIds();
		if (!ids.length) {
			return;
		};

		U.Subscription.destroyList([ personalSubId ], false, () => {
			U.Subscription.subscribe({
				subId: personalSubId,
				filters: [ { relationKey: 'id', condition: I.FilterCondition.In, value: ids } ],
				keys: J.Relation.sidebar,
				noDeps: true,
			}, forceUpdate);
		});
	};

	useImperativeHandle(ref, () => ({ updateData }));

	useEffect(() => {
		updateData();

		return () => {
			U.Subscription.destroyList([ personalSubId ]);
		};
	}, []);

	const isAllowedObject = (type: any): boolean => {
		const skipLayouts = [ I.ObjectLayout.Participant ].concat(U.Object.getSystemLayouts());

		let ret = true;
		if (skipLayouts.includes(type.recommendedLayout)) {
			ret = false;
		};

		if (type.uniqueKey == J.Constant.typeKey.template) {
			ret = false;
		};

		return ret;
	};

	const subId = getSubId();
	const canDrag = [ 
		J.Constant.widgetId.type, 
		J.Constant.widgetId.pinned, 
		J.Constant.widgetId.personalWidgets,
	].includes(realId) && canWrite;
	const { total } = S.Record.getMeta(subId, '');

	const onSortStart = (e: any) => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (event) => {
		keyboard.disableSelection(false);

		const { active, over } = event;
		if (!over || (active.id == over.id)) {
			return;
		};

		const items = getItems();
		const oldIndex = items.findIndex(it => it.id == active.id);
		const newIndex = items.findIndex(it => it.id == over.id);

		if ((oldIndex < 0) || (newIndex < 0)) {
			return;
		};

		const newItems = arrayMove(items, oldIndex, newIndex);

		if (realId == J.Constant.widgetId.type) {
			U.Data.sortByOrderIdRequest(getSubId(), newItems, callBack => {
				C.ObjectTypeSetOrder(space, newItems.map(it => it.id), callBack);
			});
		} else
		if ([ J.Constant.widgetId.pinned, J.Constant.widgetId.personalWidgets ].includes(realId)) {
			const rootId = realId == J.Constant.widgetId.pinned ? S.Block.widgets : U.Object.getPersonalWidgetsId();
			const activeBlocks = S.Block.getWidgetsForTargetIn(active.id, rootId);
			const overBlocks = S.Block.getWidgetsForTargetIn(over.id, rootId);

			if (!activeBlocks.length || !overBlocks.length) {
				return;
			};

			const position = newIndex > oldIndex ? I.BlockPosition.Bottom : I.BlockPosition.Top;

			C.BlockListMoveToExistingObject(rootId, rootId, overBlocks[0].id, [ activeBlocks[0].id ], position);
		};
	};

	const getItems = () => {
		let items = [];

		switch (realId) {
			case J.Constant.widgetId.unread: {
				items = U.Data.getWidgetChats();
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				items = S.Record.getRecords(subId);
				break;
			};

			case J.Constant.widgetId.type: {
				items = U.Data.getWidgetTypes();
				break;
			};

			case J.Constant.widgetId.pinned: {
				items = U.Data.getWidgetObjects(S.Block.widgets, isLinksView);
				break;
			};

			case J.Constant.widgetId.personalWidgets: {
				const personalRootId = U.Object.getPersonalWidgetsId();
				const subscribedMap = new Map(S.Record.getRecords(personalSubId).map(it => [ it.id, it ]));

				getPersonalTargetIds().forEach(targetId => {
					const object = subscribedMap.get(targetId) || S.Detail.get(personalRootId, targetId);
					if (!object || object._empty_ || object.isArchived || object.isDeleted) {
						return;
					};
					items.push(object);
				});
				break;
			};

			case J.Constant.widgetId.bin: {
				items = [
					{ 
						id: J.Constant.widgetId.bin, 
						icon: 'widget-bin', 
						iconParam: { name: 'common/bin' }, 
						name: translate('commonBin'), 
						layout: I.ObjectLayout.Archive,
					},
				];
				break;
			};

		};

		const seen = new Set<string>();
		return items.filter(it => {
			if (!it?.id || seen.has(it.id)) {
				return false;
			};
			seen.add(it.id);
			return true;
		});
	};

	const onCreate = (e: any, type: any) => {
		e.preventDefault();
		e.stopPropagation();

		const route = analytics.route.widget;
		const element = `#widget-${U.Common.esc(parent.id)} #item-${U.Common.esc(type.id)}`;
		const cb = (object: any) => {
			U.Object.openConfig(e, object);
		};

		const details: any = {};
		const flags: I.ObjectFlag[] = [I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectTemplate];

		if (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout)) {
			const menuParam = {
				element: `${element} .icon.plus`,
				onOpen: () => U.Dom.addClass(U.Dom.select(element), 'active'),
				onClose: () => U.Dom.removeClass(U.Dom.select(element), 'active'),
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

		if (U.Object.getFileLayouts().includes(type.recommendedLayout)) {
			U.Menu.onFileUploadPopup(type.recommendedLayout, '', details, (objectIds) => {
				if (objectIds?.length) {
					const object = S.Detail.get(S.Common.space, objectIds[0]);
					if (object) {
						cb(object);
					};
				};
			}, analytics.route.uploadTypeWidget);
			return;
		};

		C.ObjectCreate(details, flags, type.defaultTemplateId, type.uniqueKey, S.Common.space, (message: any) => {
			if (!message.error.code) {
				cb(message.details);
			};
		});
	};

	const onContextHandler = (e: any, item: any, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const element = U.Dom.select(`#item-${U.Common.esc(item.id)}`, nodeRef.current);
		const more = element ? U.Dom.select('.buttons', element) : null;
		const data: any = {};

		if (isRecent) {
			data.allowedType = true;
		};

		if (isBin) {
			U.Menu.widgetSectionContext(I.WidgetSection.Bin, {
				element,
				horizontal: I.MenuDirection.Center,
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				onOpen: () => U.Dom.addClass(element, 'active'),
				onClose: () => U.Dom.removeClass(element, 'active'),
			});
		} else {
			onContext({ node: element, element: more, withElement, subId, objectId: item.id, data });
		};
	};

	const items = getItems();

	return (
		<>
			{items.length ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
					onDragStart={onSortStart}
					onDragEnd={onSortEnd}
				>
					<SortableContext
						items={items.map(it => it.id)}
						strategy={verticalListSortingStrategy}
					>
						<div ref={nodeRef} className="items">
							{items.map(item => (
								<WidgetObjectItem
									key={item.id}
									item={item}
									canDrag={canDrag}
									canWrite={canWrite}
									realId={realId}
									isUnread={isUnread}
									hasUnreadSection={hasUnreadSection}
									isAllowedObject={isAllowedObject}
									onCreate={onCreate}
									onContextHandler={onContextHandler}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			) : (
				<div className="empty">
					{translate('commonNothingHere')}
				</div>
			)}
		</>
	);

});

export default WidgetObject;