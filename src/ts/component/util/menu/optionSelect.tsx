import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Tag, Filter, IconObject, ObjectName, Loader } from 'Component';
import { I, C, S, U, J, keyboard, Relation, translate, Preview, analytics } from 'Lib';
import $ from 'jquery';

const HEIGHT = 28;
const LIMIT = 40;

interface SelectItem {
	id: string;
	name: string;
	color?: string;
	isSection?: boolean;
	isArchived?: boolean;
	isDeleted?: boolean;
	_empty_?: boolean;
	restrictions?: any[];
	style?: React.CSSProperties;
};

interface SearchParam {
	types?: string[];
	filters?: I.Filter[];
	sorts?: I.Sort[];
	keys?: string[];
	limit?: number;
};

interface AddParamDetails {
	type?: string;
	[key: string]: any;
};

interface AddParam {
	details?: AddParamDetails;
};

interface Props {
	subId: string;
	relationKey: string;
	value: string[];
	onChange: (value: string[]) => void;

	// Display options
	isReadonly?: boolean;
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
	setActive?: (item?: any, scroll?: boolean) => void;
	onClose?: () => void;

	// Menu context (for edit menu)
	menuId?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	getSize?: () => { width: number; height: number };
	position?: () => void;

	// Cell reference (for clearing cell on click)
	cellRef?: { clear: () => void };

	// Rebind callback (for edit menu keyboard handling)
	rebind?: () => void;

	// Object mode (when searchParam is provided)
	searchParam?: SearchParam;
	addParam?: AddParam;
	rootId?: string;
};

export interface OptionSelectRefProps {
	getItems: () => SelectItem[];
	getIndex: () => number;
	setIndex: (i: number) => void;
	getFilterRef: () => any;
	getListRef: () => any;
	onOver: (e: React.MouseEvent, item: SelectItem) => void;
	onClick: (e: React.MouseEvent | { stopPropagation: () => void }, item: SelectItem) => void;
	onSortEnd?: (result: any) => void;
};

