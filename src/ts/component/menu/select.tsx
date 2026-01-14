import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Label, Icon } from 'Component';
import { I, U, Relation, keyboard, translate } from 'Lib';

const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_SECTION = 28;
const HEIGHT_DESCRIPTION = 56;
const HEIGHT_DIV = 16;
const LIMIT = 10;

const MenuSelect = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, onKeyDown, position, getId, close } = props;
	const { data } = param;
	const { 
		filter, value, disabled, placeholder, noVirtualisation, menuLabel, noKeys, preventFilter, withAdd, 
		canSelectInitial, onSelect, noClose, noScroll, maxHeight, noFilter, onSwitch,
	} = data;
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const n = useRef(-1);
	const top = useRef(0);
	const sections = data.sections || [];

	useEffect(() => {
		const items = getItems(true);
		const withFilter = isWithFilter();
		
		if (!noKeys) {
			rebind();
		};

		let active = value ? items.find(it => it.id == value) : null;
		if (!active && items.length && !withFilter) {
			active = items[0];
		};

		if (active && !active.isInitial) {
			window.setTimeout(() => setActive(active, true), 15);
		};

		resize();
	}, []);

	useEffect(() => {
		listRef.current?.scrollToPosition(top.current);

		if (n.current == -1) {
			focus();
		};

		resize();
	});

	useEffect(() => {
		if (!withFilter) {
			return;
		};
		
		n.current = -1;
		top.current = 0;
		listRef.current?.scrollToPosition(top.current);
	}, [ filter ]);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
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

		if (withAdd) {
			items = items.concat([
				{ isDiv: true },
				{ id: 'add', name: translate('commonAddRelation') }
			]);
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

	const onFilterKeyUp = (e: React.KeyboardEvent, v: string) => {
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

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const isWithFilter = () => {
		if (withFilter) {
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

	const resize = () => {
		const items = getItems(true);
		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const withFilter = isWithFilter();
		
		if (!noScroll) {
			let height = 0;
			if (withFilter) {
				height += 52;
			};
			if (!withFilter) {
				height += 16;
			};

			if (!items.length) {
				height += HEIGHT_ITEM;
			} else {
				height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
			};

			height = Math.min(maxHeight || 370, height);
			height = Math.max(44, height);

			content.css({ height });
		};

		obj.toggleClass('withFilter', Boolean(withFilter));
		obj.toggleClass('withAdd', Boolean(withAdd));
		obj.toggleClass('noScroll', Boolean(noScroll));
		obj.toggleClass('noVirtualisation', Boolean(noVirtualisation));

		position();
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
					<Icon className="plus" />
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
	}));
	
	return (
		<>
			{withFilter ? (
				<Filter 
					ref={filterRef}
					className="outlined"
					value={filter}
					placeholder={placeholder}
					onChange={onFilterChange}
					onKeyUp={onFilterKeyUp}
					focusOnMount={true}
				/>
			) : ''}

			{menuLabel ? (
				<Label className="menuLabel" text={menuLabel} />
			) : ''}
			
			<div className="items">
				{content}
			</div>
		</>
	);
	
}));

export default MenuSelect;