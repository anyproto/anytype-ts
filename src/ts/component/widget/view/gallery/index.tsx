import React, { forwardRef, useRef, useEffect } from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { observer } from 'mobx-react';
import { I, S, J } from 'Lib';
import Item from './item';

const LIMIT = 30;
const LIMIT_ROW = 2;
const HEIGHT = 60;

const WidgetViewGallery = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {
	
	const { block, subId, isPreview, getView, getRecordIds } = props;
	const view = getView();
	const items = getRecordIds().map(id => S.Detail.get(subId, id, J.Relation.sidebar));
	const { total } = S.Record.getMeta(subId, '');
	const listRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const length = Math.ceil(total / LIMIT_ROW);

	const getItems = () => {
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (let i = 0; i < items.length; i++) {
			const id = items[i].id;

			row.children.push({ id });
			n++;

			if (n == LIMIT_ROW) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length && (row.children.length < LIMIT_ROW)) {
			ret.push(row);
		};

		return ret;
	};

	const rows = getItems();

	let content = null;
	if (isPreview) {
		const rowRenderer = (param: any) => (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				{({ measure }) => (
					<div className="row" style={param.style}>
						{(rows[param.index]?.children || []).map((item: any, i: number) => (
							<Item 
								{...props}
								key={`widget-${block.id}-item-${item.id}`} 
								subId={subId}
								id={item.id} 
								hideIcon={view.hideIcon}
							/>
						))}
					</div>
				)}
			</CellMeasurer>
		);

		content = (
			<InfiniteLoader
				rowCount={length}
				loadMoreRows={() => {}}
				isRowLoaded={() => true}
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
								rowCount={length}
								rowHeight={param => cache.current.rowHeight(param)}
								rowRenderer={rowRenderer}
								onRowsRendered={onRowsRendered}
								overscanRowCount={LIMIT}
								scrollToAlignment="center"
							/>
					)}
					</AutoSizer>
				)}
			</InfiniteLoader>
		);
	} else {
		content = (
			<>
				{rows.map((row, i: number) => (
					<div className="row" key={`widget-${block.id}-row-${i}`}>
						{row.children.map((item: any, i: number) => (
							<Item 
								{...props}
								key={`widget-${block.id}-item-${item.id}`} 
								subId={subId}
								id={item.id} 
								hideIcon={view.hideIcon}
							/>
						))}
					</div>
				))}
			</>
		);
	};

	useEffect(() => {
		cache.current.clearAll();
		listRef.current?.recomputeRowHeights(0);
	}, [ rows.length ]);

	return (
		<div className="body">
			<div id="items" className="items">
				{content}
			</div>
		</div>
	);

}));

export default WidgetViewGallery;