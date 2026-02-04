import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, IconObject } from 'Component';
import { I, C, S, U, J, Relation, keyboard, analytics, translate } from 'Lib';

const HEIGHT = 48;
const HEIGHT_DIV = 16;
const HEIGHT_ITEM = 28;
const HEIGHT_EMPTY = 48;
const LIMIT = 20;

const MenuSort = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, getId, setHover, onKeyDown, setActive, getSize, position } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, getView, onSortAdd, isInline, getTarget, readonly, closeFilters, loadData } = data;
	const [ dummy, setDummy ] = useState(0);
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const topRef = useRef(0);
	const n = useRef(-1);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
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

	const getSortItems = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		return U.Common.objectCopy(view.sorts || []);
	};

	const getItems = () => {
		const sortItems = getSortItems();
		const items: any[] = [ ...sortItems ];

		if (!sortItems.length) {
			items.push({ isEmpty: true });
		};

		if (!isReadonlyValue) {
			items.push({ isDiv: true });
			items.push({ id: 'add', name: translate('menuDataviewSortAddSort') });
			if (sortItems.length) {
				items.push({ id: 'clear', name: translate('menuDataviewFilterDeleteSort') });
			};
		};

		return items;
	};

	const getRelationOptions = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		return Relation.getFilterOptions(rootId, blockId, view);
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		switch (item.id) {
			case 'add': {
				onAdd();
				break;
			};

			case 'clear': {
				onClear();
				break;
			};

			default: {
				S.Menu.open('select', {
					rebind,
					element: `#${getId()} #item-${item.id}`,
					className,
					classNameWrap,
					horizontal: I.MenuDirection.Center,
					noFlipY: true,
					data: {
						...data,
						options: getRelationOptions(),
						value: item.relationKey,
						itemId: item.id,
						onSelect: (e: any, el: any) => {
							onChange(item.id, 'relationKey', el.id);
						}
					}
				});
				break;
			};
		};

	};

	const onMore = (e: any, item: any) => {
		const elementId = `#${getId()} #item-${item.id}`;
		const options = [
			{ name: translate('menuDataviewSortShowEmpty'), isSection: true },
			{ id: I.EmptyType.Start, name: translate('menuDataviewSortShowEmptyTop') },
			{ id: I.EmptyType.End, name: translate('menuDataviewSortShowEmptyBottom') },
		];

		S.Menu.open('select', {
			rebind,
			className,
			classNameWrap,
			element: `${elementId} .more`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			onOpen: () => $(elementId).addClass('hover'),
			onClose: () => $(elementId).removeClass('hover'),
			data: {
				...data,
				options,
				value: String(item.empty),
				itemId: item.id,
				onSelect: (e: any, el: any) => {
					onChange(item.id, 'empty', el.id);
				}
			}
		});
	};

	const onSortNameClick = (e: MouseEvent, item: any) => {
		if (isReadonly()) {
			return;
		};

		const menuParam = {
			className,
			classNameWrap,
			element: `#${getId()} #item-${item.id} .chip.relation`,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Bottom,
			offsetY: 4,
		};

		U.Menu.sortOrFilterRelationSelect(menuParam, {
			rootId,
			blockId,
			getView,
			onSelect: v => {
				onChange(item.id, 'relationKey', v.relationKey ? v.relationKey : v.id);
			}
		});
	};

	const onAdd = () => {
		const menuParam = {
			className,
			classNameWrap,
			element: `#${getId()} #item-add`,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Bottom,
			offsetY: 4,
			offsetX: 8,
		};
		const content = $(`#${getId()} .content`);

		U.Menu.sortOrFilterRelationSelect(menuParam, {
			rootId,
			blockId,
			getView,
			onSelect: (item: any) => {
				const newItem = {
					relationKey: item.relationKey ? item.relationKey : item.id,
					type: I.SortType.Asc,
					empty: I.EmptyType.End,
				};

				onSortAdd(newItem, () => {
					content.animate({ scrollTop: content.get(0).scrollHeight }, 50);
				});
			},
		});
	};

	const onChange = (id: string, k: string, v: string) => {
		const view = getView();
		if (!view) {
			return;
		};

		const item = view.getSort(id);
		if (!item) {
			return;
		};

		const object = getTarget();

		item[k] = v;

		C.BlockDataviewSortReplace(rootId, blockId, view.id, item.id, { ...item });

		analytics.event('ChangeSortValue', {
			type: item.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline),
			emptyType: item.empty,
		});
		
		setDummy(dummy + 1);
	};
	
	const onRemove = (e: any, item: any) => {
		const view = getView();
		if (!view) {
			return;
		};

		const object = getTarget();

		C.BlockDataviewSortRemove(rootId, blockId, view.id, [ item.id ]);

		S.Menu.close('select');
		analytics.event('RemoveSort', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) return HEIGHT_DIV;
		if (item.isEmpty) return HEIGHT_EMPTY;
		if ([ 'add', 'clear' ].includes(item.id)) return HEIGHT_ITEM;
		return HEIGHT;
	};

	const onClear = () => {
		const view = getView();
		if (!view) return;

		C.BlockDataviewSortRemove(rootId, blockId, view.id, view.sorts.map(it => it.id), () => {
			loadData?.(view.id, 0, false);
			closeFilters?.();
		});

		S.Menu.close('dataviewSort');
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};
	
	const onSortEnd = (result: any) => {
		const view = getView();
		if (!view) {
			return;
		};

		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const sortIds = view.sorts.map(it => it.id);
		const oldIndex = sortIds.indexOf(active.id);
		const newIndex = sortIds.indexOf(over.id);
		const object = getTarget();

		n.current = newIndex;
		view.sorts = arrayMove(view.sorts, oldIndex, newIndex);
		C.BlockDataviewSortSort(rootId, blockId, view.id, view.sorts.map(it => it.id));

		keyboard.disableSelection(false);

		analytics.event('RepositionSort', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const height = items.reduce((res: number, current: any) => res + getRowHeight(current), offset);

		obj.css({ height });
		position();
	};

	const isReadonly = () => {
		const allowedView = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};

	const onTypeChange = (e: any, item: any) => {
		const type = item.type === I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
		onChange(item.id, 'type', String(type));
	};

	const isReadonlyValue = isReadonly();
	const items = getItems();

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: isReadonlyValue });
		const relation: any = S.Record.getRelationByKey(item.relationKey) || {};
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};
		const cn = [ 'item', 'sortItem' ];

		if (isReadonlyValue) {
			cn.push('isReadonly');
		};

		return (
			<div
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onMouseEnter={e => onOver(e, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{!isReadonlyValue ? <Icon className="dnd" /> : ''}
				<div className="sides">
					<div className="side left">
						<div className="chip relation" onClick={e => onSortNameClick(e, item)}>
							<IconObject size={20} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />
							<div className="name">{relation.name}</div>
						</div>
						<div className="chip type" onClick={e => onTypeChange(e, item)}>
							<Icon className={`sortArrow c${item.type}`} />
						</div>
					</div>
					<div className="side right">
						{!isReadonlyValue ? (
							<div className="buttons">
								<Icon className="more withBackground" onClick={e => onMore(e, item)} />
								<Icon className="delete withBackground" onClick={e => onRemove(e, item)} />
							</div>
						) : ''}
					</div>
				</div>
			</div>
		);
	};

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
			content = (
				<div className="item empty" style={param.style}>
					<div className="inner">{translate('menuDataviewSortNoSortsApplied')}</div>
				</div>
			);
		} else
		if ([ 'add', 'clear' ].includes(item.id)) {
			const cn = [ 'item', item.id ];
			content = (
				<div
					key={`sort-item-${item.id}`}
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={item.id === 'add' ? onAdd : onClear}
					onMouseEnter={() => setHover({ id: item.id })}
					onMouseLeave={() => setHover()}
					style={param.style}
				>
					<Icon className={item.id === 'add' ? 'plus' : 'remove'} />
					<div className="name">{item.name}</div>
				</div>
			);
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
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.cell);
		};
	}, []);
	
	useEffect(() => {
		resize();

		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};

		setActive();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		getListRef: () => listRef.current,
		onSortEnd,
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
					items={items.filter(it => !it.isDiv && !it.isEmpty && ![ 'add', 'clear' ].includes(it.id)).map(it => it.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="items">
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
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);

}));

export default MenuSort;