const OptionSelect = observer(forwardRef<OptionSelectRefProps, Props>((props, ref) => {

	const {
		subId, relationKey, value, onChange, isReadonly, noFilter, noSelect, maxHeight, maxCount, skipIds, filterMapper, canAdd,
		canSort, canEdit, setActive, onClose, menuId, menuClassName, menuClassNameWrap, getSize, position, cellRef, rebind,
		searchParam, addParam, rootId,
	} = props;

	const relation = S.Record.getRelationByKey(relationKey);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const [ filter, setFilter ] = useState('');
	const [ activeId, setActiveId ] = useState<string | null>(null);
	const [ isLoading, setIsLoading ] = useState(false);

	const isObjectMode = !!searchParam;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	useEffect(() => {
		load();
		resize();

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	useEffect(() => {
		load();
	}, [ relationKey ]);

	useEffect(() => {
		n.current = -1;
	}, [ filter ]);

	useEffect(() => {
		setActive();
		resize();
	});

	const loadObjects = (): void => {
		if (!searchParam) {
			return;
		};

		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(searchParam.filters || []);

		if (searchParam.types?.length) {
			const types = searchParam.types.map(id => S.Record.getTypeById(id)).filter(it => it);
			if (types.length) {
				filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.In, value: types.map(it => it.uniqueKey) });
			};
		};

		U.Subscription.subscribe({
			subId,
			filters,
			sorts: searchParam.sorts || [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			],
			keys: searchParam.keys || J.Relation.default,
			limit: searchParam.limit || LIMIT,
		}, () => setIsLoading(false));
	};

	const loadOptions = (): void => {
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
		}, () => setIsLoading(false));
	};

	const load = (): void => {
		if (!relationKey && !searchParam) {
			return;
		};

		setIsLoading(true);

		U.Subscription.destroyList([ subId ], false, () => {
			isObjectMode ? loadObjects() : loadOptions();
		});
	};

	const getObjectItems = (): SelectItem[] => {
		if (!searchParam) {
			return [];
		};

		const keys = searchParam.keys || J.Relation.default;
		const skip = Relation.getArrayValue(skipIds);
		const ret: SelectItem[] = [];

		let items = S.Record.getRecords(subId, keys);
		items = items.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted && !skip.includes(it.id));

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');
			items = items.filter(it => it.name?.match(reg));

			if (canAdd && !isReadonly) {
				const check = items.filter(it => it.name?.toLowerCase() == filter.toLowerCase());
				if (!check.length) {
					ret.push({
						id: 'add',
						name: U.String.sprintf(translate('commonCreateObjectWithName'), filter),
					});
				};
			};
		};

		return items.concat(ret);
	};

	const getOptionItems = (): SelectItem[] => {
		const isSelect = relation?.format == I.RelationType.Select;
		const skip = Relation.getArrayValue(skipIds);
		const ret: SelectItem[] = [];

		let items = S.Record.getRecords(subId, U.Subscription.optionRelationKeys(true));
		let check: SelectItem[] = [];

		items = items.filter(it => !it._empty_ && !skip.includes(it.id));

		if (filterMapper) {
			items = items.filter(filterMapper);
		};

		items.sort((c1, c2) => U.Data.sortByOrderId(c1, c2) || U.Data.sortByNumericKey('createdDate', c1, c2, I.SortType.Desc));

		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');

			check = items.filter(it => it.name.toLowerCase() == filter.toLowerCase());
			items = items.filter(it => it.name.match(reg));

			if (canAdd && !isReadonly && !check.length) {
				ret.unshift({
					id: 'add',
					name: U.String.sprintf(isSelect && !noSelect ? translate('menuDataviewOptionListSetStatus') : translate('menuDataviewOptionListCreateOption'), filter),
				});
			};
		};

		return items.concat(ret);
	};

	const getItems = (): SelectItem[] => {
		return isObjectMode ? getObjectItems() : getOptionItems();
	};

	const onFilterChange = (v: string): void => {
		setFilter(v);
	};

	const onClick = (e: React.MouseEvent | { stopPropagation: () => void }, item: SelectItem): void => {
		e.stopPropagation();

		if (cellRef) {
			cellRef.clear();
		};

		if (isReadonly) {
			return;
		};

		if (item.id == 'add') {
			isObjectMode ? onObjectAdd() : onOptionAdd();
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

			// Persist object details to rootId so DataviewFilterItem can access them
			if (isObjectMode && rootId && (item.id != rootId)) {
				S.Detail.update(rootId, { id: item.id, details: item }, false);
			};
		};

		if (maxCount) {
			newValue = newValue.slice(newValue.length - maxCount, newValue.length);

			if (maxCount == 1) {
				onClose?.();
			};
		};

		onChange(U.Common.arrayUnique(newValue));
		filterRef.current?.setValue('');
		setFilter('');
	};

	const onOptionAdd = (): void => {
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

			const newOptionId = message.objectId;

			filterRef.current?.setValue('');
			setFilter('');

			// Add newly created option to value
			let newValue = [ ...value, newOptionId ];
			newValue = U.Common.arrayUnique(newValue);

			if (maxCount) {
				newValue = newValue.slice(newValue.length - maxCount, newValue.length);

				if (maxCount == 1) {
					onClose?.();
				};
			};

			onChange(newValue);

			// Restore hover state on newly created option
			window.setTimeout(() => {
				const items = getItems();
				const index = items.findIndex(it => it.id == newOptionId);

				if (index >= 0) {
					n.current = index;
					setActive?.(items[index], false);
				};
			}, 50);
		});
	};

	const onObjectAdd = (): void => {
		if (!filter?.trim()) {
			return;
		};

		const types = searchParam?.types || [];
		const typeKey = types.length ? (S.Record.getTypeById(types[0])?.uniqueKey ?? '') : '';
		const details: AddParamDetails = {
			...(addParam?.details || {}),
			name: filter.trim(),
		};

		U.Object.create('', typeKey, details, I.BlockPosition.Bottom, '', [], analytics.route.relation, (message: any) => {
			if (!message.targetId) {
				return;
			};

			const newId = message.targetId;

			filterRef.current?.setValue('');
			setFilter('');

			let newValue = [ ...value, newId ];
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

	const onEdit = (e: React.MouseEvent, item: SelectItem): void => {
		e.stopPropagation();

		if (!item || item.id == 'add' || !canEdit || !menuId) {
			return;
		};

		const isAllowed = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);
		if (!isAllowed) {
			return;
		};

		const element = `#utilOptionSelect #item-${item.id}`;

		S.Menu.open('dataviewOptionEdit', {
			element,
			offsetX: getSize?.().width || $(element).outerWidth(),
			vertical: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			rebind,
			parentId: menuId,
			data: {
				option: item,
				relationKey,
			}
		});
	};

	const onOver = (e: React.MouseEvent, item: SelectItem): void => {
		if (setActive) {
			setActive(item, false);
		};

		Preview.tooltipShow({
			text: item.name,
			element: $(nodeRef.current).find(`#item-${item.id}`)
		});
	};

	const onMouseEnter = (e: React.MouseEvent, item: SelectItem): void => {
		if (!keyboard.isMouseDisabled && setActive) {
			setActive(item, false);
		};

		Preview.tooltipShow({
			text: item.name,
			element: $(nodeRef.current).find(`#item-${item.id}`)
		});
	};

	const onMouseLeave = (): void => {
		Preview.tooltipHide(false);
	};

	// DnD handlers
	const onSortStart = (e: any): void => {
		keyboard.disableSelection(true);
		setActiveId(e.active.id);
	};

	const onSortCancel = (): void => {
		keyboard.disableSelection(false);
		setActiveId(null);
	};

	const onSortEndObjects = (active: any, over: any): void => {
		let newValue = [ ...value ];
		const oldIndex = newValue.indexOf(active.id);
		const newIndex = newValue.indexOf(over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		};

		newValue = arrayMove(newValue, oldIndex, newIndex);
		onChange(newValue);
	};

	const onSortEndOptions = (active: any, over: any): void => {
		if (!relation) {
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

	const onSortEnd = (result: any): void => {
		const { active, over } = result;

		setActiveId(null);
		keyboard.disableSelection(false);

		if (!active || !over) {
			return;
		};

		isObjectMode ? onSortEndObjects(active, over) : onSortEndOptions(active, over);
	};

	const resize = (): void => {
		const items = getItems();
		const obj = $(nodeRef.current);
		const offset = !isReadonly && !noFilter ? 36 : 8;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position?.();
	};

	const items = getItems();

	// Placeholder and empty text
	let placeholder = '';
	let empty = '';

	if (isObjectMode) {
		placeholder = translate('commonFilterObjects');
		empty = translate('menuDataviewOptionListTypeToSearch');
	} else if (canAdd) {
		placeholder = translate('menuDataviewOptionListFilterOrCreateOptions');
		empty = translate('menuDataviewOptionListTypeToCreate');
	} else {
		placeholder = translate('menuDataviewOptionListFilterOptions');
		empty = translate('menuDataviewOptionListTypeToSearch');
	};

	if (isReadonly) {
		empty = translate('placeholderCellCommon');
	};

	const Item = (item: SelectItem): React.ReactElement | null => {
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
		if (isReadonly) {
			cn.push('isReadonly');
		};
		if (isDragging) {
			cn.push('isDragging');
		};
		if (canSort) {
			cn.push('withHandle');
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

				{canSort && !isReadonly ? <Icon className="dnd" /> : ''}

				<div className="clickable" onClick={e => onClick(e, item)}>
					{!noSelect && isSelected ? <Icon className="chk" /> : ''}
					{isObjectMode ? (
						<>
							<IconObject object={item} />
							<ObjectName object={item} />
						</>
					) : (
						<Tag
							text={item.name}
							color={item.color}
							className={Relation.selectClassName(relation?.format)}
						/>
					)}
				</div>

				{canEdit && isAllowed ? (
					<div className="buttons">
						<Icon className="more" onClick={e => onEdit(e, item)} />
					</div>
				) : ''}
			</div>
		);
	};

	const DragOverlayContent = ({ item }: { item: SelectItem | undefined }): React.ReactElement | null => {
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
				style={{ height: HEIGHT }}
			>
				{canSort && !isReadonly ? <Icon className="dnd" /> : ''}
				<div className="clickable">
					{!noSelect ? <Icon className={isSelected ? 'chk' : 'chk empty'} /> : ''}
					{isObjectMode ? (
						<>
							<IconObject object={item} />
							<ObjectName object={item} />
						</>
					) : (
						<Tag
							text={item.name}
							color={item.color}
							className={Relation.selectClassName(relation?.format)}
						/>
					)}
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

	const renderList = (): React.ReactElement => {
		if (!items.length) {
			return <div className="item empty">{empty}</div>;
		};

		const list = (
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

	const cn = [ 'utilOptionSelect' ];

	if (!noSelect) {
		cn.push('canSelect');
	};
	if (canEdit) {
		cn.push('canEdit');
	};
	if (canSort) {
		cn.push('canSort');
	};
	if (noFilter) {
		cn.push('noFilter');
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
		<div id="utilOptionSelect" ref={nodeRef} className={cn.join(' ')}>
			{!noFilter ? (
				<Filter
					className="outlined round"
					ref={filterRef}
					placeholderFocus={placeholder}
					value={filter}
					onChange={onFilterChange}
					focusOnMount={true}
				/>
			) : ''}

			{isLoading ? <Loader /> : ''}

			<div className="items">
				{!isLoading ? renderList() : ''}
			</div>
		</div>
	);

}));

export default OptionSelect;
