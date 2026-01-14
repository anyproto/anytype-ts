import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { MenuItemVertical, Loader, ObjectName, ObjectType, EmptySearch } from 'Component';
import { I, S, U, J, C, keyboard, Mark, translate, analytics } from 'Lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT_HEIGHT = 10;

const MenuBlockMention = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, close, position } = props;
	const { data, className, classNameWrap } = param;
	const { pronounId, withCaption, canAdd, skipIds, onChange } = data;
	const { filterText, space } = S.Common;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));
	const listRef = useRef(null);
	const itemsRef = useRef([]);
	const n = useRef(0);
	const offset = useRef(0);

	useEffect(() => {
		rebind();
		resize();
		load(true);

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		rebind();
		resize();
	});

	useEffect(() => {
		n.current = 0;
		offset.current = 0;
		load(true);
	}, [ filterText ]);
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => props.onKeyDown(e));
		window.setTimeout(() => props.setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getSections = () => {
		const filter = S.Common.filterText;
		const sections: any[] = [];
		
		let items = U.Common.objectCopy(itemsRef.current);

		const dates = items.filter(it => U.Object.isDateLayout(it.layout));

		items = items.filter(it => !U.Object.isDateLayout(it.layout));
		
		const length = items.length;
		
		if (dates.length) {
			sections.push({ 
				id: 'date', 
				name: translate('commonDates'), 
				children: [
					...dates,
					{ id: 'selectDate', icon: 'relation c-date', name: translate(`placeholderCell${I.RelationType.Date}`) },
					{ isDiv: true },
				]
			});
		};

		if (length) {
			sections.push({ id: I.MarkType.Object, name: translate('commonObjects'), children: items.filter(it => !U.Object.isDateLayout(it.layout)) });
		};

		if (filter && canAdd) {
			const children: any[] = [
				{ id: 'add', icon: 'plus', name: U.String.sprintf(translate('commonCreateObjectWithName'), filter) }
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

		U.Subscription.search({
			filters,
			sorts,
			fullText: filterText,
			offset: offset.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.records || []);
			setDummy(dummy + 1);

			callBack?.(null);
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
		const cb = (object: any) => {
			const name = U.String.shorten(U.Object.name(object, true), J.Constant.limit.string.mention);
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
			const name = S.Common.filterText;

			U.Object.create('', '', { name }, I.BlockPosition.Bottom, '', [ I.ObjectFlag.SelectTemplate ], analytics.route.mention, (message: any) => {
				cb(message.details);
			});
		} else 
		if (item.id == 'selectDate') {
			S.Menu.open('calendar', {
				element: `#${getId()} #item-${item.id}`,
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

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);

		let height = 16;
		if (!items.length) {
			height += HEIGHT_ITEM;
		} else {
			height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
		};

		obj.css({ height });
		position();
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
					icon={item.icon}
					name={<ObjectName object={item} withPlural={true} withPronoun={withPronoun} />}
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
	
}));

export default MenuBlockMention;