import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import raf from 'raf';

import { MenuItemVertical, Loader, ObjectName, ObjectType, EmptySearch } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import * as I from 'Interface';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT_HEIGHT = 10;

const MenuBlockMention = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getContainer, close, position, setActive } = props;
	const { data, className, classNameWrap } = param;
	const { pronounId, withCaption, canAdd, skipIds, onChange } = data;
	const { space } = S.Common;
	const parsedFilter = Mark.parseMentionFilter(S.Common.filter.text);
	const searchQuery = parsedFilter.query;
	const aliasText = parsedFilter.alias;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));
	const listRef = useRef(null);
	const itemsRef = useRef([]);
	const searchIdRef = useRef(0);
	const n = useRef(0);
	const offset = useRef(0);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		n.current = 0;
		offset.current = 0;
		load(true);
	}, [ searchQuery ]);

	useEffect(() => {
		cache.current.clearAll();
		listRef.current?.forceUpdateGrid?.();
		setDummy(d => d + 1);
		position();
	}, [ aliasText ]);

	const getAutoSelectCandidate = () => {
		const currentItems = getItems();
		if ((n.current > 0) && currentItems[n.current] && !currentItems[n.current].isDiv && ![ 'add', 'selectDate' ].includes(currentItems[n.current].id)) {
			return currentItems[n.current];
		};

		const currentQuery = Mark.parseMentionFilter(S.Common.filter.text).query.toLowerCase();
		if (currentQuery) {
			const exactMatch = currentItems.find(it => !it.isDiv && ![ 'add', 'selectDate' ].includes(it.id) && !U.Object.isDateLayout(it.layout) && (U.Object.name(it, true).trim().toLowerCase() === currentQuery));
			if (exactMatch) {
				return exactMatch;
			};
		};

		const nonDateObject = currentItems.find(it => !it.isDiv && ![ 'add', 'selectDate' ].includes(it.id) && !U.Object.isDateLayout(it.layout));
		if (nonDateObject) {
			return nonDateObject;
		};

		return currentItems.find(it => !it.isDiv && ![ 'add', 'selectDate' ].includes(it.id)) || null;
	};

	// Closed bracket ([[Target]], [Target|Alias]): link to the best match, or —
	// when nothing matches — close the menu and leave the typed text as is, so
	// the menu never swallows the text typed after it
	const onClosedFilter = () => {
		const candidate = getAutoSelectCandidate();
		if (candidate) {
			onClick(new MouseEvent('click'), candidate);
		} else {
			close();
		};
	};

	useEffect(() => {
		if (parsedFilter.isClosed && !isLoading) {
			onClosedFilter();
		};
	}, [ parsedFilter.isClosed, isLoading ]);

	const keydownHandler = useRef(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => props.onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		raf(() => raf(() => setActive()));
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const getSections = () => {
		const { query, alias } = Mark.parseMentionFilter(S.Common.filter.text);
		const filter = query || alias;
		const sections: any[] = [];
		
		let items = U.Common.objectCopy(itemsRef.current);

		const dates = items.filter(it => U.Object.isDateLayout(it.layout));

		items = items.filter(it => !U.Object.isDateLayout(it.layout));

		if (query) {
			const queryLower = query.trim().toLowerCase();
			items.sort((a: any, b: any) => {
				const aExact = (U.Object.name(a, true).trim().toLowerCase() === queryLower) ? 1 : 0;
				const bExact = (U.Object.name(b, true).trim().toLowerCase() === queryLower) ? 1 : 0;
				return bExact - aExact;
			});
		};
		
		const length = items.length;
		
		if (dates.length) {
			sections.push({ 
				id: 'date', 
				name: translate('commonDates'), 
				children: [
					...dates,
					{ id: 'selectDate', iconParam: { name: 'relation/date' }, name: translate(`placeholderCell${I.RelationType.Date}`) },
					{ isDiv: true },
				]
			});
		};

		if (length) {
			sections.push({ id: I.MarkType.Object, name: translate('commonObjects'), children: items.filter(it => !U.Object.isDateLayout(it.layout)) });
		};

		if (filter && canAdd) {
			const children: any[] = [
				{ id: 'add', iconParam: { name: 'plus/menu' }, name: U.String.sprintf(translate('commonCreateObjectWithName'), filter) }
			];

			if (length) {
				children.unshift({ isDiv: true });
			};

			sections.push({ children });
		};

		return sections;
	};

	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	const load = (clear: boolean, callBack?: (value: any) => void) => {
		const skipLayouts = U.Object.getSystemLayouts().filter(it => !U.Object.isDateLayout(it) && !U.Object.isTypeLayout(it));
		const sorts = [
			{ relationKey: '_final_score', type: I.SortType.Desc },
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		let filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts },
		];

		if (data.filters && data.filters.length) {
			filters = filters.concat(data.filters);
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			setIsLoading(true);
		};

		const reqId = clear ? ++searchIdRef.current : searchIdRef.current;
		const currentQuery = Mark.parseMentionFilter(S.Common.filter.text).query;

		U.Subscription.search({
			filters,
			sorts,
			keys: J.Relation.default.concat([ '_final_score' ]),
			fullText: currentQuery,
			offset: offset.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			if (reqId !== searchIdRef.current) {
				return;
			};

			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.records || []);
			cache.current.clearAll();
			listRef.current?.forceUpdateGrid?.();
			setDummy(d => d + 1);
			position();
			raf(() => raf(() => setActive()));
			callBack?.(null);

			if (clear && Mark.parseMentionFilter(S.Common.filter.text).isClosed) {
				onClosedFilter();
			};
		});
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			props.setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			props.close();
			return;
		};

		const { from } = S.Common.filter;
		const { query, alias } = Mark.parseMentionFilter(S.Common.filter.text);
		const cb = (object: any) => {
			const rawName = alias || U.Object.name(object, true);
			const name = U.String.shorten(rawName, J.Constant.limit.string.mention);
			const to = from + name.length;

			let marks = U.Common.objectCopy(data.marks || []);
			marks = Mark.adjust(marks, from, name.length);
			marks = Mark.toggle(marks, { 
				type: I.MarkType.Mention, 
				param: object.id, 
				range: { from, to },
			});

			onChange(object, name + ' ', marks, from, to + 1);
			close();

			analytics.event('ChangeTextStyle', { type: I.MarkType.Mention, count: 1, objectType: object.type });
		};

		if (item.id == 'add') {
			const name = query || alias || S.Common.filterText;

			U.Object.create('', '', { name }, I.BlockPosition.Bottom, '', [ I.ObjectFlag.SelectTemplate ], analytics.route.mention, (message: any) => {
				cb(message.details);
			});
		} else 
		if (item.id == 'selectDate') {
			S.Menu.open('calendar', {
				element: `#${getId()} #item-${U.Common.esc(item.id)}`,
				horizontal: I.MenuDirection.Center,
				rebind: rebind,
				parentId: props.id,
				className,
				classNameWrap,
				data: { 
					canEdit: true,
					canClear: false,
					value: U.Date.now(),
					relationKey: J.Relation.key.mention,
					onChange: (value: number) => {
						C.ObjectDateByTimestamp(space, value, (message: any) => {
							if (!message.error.code) {
								cb(message.details);
							};
						});
					},
				},
			});

		} else {
			cb(item);
		};
	};

	const getRowHeight = (item: any) => {
		let h = HEIGHT_ITEM;
		if (!item) {
			return h;
		};

		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	const beforePosition = () => {
		const items = getItems();

		let height = 16;
		if (!items.length) {
			height += HEIGHT_ITEM;
		} else {
			height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
		};

		U.Dom.css(U.Dom.select('.content', getContainer()), { height: `${height}px` });
	};

	const items = getItems();

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};			

		const type = item.type ? S.Record.getTypeById(item.type) : null;
		const object = ![ 'add', 'selectDate' ].includes(item.id) ? item : null;
		const withPronoun = pronounId && (pronounId == item.id);
		const cn = [];

		if (item.id == 'add') {
			cn.push('add');
		};
		if (item.isHidden) {
			cn.push('isHidden');
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<MenuItemVertical
					id={item.id}
					object={object}
					name={<ObjectName object={item} alias={object ? aliasText : ''} withPlural={true} withPronoun={withPronoun} />}
					onMouseEnter={e => onOver(e, item)} 
					onClick={e => onClick(e, item)}
					caption={withCaption && type ? <ObjectType object={type} /> : ''}
					style={param.style}
					isDiv={item.isDiv}
					className={cn.join(' ')}
					withPlural={true}
					withPronoun={withPronoun}
				/>
			</CellMeasurer>
		);
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		beforePosition,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		onClick,
		onOver,
	}), []);

	return (
		<>
			{!items.length && !isLoading ? (
				<EmptySearch text={translate('commonNothingFound')} />
			) : ''}

			{items.length ? (
				<div className="items">
					{isLoading ? <Loader /> : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={loadMoreRows}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={listRef}
											width={width}
											height={height}
											deferredMeasurementCache={cache.current}
											rowCount={items.length}
											rowHeight={({ index }) => getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>
			) : ''}
		</>
	);
	
});

export default MenuBlockMention;