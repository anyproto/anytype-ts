import React, { forwardRef, useRef, useImperativeHandle, useEffect, KeyboardEvent } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Icon } from 'Component';
import * as I from 'Interface';

const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_SECTION = 28;
const HEIGHT_DESCRIPTION = 56;
const HEIGHT_DIV = 16;
const LIMIT = 10;

const MenuSelect = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, onKeyDown, position, getId, getContainer, close, setHover, getMaxHeight } = props;
	const { data } = param;
	const {
		filter, value, disabled, placeholder, noVirtualisation, noKeys, preventFilter, withAdd,
		canSelectInitial, onSelect, onContext, noClose, noScroll, maxHeight, noFilter, onSwitch, buttons = [],
		useMaxWindowHeight,
	} = data;
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const n = useRef(-1);
	const top = useRef(0);
	const prevItemKeys = useRef('');
	const keydownHandler = useRef(null);
	const sections = data.sections || [];

	useEffect(() => {
		const items = getItems(true);
		const withFilter = isWithFilter();
		
		if (!noKeys) {
			rebind();
		};

		let active = value ? items.find(it => it.id == value) : null;
		if (!active && items.length && !withFilter) {
			active = items.find(it => !it.isSection && !it.isDiv) || items[0];
		};

		if (active && !active.isInitial) {
			window.setTimeout(() => setActive(active, true), 15);
		};

		position();

		return () => unbind();
	}, []);

	useEffect(() => {
		listRef.current?.scrollToPosition(top.current);

		if (n.current == -1) {
			focus();
		};

		// Re-select first item when items change (e.g. external filtering)
		const currentItems = getItems(false);
		const itemKeys = currentItems.map(it => it.id).join(',');

		if (itemKeys !== prevItemKeys.current) {
			prevItemKeys.current = itemKeys;

			const first = currentItems.find(it => !it.isSection && !it.isDiv);
			if (first) {
				n.current = currentItems.indexOf(first);
				window.setTimeout(() => setActive(first, false), 0);
			};
		};

		position();
	});

	useEffect(() => {
		if (!isWithFilter()) {
			return;
		};

		n.current = -1;
		top.current = 0;
		listRef.current?.scrollToPosition(top.current);
	}, [ filter ]);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const focus = () => {
		window.setTimeout(() => filterRef.current?.focus(), 15);
	};

	const getItemsWithoutFilter = () => {
		return U.Menu.prepareForSelect((data.options || [])).filter(it => it);
	};

	const getItems = (withSections: boolean) => {
		let items: any[] = [];

		if (sections && sections.length) {
			for (const section of sections) {
				if (withSections) {
					items.push({ id: section.id, name: section.name, isSection: true });
				};
				items = items.concat(section.children);
			};
		} else {
			items = getItemsWithoutFilter();
		};

		if (data.filter && !preventFilter) {
			const filter = new RegExp(U.String.regexEscape(data.filter), 'gi');

			items = items.filter(it => String(it.name || '').match(filter));
		};

		if (!items.length) {
			items.push({ id: 'empty', name: translate('menuSelectEmpty'), className: 'empty', isEmpty: true });
		};

		return items || [];
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};
	
	const onOver = (e: any, item: any) => {
		if (item.isInitial && !canSelectInitial) {
			return;
		};

		data.onOver?.(e, item);
	};
	
	const onClick = (e: any, item: any) => {
		if (item.isSection || item.disabled || (item.isInitial && !canSelectInitial)) {
			return;
		};

		const cb = () => {
			if (!disabled && onSelect) {
				onSelect(e, item);
			};
		};

		noClose ? cb() : close(cb);
	};

	const onFilterChange = (v: string) => {
		props.param.data.filter = v;
	};

	const onFilterKeyUp = (e: KeyboardEvent, v: string) => {
		const { param } = props;
		const { data } = param;
		const { onFilterKeyUp } = data;

		if (onFilterKeyUp) {
			onFilterKeyUp(e, v);
		};
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) return HEIGHT_DIV;
		if (item.isSection) return HEIGHT_SECTION;
		if (item.withDescription) return HEIGHT_DESCRIPTION;
		if (item.isBig) return HEIGHT_ITEM_BIG;
		return HEIGHT_ITEM;
	};

	const scrollToRow = (_items: any[], index: number) => {
		if (!listRef.current) {
			return;
		};

		const item = _items[index];
		if (!item) {
			return;
		};

		// Use the full rendered list (with sections) to calculate offsets
		const all = getItems(true);
		const rowIndex = all.findIndex(it => it.id == item.id);

		if (rowIndex < 0) {
			return;
		};

		const listHeight = listRef.current.props.height;
		const itemHeight = getRowHeight(all[rowIndex]);

		let offset = 0;
		let total = 0;

		for (let i = 0; i < all.length; ++i) {
			const h = getRowHeight(all[i]);

			if (i < rowIndex) {
				offset += h;
			};
			total += h;
		};

		if (offset + itemHeight < listHeight) {
			offset = 0;
		} else {
			offset -= listHeight / 2 - itemHeight / 2;
		};

		offset = Math.min(offset, total - listHeight + 16);
		offset = Math.max(0, offset);
		listRef.current.scrollToPosition(offset);
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const isWithFilter = () => {
		if (data.withFilter) {
			return true;
		};

		const options = getItemsWithoutFilter().filter(it => !it.isDiv);
		return !noFilter && (options.length > LIMIT);
	};

	const updateOptions = (options: any[]) => {
		data.options = options;
	};

	const isActive = (item: any) => {
		if (undefined !== item.checkbox) {
			return item.checkbox;
		};

		return Relation.getArrayValue(value).includes(String(item.id));
	};

	const beforePosition = () => {
		const items = getItems(true);
		const obj = getContainer();
		const content = U.Dom.select('.content', obj);
		const withFilter = isWithFilter();
		const mh = useMaxWindowHeight ? getMaxHeight?.(keyboard.isPopup()) || 0 : maxHeight;

		if (!noScroll) {
			let height = withFilter ? 52 : 16;
			if (!items.length) {
				height += HEIGHT_ITEM;
			} else {
				height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
			};

			height += buttons.length ? 16 : 0;
			height = buttons.reduce((res: number, current: any) => res + getRowHeight(current), height);

			height = Math.min(mh || 370, height);
			height = Math.max(44, height);

			U.Dom.css(content, { height: `${height}px` });
		};

		U.Dom.toggleClass(obj, 'withFilter', !!withFilter);
		U.Dom.toggleClass(obj, 'withAdd', !!withAdd);
		U.Dom.toggleClass(obj, 'noScroll', !!noScroll);
		U.Dom.toggleClass(obj, 'noVirtualisation', !!noVirtualisation);
		U.Dom.toggleClass(obj, 'withMaxHeight', !!useMaxWindowHeight);
	};

	const items = getItems(true);
	const withFilter = isWithFilter();

	items.forEach((item: any) => {
		const { switchValue } = item;
	});

	const Item = (item) => {
		const cn = [];

		let content = null;
		if (item.id == 'add') {
			content = (
				<div
					id="item-add"
					className="item add"
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={item.style}
				>
					<Icon name="plus/menu" className="plus" />
					<div className="name">{item.name}</div>
				</div>
			);
		} else {
			if (item.className) {
				cn.push(item.className);
			};
			if (item.isInitial) {
				cn.push('isInitial');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};
			if (disabled || item.disabled) {
				cn.push('disabled');
			};

			content = (
				<MenuItemVertical
					{...item}
					icon={item.icon}
					className={cn.join(' ')}
					checkbox={isActive(item)}
					onClick={e => onClick(e, item)}
					onMouseEnter={e => onMouseEnter(e, item)}
					onContextMenu={onContext ? e => onContext(e, item) : undefined}
					style={item.style}
				/>
			);
		};

		return content;
	};

	let content = null;
	if (noVirtualisation) {
		content = (
			<>
				{items.map((item, i) => (
					<Item {...item} key={i} index={i} />
				))}
			</>
		);
	} else {
		const rowRenderer = (param: any) => (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<Item {...items[param.index]} index={param.index} style={param.style} />
			</CellMeasurer>
		);

		content = (
			<InfiniteLoader
				rowCount={items.length}
				loadMoreRows={() => {}}
				isRowLoaded={({ index }) => !!items[index]}
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
								onScroll={onScroll}
								scrollToAlignment="center"
								overscanRowCount={10}
							/>
						)}
					</AutoSizer>
				)}
			</InfiniteLoader>
		);
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
		getItems: () => getItems(false),
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
		updateOptions,
		onSwitch,
		beforePosition,
		scrollToRow,
	}));
	
	return (
		<>
			{withFilter ? (
				<Filter
					ref={filterRef}
					value={filter}
					placeholder={placeholder}
					onChange={onFilterChange}
					onKeyUp={onFilterKeyUp}
					focusOnMount={true}
				/>
			) : ''}

			<div className="items">
				{content}
			</div>

			{buttons.length ? (
				<div className="bottom">
					{buttons.map((item, i) => (
						<MenuItemVertical 
							key={item.id}
							{...item}
							onMouseEnter={() => setHover(item)} 
							onClick={e => onClick(e, item)}
						/>
					))}
				</div>
			) : ''}
		</>
	);
	
});

export default MenuSelect;
