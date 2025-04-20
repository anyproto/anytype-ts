import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Filter, Icon, MenuItemVertical, EmptySearch } from 'Component';
import { I, C, S, U, J, analytics, keyboard, Action, translate, Storage } from 'Lib';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 15;

const MenuTypeSuggest = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { space } = S.Common;
	const [ dummy, setDummy ] = useState(0);
	const { param, getId, position, close, setHover, setActive, onKeyDown } = props;
	const { data } = param;
	const { noFilter, skipIds, onMore, onClick, noInstall } = data;
	const itemList = useRef([]);
	const filter = String(data.filter || '');
	const currentFilter = useRef('');
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const n = useRef(0);
	const offset = useRef(0);
	const timeoutFilter = useRef(0);
	const cache = useRef(new CellMeasurerCache());
	const canWrite = U.Space.canMyParticipantWrite();
	const addName = filter ? U.Common.sprintf(translate('menuTypeSuggestCreateTypeFilter'), filter) : translate('menuTypeSuggestCreateType');
	const buttons = (data.buttons || []).map(it => ({ ...it, isButton: true }));
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const getSections = () => {
		const { filter } = data;
		const pinned = Storage.getPinnedTypes();
		const items = U.Common.objectCopy(itemList.current || []).map(it => ({ ...it, object: it }));
		const add = buttons.find(it => it.id == 'add');

		items.sort((c1, c2) => U.Data.sortByPinnedTypes(c1, c2, pinned));

		const library = items.filter(it => (it.spaceId == space));
		const canWrite = U.Space.canMyParticipantWrite();

		let sections: any[] = [
			{ id: 'library', name: translate('commonMyTypes'), children: library },
		];

		if (canWrite && filter && !add) {
			sections.push({ 
				children: [ 
					{ id: 'add', name: U.Common.sprintf(translate('menuTypeSuggestCreateTypeFilter'), filter) },
				], 
			});
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	const getItems = () => {
		const sections = getSections();
		const context = {
			forceUpdate: () => setDummy(dummy + 1),
			props,
		};
		
		let items: any[] = [];

		sections.forEach((section: any, i: number) => {
			if (section.name && section) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};

			items = items.concat(section.children);

			if (i < sections.length - 1) {
				items.push({ isDiv: true });
			};
		});

		if (onMore) {
			items = items.map((item: any) => {
				item.onMore = e => onMore(e, context, item);
				return item;
			});
		};

		return items;
	};

	const items = getItems();

	cache.current = new CellMeasurerCache({
		fixedWidth: true,
		defaultHeight: HEIGHT_ITEM,
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

	const loadMoreRows = () => {
		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		const sorts = [
			{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		let filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
		];
		if (data.filters) {
			filters = filters.concat(data.filters);
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			itemList.current = [];
		};

		U.Data.search({
			filters,
			sorts,
			keys: U.Data.typeRelationKeys(),
			fullText: filter,
			offset: offset.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			itemList.current = itemList.current.concat(message.records || []);
			setDummy(dummy + 1);

			if (callBack) {
				callBack(message);
			};
		});
	};

	const onFilterChange = (v: string) => {
		if (v != currentFilter.current) {
			window.clearTimeout(timeoutFilter.current);
			timeoutFilter.current = window.setTimeout(() => data.filter = v, J.Constant.delay.keyboard);
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		e.persist();

		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClickHandler = (e: any, item: any) => {
		item = U.Common.objectCopy(item);

		if (item.arrow) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const cb = (item: any) => {
			close();

			if (onClick) {
				onClick(S.Detail.mapper(item));
			};
		};
		const setLast = item => U.Object.setLastUsedDate(item.id, U.Date.now());

		if (item.id == 'add') {
			C.ObjectCreateObjectType({ name: filter }, [], S.Common.space, (message: any) => {
				if (!message.error.code) {
					cb(message.details);
					analytics.event('CreateType');
				};
			});
		} else 
		if (item.onClick) {
			item.onClick(e);
		} else {
			if (item.isInstalled || noInstall) {
				cb(item);
				setLast(item);
			} else {
				Action.install(item, true, message => {
					cb(message.details);
					setLast(message.details);
				});
			};
		};
	};

	const onKeyDownHandler = (e: any) => {
		const cmd = keyboard.cmdKey();
		const clipboard = buttons.find(it => it.id == 'clipboard');

		let ret = false;

		if (clipboard && clipboard.onClick) {
			keyboard.shortcut(`${cmd}+v`, e, () => {
				e.preventDefault();

				clipboard.onClick();
				ret = true;
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};

	const getRowHeight = (item: any) => {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	const resize = () => {
		const { data } = param;
		const { noFilter } = data;
		const obj = $(`#${getId()} .content`);
		const offset = 16 + (noFilter ? 0 : 42);
		const buttonHeight = buttons.length ? buttons.reduce((res: number, current: any) => res + getRowHeight(current), 16) : 0;
		const itemsHeight = items.length ? items.reduce((res: number, current: any) => res + getRowHeight(current), 0) : 160;

		let height = offset + itemsHeight + buttonHeight;
		height = Math.min(height, offset + buttonHeight + HEIGHT_ITEM * LIMIT);

		obj.css({ height });
		position();
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;
		const ids = items.map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		Storage.setPinnedTypes(arrayMove(ids, oldIndex, newIndex));
		setDummy(dummy + 1);
	};

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
		const style = {
			...item.style,
			transform: CSS.Transform.toString(transform),
			transition,
		};

		let content = null;
		if (item.id == 'add') {
			content = (
				<div 
					id={`item-${item.id}`}
					className="item add" 
					onMouseEnter={e => onMouseEnter(e, item)} 
					onClick={e => onClickHandler(e, item)} 
				>
					<Icon className="plus" />
					<div className="name">{addName}</div>
				</div>
			);
		} else {
			content = (
				<MenuItemVertical 
					{...item}
					style={{}}
					index={item.index}
					className={item.isHidden ? 'isHidden' : ''}
					onMouseEnter={e => onMouseEnter(e, item)} 
					onClick={e => onClickHandler(e, item)}
					withMore={!!item.onMore}
				/>
			);
		};

		return (
			<div
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				style={style}
			>
				{content}
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
			window.clearTimeout(timeoutFilter.current);
			unbind();
		};
	}, []);

	useEffect(() => {
		n.current = 0;
		offset.current = 0;
		currentFilter.current = filter;
		load(true);
	}, [ filter ]);

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		forceUpdate: () => setDummy(dummy + 1),
		onClick: onClickHandler,
		getData: () => data,
		getListRef: () => listRef.current,
	}), []);

	return (
		<div className="wrap">
			{!noFilter ? (
				<Filter 
					ref={filterRef}
					className="outlined"
					placeholderFocus={translate('menuTypeSuggestFilterTypes')}
					value={filter}
					onChange={onFilterChange} 
					focusOnMount={true}
				/>
			) : ''}

			{items.length ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={onSortEnd}
					modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
				>
					<SortableContext
						items={items.map(item => item.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="items">
							<InfiniteLoader
								rowCount={items.length + 1}
								loadMoreRows={loadMoreRows}
								isRowLoaded={({ index }) => !!items[index]}
								threshold={LIMIT}
							>
								{({ onRowsRendered, registerChild }) => (
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
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</div>
					</SortableContext>
				</DndContext>
			) : <EmptySearch readonly={!canWrite} filter={filter} />}

			{buttons.length ? (
				<div className="bottom">
					{buttons.map((item, i) => {
						if (item.id == 'add') {
							item.name = addName;
						};

						return (
							<MenuItemVertical 
								key={item.id}
								{...item}
								onMouseEnter={() => setHover(item)} 
								onClick={e => item.onClick ? item.onClick(e) : onClickHandler(e, item)}
							/>
						);
					})}
				</div>
			) : ''}
		</div>
	);

}));

export default MenuTypeSuggest;