import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import { Checkbox, Filter, Icon, IconObject, Loader, ObjectName, EmptySearch, ObjectDescription, Label } from 'Component';
import { I, S, U, J, translate } from 'Lib';

interface Props {
	subId?: string;
	rowLength?: number;
	buttons: I.ButtonComponent[];
	info?: I.ObjectManagerItemInfo,
	iconSize?: number;
	textEmpty?: string;
	filters?: I.Filter[];
	sorts?: I.Sort[];
	rowHeight?: number;
	sources?: string[];
	collectionId?: string;
	isReadonly?: boolean;
	ignoreArchived?: boolean;
	ignoreHidden?: boolean;
	resize?: () => void;
	onAfterLoad?: (message: any) => void;
};

interface ListManagerRefProps {
	getSelected(): string[];
	setSelection(ids: string[]): void;
	selectionClear(): void;
};

const ListManager = observer(forwardRef<ListManagerRefProps, Props>(({
	subId = '',
	rowLength = 2,
	buttons,
	info,
	iconSize,
	textEmpty = '',
	filters = [],
	sorts = [],
	rowHeight = 0,
	sources = [],
	collectionId = '',
	isReadonly = false,
	ignoreArchived = true,
	ignoreHidden = true,
	resize,
	onAfterLoad
}, ref) => {

	const nodeRef = useRef(null);
	const filterWrapperRef = useRef(null);
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const checkboxRef = useRef(new Map());
	const timeout = useRef(0);
	const top = useRef(0);
	const cache = useRef(new CellMeasurerCache());
	const [ selected, setSelected ] = useState<string[]>([]);
	const [ isLoading, setIsLoading ] = useState(false);

	const onFilterShow = () => {
		$(filterWrapperRef.current).addClass('active');
		filterRef.current.focus();
	};

	const onFilterChange = () => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => load(), J.Constant.delay.keyboard);
	};

	const onFilterClear = () => {
		S.Menu.closeAll(J.Menu.store);
		$(filterWrapperRef.current).addClass('active');
	};

	const onClick = (e: React.MouseEvent, item: any) => {
		e.stopPropagation();

		const records = S.Record.getRecordIds(subId, '');
		
		let ids = selected;

		if (e.shiftKey) {
			const idx = records.findIndex(id => id == item.id);

			if ((idx >= 0) && (ids.length > 0)) {
				const indexes = getSelectedIndexes().filter(i => i != idx);
				const closest = U.Common.findClosestElement(indexes, idx);

				if (isFinite(closest)) {
					const [ start, end ] = getSelectionRange(closest, idx);
					ids = ids.concat(records.slice(start, end));
				};
			};
		} else {
			ids = ids.includes(item.id) ? ids.filter(it => it != item.id) : ids.concat(item.id);
		};

		setSelection(ids);
	};

	const getSelectedIndexes = () => {
		const records = S.Record.getRecordIds(subId, '');
		const indexes = selected.map(id => records.findIndex(it => it == id));

		return indexes.filter(idx => idx >= 0);
	};

	const getSelectionRange = (index1: number, index2: number) => {
		const [ start, end ] = (index1 >= index2) ? [ index2, index1 ] : [ index1 + 1, index2 + 1 ];
		return [ start, end ];
	};

	const setSelectedRange = (start: number, end: number) => {
		const records = S.Record.getRecordIds(subId, '');

		if (end > records.length) {
			end = records.length;
		};

		setSelection(selected.concat(records.slice(start, end)));
	};

	const setSelection = (ids: string[]) => {
		setSelected(U.Common.arrayUnique(ids));
	};

	const onSelectAll = () => {
		selected.length ? selectionClear() : selectionAll();
	};

	const selectionAll = () => {
		setSelection(S.Record.getRecordIds(subId, ''));
	};

	const selectionClear = () => {
		setSelection([]);
	};

	const onScroll = ({ scrollTop }) => {
		top.current = scrollTop;
	};

	const load = () => {
		const filter = getFilterValue();
		const fl = [].concat(filters || []);
		const sl = [].concat(sorts || []);

		if (filter) {
			filters.push({ relationKey: 'name', condition: I.FilterCondition.Like, value: filter });
		};

		setIsLoading(true);

		U.Data.searchSubscribe({
			subId,
			sorts: sl,
			filters: fl,
			ignoreArchived,
			ignoreHidden,
			sources: sources || [],
			collectionId: collectionId || ''
		}, (message) => {
			setIsLoading(false);

			if (onAfterLoad) {
				onAfterLoad(message);
			};
		});
	};

	const getItems = () => {
		const ret: any[] = [];
		const records = S.Record.getRecords(subId);

		let row = { children: [] };
		let n = 0;

		for (const item of records) {
			row.children.push(item);

			n++;
			if (n == rowLength) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < rowLength) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	const getFilterValue = () => {
		return String(filterRef.current?.getValue() || '');
	};

	const items = getItems();
	const cnControls = [ 'controls' ];
	const filter = getFilterValue();

	if (filter) {
		cnControls.push('withFilter');
	};

	let buttonsList: I.ButtonComponent[] = [];

	if (selected.length) {
		cnControls.push('withSelected');

		buttonsList.push({ icon: 'checkbox active', text: translate('commonDeselectAll'), onClick: onSelectAll });
		buttonsList = buttonsList.concat(buttons);
	} else {
		buttonsList.push({ icon: 'checkbox', text: translate('commonSelectAll'), onClick: onSelectAll });
	};

	if (isReadonly) {
		buttonsList = [];
	};

	const Info = (item: any) => {
		let itemInfo: any = null;

		switch (info) {
			default:
			case I.ObjectManagerItemInfo.Description: {
				itemInfo = <ObjectDescription object={item} />;
				break;
			};

			case I.ObjectManagerItemInfo.FileSize: {
				itemInfo = <Label text={String(U.File.size(item.sizeInBytes))} />;
				break;
			};
		};

		return itemInfo;
	};

	const Button = (item: any) => (
		<div className="element" onClick={item.onClick}>
			<Icon className={item.icon} />
			<div className="name">{item.text}</div>
		</div>
	);

	const Item = (item: any) => (
		<div className="item">
			{isReadonly ? '' : (
				<Checkbox
					ref={ref => checkboxRef.current.set(item.id, ref)}
					value={selected.includes(item.id)}
					onChange={e => onClick(e, item)}
				/>
			)}
			<div className="objectClickArea" onClick={() => U.Object.openConfig(item)}>
				<IconObject object={item} size={iconSize} />

				<div className="info">
					<ObjectName object={item} />

					<Info {...item} />
				</div>
			</div>
		</div>
	);

	const rowRenderer = (param: any) => {
		const item = items[param.index];

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
				hasFixedWidth={() => {}}
			>
				<div className="row" style={param.style}>
					{item.children.map((item: any, i: number) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</CellMeasurer>
		);
	};

	let controls = (
		<div className="controlsWrapper">
			<div className={cnControls.join(' ')}>
				<div className="side left">
					{buttonsList.map((item: any, i: number) => (
						<Button key={i} {...item} />
					))}
				</div>
				<div className="side right">
					<Icon className="search" onClick={onFilterShow} />

					<div ref={filterWrapperRef} id="filterWrapper" className="filterWrapper">
						<Filter
							ref={filterRef}
							onChange={onFilterChange}
							onClear={onFilterClear}
							placeholder={translate('commonSearchPlaceholder')}
						/>
					</div>
				</div>
			</div>
		</div>
	);

	let content = null;
	if (!items.length) {
		if (!filter) {
			controls = null;
		} else {
			textEmpty = U.Common.sprintf(translate('popupSearchNoObjects'), filter);
		};

		content = <EmptySearch text={textEmpty} />;
	} else {
		content = (
			<div className="items">
				{isLoading ? <Loader /> : (
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => true}
					>
						{({ onRowsRendered }) => (
							<WindowScroller scrollElement={$('#popupPage-innerWrap').get(0)}>
								{({ height, isScrolling, registerChild, scrollTop }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={listRef}
												width={width}
												height={height}
												deferredMeasurmentCache={cache.current}
												rowCount={items.length}
												rowHeight={rowHeight || 64}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												onScroll={onScroll}
												scrollToAlignment="start"
											/>
										)}
									</AutoSizer>
								)}
							</WindowScroller>
						)}
					</InfiniteLoader>
				)}
			</div>
		);
	};

	useEffect(() => {
		load();

		if (resize) {
			resize();
		};

		return () => {
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		const records = S.Record.getRecordIds(subId, '');
		const items = getItems();

		cache.current = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: rowHeight || 64,
			keyMapper: i => (items[i] || {}).id,
		});

		records.forEach(id => {
			const check = checkboxRef.current.get(id);
			if (check) {
				check.setValue(selected.includes(id));
			};
		});

		if (resize) {
			resize();
		};

		listRef.current?.recomputeRowHeights();
	});

	useImperativeHandle(ref, () => ({
		getSelected: () => selected,
		setSelection,
		selectionClear,
	}));

	return (
		<div className="objectManagerWrapper">
			{controls}
			{content}
		</div>
	);
}));

export default ListManager;