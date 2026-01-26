import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Icon, Loader, ObjectName, ObjectType } from 'Component';
import { I, S, U, J, keyboard, Relation, translate, analytics } from 'Lib';

const LIMIT_HEIGHT = 20;
const LIMIT_TYPE = 2;

const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_EMPTY = 96;
const HEIGHT_DIV = 16;

const MenuDataviewObjectList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, onKeyDown, close, position, getId } = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const { data } = param;
	const {
		filter, noFilter, cellRef, canEdit, onChange, maxCount, canAdd, nameCreate, dataChange,
		placeholderFocus = translate('commonFilterObjects'),
	} = data;
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const topRef = useRef(0);
	const itemsRef = useRef<any[]>([]);
	const offsetRef = useRef(0);
	const n = useRef(-1);

	useEffect(() => {
		rebind();
		resize();
		focus();
		load(true);
	}, []);

	useEffect(() => {
		topRef.current = 0;
		offsetRef.current = 0;
		n.current = -1;
		load(true);
	}, [ filter ]);

	useEffect(() => {
		const items = getItems();

		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};

		resize();
		focus();
		setActive(items[n.current], false);
	});
	
	const focus = () => {
		window.setTimeout(() => filterRef.current?.focus(), 15);
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onKeyDownHandler = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		keyboard.shortcut('arrowup, arrowdown', e, () => {
			if (cellRef) {
				cellRef.blur();
			};
		});

		onKeyDown(e);
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		if (isLoading) {
			return;
		};

		const types = getTypes();
		const value = Relation.getArrayValue(data.value);

		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(data.filters || []);
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		if (types && types.length) {
			filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.In, value: types.map(it => it.uniqueKey) });
		};

		if (clear) {
			setIsLoading(true);
		};

		let limit = J.Constant.limit.menuRecords;

		if (!canEdit) {
			limit = 0;
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value });
		};

		U.Subscription.search({
			filters,
			sorts,
			fullText: filter,
			offset: offsetRef.current,
			limit,
		}, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			callBack?.(message);

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.records || []);
			setDummy(dummy + 1);
		});
	};

	const getItems = () => {
		const value = Relation.getArrayValue(data.value);
		const typeNames = getTypeNames();

		let ret = U.Common.objectCopy(itemsRef.current);

		if (dataChange) {
			ret = dataChange(this, ret);
		};

		if (canEdit) {
			ret = ret.filter(it => !value.includes(it.id));
		};
		if (typeNames) {
			ret.unshift({ isSection: true, name: typeNames });
		};

		if (data.filter && canAdd && canEdit) {
			if (ret.length || typeNames) {
				ret.push({ isDiv: true });
			};
			ret.push({ id: 'add', name: U.String.sprintf(nameCreate || translate('commonCreateObjectWithName'), data.filter) });
		};

		return ret;
	};

	const getTypes = () => {
		return (data.types || []).map(id => S.Record.getTypeById(id)).filter(it => it);
	};

	const getTypeNames = (): string => {
		const types = getTypes();

		if (!types || !types.length) {
			return '';
		};

		const names = types.map(it => it.name);
		const l = names.length;

		if (l > LIMIT_TYPE) {
			const more = l - LIMIT_TYPE;

			names.splice(LIMIT_TYPE, more);
			names.push(`+${more}`);
		};

		return `${U.Common.plural(l, translate('pluralObjectType'))}: ${names.join(', ')}`;
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offsetRef.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const onFilterChange = (v: string) => {
		data.filter = v;
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};
	
	const onClick = (e: any, item: any) => {
		const relation = data.relation.get();
		const addParam = data.addParam || {};

		e.preventDefault();
		e.stopPropagation();

		if (!item || !relation) {
			close();
			return;
		};

		if (!canEdit) {
			U.Object.openConfig(e, item);
			return;
		};

		cellRef?.clear();

		const cb = (id: string) => {
			if (!id) {
				return;
			};

			let value = U.Common.arrayUnique(Relation.getArrayValue(data.value).concat([ id ]));
			if (maxCount) {
				value = value.slice(value.length - maxCount, value.length);
			};

			onChange(value, () => {
				S.Menu.updateData(props.id, { value });
				S.Menu.updateData('dataviewObjectValues', { value });

				position();
			});
		};

		if (item.id == 'add') {
			const param = Relation.getParamForNewObject(filter, relation);
			const details = Object.assign(param.details, addParam.details || {});

			U.Object.create('', '', details, I.BlockPosition.Bottom, '', param.flags, analytics.route.relation, (message: any) => {
				cb(message.targetId);
				close();
			});
		} else {
			cb(item.id);
		};
	};

	const getRowHeight = (item: any) => {
		let h = HEIGHT_ITEM;
		if (item.isBig) h = HEIGHT_ITEM_BIG;
		if (item.isEmpty) h = HEIGHT_EMPTY;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);

		let offset = 16;

		if (!noFilter) {
			offset += 42;
		};
		if (!items.length) {
			offset += HEIGHT_EMPTY;
		};

		const itemsHeight = items.reduce((res: number, current: any) => res + getRowHeight(current), offset);
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(300, itemsHeight));

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

		let content = null;
		if (item.isDiv) {
			content = (
				<div className="separator" style={param.style}>
					<div className="inner" />
				</div>
			);
		} else
		if (item.isSection) {
			content = (<div className="sectionName" style={param.style}>{item.name}</div>);
		} else {
			content = (
				<MenuItemVertical 
					id={item.id}
					object={item.isSystem ? null : item}
					icon={item.icon}
					name={<ObjectName object={item} />}
					onMouseEnter={e => onOver(e, item)} 
					onClick={e => onClick(e, item)}
					caption={type ? <ObjectType object={type} /> : ''}
					style={param.style}
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
		onClick,
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
	}), []);

	return (
		<div className={[ 'wrap', (!noFilter ? 'withFilter' : '') ].join(' ')}>
			{!noFilter ? (
				<Filter
					className="outlined"
					icon="search"
					ref={filterRef} 
					placeholderFocus={placeholderFocus}
					value={filter}
					onChange={onFilterChange} 
				/>
			) : ''}

			{isLoading ? <Loader /> : ''}

			{cache.current && items.length && !isLoading ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length + 1}
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
										overscanRowCount={LIMIT_HEIGHT}
										onScroll={onScroll}
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

export default MenuDataviewObjectList;
