import React, { forwardRef, useRef, useImperativeHandle, useEffect, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { Icon } from 'Component';
import { I, C, S, U, J, keyboard, analytics, Relation, translate } from 'Lib';
import Item from 'Component/menu/item/filter';

const HEIGHT = 48;
const LIMIT = 20;

const MenuFilterList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, getId, getSize, setHover, onKeyDown, setActive, position } = props;
	const { data } = param;
	const { rootId, blockId, getView, loadData, isInline, getTarget, readonly } = data;
	const view = getView();
	const subId = S.Record.getSubId(rootId, blockId);
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const n = useRef(-1);
	const top = useRef(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const rebind = () => {
		const obj = $(`#${getId()} .content`);

		obj.off('click').on('click', () => S.Menu.closeAll(J.Menu.cell));

		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onAdd = (e: MouseEvent) => {
		const { data } = param;
		const { onFilterAdd, onFilterOrSortAdd } = data;
		const relationOptions = getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		if (onFilterOrSortAdd) {
			onFilterOrSortAdd(getId(), param.component || id, getSize().width);
			return;
		};

		const obj = $(`#${getId()} .content`);
		const first = relationOptions[0];
		const conditions = Relation.filterConditionsByType(first.format);
		const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
		const quickOptions = Relation.filterQuickOptions(first.format, condition);
		const quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.Today;
		const newItem = { 
			relationKey: first.id, 
			condition: condition as I.FilterCondition,
			value: Relation.formatValue(first, null, false),
			quickOption,
		};

		onFilterAdd(newItem, () => {
			obj.animate({ scrollTop: obj.get(0).scrollHeight }, 50);
		});
	};

	const onRemove = (e: any, item: any) => {
		const view = getView();

		if (!view) {
			return;
		};

		const object = getTarget();

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => loadData(view.id, 0));

		S.Menu.close('select');
		analytics.event('RemoveFilter', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	const onOver = (e: MouseEvent, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: MouseEvent, item: any) => {
		const view = getView();

		if (!view) {
			return;
		};

		S.Menu.open('dataviewFilterValues', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				save: () => {
					C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, view.getFilter(item.id), () => {
						loadData(view.id, 0);
					});
				},
				itemId: item.id,
			}
		});
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};
	
	const onSortEnd = (result: any) => {
		const view = getView();
		if (!view) {
			return;
		};

		const object = getTarget();
		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const ids = items.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		n.current = newIndex;
		view.filters = arrayMove(view.filters as I.Filter[], oldIndex, newIndex);
		C.BlockDataviewFilterSort(rootId, blockId, view.id, view.filters.map(it => it.id), () => loadData(view.id, 0));

		keyboard.disableSelection(false);

		analytics.event('RepositionFilter', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	const getItems = () => {
		const view = getView();

		if (!view) {
			return [];
		};

		return U.Common.objectCopy(view.filters || []).map((it: any) => {
			return { 
				...it, 
				relation: S.Record.getRelationByKey(it.relationKey),
			};
		}).filter(it => it.relation);
	};

	const getRelationOptions = () => {
		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = !isReadonly ? 62 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

	const filterCnt = view.filters.length;
	const items = getItems();

	for (const filter of items) {
		const { relationKey, condition, value } = filter;
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<Item 
					key={item.id} 
					{...item} 
					subId={subId}
					index={param.index} 
					style={param.style} 
					readonly={isReadonly}
					onOver={e => onOver(e, item)}
					onClick={e => onClick(e, item)}
					onRemove={e => onRemove(e, item)}
				/>
			</CellMeasurer>
		);
	};
	
	useEffect(() => {
		const items = getItems();

		resize();
		rebind();

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

		if (listRef.current && top.current) {
			listRef.current.scrollToPosition(top.current);
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
						{!items.length ? (
							<div className="item empty">
								<div className="inner">{translate('menuDataviewFilterListEmpty')}</div>
							</div>
						) : (
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
												overscanRowCount={LIMIT}
												onScroll={onScroll}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						)}
					</div>
				</SortableContext>
			</DndContext>

			{!isReadonly ? (
				<div className="bottom">
					<div className="line" />
					<div 
						id="item-add" 
						className="item add" 
						onClick={onAdd}
						onMouseEnter={() => setHover({ id: 'add' })} 
						onMouseLeave={() => setHover()}
					>
						<Icon className="plus" />
						<div className="name">{translate('menuDataviewFilterNewFilter')}</div>
					</div>
				</div>
			) : ''}
		</div>
	);

}));

export default MenuFilterList;