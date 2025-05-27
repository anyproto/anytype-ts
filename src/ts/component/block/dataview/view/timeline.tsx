import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, U, S, Dataview } from 'Lib';
import { InfiniteLoader, List, Grid, AutoSizer, CellMeasurer, CellMeasurerCache, WindowScroller } from 'react-virtualized';

const HEIGHT = 32;
const WIDTH = 40;

const ViewTimeline = observer(forwardRef<{}, I.ViewComponent>((props, ref) => {

	const { className, isCollection, isPopup, getView, getSearchIds, getSubId, getKeys, getTarget } = props;
	const [ value, setValue ] = useState(U.Date.now());
	const view = getView();
	const cn = [ 'viewContent', className ];
	const subId = getSubId();
	const listRef = useRef(null);
	const itemsRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const startKey = view.groupRelationKey;
	const endKey = 'dueDate'; // view.endRelationKey;
	const object = getTarget();
	const startRelation = S.Record.getRelationByKey(startKey);
	const endRelation = S.Record.getRelationByKey(endKey);

	const getData = () => {
		const ret = [];
		const add = d => {
			if (!ret.find(it => (d.y == it.y) && (d.m == it.m) && (d.d == it.d))) {
				ret.push(d);
			};
		};

		for (let i = 3; i >= 0; i--) {
			const current = U.Date.getCalendarMonth(value - 86400 * 30 * i, true);

			current.forEach(add);
		};

		for (let i = 1; i <= 3; i++) {
			const current = U.Date.getCalendarMonth(value + 86400 * 30 * i, true);

			current.forEach(add);
		};

		return ret;
	};

	const data = getData();

	const getItems = () => {
		return view ? S.Record.getRecords(subId, [ view.groupRelationKey, 'dueDate' ]) : [];
	};

	const rowRenderer = (param: any) => {
		const item = items[param.index];
		const start = Number(item[startKey]) || 0;
		const end = Number(item[endKey]) || 0;
		const duration = end - start;

		if (duration <= 0) {
			return null;
		}; 

		const idx = data.findIndex(it => {
			return (U.Date.date('j-n-Y', it.ts) == U.Date.date('j-n-Y', start));
		});
		const width = Math.ceil(Math.max(1, duration / 86400) * WIDTH);
		const left = idx * WIDTH;

		console.log(item.name, 'IDX', idx, 'START', start, 'END', end, 'DURATION', duration);

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<div className="item" style={{ ...param.style, width, left }}>
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
			</CellMeasurer>
		);
	};

	const load = () => {
		if (!view || !data.length) {
			return;
		};

		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = U.Date.timestamp(last.y, last.m, last.d, 23, 59, 59);
		const searchIds = getSearchIds();
		const subId = getSubId();
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			{ relationKey: startRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: start, quickOption: I.FilterQuickOption.ExactDate, format: startRelation.format },
			{ relationKey: endRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: start, format: endRelation.format },
			{ relationKey: endRelation.relationKey, condition: I.FilterCondition.LessOrEqual, value: end, quickOption: I.FilterQuickOption.ExactDate, format: endRelation.format },
		].concat(view.filters as any[]);

		const sorts: I.Sort[] = [].concat(view.sorts);

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Subscription.subscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: getKeys(view.id),
			sources: object.setOf || [],
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		});
	};

	const resize = () => {
		$(itemsRef.current).css({ height: items.length * HEIGHT });
	};

	const items = getItems();

	useEffect(() => {
		resize();
	});

	useImperativeHandle(ref, () => ({
		load,
	}));

	return (
		<div id="scroll" className="scroll">
			<div id="scrollWrap" className="scrollWrap">
				<div className={cn.join(' ')} style={{ width: data.length * WIDTH }}>
					<div className="header months">

					</div>
					<div className="header days">
						{data.map((it, index) => (
							<div key={index} className="day">
								{it.d}
							</div>
						))}
					</div>

					<div className="body">
						<div className="grid">
							{data.map((it, i) => {
								const cn = [ 'cell' ];

								if (it.isWeekend) {
									cn.push('weekend');
								};

								return (
									<div key={[ it.d, it.m, it.y ].join('-')} className={cn.join(' ')} style={{ left: i * WIDTH }} />
								);
							})}
						</div>

						<div ref={itemsRef} className="items">
							<InfiniteLoader
								loadMoreRows={() => {}}
								isRowLoaded={() => true}
								rowCount={items.length}
								threshold={10}
							>
								{({ onRowsRendered }) => (
									<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
										{({ height, isScrolling, registerChild, scrollTop }) => (
											<AutoSizer>
												{({ width }) => (
													<div ref={registerChild}>
														<List
															autoHeight={true}
															height={Number(height) || 0}
															width={Number(width) || 0}
															isScrolling={isScrolling}
															rowCount={items.length}
															rowHeight={HEIGHT}
															onRowsRendered={onRowsRendered}
															rowRenderer={rowRenderer}
															scrollTop={scrollTop}
														/>
													</div>
												)}
											</AutoSizer>
										)}
									</WindowScroller>
								)}
							</InfiniteLoader>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

}));

export default ViewTimeline;