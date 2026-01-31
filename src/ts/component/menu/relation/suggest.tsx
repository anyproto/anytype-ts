import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, MenuItemVertical, EmptySearch } from 'Component';
import { I, S, U, J, analytics, keyboard, Relation, translate } from 'Lib';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuRelationSuggest = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, onKeyDown, setActive, getId, getSize, position } = props;
	const { data, className, classNameWrap } = param;
	const { filter, blockId, noFilter, skipCreate, rootId, menuIdEdit, addCommand } = data;
	const types = data.types || [];
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const canWrite = U.Space.canMyParticipantWrite();
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const n = useRef(1);
	const offset = useRef(0);
	const timeout = useRef(0);
	const itemsRef = useRef([]);

	useEffect(() => {
		rebind();
		resize();
		load(true);

		return () => {
			unbind();
			S.Menu.closeAll([ 'searchObject' ]);
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();
	});

	useEffect(() => {
		n.current = -1;
		offset.current = 0;
		load(true);
	}, [ filter ]);
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
			{ relationKey: 'relationKey', condition: I.FilterCondition.NotIn, value: data.skipKeys || [] },
		];
		const sorts = [
			{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (types.length) {
			filters.push({ relationKey: 'relationFormat', condition: I.FilterCondition.In, value: types });
		};

		if (clear) {
			setIsLoading(true);
			itemsRef.current = [];
		};

		U.Subscription.search({
			filters,
			sorts,
			keys: J.Relation.relation,
			fullText: filter,
			offset: offset.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			setIsLoading(false);
			itemsRef.current = itemsRef.current.concat(message.records || []);
			setDummy(dummy + 1);
			callBack?.(message);
		});
	};

	const getSections = () => {
		const reg = new RegExp(U.String.regexEscape(data.filter), 'gi');
		const systemKeys = Relation.systemKeys();
		const items = U.Common.objectCopy(itemsRef.current || []).map(it => ({ ...it, object: it }));
		const library = items.filter(it => !systemKeys.includes(it.relationKey));
		const system = items.filter(it => systemKeys.includes(it.relationKey));
		const types = data.types || [];
		const typesList = U.Menu.getRelationTypes().filter(it => {
			if (types.length && !types.includes(Number(it.id))) {
				return false;
			};

			return it.name.match(reg);
		}).map(it => ({ ...it, isType: true }));

		let sections: any[] = [
			canWrite && !skipCreate ? { id: 'create', name: translate('menuRelationSuggestCreateNew'), children: typesList } : null,
			{ id: 'library', name: translate('commonMyRelations'), children: library },
			{ id: 'system', name: translate('commonSystemRelations'), children: system },
		];

		if (canWrite && data.filter) {
			sections.unshift({ 
				children: [ 
					{ id: 'add', name: U.String.sprintf(translate('menuRelationSuggestCreateRelation'), data.filter) },
				],
			});
		};

		sections = sections.filter((section: any) => {
			if (!section) {
				return false;
			};

			section.children = section.children.filter(it => it);
			section.children = U.Menu.prepareForSelect(section.children);
			return section.children.length > 0;
		});

		return sections;
	};
	
	const getItems = () => {
		const sections = getSections();
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

		return items;
	};

	const onFilterChange = (v: string) => {
		if (v != filter) {
			window.clearTimeout(timeout.current);
			timeout.current = window.setTimeout(() => data.filter = v, J.Constant.delay.keyboard);
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		e.persist();

		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		if (item.arrow) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);
		const onAdd = (item: any) => {
			S.Menu.close(menuIdEdit, () => close());

			if (addCommand && item) {
				addCommand(rootId, blockId, item);
			};

			U.Object.setLastUsedDate(item.id, U.Date.now());
		};

		if (item.isType || (item.id == 'add')) {
			S.Menu.open(menuIdEdit, { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				offsetY: -80,
				noAnimation: true,
				className,
				classNameWrap,
				rebind,
				parentId: props.id,
				data: {
					...data,
					canEdit: true,
					addParam: { 
						name: filter,
						format: item.isType ? item.id : I.RelationType.LongText,
					},
					onChange: () => close(),
					addCommand: (rootId: string, blockId: string, item: any) => onAdd(item),
				}
			});
		} else {
			onAdd(item);
			analytics.event('AddExistingRelation', { format: item.format, type: ref, objectType: object.type, relationKey: item.relationKey });
		};
	};

	const onEdit = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open(menuIdEdit, { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			noAnimation: true,
			className,
			classNameWrap,
			data: {
				...data,
				rootId,
				relationId: item.id,
				noUnlink: true,
				saveCommand: () => load(true),
			}
		});
	};

	const getRowHeight = (item: any) => {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);

		let height = 16 + (noFilter ? 0 : 40);
		if (!items.length) {
			height = 160;
		} else {
			height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
		};
		height = Math.min(height, 376);

		obj.css({ height });
		position();
	};

	const items = getItems();

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		let content = null;
		if (item.id == 'add') {
			content = (
				<div 
					id="item-add" 
					className="item add" 
					onMouseEnter={e => onMouseEnter(e, item)} 
					onClick={e => onClick(e, item)} 
					style={param.style}
				>
					<Icon className="plus" />
					<div className="name">{item.name}</div>
				</div>
			);
		} else {
			content = (
				<MenuItemVertical 
					{...item}
					index={param.index}
					className={item.isHidden ? 'isHidden' : ''}
					style={param.style}
					onMouseEnter={e => onMouseEnter(e, item)} 
					onClick={e => onClick(e, item)}
					withMore={true}
					onMore={e => onEdit(e, item)}
				/>
			);
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

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		onClick,
	}), []);

	return (
		<div className="wrap">
			{!noFilter ? (
				<Filter 
					ref={filterRef}
					className="outlined"
					placeholderFocus={translate('menuRelationSuggestFilterOrCreateRelation')}
					value={filter}
					onChange={onFilterChange}
					focusOnMount={true}
				/>
			) : ''}

			{!items.length && !isLoading ? (
				<EmptySearch readonly={!canWrite} filter={filter} />
			) : ''}

			{items.length && !isLoading ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length + 1}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => !!items[index]}
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
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			) : ''}
		</div>
	);
	
}));

export default MenuRelationSuggest;