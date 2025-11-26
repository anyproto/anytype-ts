import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { I, U, S, keyboard, translate } from 'Lib';
import { Icon, Switch } from 'Component';

const HEIGHT = 28;

const MenuWidgetSection = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setActive, onKeyDown, position } = props;
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

		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
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

		const oldIndex = widgetSections.findIndex(it => it.id == active.id);
		const newIndex = widgetSections.findIndex(it => it.id == over.id);

		if (oldIndex != newIndex) {
			S.Common.widgetSectionsSet(arrayMove(widgetSections, oldIndex, newIndex));
		};
	};

	const onSwitch = (item: any) => {
		const id = Number(item.id);
		const section = U.Common.objectCopy(widgetSections).find(it => it.id == id);

		if (!section) {
			return;
		};

		section.isHidden = !section.isHidden;
		S.Common.widgetSectionsSet([ ...widgetSections ]);
	};

	const getItems = (): any[] => {
		const sections = U.Menu.widgetSections().filter(it => it.id != I.WidgetSection.Unread).map(it => {
			const param = widgetSections.find(p => p.id == it.id) || {};
			return { ...it, ...param };
		});

		return [
			{ id: '', name: translate('widgetManageSections'), isSection: true },
		].concat(U.Menu.prepareForSelect(sections));
	};

	const resize = () => {
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT, Math.min(360, items.length * HEIGHT + 16));

		obj.css({ height });
		position();
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
					{!readonly ? <Icon className="dnd" /> : ''}
					<span className="clickable">
						<div className="name">{item.name}</div>
					</span>
					<Icon 
						className={[ 'eye', (!item.isHidden ? 'on' : 'off') ].join(' ')} 
						onClick={e => onSwitch(item)} 
					/>
				</div>
			);
		};

		return content;
	};
	
	useEffect(() => {
		rebind();
		resize();

		return () => {
			unbind();
		};

	}, []);
	
	useEffect(() => {
		resize();
		rebind();
		setActive(null, true);
		position();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
	}), []);
	
	return (
		<div 
			ref={nodeRef}
			className="wrap"
		>
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
	);

}));

export default MenuWidgetSection;