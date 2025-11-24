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
	const nodeRef = useRef(null);
	const hasUnreadSection = S.Common.checkWidgetSection(I.WidgetSection.Unread);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const realId = parent.id.replace(`${space}-`, '');
	const isUnread = realId == J.Constant.widgetId.unread;

	const getId = (id: string) => {
		return [ space, id ].join('-');
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
				subId = J.Constant.subId.recentEdit;
				break;
			};
		};

		return subId;
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
		};

		return items;
	};

	const onContextHandler = (e: any, item: any, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = node.find(`#item-${item.id}`);
		const more = element.find('.icon.more');

		onContext({ node: element, element: more, withElement, subId, objectId: item.id });
	};

	const Item = (item: any) => {
		const isChat = U.Object.isChatLayout(item.layout);
		const { attributes, listeners, transform, transition, setNodeRef} = useSortable({ id: item.id, disabled: !canDrag });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

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
						<Icon
							className="more"
							tooltipParam={{ text: translate('widgetOptions') }}
							onClick={e => onContextHandler(e, item, true)}
						/>
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