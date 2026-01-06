import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, MenuItemVertical, Loader, EmptySearch, ObjectName, ObjectType } from 'Component';
import { I, S, U, J, Relation, keyboard, translate, Action, C } from 'Lib';
import { set } from 'lodash';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const MENU_ID = 'dataviewFileValues';
const LIMIT = 20;

const MenuDataviewFileList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setHover, setActive, close, onKeyDown, position } = props;
	const { data } = param;
	const { onChange, maxCount } = data;
	const [ dummy, setDummy ] = useState(0);
	const n = useRef(-1);
	const listRef = useRef(null);
	const itemsRef = useRef([]);
	const filterInputRef = useRef(null);
	const timeoutRef = useRef(0);
	const offsetRef = useRef(0);
	const topRef = useRef(0);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));

	const filter = String(data.filter || '');

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			topRef.current = scrollTop;
		};
	};

	const getItems = () => {
		const value = Relation.getArrayValue(data.value);

		return U.Common.objectCopy(itemsRef.current).filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted && !value.includes(it.id));
	};

	const reload = () => {
		n.current = -1;
		offsetRef.current = 0;
		load(true);
	};
	
	const load = (clear: boolean, callBack?: (message: any) => void) => {
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		let filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() }
		];
		if (data.filters) {
			filters = Object.assign(data.filters);
		};

		U.Subscription.search({
			filters,
			sorts,
			fullText: filter,
			offset: offsetRef.current,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
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

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offsetRef.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => {
			data.filter = v;
		}, J.Constant.delay.keyboard);
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

		onChangeHandler(item.id);
	};

	const onUpload = () => {
		Action.openFileDialog({}, paths => {
			C.FileUpload(S.Common.space, '', paths[0], I.FileType.None, {}, false, '', 0, (message: any) => {
				if (!message.error.code) {
					onChangeHandler(message.objectId);
					reload();
				};
			});
		});
	};

	const onChangeHandler = (id) => {
		let value = U.Common.arrayUnique(Relation.getArrayValue(data.value).concat(id));
		if (maxCount) {
			value = value.slice(value.length - maxCount, value.length);
		};

		onChange(value, () => {
			S.Menu.updateData(props.id, { value });
			S.Menu.updateData(MENU_ID, { value });
			position();
		});
	};

	const getRowHeight = (item: any) => {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	const resize = () => {
		const obj = $(`#${getId()} .content`);
		const offset = 100;
		const itemsHeight = items.reduce((res: number, current: any) => res + getRowHeight(current), offset);
		const height = Math.max(HEIGHT_ITEM + offset, Math.min(360, itemsHeight));

		obj.css({ height: (items.length ? height : '') });
		position();
	};

	const items = getItems();

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		
		if (!item) {
			return null;
		};

		const type = S.Record.getTypeById(item.type);

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<MenuItemVertical 
					{...item}
					object={item}
					name={<ObjectName object={item} />}
					onMouseEnter={e => onOver(e, item)} 
					onClick={e => onClick(e, item)}
					caption={<ObjectType object={type} />}
					style={param.style}
				/>
			</CellMeasurer>
		);
	};

	useEffect(() => {
		rebind();
		resize();
		load(true);

		return () => {
			window.clearTimeout(timeoutRef.current);
			unbind();
		};
	}, []);

	useEffect(() => {
		if (listRef.current && topRef.current) {
			listRef.current.scrollToPosition(topRef.current);
		};

		resize();
		setActive();
	});

	useEffect(() => {
		topRef.current = 0;
		reload();
	}, [ filter ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getFilterRef: () => filterInputRef.current,
		getListRef: () => listRef.current,
		onClick,
		onOver,
	}), []);

	return (
		<div className="wrap">
			<Filter
				ref={filterInputRef}
				className="outlined"
				placeholderFocus={translate('commonFilterObjects')}
				value={filter}
				onChange={onFilterChange} 
				focusOnMount={true}
			/>

			{!items.length ? (
				<EmptySearch filter={filter} />
			) : ''}

			{cache.current && items.length ? (
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
										deferredMeasurmentCache={cache}
										rowCount={items.length}
										rowHeight={({ index }) => getRowHeight(items[index])}
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
			) : ''}

			<div className="bottom">
				<div className="line" />
				<MenuItemVertical 
					id="upload" 
					icon="plus" 
					name={translate('commonUpload')} 
					onClick={onUpload}
					onMouseEnter={() => setHover({ id: 'upload' })}
					onMouseLeave={() => setHover()}
				/>
			</div>
		</div>
	);
	
}));

export default MenuDataviewFileList;