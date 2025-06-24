import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { I, C, S, J, U, keyboard, Dataview, translate, analytics } from 'Lib';
import { Icon, IconObject, Switch } from 'Component';

const HEIGHT = 28;
const LIMIT = 20;

const MenuRelationList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getSize, setHover, setActive, onKeyDown, position } = props;
	const { data } = param;
	const { rootId, blockId, readonly, getView } = data;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const topRef = useRef(0);
	const n = useRef(-1);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
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

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();

			if (item) {
				onSwitch(e, item, !item.isVisible);
			};
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onAdd = (e: any) => {
		const { data } = param;
		const { rootId, blockId, getView, onAdd } = data;
		const view = getView();
		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('relationSuggest', { 
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Top,
			offsetY: 36,
			noAnimation: true,
			noFlipY: true,
			data: {
				...data,
				menuIdEdit: 'dataviewRelationEdit',
				filter: '',
				ref: 'dataview',
				skipKeys: relations.map(it => it.relationKey),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					const cb = (message: any) => {
						if (onAdd) {
							onAdd();
						};

						if (onChange) {
							onChange(message);
						};
					};

					Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, relations.length, cb);
				},
			}
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		const relation = S.Record.getRelationByKey(item.relationKey);
		const object = S.Detail.get(rootId, rootId);
		const isType = U.Object.isTypeLayout(object.layout);
		const view = getView();

		if (!relation || readonly || !view) {
			return;
		};

		let unlinkCommand = null;
		if (isType) {
			unlinkCommand = (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
				U.Object.typeRelationUnlink(object.id, relation.id, onChange);
			};
		};

		S.Menu.open('dataviewRelationEdit', { 
			element: `#${getId()} #item-${item.relationKey}`,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				...data,
				relationId: relation.id,
				unlinkCommand,
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

		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const ids = items.map(it => it.relationKey);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);
		const list = arrayMove(getItems(), oldIndex, newIndex);

		n.current = newIndex;
		view.relations = list;
		C.BlockDataviewViewRelationSort(rootId, blockId, view.id, list.map(it => it && it.relationKey));
		keyboard.disableSelection(false);
	};

	const onSwitch = (e: any, item: any, v: boolean) => {
		const view = getView();
		const object = S.Detail.get(rootId, rootId);
		const relation = S.Record.getRelationByKey(item.relationKey);

		C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, item.relationKey, { ...item, isVisible: v });
		analytics.event('ShowDataviewRelation', { type: v ? 'True' : 'False', relationKey: item.relationKey, format: relation.format, objectType: object.type });
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const getItems = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		return Dataview.viewGetRelations(rootId, blockId, view).map((it: any) => ({ 
			...it,
			id: it.relationKey,
			relation: S.Record.getRelationByKey(it.relationKey) || {},
		}));
	};

	const resize = () => {
		const obj = $(`#${getId()} .content`);
		const offset = !isReadonly ? 62 : 16;
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	const items = getItems();
	const view = getView();

	items.map((it: any) => {
		const { format, name } = it.relation;
	});

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled: isReadonly });
		const isName = item.relationKey == 'name';
		const canHide = !isReadonly && (!isName || (view.type == I.ViewType.Gallery));
		const cn = [ 'item' ];
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};
		
		if (item.relation.isHidden) {
			cn.push('isHidden');
		};
		if (isReadonly) {
			cn.push('isReadonly');
		};

		return (
			<div 
				id={`item-${item.relationKey}`} 
				className={cn.join(' ')} 
				onMouseEnter={e => onMouseEnter(e, item)}
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{!isReadonly ? <Icon className="dnd" /> : ''}
				<span className="clickable" onClick={e => onClick(e, item)}>
					<IconObject object={item.relation} />
					<div className="name">{item.relation.name}</div>
				</span>
				{canHide ? (
					<Switch 
						value={item.isVisible} 
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
		rebind();
		setActive(null, true);
		position();

		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};
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
						<div className="name">{translate('commonAddRelation')}</div>
					</div>
				</div>
			) : ''}
		</div>
	);

}));

export default MenuRelationList;