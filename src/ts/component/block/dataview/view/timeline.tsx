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

	const getData = () => {
		const cur = U.Date.getCalendarMonth(value);
		if (!cur.length) {
			return [];
		};

		const prev = U.Date.getCalendarMonth(cur[0].ts);
		const next = U.Date.getCalendarMonth(cur[cur.length - 1].ts);
		const ret = [].concat(prev);

		cur.forEach(it => {
			if (!ret.find(d => (d.y == it.y) && (d.m == it.m) && (d.d == it.d))) {
				ret.push(it);
			};
		});

		next.forEach(it => {
			if (!ret.find(d => (d.y == it.y) && (d.m == it.m) && (d.d == it.d))) {
				ret.push(it);
			};
		});

		return ret;
	};

	const data = getData();

	console.log('DATA', data);

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
		<div className={cn.join(' ')}>
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
				<div className="backgrounds">
				</div>

				<div className="items">
				</div>
			</div>
		</div>
	);

}));

export default ViewTimeline;