import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, ChatCounter, Icon } from 'Component';
import { I, J, U, S, C, translate, keyboard, analytics } from 'Lib';

const WidgetObject = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent, onContext } = props;
	const { space } = S.Common;
	const nodeRef = useRef(null);
	const hasUnreadSection = S.Common.checkWidgetSection(I.WidgetSection.Unread);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const realId = parent.id.replace(`${space}-`, '');
	const isUnread = realId == J.Constant.widgetId.unread;
	const isBin = realId == J.Constant.widgetId.bin;
	const canWrite = U.Space.canMyParticipantWrite();

	const getId = (id: string) => {
		return [space, id].join('-');
	};

	const getSubId = () => {
		let subId = '';

		switch (realId) {
			case J.Constant.widgetId.unread: {
				subId = J.Constant.subId.chat;
				break;
			};

			case J.Constant.widgetId.type: {
				subId = J.Constant.subId.type;
				break;
			};

			case J.Constant.widgetId.recentEdit: {
				subId = U.Subscription.getRecentSubId();
				break;
			};
		};

		return subId;
	};

	const isAllowedObject = (type: any): boolean => {
		const skipLayouts = [I.ObjectLayout.Participant].concat(U.Object.getFileAndSystemLayouts());

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
	const canDrag = parent.id == getId(J.Constant.widgetId.type);
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

		U.Data.sortByOrderIdRequest(getSubId(), newItems, callBack => {
			C.ObjectTypeSetOrder(space, newItems.map(it => it.id), callBack);
		});
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

			case J.Constant.widgetId.bin: {
				items = [
					{ id: J.Constant.widgetId.bin, icon: 'widget-bin', name: translate('commonBin'), layout: I.ObjectLayout.Archive },
				];
				break;
			};
		};

		return items;
	};

	const onCreate = (e: any, type: any) => {
		e.preventDefault();
		e.stopPropagation();

		const route = analytics.route.widget;
		const element = `#widget-${$.escapeSelector(parent.id)} #item-${$.escapeSelector(type.id)}`;
		const cb = (object: any) => {
			U.Object.openConfig(e, object);
		};

		const details: any = {};
		const flags: I.ObjectFlag[] = [I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectTemplate];

		if (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout)) {
			const menuParam = {
				element: `${element} .icon.plus`,
				onOpen: () => $(element).addClass('active'),
				onClose: () => $(element).removeClass('active'),
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

		C.ObjectCreate(details, flags, type.defaultTemplateId, type.uniqueKey, S.Common.space, (message: any) => {
			if (!message.error.code) {
				cb(message.details);
			};
		});
	};

	const onContextHandler = (e: any, item: any, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = node.find(`#item-${$.escapeSelector(item.id)}`);
		const more = element.find('.buttons');

		if (isBin) {
			U.Menu.widgetSectionContext(I.WidgetSection.Bin, {
				element: more,
				horizontal: I.MenuDirection.Center,
				className: 'fixed',
				classNameWrap: 'fromSidebar',
				onOpen: () => $(element).addClass('active'),
				onClose: () => $(element).removeClass('active'),
			});
		} else {
			onContext({ node: element, element: more, withElement, subId, objectId: item.id });
		};
	};

	const Item = (item: any) => {
		const isChat = U.Object.isChatLayout(item.layout);
		const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: item.id, disabled: !canDrag });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};
		const canAdd = canWrite && (realId == J.Constant.widgetId.type) && isAllowedObject(item);

		let icon = null;
		if (item.icon) {
			icon = <Icon className={item.icon} />;
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
				className="item"
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
				onClick={e => U.Object.openEvent(e, item)}
				onContextMenu={e => onContextHandler(e, item, false)}
			>
				<div className="side left">
					{icon}
					<ObjectName object={item} withPlural={true} />
				</div>
				<div className="side right">
					{isChat && (!hasUnreadSection || isUnread) ? <ChatCounter chatId={item.id} /> : ''}
					<div className="buttons">
						{canAdd ? (
							<Icon
								className="plus"
								tooltipParam={{ text: translate('commonCreateNewObject') }}
								onClick={e => onCreate(e, item)}
							/>
						) : ''}
					</div>
				</div>
			</div>
		);
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
							{items.map(item => <Item key={item.id} {...item} />)}
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

}));

export default WidgetObject;