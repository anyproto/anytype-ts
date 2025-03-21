import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Switch, Cell } from 'Component';
import { I, C, S, J, Dataview, keyboard, translate } from 'Lib';

const HEIGHT = 28;
const LIMIT = 20;

const MenuGroupList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setActive, onKeyDown, position } = props;
	const { data } = param;
	const { readonly, rootId, blockId, getView } = data;
	const view = getView();
	const items = Dataview.getGroups(rootId, blockId, view.id, true);
	const block = S.Block.getLeaf(rootId, blockId);
	const allowedView = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const cache = useRef({});
	const listRef = useRef(null);
	const top = useRef(0);
	const n = useRef(-1);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	cache.current = new CellMeasurerCache({
		fixedWidth: true,
		defaultHeight: HEIGHT,
		keyMapper: i => (items[i] || {}).id,
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onKeyDownHandler = (e: any) => {
		const item = items[n.current];

		let ret = false;

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();

			onSwitch(e, item, !item.isVisible);
			ret = true;
		});

		if (ret) {
			return;
		};

		onKeyDown(e);
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;
		const ids = items.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);
			
		S.Record.groupsSet(rootId, blockId, arrayMove(items, oldIndex, newIndex));
		save();

		keyboard.disableSelection(false);
	};

	const onSwitch = (e: any, item: any, v: boolean) => {
		e.stopPropagation();

		const items = S.Record.getGroups(rootId, blockId);
		const current = items.find(it => it.id == item.id);

		current.isHidden = !v;
		save();
	};

	const save = () => {
		const view = getView();
		const items = S.Record.getGroups(rootId, blockId);
		const update: any[] = [];

		items.forEach((it: any, i: number) => {
			update.push({ ...it, groupId: it.id, index: i });
		});

		S.Record.groupsSet(rootId, blockId, items);
		Dataview.groupUpdate(rootId, blockId, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const resize = () => {
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 16));

		obj.css({ height });
		position();
	};

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: !allowedView });
		const canHide = allowedView;
		const canEdit = !readonly && allowedView;
		const subId = S.Record.getSubId(rootId, [ blockId, item.id ].join(':'));
		const cn = [ 'item' ];
		const head = {};
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};

		head[view.groupRelationKey] = item.value;
		
		if (!canEdit) {
			cn.push('isReadonly');
		};

		return (
			<div 
				id={'item-' + item.id} 
				className={cn.join(' ')} 
				onMouseEnter={e => onMouseEnter(e, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{allowedView ? <Icon className="dnd" /> : ''}
				<span className="clickable">
					<Cell 
						id={'menu-group-' + item.id} 
						rootId={rootId}
						subId={subId}
						block={block}
						relationKey={view.groupRelationKey} 
						viewType={I.ViewType.Board}
						getRecord={() => head}
						readonly={true} 
						arrayLimit={4}
						withName={true}
						placeholder={translate('commonUncategorized')}
					/>
				</span>
				{canHide ? (
					<Switch 
						value={!item.isHidden} 
						onChange={(e: any, v: boolean) => onSwitch(e, item, v)} 
					/>
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
		rebind();
		resize();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.cell);
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();
		setActive(null, true);
		position();

		if (top.current) {
			listRef.current?.scrollToPosition(top.current);
		};
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => items,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
	}), []);
	
	return (
		<div className="wrap">
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
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => true}
							threshold={LIMIT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<VList
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
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);

}));

export default MenuGroupList;