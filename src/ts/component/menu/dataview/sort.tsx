import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, IconObject, Label, Select } from 'Component';
import { I, C, S, U, J, Relation, keyboard, analytics, translate } from 'Lib';

const HEIGHT = 48;
const LIMIT = 20;

const MenuSort = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, getId, setHover, onKeyDown, setActive, getSize, position } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, getView, onSortAdd, onFilterOrSortAdd, isInline, getTarget, readonly } = data;
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

	const getItems = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		return U.Common.objectCopy(view.sorts || []);
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
		S.Menu.open('select', {
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
	};

	const onMore = (e: any, item: any) => {
		const elementId = `#${getId()} #item-${item.id}`;
		const options = [
			{ name: translate('menuDataviewSortShowEmpty'), isSection: true },
			{ id: I.EmptyType.Start, name: translate('menuDataviewSortShowEmptyTop') },
			{ id: I.EmptyType.End, name: translate('menuDataviewSortShowEmptyBottom') },
		];

		S.Menu.open('select', {
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

	const onSortNameClick = (e: React.MouseEvent, item: any) => {
		if (isReadonly()) {
			return;
		};

		const menuParam = {
			className,
			classNameWrap,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
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
		const relationOptions = getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		if (onFilterOrSortAdd) {
			onFilterOrSortAdd(getId(), param.component || id, getSize().width);
			return;
		};

		const content = $(`#${getId()} .content`);
		const newItem = { 
			relationKey: relationOptions[0].id, 
			type: I.SortType.Asc,
			empty: I.EmptyType.End,
		};

		onSortAdd(newItem, () => {
			content.animate({ scrollTop: content.get(0).scrollHeight }, 50);
		});
	};

	const onChange = (id: number, k: string, v: string) => {
		const view = getView();
		if (!view) {
			return;
		};

		const item = view.getSort(id);
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

		const ids = items.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);
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
		const offset = !isReadonly() ? 62 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	const isReadonly = () => {
		const allowedView = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};

	const isReadonlyValue = isReadonly();
	const items = getItems();
	const sortCnt = items.length;

	const typeOptions = [
		{ id: I.SortType.Asc, name: translate('commonAscending') },
		{ id: I.SortType.Desc, name: translate('commonDescending') },
	];

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: isReadonlyValue });
		const relation: any = S.Record.getRelationByKey(item.relationKey) || {};
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};
		const cn = [ 'item' ];

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
				<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />
				<div className="txt">
					<Label id={[ 'filter', 'relation', item.id ].join('-')} text={relation.name} onClick={e => onSortNameClick(e, item)} />

					<Select 
						id={[ 'filter', 'type', item.id ].join('-')} 
						className="grey" 
						options={typeOptions}
						arrowClassName={'light'}
						value={item.type} 
						onChange={v => onChange(item.id, 'type', v)} 
						readonly={isReadonlyValue}
						menuParam={{ className, classNameWrap }}
					/>
				</div>
				{!isReadonlyValue ? (
					<div className="buttons">
						<Icon className="more withBackground" onClick={e => onMore(e, item)} />
						<Icon className="delete withBackground" onClick={e => onRemove(e, item)} />
					</div>
				) : ''}
			</div>
		);
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
				<Item key={item.id} {...item} index={param.index} style={param.style} />
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
								<div className="inner">{translate('menuDataviewSortNoSortsApplied')}</div>
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

			{!isReadonlyValue ? (
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
						<div className="name">{translate('menuDataviewSortNewSort')}</div>
					</div> 
				</div>
			) : ''}
		</div>
	);

}));

export default MenuSort;