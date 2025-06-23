import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon } from 'Component';
import { I, C, S, U, keyboard, Relation, analytics, translate, Dataview } from 'Lib';

const HEIGHT = 28;
const LIMIT = 20;

const MenuViewList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setHover, onKeyDown, setActive, close, getSize, position } = props;
	const { data } = param;
	const { rootId, blockId, loadData, getView, getSources, isInline, getTarget, onViewSwitch, onViewCopy, onViewRemove, readonly } = data;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const topRef = useRef(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const n = useRef(-1);
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
		const items: any[] = U.Common.objectCopy(S.Record.getViews(rootId, blockId)).map(it => ({ 
			...it, name: it.name || translate('defaultNamePage'),
		}));

		items.unshift({ id: 'label', name: translate('menuDataviewViewListViews'), isSection: true });
		return items;
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onAdd = () => {
		const view = getView();
		if (!view) {
			return;
		};

		const sources = getSources();
		const filters: I.Filter[] = [];
		const object = getTarget();
		const newView = {
			name: Dataview.defaultViewName(I.ViewType.Grid),
			type: I.ViewType.Grid,
			groupRelationKey: Relation.getGroupOption(rootId, blockId, view.type, '')?.id,
			cardSize: I.CardSize.Medium,
			filters,
			sorts: [],
		};

		C.BlockDataviewViewCreate(rootId, blockId, newView, sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = S.Record.getView(rootId, blockId, message.viewId);

			close();
			window.setTimeout(() => onViewSwitch(view), S.Menu.getTimeout());

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline),
			});
		});
	};

	const onViewContext = (e: any, view: any) => {
		e.stopPropagation();

		U.Menu.viewContextMenu({
			rootId,
			blockId,
			view,
			onCopy: onViewCopy,
			onRemove: onViewRemove,
			close,
			menuParam: {
				element: `#${getId()} #item-${view.id} .more`,
				horizontal: I.MenuDirection.Center,
			}
		});
	};

	const onClick = (e: any, item: any) => {
		const subId = S.Record.getSubId(rootId, blockId);
		const object = getTarget();

		S.Record.metaSet(subId, '', { viewId: item.id });
		C.BlockDataviewViewSetActive(rootId, blockId, item.id);

		analytics.event('SwitchView', {
			type: item.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});

		close();
	};

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const items = S.Record.getViews(rootId, blockId);
		const ids = items.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		S.Record.viewsSort(rootId, blockId, arrayMove(ids, oldIndex, newIndex));
		C.BlockDataviewViewSetPosition(rootId, blockId, active.id, newIndex);
		keyboard.disableSelection(false);
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = isAllowed() ? 58 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	const isAllowed = () => {	
		return !readonly && S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	};

	const items = getItems();
	const allowed = isAllowed();

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !allowed });
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};

		return (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onClick={e => onClick(e, item)}
				onMouseEnter={e => onOver(e, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{allowed ? <Icon className="dnd" /> : ''}
				<div className="clickable" onClick={() => loadData(item.id, 0)}>
					<div className="name">{item.name}</div>
				</div>
				<div className="buttons">
					<Icon className="more withBackground" onClick={e => onViewContext(e, item)} />
				</div>
			</div>
		);
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		let content = null;
		if (item.isSection) {
			content = <div className="sectionName" style={param.style}>{item.name}</div>;
		} else {
			content = <Item key={item.id} {...item} index={param.index - 1} style={param.style} />;
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

		cache.current = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		resize();

		return () => {
			S.Menu.closeAll([ 'select' ]);
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
								<div className="inner">{translate('menuDataviewViewListNoViewsFound')}</div>
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

			{allowed ? (
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
						<div className="name">{translate('menuDataviewViewListAddView')}</div>
					</div>
				</div>
			) : ''}
		</div>
	);

}));

export default MenuViewList;