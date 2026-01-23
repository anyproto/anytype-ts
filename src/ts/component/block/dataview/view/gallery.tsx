import React, { forwardRef, useRef, useState, useEffect, useLayoutEffect, useMemo, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { I, S, U, J, Relation, Dataview } from 'Lib';
import { LoadMore } from 'Component';
import Card from './gallery/card';
import { throttle } from 'lodash';

const ViewGallery = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { 
		rootId, block, isPopup, isInline, className, getSubId, getView, getKeys, getLimit, 
		getVisibleRelations, onRecordAdd, getEmptyView, getRecords, onRefRecord, loadData,
		isAllowedObject,
	} = props;
	const [ columnCount, setColumnCount ] = useState(0);
	const [ cardHeight, setCardHeight ] = useState(0);
	const [ width, setWidth ] = useState(0);
	const view = getView();
	const relations = getVisibleRelations();
	const subId = getSubId();
	const records = getRecords();
	const { coverRelationKey, cardSize, hideIcon } = view || {};
	const { offset, total } = S.Record.getMeta(subId, '');
	const limit = getLimit();
	const cn = [ 'viewContent', className ];
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: J.Size.dataview.gallery.height }));
	const listRef = useRef(null);
	const topRef = useRef(0);

	const getItems = () => {
		const records = U.Common.objectCopy(getRecords());
		
		if (isAllowedObject()) {
			records.push('add-record');
		};

		return records;
	};

	const getRows = () => {
		if (!width || !columnCount) {
			return [];
		};

		const records = getItems();
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (const item of records) {
			row.children.push(item);

			n++;
			if (n == columnCount) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < columnCount) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	useLayoutEffect(() => {
		setCardHeight(getCardHeight());
	}, []);

	useLayoutEffect(() => {
		setColumnCount(getColumnCount());
		setCardHeight(getCardHeight());
	}, [ width, cardSize, coverRelationKey, hideIcon, relations.length, view.type ]);

	useLayoutEffect(() => {
		if (!isInline) {
			S.Common.setTimeout('galleryReset', 20, () => {
				cache.current.clearAll();
				listRef.current?.recomputeRowHeights(0);
			});
		};
	}, [ columnCount, cardHeight, width, records.length, coverRelationKey ]);

	useEffect(() => {
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		if (ids.length) {
			selection?.renderSelection();
		};
	});

	const getColumnCount = () => {
		const { margin, card } = J.Size.dataview.gallery;
		const view = getView();

		if (!view) {
			return card.small;
		};

		let ret = card.small;
		switch (view.cardSize) {
			case I.CardSize.Medium:	 ret = card.medium; break;
			case I.CardSize.Large:	 ret = card.large; break;
		};

		return Math.max(1, Math.floor((width - margin) / ret));
	};

	const onResize = ({ width }) => {
		setWidth(width);
	};

	const throttledResize = useMemo(() => {
		return throttle(onResize, 40);
	}, [ onResize ]);

	const loadMoreCards = ({ startIndex, stopIndex }) => {
		const subId = getSubId();
		const view = getView();

		let { offset } = S.Record.getMeta(subId, '');

		return new Promise((resolve, reject) => {
			offset += getLimit();
			loadData(view.id, offset, false, resolve);
			S.Record.metaSet(subId, '', { offset });
		});
	};

	const getCardHeight = (): number => {
		const { padding, margin, height } = J.Size.dataview.gallery;

		let ret = padding * 2 + margin - 4;

		relations.forEach((it: any) => {
			if (it.relationKey == 'name') {
				ret += 24;
				return;
			};
			switch (it.relation.format) {
				default: {
					ret += 22; 
					break;
				};

				case I.RelationType.LongText: {
					ret += 40; 
					break;
				};

				case I.RelationType.Object:
				case I.RelationType.File: {
					ret += 24; 
					break;
				};
			};
		});

		return Math.max(height, ret);
	};

	const getCoverObject = (id: string): any => {
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = getSubId();
		const record = S.Detail.get(subId, id, getKeys(view.id));

		return Dataview.getCoverObject(subId, record, view.coverRelationKey);
	};

	const onScroll = ({ scrollTop }) => {
		topRef.current = scrollTop;
	};

	if (!records.length) {
		return getEmptyView(I.ViewType.Gallery);
	};

	const keys = relations.filter((it: any) => Relation.isObjectType(it.relation.format)).map(it => it.relationKey);

	// Subscriptions on dependent objects
	for (const id of records) {
		const item = S.Detail.get(subId, id, keys);
		if (item._empty_) {
			continue;
		};

		for (const k of keys) {
			const v = Relation.getArrayValue(item[k]);
			if (v && v.length) {
				v.forEach(id => {
					const object = S.Detail.get(rootId, id, []);
				});
			};
		};
	};

	const cardItem = (id: string) => {
		if (id == 'add-record') {
			return (
				<div 
					key={`gallery-card-${view.id + id}`} 
					className="card add" 
					onClick={e => onRecordAdd(e, 1)} 
				/>
			);
		} else {
			return (
				<Card
					ref={ref => onRefRecord(ref, id)}
					key={`gallery-card-${view.id + id}`}
					{...props} 
					getCoverObject={getCoverObject}
					recordId={id}
					recordIdx={records.indexOf(id)}
				/>
			);
		};
	};

	let content = null;

	if (isInline) {
		const items = getItems();
		content = (
			<>
				{items.map(id => cardItem(id))}
			</>
		);
	} else {
		const items = getRows();
		const length = items.length;

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const style = { ...param.style, gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` };

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={cache.current}
					columnIndex={0}
					rowIndex={param.index}
				>
					{({ registerChild, measure }) => (
						<div 
							ref={registerChild} 
							key={`gallery-row-${view.id + param.index}`} 
							className="row" style={style}
						>
							{item.children.map(id => cardItem(id))}
						</div>
					)}
				</CellMeasurer>
			);
		};

		content = (
			<WindowScroller 
				scrollElement={U.Common.getScrollContainer(isPopup).get(0)}
				onScroll={onScroll}
				scrollTop={topRef.current}
			>
				{({ height }) => (
					<AutoSizer disableHeight={true} onResize={throttledResize}>
						{({ width }) => (
							<List
								autoHeight={true}
								ref={listRef}
								width={Number(width) || 0}
								height={Number(height) || 0}
								deferredMeasurementCache={cache.current}
								rowCount={length}
								rowHeight={param => Math.max(cache.current.rowHeight(param), cardHeight)}
								rowRenderer={rowRenderer}
								overscanRowCount={length}
								scrollToAlignment="start"
							/>
						)}
					</AutoSizer>
				)}
			</WindowScroller>
		);
	};

	return (
		<div className="wrap">
			<div className={cn.join(' ')}>
				<div className={[ 'galleryWrap', U.Data.cardSizeClass(cardSize) ].join(' ')}>
					{content}
				</div>

				{limit + offset < total ? (
					<LoadMore limit={limit} loaded={records.length} total={total} onClick={loadMoreCards} />
				) : ''}
			</div>
		</div>
	);

}));

export default ViewGallery;