import React, { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Filter, ObjectName } from 'Component';
import { I, S, U, J, keyboard, focus, translate, analytics, Preview } from 'Lib';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;
const HEIGHT_FILTER = 44;
const LIMIT_HEIGHT = 6;

const MenuBlockLink = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, setActive, onKeyDown, getId, position } = props;
	const { data } = param;
	const { type, onChange, filter, onClear, skipIds } = data;
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const n = useRef(-1);
	const top = useRef(0);
	const offset = useRef(0);
	const itemsRef = useRef([]);
	const timeout = useRef(0);
	const [ dummy, setDummy ] = useState(0);

	useEffect(() => {
		if (filter) {
			filterRef.current.setRange({ from: 0, to: filter.length });
		};

		rebind();
		resize();
		load(true);

		return () => {
			window.clearTimeout(timeout.current);
			unbind();
		};
	}, []);

	useEffect(() => {
		if (listRef.current && top.current) {
			listRef.current.scrollToPosition(top.current);
		};

		resize();
		setActive();
	});

	useEffect(() => {
		top.current = 0;
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

	const onFilterChange = (e: any) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			S.Menu.updateData(props.id, { filter: filterRef.current.getValue() });
		}, J.Constant.delay.keyboard);
	};

	const onFilterClear = () => {
		if (type !== null) {
			onClear?.(filter);
			onChange?.(type, '');
		};

		close();
		focus.apply();
		Preview.previewHide();
	};

	const getSections = () => {
		if (!filter) {
			return [];
		};

		const encoded = data.filter.replace(/\s/g, '%20');
		const urls = U.String.getUrlsFromText(encoded);
		const items = [].concat(itemsRef.current);
		const sections: any[] = [];

		if (urls.length) {
			items.unshift({ id: 'link', name: translate('menuBlockLinkSectionsLinkToWebsite'), icon: 'link', url: urls[0] });
		};

		if (items.length) {
			sections.push({ id: I.MarkType.Object, children: items.map(it => ({ ...it, isBig: true })) });
		};

		sections.push({ 
			id: I.MarkType.Link, name: '', children: [
				{ id: 'add', name: U.String.sprintf(translate('commonCreateObjectWithName'), filter), icon: 'plus' },
			] 
		});

		return U.Menu.sectionsMap(sections);
	};

	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			if (items.length && section.children.length) {
				items.push({ isDiv: true });
			};
			if (section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};
	
	const loadMoreRows = ({ startIndex, stopIndex }: any) => {
		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it)) },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
			{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (!filter) {
			itemsRef.current = [];
			setDummy(dummy + 1);
			return;
		};

		U.Subscription.search({
			filters,
			sorts,
			fullText: filter,
			offset: offset.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				return;
			};

			callBack?.(null);

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.records || []);
			setDummy(dummy + 1);
		});
	};

	const onOver = (e: any, item: any) => {
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

		if (item.itemId == 'link') {
			if (item.url) {
				onChange?.(I.MarkType.Link, item.url.value);
			};
		} else
		if (item.itemId == 'add') {
			U.Object.create('', '', { name: filter }, I.BlockPosition.Bottom, '', [ I.ObjectFlag.SelectTemplate ], analytics.route.link, (message: any) => {
				onChange?.(I.MarkType.Object, message.targetId);
			});
		} else {
			onChange?.(I.MarkType.Object, item.itemId);
		};

		close();
	};

	const onScroll = ({ scrollTop }: any) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const getRowHeight = (item: any) => {
		let h = HEIGHT_ITEM;
		if (item.isBig) h = HEIGHT_ITEM_BIG;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	const resize = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 12;

		let height = HEIGHT_FILTER;
		if (filter) {
			height += items.reduce((res: number, item: any) => res + getRowHeight(item), offset);
		};

		obj.css({ height }).toggleClass('initial', !filter);
		position();
	};

	const items = getItems();

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};

		const type = S.Record.getTypeById(item.type);
		const cn = [];

		let object = { ...item, id: item.itemId };
		let content = null;

		if (item.isSection) {
			content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
		} else {
			if ([ 'add', 'link' ].indexOf(item.itemId) >= 0) {
				cn.push(item.itemId);
				object = null;
			};

			if (item.isHidden) {
				cn.push('isHidden');
			};
			if (item.isBig) {
				cn.push('isBig');
			};

			content = (
				<MenuItemVertical 
					id={item.id}
					object={object}
					icon={item.icon}
					name={<ObjectName object={item} withPlural={true} />}
					onMouseEnter={e => onOver(e, item)} 
					onClick={e => onClick(e, item)}
					withDescription={item.isBig}
					description={type ? type.name : undefined}
					style={param.style}
					iconSize={40}
					isDiv={item.isDiv}
					className={cn.join(' ')}
					withPlural={true}
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

	const list = (
		<div className="items">
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
								deferredMeasurmentCache={cache.current}
								rowCount={items.length}
								rowHeight={({ index }) => getRowHeight(items[index])}
								rowRenderer={rowRenderer}
								onRowsRendered={onRowsRendered}
								overscanRowCount={10}
								onScroll={onScroll}
								scrollToAlignment="center"
							/>
						)}
					</AutoSizer>
				)}
			</InfiniteLoader>
		</div>
	);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
		onClick,
		onOver,
	}), []);

	return (
		<div className="wrap">
			<Filter 
				ref={filterRef} 
				placeholder={translate('menuBlockLinkFilterPlaceholder')}
				value={filter}
				onChange={onFilterChange}
				onClear={onFilterClear}
			/>

			{filter ? list : ''}
		</div>
	);
	
}));

export default MenuBlockLink;