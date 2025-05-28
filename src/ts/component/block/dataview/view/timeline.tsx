import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle, MouseEvent, DragEvent } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, U, S, C, Dataview, keyboard } from 'Lib';
import { InfiniteLoader, List, AutoSizer, CellMeasurer, CellMeasurerCache, WindowScroller } from 'react-virtualized';

const HEIGHT = 32;
const WIDTH = 40;

const ViewTimeline = observer(forwardRef<{}, I.ViewComponent>((props, ref) => {

	const { className, isCollection, isPopup, readonly, getView, getSearchIds, getSubId, getKeys, getTarget, onContext } = props;
	const [ value, setValue ] = useState(U.Date.now());
	const view = getView();
	const { hideIcon } = view;
	const cn = [ 'viewContent', className ];
	const subId = getSubId();
	const nodeRef = useRef(null);
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

	const onDragStart = (e: DragEvent, item: any) => {

	};

	const onResizeStart = (e: MouseEvent, item: any, dir: number) => {
		e.stopPropagation();
		e.preventDefault();

		const win = $(window);
		const unbind = () => win.off('mousemove.timeline mouseup.timeline');
		const node = $(nodeRef.current);
		const el = node.find(`#item-${item.id}`);
		const { left } = el.offset();
		const width = Math.floor(el.outerWidth());
		const body = $('body');

		unbind();
		keyboard.setResize(true);
		body.addClass(dir > 0 ? 'eResize' : 'wResize');

		let d = 0;

		win.on('mousemove.timeline', (e: any) => {
			if (dir < 0) {
				d = e.pageX - left;
			};

			if (dir > 0) {
				d = e.pageX - left - width;
			};

			if (d) {
				d = Math.ceil(d / WIDTH);

				const css: any = {};

				if (dir < 0) {
					css.left = left - node.offset().left + d * WIDTH;
					css.width = width - d * WIDTH;
				};

				if (dir > 0) {
					css.width = width + d * WIDTH;
				};

				el.css(css);
			};
		});

		win.on('mouseup.timeline', (e: any) => {
			e.stopPropagation();

			unbind();
			window.setTimeout(() => keyboard.setResize(false), 20);
			body.removeClass('eResize wResize');

			if (d) {
				const details: any = {};

				if (dir > 0) {
					item[endKey] = item[startKey] + d * 86400;
				};

				if (U.Common.objectLength(details)) {
					S.Detail.update(subId, { id: item.id, details }, false);
					C.ObjectListSetDetails([ item.id ], [ details ]);
				};
			};
		});
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
		if (idx < 0) {
			return null;
		};

		const icon = hideIcon ? null : <IconObject object={item} size={18} />;
		const width = Math.max(1, Math.ceil(duration / 86400)) * WIDTH;
		const left = idx * WIDTH;

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<div 
					id={`item-${item.id}`}
					className="item" 
					style={{ ...param.style, width, left }} 
					onClick={e => onClick(e, item)} 
					onContextMenu={e => onContext(e, item.id)}
					draggable={!readonly}
					onDragStart={e => onDragStart(e, item)}
				>
					{icon}
					<ObjectName object={item} />

					<Icon className="resize left" onMouseDown={e => onResizeStart(e, item, -1)} />
					<Icon className="resize right" onMouseDown={e => onResizeStart(e, item, 1)} />
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

	const onClick = (e: MouseEvent, item: any) => {
		e.preventDefault();

		if (keyboard.isResizing || keyboard.isDragging) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const cb = {
			0: () => {
				keyboard.withCommand(e) ? U.Object.openEvent(e, item) : U.Object.openConfig(item); 
			},
			2: () => onContext(e, item.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	const items = getItems();

	useEffect(() => {
		resize();
	});

	useImperativeHandle(ref, () => ({
		load,
	}));

	return (
		<div ref={nodeRef} id="scroll" className="scroll">
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