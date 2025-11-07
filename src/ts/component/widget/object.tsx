import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, ChatCounter, Icon } from 'Component';
import { I, J, U, S, C, translate, keyboard } from 'Lib';

const WidgetObject = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent, onContext } = props;
	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const nodeRef = useRef(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
	const canDrag = parent.id == J.Constant.widgetId.type;

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

		let newIndex = items.findIndex(it => it.id == over.id);
		if ((oldIndex < 0) || (newIndex < 0)) {
			return;
		};

		if (oldIndex < newIndex) {
			newIndex--;
		};

		const newItems = arrayMove(items, oldIndex, newIndex);

		U.Data.sortByOrderIdRequest(getSubId(), newItems, callBack => {
			C.ObjectTypeSetOrder(space, newItems.map(it => it.id), callBack);
		});
	};

	const getSubId = () => {
		let subId = '';
		switch (parent.id) {
			case J.Constant.widgetId.unread: {
				subId = J.Constant.subId.chat;
				break;
			};

			case J.Constant.widgetId.type: {
				subId = J.Constant.subId.type;
				break;
			};
		};

		return subId;
	};

	const getItems = () => {
		let items = [];

		switch (parent.id) {
			case J.Constant.widgetId.unread: {
				items = S.Record.getRecords(J.Constant.subId.chat).filter(it => {
					const counters = S.Chat.getChatCounters(space, it.id);
					return (counters.messageCounter > 0) || (counters.mentionCounter > 0);
				});
				break;
			};

			case J.Constant.widgetId.type: {
				items = S.Record.checkHiddenObjects(S.Record.getTypes()).filter(it => {
					return (
						!U.Object.isInSystemLayouts(it.recommendedLayout) && 
						!U.Object.isDateLayout(it.recommendedLayout) && 
						(it.uniqueKey != J.Constant.typeKey.template) &&
						(S.Record.getRecordIds(U.Subscription.typeCheckSubId(it.uniqueKey), '').length > 0)
					);
				});

				items.push({ id: J.Constant.widgetId.bin, icon: 'widget-bin', name: translate('commonBin'), layout: I.ObjectLayout.Archive });
				break;
			};
		};

		return items;
	};

	const onContextHandler = (e: any, item: any, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = node.find(`#item-${item.id}`);
		const more = element.find('.icon.more');

		onContext({ node: element, element: more, withElement, subId: getSubId(), objectId: item.id });
	};

	const Item = (item: any) => {
		const isChat = U.Object.isChatLayout(item.recommendedLayout || item.layout);
		const isBin = item.id == J.Constant.widgetId.bin;
		const { attributes, listeners, transform, transition, setNodeRef} = useSortable({ id: item.id, disabled: !canDrag || isBin });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		let icon = null;
		if (item.icon) {
			icon = <Icon className={item.icon} />;
		} else {
			icon = <IconObject object={item} />;
		};

		return (
			<div 
				id={`item-${item.id}`}
				className="item"
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
				onContextMenu={e => onContextHandler(e, item, false)}
			>
				<div className="side left" onClick={e => U.Object.openEvent(e, item)}>
					{icon}	
					<ObjectName object={item} />
				</div>
				<div className="side right">
					{isChat ? <ChatCounter chatId={item.id} /> : ''}
					<div className="buttons">
						{!isBin ? (
							<Icon 
								className="more" 
								tooltipParam={{ text: translate('widgetOptions') }} 
								onClick={e => onContextHandler(e, item, true)} 
							/>
						) : ''}
					</div>
				</div>
			</div>
		);
	};

	const items = getItems();

	return (
		<DndContext 
			sensors={sensors} 
			collisionDetection={closestCenter} 
			modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]} 
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
	);

}));

export default WidgetObject;