import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Button, Label } from 'Component';
import * as I from 'Interface';

const HEIGHT = 52;

const MenuWidgetSection = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setActive, onKeyDown, position, close } = props;
	const { data } = param;
	const { readonly } = data;
	const { widgetSections } = S.Common;
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const rebind = () => {
		unbind();

		U.Dom.addEvent(window, 'keydown', onKeyDownHandler);
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDownHandler);
	};

	const onKeyDownHandler = (e: any) => {
		const items = getItems();
		const item = items[n.current];

		let ret = false;

		keyboard.shortcut('space', e, () => {
			e.preventDefault();

			if (item) {
				onSwitch(item);
			};
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled && !item.isSection && !item.isDiv) {
			setActive(item, false);
		};
	};
	
	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		keyboard.disableSelection(false);

		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		if (I.FIXED_WIDGET_SECTIONS.includes(Number(active.id)) || I.FIXED_WIDGET_SECTIONS.includes(Number(over.id))) {
			return;
		};

		const oldIndex = widgetSections.findIndex(it => it.id == active.id);
		const newIndex = widgetSections.findIndex(it => it.id == over.id);

		if (oldIndex != newIndex) {
			S.Common.widgetSectionsSet(arrayMove(widgetSections, oldIndex, newIndex));
			analytics.event('ReorderSection', { type: active.id });
		};
	};

	const onSwitch = (item: any) => {
		const id = Number(item.id);
		const idx = widgetSections.findIndex(it => it.id == id);

		if (idx < 0) {
			return;
		};

		const isHidden = widgetSections[idx].isHidden;

		widgetSections[idx].isHidden = !isHidden;
		S.Common.widgetSectionsSet([ ...widgetSections ]);

		analytics.event(isHidden ? 'ShowSection' : 'HideSection', { type: item.id });
	};

	const getItems = (): any[] => {
		const sections = U.Menu.widgetSections().filter(it => !I.FIXED_WIDGET_SECTIONS.includes(it.id)).map(it => {
			const param = widgetSections.find(p => p.id == it.id) || {};
			return { ...it, ...param };
		});

		return U.Menu.prepareForSelect(sections);
	};

	const beforePosition = () => {
		const obj = U.Dom.select('.itemsWrapper', U.Dom.get(getId()));
		const height = Math.max(HEIGHT, Math.min(360, items.length * HEIGHT - 8));

		U.Dom.css(obj, { height: `${height}px` });
	};

	const items = getItems();

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: readonly });
		const cn = [ 'item' ];
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		if (readonly) {
			cn.push('isReadonly');
		};
		if (isDragging) {
			cn.push('isDragging');
		};
		if (item.isHidden) {
			cn.push('isHidden');
		};

		let content = null;

		if (item.isSection) {
			content = (
				<div className="sectionName" style={style}>
					{item.name}
				</div>
			);
		} else {
			content = (
				<div 
					id={`item-${item.id}`} 
					className={cn.join(' ')} 
					onMouseEnter={e => onMouseEnter(e, item)}
					ref={setNodeRef}
					{...attributes}
					{...listeners}
					style={style}
				>
					{!readonly ? <Icon name="common/dnd" /> : ''}
					<span className="clickable">
						<div className="name">{item.name}</div>
					</span>
					<Icon
						name={item.isHidden ? 'common/eye1' : 'common/eye0'}
						className="eye"
						onClick={e => onSwitch(item)}
					/>
				</div>
			);
		};

		return content;
	};
	
	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};

	}, []);
	
	useEffect(() => {
		setActive(null, true);
		position();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		beforePosition,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onSortEnd,
	}), []);
	
	return (
		<div 
			ref={nodeRef}
			className="wrap"
		>
			<Label className="menuLabel" text={translate('widgetManageSections')} />

			<div className="itemsWrapper">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={onSortStart}
					onDragEnd={onSortEnd}
					modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
				>
					<SortableContext
						items={items.map((item) => item.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="items">
							{items.map(item => (
								<Item key={item.id} {...item} />
							))}
						</div>
					</SortableContext>
				</DndContext>
			</div>

			<Button onClick={() => close()} color="accent" size={40} text={translate('commonDone')} />
		</div>
	);

});

export default MenuWidgetSection;
