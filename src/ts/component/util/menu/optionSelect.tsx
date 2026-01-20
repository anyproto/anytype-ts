import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Tag, Filter } from 'Component';
import { I, C, S, U, keyboard, Relation, translate, Preview } from 'Lib';

const OPTION_HEIGHT = 28;

interface Props {
	subId: string;
	relationKey: string;
	value: string[];
	onChange: (value: string[]) => void;

	// Display options
	readonly?: boolean;
	noFilter?: boolean;
	noSelect?: boolean;
	maxHeight?: number;

	// Selection behavior
	maxCount?: number;
	skipIds?: string[];
	filterMapper?: (item: any) => boolean;

	// Creation
	canAdd?: boolean;

	// Drag and drop
	canSort?: boolean;

	// Editing
	canEdit?: boolean;

	// Callbacks
	setActive?: (item: any, scroll?: boolean) => void;
	onClose?: () => void;

	// Menu context (for edit menu)
	menuId?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	getMenuSize?: () => { width: number; height: number };
};

export interface OptionSelectRefProps {
	getItems: () => any[];
	getIndex: () => number;
	setIndex: (i: number) => void;
	getFilterRef: () => any;
	getListRef: () => any;
	onOver: (e: any, item: any) => void;
	onClick: (e: any, item: any) => void;
	onSortEnd?: (result: any) => void;
};

