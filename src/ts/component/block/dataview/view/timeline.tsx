import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, U, S, Dataview } from 'Lib';
import { InfiniteLoader, List, Grid, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';

const HEIGHT = 32;

const ViewTimeline = observer(forwardRef<{}, I.ViewComponent>((props, ref) => {

	const { className, isCollection, getView, getSearchIds, getSubId, getKeys, getTarget } = props;
	const [ value, setValue ] = useState(U.Date.now());
	const cn = [ 'viewContent', className ];
	const subId = getSubId();
	const listRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));

	const getItems = () => {
		const view = getView();

		return S.Record.getRecords(subId, [ view.groupRelationKey, 'dueDate' ]);
	};

	const rowRenderer = (param: any) => {
		const item = items[param.index];

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<div className="item">
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
			</CellMeasurer>
		);
	};

	const load = () => {
		const view = getView();
		if (!view) {
			return;
		};

		const data = U.Date.getCalendarMonth(value);
		if (!data.length) {
			return;
		};

		const startKey = view.groupRelationKey;
		const endKey = 'dueDate'; // view.endRelationKey;
		const object = getTarget();
		const startRelation = S.Record.getRelationByKey(startKey);
		const endRelation = S.Record.getRelationByKey(endKey);
		const first = data[0];
		const last = data[data.length - 1];
		const start = U.Date.timestamp(first.y, first.m, first.d, 0, 0, 0);
		const end = U.Date.timestamp(last.y, last.m, last.d, 23, 59, 59);
		const searchIds = getSearchIds();
		const subId = getSubId();

		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(view.filters as any[]);
		const sorts: I.Sort[] = [].concat(view.sorts);

		filters.push({ 
			relationKey: startRelation.relationKey, 
			condition: I.FilterCondition.GreaterOrEqual, 
			value: start, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: startRelation.format,
		});

		filters.push({ 
			relationKey: endRelation.relationKey, 
			condition: I.FilterCondition.LessOrEqual, 
			value: end, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: endRelation.format,
		});

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

	const items = getItems();

	useImperativeHandle(ref, () => ({
		load,
	}));

	return (
		<div
			className={cn.join(' ')}
		>
			<div className="side left">
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
									rowHeight={HEIGHT}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={10}
									onScroll={() => {}}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>

			<div className="side right">
			</div>
		</div>
	);

}));

export default ViewTimeline;