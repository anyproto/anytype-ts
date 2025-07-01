import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, IconObject, ObjectName, EmptySearch } from 'Component';
import { I, S, U, keyboard, Relation, translate } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 28;
const HEIGHT_EMPTY = 96;
const HEIGHT_DIV = 16;

const MenuObjectValues = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, getId, getSize, onKeyDown, setActive, position } = props;
	const { data, className, classNameWrap } = param;
	const { subId, valueMapper, nameAdd, canEdit, onChange } = data;
	const listRef = useRef(null);
	const topRef = useRef(0);
	const n = useRef(-1);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const rebind = () => {
		unbind();

		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		let value: any[] = Relation.getArrayValue(data.value);
		value = value.map(it => S.Detail.get(subId, it, []));
		
		if (valueMapper) {
			value = value.map(valueMapper);
		};

		value = value.filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);
		value = S.Record.checkHiddenObjects(value);

		if (!value.length) {
			value.push({ isEmpty: true });
		};

		if (canEdit) {
			value = value.concat([
				{ isDiv: true },
				{ id: 'add', name: (nameAdd || translate('menuDataviewObjectValuesAddObject')) },
			]);
		};

		return value;
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'add') {
			onAdd();
		} else {
			U.Object.openEvent(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onAdd = () => {
		const { width } = getSize();

		S.Menu.open('dataviewObjectList', {
			element: `#${getId()}`,
			vertical: I.MenuDirection.Center,
			offsetX: width,
			width,
			passThrough: true,
			noAnimation: true,
			className,
			classNameWrap,
			rebind: rebind,
			parentId: id,
			data: {
				...data,
				canAdd: true,
			},
		});
	};

	const onRemove = (e: any, item: any) => {
		const relation = data.relation.get();
		
		let value = Relation.getArrayValue(data.value);
		value = value.filter(it => it != item.id);
		
		if (relation) {
			value = Relation.formatValue(relation, value, true);
		};

		n.current = -1;

		onChange(value, () => {
			S.Menu.updateData(id, { value });
			S.Menu.updateData('dataviewObjectList', { value });
		});
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};
	
	const onSortEnd = (result: any) => {
		keyboard.disableSelection(false);

		const relation = data.relation.get();
		if (!relation) {
			return;
		};

		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		let value = Relation.getArrayValue(data.value);

		const oldIndex = value.indexOf(active.id);
		const newIndex = value.indexOf(over.id);

		value = arrayMove(value, oldIndex, newIndex);
		value = Relation.formatValue(relation, value, true);

		onChange(value, () => S.Menu.updateData(id, { value }));
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const getRowHeight = (item: any) => {
		let h = HEIGHT_ITEM;
		if (item.isEmpty) h = HEIGHT_EMPTY;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const height = items.reduce((res: number, current: any) => res + getRowHeight(current), offset);

		listRef.current?.recomputeRowHeights(0);

		obj.css({ height });
		position();
	};

	const items = getItems();

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !canEdit });
		const cn = [ 'item', 'withCaption' ];
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};

		if (item.isHidden) {
			cn.push('isHidden');
		};

		return (
			<div 
				id={'item-' + item.id} 
				className={cn.join(' ')} 
				onMouseEnter={e => onOver(e, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{canEdit ? <Icon className="dnd" /> : ''}
				<span className="clickable" onClick={e => onClick(e, item)}>
					<IconObject object={item} />
					<ObjectName object={item} />
				</span>
				{canEdit ? <Icon className="delete" onClick={e => onRemove(e, item)} /> : ''}
			</div>
		);
	};

	const ItemAdd = (item: any) => (
		<div 
			id="item-add" 
			className="item add" 
			onMouseEnter={e => onOver(e, item)} 
			onClick={e => onClick(e, item)}
			style={item.style}
		>
			<Icon className="plus" />
			<div className="name">{item.name}</div>
		</div>
	);

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		let content = null;
		if (item.isDiv) {
			content = (
				<div className="separator" style={param.style}>
					<div className="inner" />
				</div>
			);
		} else
		if (item.isEmpty) {
			content = <EmptySearch key={item.id} style={param.style} text={translate('menuDataviewObjectValuesEmptySearch')} />;
		} else
		if (item.id == 'add') {
			content = <ItemAdd key={item.id} {...item} index={param.index} disabled={true} style={param.style} />;
		} else {
			content = <Item key={item.id} {...item} index={param.index} style={param.style} />;
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				{content}
			</CellMeasurer>
		);
	};

	useEffect(() => {
		const items = getItems();

		rebind();
		resize();

		cache.current = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		resize();

		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};

		setActive(null, true);
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => items,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
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
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={() => {}}
					isRowLoaded={() => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={listRef}
									width={width}
									height={height}
									deferredMeasurmentCache={cache.current}
									rowCount={items.length}
									rowHeight={({ index }) => getRowHeight(items[index])}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={LIMIT}
									onScroll={onScroll}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</SortableContext>
		</DndContext>
	);

}));

export default MenuObjectValues;