const OptionSelect = observer(forwardRef<OptionSelectRefProps, Props>((props, ref) => {

	const {
		subId, relationKey, value, onChange, readonly, noFilter, noSelect, maxHeight, maxCount, skipIds, filterMapper, canAdd,
		canSort, canEdit, setActive, onClose, menuId, menuClassName, menuClassNameWrap, getMenuSize,
	} = props;

	const relation = S.Record.getRelationByKey(relationKey);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: OPTION_HEIGHT }));
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const [ filter, setFilter ] = useState('');
	const [ activeId, setActiveId ] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	useEffect(() => {
		loadOptions();

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	useEffect(() => {
		loadOptions();
	}, [ relationKey ]);

	useEffect(() => {
		n.current = -1;
	}, [ filter ]);

	const loadOptions = () => {
		if (!relationKey) {
			return;
		};

		U.Subscription.destroyList([ subId ], false, () => {
			U.Subscription.subscribe({
				subId,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Option },
					{ relationKey: 'relationKey', condition: I.FilterCondition.Equal, value: relationKey },
				],
				sorts: [
					{ relationKey: 'orderId', type: I.SortType.Asc },
					{ relationKey: 'createdDate', type: I.SortType.Desc, format: I.RelationType.Date, includeTime: true },
				] as I.Sort[],
				keys: U.Subscription.optionRelationKeys(false),
			});
		});
	};

	const getItems = (): any[] => {
		const isSelect = relation?.format == I.RelationType.Select;
		const skip = Relation.getArrayValue(skipIds);
		const ret: any[] = [];

		let items = S.Record.getRecords(subId, U.Subscription.optionRelationKeys(true));
		let check: any[] = [];

		items = items.filter(it => !it._empty_ && !skip.includes(it.id));

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		items.sort((c1, c2) => U.Data.sortByOrderId(c1, c2) || U.Data.sortByNumericKey('createdDate', c1, c2, I.SortType.Desc));

		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');

			check = items.filter(it => it.name.toLowerCase() == filter.toLowerCase());
			items = items.filter(it => it.name.match(reg));

			if (canAdd && !readonly && !check.length) {
				ret.unshift({
					id: 'add',
					name: U.String.sprintf(isSelect && !noSelect ? translate('menuDataviewOptionListSetStatus') : translate('menuDataviewOptionListCreateOption'), filter),
				});
			};
		};

		return items.concat(ret);
	};

	const onFilterChange = (v: string) => {
		setFilter(v);
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		if (readonly) {
			return;
		};

		if (item.id == 'add') {
			onOptionAdd();
			return;
		};

		if (noSelect) {
			return;
		};

		let newValue = [ ...value ];

		if (newValue.includes(item.id)) {
			newValue = newValue.filter(id => id !== item.id);
		} else {
			newValue = [ ...newValue, item.id ];
		};

		if (maxCount) {
			newValue = newValue.slice(newValue.length - maxCount, newValue.length);

			if (maxCount == 1) {
				onClose?.();
			};
		};

		onChange(U.Common.arrayUnique(newValue));

		// Clear filter after selection
		filterRef.current?.setValue('');
		setFilter('');
	};

	const onOptionAdd = () => {
		if (!relation) {
			return;
		};

		const colors = U.Menu.getBgColors();
		const option = {
			name: String(filter || '').trim(),
			color: colors[U.Common.rand(1, colors.length - 1)].value,
		};

		if (!option.name) {
			return;
		};

		const items = getItems();
		const match = items.find(it => it.name == option.name);

		if (match) {
			onClick({ stopPropagation: () => {} }, match);
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
			setFilter('');

			// Add newly created option to value
			let newValue = [ ...value, message.objectId ];
			newValue = U.Common.arrayUnique(newValue);

			if (maxCount) {
				newValue = newValue.slice(newValue.length - maxCount, newValue.length);

				if (maxCount == 1) {
					onClose?.();
				};
			};

			onChange(newValue);
		});
	};

	const onEdit = (e: any, item: any) => {
		e.stopPropagation();

		if (!item || item.id == 'add' || !canEdit || !menuId) {
			return;
		};

		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

		if (!isAllowed) {
			return;
		};

		S.Menu.open('dataviewOptionEdit', {
			element: `#${menuId} #item-${item.id}`,
			offsetX: getMenuSize?.().width || 0,
			vertical: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			parentId: menuId,
			data: {
				option: item,
				relationKey,
			}
		});
	};

	const onOver = (e: any, item: any) => {
		if (setActive) {
			setActive(item, false);
		};

		Preview.tooltipShow({
			text: item.name,
			element: $(nodeRef.current).find(`#item-${item.id}`)
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled && setActive) {
			setActive(item, false);
		};

		Preview.tooltipShow({
			text: item.name,
			element: $(nodeRef.current).find(`#item-${item.id}`)
		});
	};

	const onMouseLeave = () => {
		Preview.tooltipHide(false);
	};

	// DnD handlers
	const onSortStart = (e: any) => {
		keyboard.disableSelection(true);
		setActiveId(e.active.id);
	};

	const onSortCancel = () => {
		keyboard.disableSelection(false);
		setActiveId(null);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;

		setActiveId(null);
		keyboard.disableSelection(false);

		if (!active || !over || !relation) {
			return;
		};

		const items = getItems().filter(it => it.id != 'add');
		const oldIndex = items.findIndex(it => it.id == active.id);
		const newIndex = items.findIndex(it => it.id == over.id);
		const newItems = arrayMove(items, oldIndex, newIndex);

		U.Data.sortByOrderIdRequest(subId, newItems, callBack => {
			C.RelationOptionSetOrder(S.Common.space, relation.relationKey, newItems.map(it => it.id), callBack);
		});
	};

	const items = getItems();
	const listHeight = Math.min(maxHeight || 200, Math.max(OPTION_HEIGHT, items.length * OPTION_HEIGHT));

	// Placeholder and empty text
	let placeholder = '';
	let empty = '';

	if (canAdd) {
		placeholder = translate('menuDataviewOptionListFilterOrCreateOptions');
		empty = translate('menuDataviewOptionListTypeToCreate');
	} else {
		placeholder = translate('menuDataviewOptionListFilterOptions');
		empty = translate('menuDataviewOptionListTypeToSearch');
	};

	if (readonly) {
		empty = translate('placeholderCellCommon');
	};

	const Item = (item: any) => {
		const sortable = useSortable({ id: item.id, disabled: !canSort || item.id == 'add' });
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
		const isSelected = value.includes(item.id);
		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && canEdit;

		const style: any = {
			...item.style,
		};

		if (canSort && item.id != 'add') {
			style.transform = CSS.Transform.toString(transform);
			style.transition = transition;
			style.opacity = isDragging ? 0 : 1;
		};

		// Add item
		if (item.id == 'add') {
			return (
				<div
					id="item-add"
					className="item add"
					style={item.style}
					onClick={e => onClick(e, item)}
					onMouseEnter={e => onMouseEnter(e, item)}
				>
					<Icon className="plus" />
					<div className="name">{item.name}</div>
				</div>
			);
		};

		// Section item
		if (item.isSection) {
			return <div className="sectionName" style={item.style}>{item.name}</div>;
		};

		// Regular item
		const cn = [ 'item' ];

		if (isSelected) {
			cn.push('isSelected');
		};
		if (readonly) {
			cn.push('isReadonly');
		};
		if (isDragging) {
			cn.push('isDragging');
		};

		return (
			<div
				id={`item-${item.id}`}
				className={cn.join(' ')}
				style={style}
				onMouseEnter={e => onMouseEnter(e, item)}
				onMouseLeave={onMouseLeave}
				ref={canSort ? setNodeRef : undefined}
				{...(canSort ? attributes : {})}
				{...(canSort ? listeners : {})}
			>

				{canSort && !readonly ? <Icon className="dnd" /> : ''}

				<div className="clickable" onClick={e => onClick(e, item)}>
					{!noSelect ? <Icon className={isSelected ? 'chk' : 'chk empty'} /> : ''}
					<Tag
						text={item.name}
						color={item.color}
						className={Relation.selectClassName(relation?.format)}
					/>
				</div>

				{canEdit && isAllowed ? (
					<div className="buttons">
						<Icon className="more" onClick={e => onEdit(e, item)} />
					</div>
				) : ''}
			</div>
		);
	};

	const DragOverlayContent = ({ item }: { item: any }) => {
		if (!item || item.id == 'add' || item.isSection) {
			return null;
		};

		const isSelected = value.includes(item.id);
		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && canEdit;
		const cn = [ 'item', 'isDragging' ];

		if (isSelected) {
			cn.push('isSelected');
		};

		return (
			<div
				id={`item-${item.id}`}
				className={cn.join(' ')}
				style={{ height: OPTION_HEIGHT }}
			>
				{canSort && !readonly ? <Icon className="dnd" /> : ''}
				<div className="clickable">
					{!noSelect ? <Icon className={isSelected ? 'chk' : 'chk empty'} /> : ''}
					<Tag
						text={item.name}
						color={item.color}
						className={Relation.selectClassName(relation?.format)}
					/>
				</div>
				{canEdit && isAllowed ? (
					<div className="buttons">
						<Icon className="more" />
					</div>
				) : ''}
			</div>
		);
	};

	const rowRenderer = ({ key, parent, index, style }) => {
		const item = items[index];

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

	const renderList = () => {
		if (!items.length) {
			return <div className="item empty">{empty}</div>;
		};

		const list = (
			<InfiniteLoader
				rowCount={items.length}
				loadMoreRows={() => {}}
				isRowLoaded={() => true}
				threshold={40}
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
								rowHeight={OPTION_HEIGHT}
								rowRenderer={rowRenderer}
								onRowsRendered={onRowsRendered}
								overscanRowCount={10}
								scrollToAlignment="center"
							/>
						)}
					</AutoSizer>
				)}
			</InfiniteLoader>
		);

		if (canSort) {
			return (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={onSortStart}
					onDragEnd={onSortEnd}
					onDragCancel={onSortCancel}
					modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
				>
					<SortableContext
						items={items.map(item => item.id)}
						strategy={verticalListSortingStrategy}
					>
						{list}
					</SortableContext>
					<DragOverlay>
						{activeId ? <DragOverlayContent item={items.find(it => it.id === activeId)} /> : null}
					</DragOverlay>
				</DndContext>
			);
		};

		return list;
	};

	useImperativeHandle(ref, () => ({
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getFilterRef: () => filterRef.current,
		getListRef: () => listRef.current,
		onOver,
		onClick,
		onSortEnd,
	}));

	return (
		<div ref={nodeRef} className="inlineSelect">
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

			<div className="optionsList" style={{ height: listHeight }}>
				{renderList()}
			</div>
		</div>
	);

}));

export default OptionSelect;
