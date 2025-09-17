import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Tag, Filter } from 'Component';
import { I, C, S, U, J, keyboard, Relation, translate } from 'Lib';

const HEIGHT = 28;
const LIMIT = 40;

const MenuOptionList = observer(forwardRef<{}, I.Menu>((props, ref) => {

	const { id, param, close, position, setActive, getId, onKeyDown, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { filter, canAdd, canEdit, noFilter, cellRef, noSelect, onChange, maxCount, filterMapper, maxHeight } = data;
	const relation = data.relation.get();
	const value = Relation.getArrayValue(data.value);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const [ dummy, setDummy ] = useState(0);
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const n = useRef(-1);
	const filterValueRef = useRef('');
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHander(e));
		$(`#${getId()}`).on('click', () => S.Menu.close('dataviewOptionEdit'));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
		$(`#${getId()}`).off('click');
	};

	const onKeyDownHander = (e: any) => {
		// Chinese IME is open
		if (keyboard.isComposition) {
			return;
		};

		const items = getItems();
		
		let ret = false;

		keyboard.shortcut('arrowright', e, () => {
			onEdit(e, items[n.current]);
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onFilterChange = (v: string) => {
		data.filter = v;
		setDummy(dummy + 1);
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		if (!canEdit) {
			return;
		};

		const value = Relation.getArrayValue(data.value);

		if (cellRef) {
			cellRef.clear();
		};

		if (item.id == 'add') {
			onOptionAdd();
		} else if (!noSelect) {
			if (value.includes(item.id)) {
				onValueRemove(item.id);
			} else {
				onValueAdd(item.id);
			};
		};

		filterValueRef.current = '';
		onFilterChange('');
	};

	const onValueAdd = (id: string) => {
		let value = Relation.getArrayValue(data.value);

		value.push(id);
		value = U.Common.arrayUnique(value);

		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);

			if (maxCount == 1) {
				close();
			};
		};

		S.Menu.updateData(props.id, { value });
		
		if (onChange) {
			onChange(value);
		};
	};

	const onValueRemove = (id: string) => {
		const value = Relation.getArrayValue(data.value);
		const idx = value.indexOf(id);

		value.splice(idx, 1);
		S.Menu.updateData(props.id, { value });
		
		if (onChange) {
			onChange(value);
		};
	};

	const onOptionAdd = () => {
		const colors = U.Menu.getBgColors();
		const option = { 
			name: String(data.filter || '').trim(),
			color: colors[U.Common.rand(1, colors.length - 1)].value,
		};

		if (!option.name) {
			return;
		};

		const items = getItems();
		const match = items.find(it => it.name == option.name);

		if (match) {
			onValueAdd(match.id);
			return;
		};

		C.ObjectCreateRelationOption({
			relationKey: relation.relationKey,
			name: option.name,
			relationOptionColor: option.color,
		}, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			filterRef.current?.setValue('');
			onFilterChange('');
			onValueAdd(message.objectId);

			window.setTimeout(() => resize(), 50);
		});
	};

	const onEdit = (e: any, item: any) => {
		e.stopPropagation();

		if (!item || (item.id == 'add')) {
			return;
		};

		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && canEdit;

		if (!isAllowed) {
			return;
		};

		S.Menu.open('dataviewOptionEdit', { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			className,
			classNameWrap,
			rebind,
			parentId: id,
			data: {
				...data,
				option: item,
			}
		});
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;

		if (!active || !over) {
			return;
		};

		const items = getItems();
		const oldIndex = items.findIndex(it => it.id == active.id);
		const newIndex = items.findIndex(it => it.id == over.id);
		const newItems = arrayMove(items, oldIndex, newIndex);

		U.Data.sortByOrderIdRequest(J.Constant.subId.option, newItems, callBack => {
			C.RelationOptionSetOrder(S.Common.space, relation.relationKey, newItems.map(it => it.id), callBack);
		});

		keyboard.disableSelection(false);
	};

	const getItems = (): any[] => {
		const isSelect = relation.format == I.RelationType.Select;
		const skipIds = Relation.getArrayValue(data.skipIds);
		const ret = [];

		let items = S.Record.getRecords(J.Constant.subId.option, U.Subscription.optionRelationKeys(true)).filter(it => it.relationKey == relation.relationKey);
		let check = [];

		items = items.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted && !skipIds.includes(it.id));

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		items.sort((c1, c2) => U.Data.sortByOrderId(c1, c2) || U.Data.sortByNumericKey('createdDate', c1, c2, I.SortType.Desc));

		if (data.filter) {
			const filter = new RegExp(U.Common.regexEscape(data.filter), 'gi');
			
			check = items.filter(it => it.name.toLowerCase() == data.filter.toLowerCase());
			items = items.filter(it => it.name.match(filter));

			if (canEdit && canAdd && !check.length) {
				ret.unshift({ 
					id: 'add', 
					name: U.Common.sprintf(isSelect && !noSelect ? translate('menuDataviewOptionListSetStatus') : translate('menuDataviewOptionListCreateOption'), data.filter),
				});
			};
		};

		return items.concat(ret);
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16 + (noFilter ? 0 : 38);
		const height = Math.max(HEIGHT + offset, Math.min(maxHeight || 360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	const items = getItems();

	let placeholder = '';
	let empty = '';

	if (canAdd) {
		placeholder = translate('menuDataviewOptionListFilterOrCreateOptions');
		empty = translate('menuDataviewOptionListTypeToCreate');
	} else {
		placeholder = translate('menuDataviewOptionListFilterOptions');
		empty = translate('menuDataviewOptionListTypeToSearch');
	};

	if (!canEdit) {
		empty = translate('placeholderCellCommon');
	};

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
		const active = value.includes(item.id);
		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && canEdit;
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};

		let content = null;
		if (item.id == 'add') {
			content = (
				<div 
					id="item-add" 
					className="item add" 
					style={item.style}
					onClick={e => onClick(e, item)} 
					onMouseEnter={e => onOver(e, item)}
				>
					<Icon className="plus" />
					<div className="name">{item.name}</div>
				</div>
			);
		} else 
		if (item.isSection) {
			content = <div className="sectionName" style={item.style}>{item.name}</div>;
		} else {
			const cn = [ 'item' ];
			if (active) {
				cn.push('withCheckbox');
			};
			if (isDragging) {
				cn.push('isDragging');
			};

			content = (
				<div 
					id={`item-${item.id}`} 
					className={cn.join(' ')} 
					onMouseEnter={e => onOver(e, item)}
					ref={setNodeRef}
					{...attributes}
					{...listeners}
					style={style}
				>
					{canEdit ? <Icon className="dnd" /> : ''}
					<div className="clickable" onClick={e => onClick(e, item)}>
						<Tag text={item.name} color={item.color} className={Relation.selectClassName(relation.format)} />
					</div>
					<div className="buttons">
						{active ? <Icon className="chk" /> : ''}
						{isAllowed ? <Icon className="more" onClick={e => onEdit(e, item)} /> : ''}
					</div>
				</div>
			);
		};

		return content;
	};

	const rowRenderer = ({ key, parent, index, style }) => {
		const item: any = items[index];
		
		return (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={index}
			>
				<Item {...item} style={style} />
			</CellMeasurer>
		);
	};

	useEffect(() => {
		rebind();
		resize();
		setActive();
		position();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		if (filterValueRef.current != filter) {
			n.current = 0;
		};

		setActive();
		position();
		resize();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<div className={[ 'wrap', (noFilter ? 'noFilter' : '') ].join(' ')}>
			{!noFilter ? (
				<Filter
					className="outlined"
					icon="search"
					ref={filterRef} 
					placeholderFocus={placeholder} 
					value={filter}
					onChange={onFilterChange} 
					focusOnMount={true}
				/>
			) : ''}

			<div className="items">
				{items.length ? (
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
												deferredMeasurementCache={cache.current}
												rowCount={items.length}
												rowHeight={HEIGHT}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</SortableContext>
					</DndContext>
				) : (
					<div className="item empty">{empty}</div>
				)}
			</div>
		</div>
	);

}));

export default MenuOptionList;