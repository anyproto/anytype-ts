import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon, Switch } from 'Component';
import * as I from 'Interface';

const HEIGHT = 28;
const LIMIT = 20;

const MenuRelationList = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getSize, setHover, setActive, onKeyDown, position } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, readonly, getView, onAdd } = data;
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
	const keydownHandler = useRef<(e: any) => void>(null);
	const keyHandlerRef = useRef<(e: any) => void>(null);

	const rebind = () => {
		unbind();

		keydownHandler.current = (e: any) => keyHandlerRef.current?.(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
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

	keyHandlerRef.current = onKeyDownHandler;

	const onAddHandler = (e: any) => {
		const view = getView();
		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const object = S.Detail.get(rootId, rootId);

		unbind();

		S.Menu.open('relationSuggest', {
			className,
			classNameWrap,
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Top,
			offsetY: 36,
			noAnimation: true,
			noFlipY: true,
			rebind,
			parentId: getId(),
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

		unbind();

		S.Menu.open('dataviewRelationEdit', {
			className,
			classNameWrap,
			element: `#${getId()} #item-${U.Common.esc(item.relationKey)}`,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			rebind,
			parentId: getId(),
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
		keyboard.disableSelection(false);

		const view = getView();
		if (!view) {
			return;
		};

		const { active, over } = result;
		if (!active || !over) {
			return;
		};

		const oldIndex = view.relations.findIndex(it => it.relationKey == active.id);
		const newIndex = view.relations.findIndex(it => it.relationKey == over.id);

		view.relations = arrayMove(view.relations, oldIndex, newIndex);
		n.current = newIndex;

		C.BlockDataviewViewRelationSort(rootId, blockId, view.id, view.relations.map((it: any) => it && it.relationKey));
	};

	const onSwitch = (e: any, item: any, v: boolean) => {
		const view = getView();
		const object = S.Detail.get(rootId, rootId);
		const relation = S.Record.getRelationByKey(item.relationKey);
		const vr = view.getRelation(item.relationKey);

		if (vr) {
			vr.isVisible = v;
		};

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

	const beforePosition = () => {
		const obj = U.Dom.select('.content', U.Dom.get(getId()));
		const offset = !isReadonly ? 62 : 16;
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + offset));

		U.Dom.css(obj, { height: `${height}px` });
	};

	const items = getItems();
	const view = getView();

	items.map((it: any) => {
		const { format, name } = it.relation;
	});

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: isReadonly });
		const isName = item.relationKey == 'name';
		const isDescription = item.relationKey == 'description';
		const isListRegular = (view.type == I.ViewType.List) && (view.listSize == I.ListSize.Regular);
		const canHide = !isReadonly && (!isName || (view.type == I.ViewType.Gallery)) && !(isDescription && isListRegular);
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
		if (isDragging) {
			cn.push('isDragging');
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
				{!isReadonly ? <Icon name="common/dnd" /> : ''}
				<span className="clickable" onClick={e => onClick(e, item)}>
					<Icon name={Relation.registryName(item.relation.relationKey, item.relation.format)} />
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
		setActive(null, true);
		position();

		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		beforePosition,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		getListRef: () => listRef.current,
		onSortEnd,
		onSwitch,
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
						onClick={onAddHandler} 
						onMouseEnter={() => setHover({ id: 'add' })} 
						onMouseLeave={() => setHover()}
					>
						<Icon name="plus/menu" className="plus" />
						<div className="name">{translate('commonAddRelation')}</div>
					</div>
				</div>
			) : ''}
		</div>
	);

});

export default MenuRelationList;