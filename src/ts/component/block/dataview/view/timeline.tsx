import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle, MouseEvent, DragEvent } from 'react';
import { createRoot } from 'react-dom/client';

import { arrayMove } from '@dnd-kit/sortable';
import { IconObject, ObjectName, Icon } from 'Component';
import { InfiniteLoader, List, AutoSizer, CellMeasurer, CellMeasurerCache, WindowScroller } from 'react-virtualized';
import * as I from 'Interface';

const HEIGHT = 36;
const WIDTH = 40;
const PADDING = 46;

const ViewTimeline = forwardRef<{}, I.ViewComponent>((props, ref) => {

	const { 
		rootId, block, className, isCollection, isPopup, readonly, isInline, 
		getView, getSearchIds, getSubId, getKeys, getTarget, onContext, objectOrderUpdate, getRecords,
	} = props;
	const [ value, setValue ] = useState(U.Date.now());
	const view = getView();
	const { hideIcon } = view;
	const cn = [ 'viewContent', className ];
	const subId = getSubId();
	const nodeRef = useRef(null);
	const itemsRef = useRef(null);
	const tooltipRef = useRef(null);
	const headRef = useRef(null);
	const bodyRef = useRef(null);
	const lineRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const startKey = view.groupRelationKey;
	const endKey = view.endRelationKey;
	const object = getTarget();
	const startRelation = S.Record.getRelationByKey(startKey);
	const endRelation = S.Record.getRelationByKey(endKey);
	const dateParam = U.Date.getDateParam(value);
	const canEditStart = !readonly && !startRelation?.isReadonlyValue;
	const canEditEnd = !readonly && !endRelation?.isReadonlyValue;
	const months = [];

	const getItems = () => {
		return getRecords().map(id => S.Detail.get(subId, id));
	};

	const scrollHandlerRef = useRef<((e: Event) => void) | null>(null);

	const rebind = () => {
		unbind();
		const container = U.Dom.getScrollContainer(isPopup);
		scrollHandlerRef.current = (e: Event) => onScrollVertical(e);
		if (container) {
			U.Dom.addEvent(container, 'scroll', scrollHandlerRef.current);
		};
	};

	const unbind = () => {
		const container = U.Dom.getScrollContainer(isPopup);
		if (scrollHandlerRef.current && container) {
			U.Dom.removeEvent(container, 'scroll', scrollHandlerRef.current);
			scrollHandlerRef.current = null;
		};
	};

	const getData = () => {
		const ret = [];
		const add = d => {
			if (!ret.find(it => (d.y == it.y) && (d.m == it.m) && (d.d == it.d))) {
				ret.push(d);
			};
		};

		for (let i = -3; i <= 3; i++) {
			const v = value + J.Constant.day * 30 * i;
			const current = U.Date.getCalendarMonth(v, true);
			const m = U.Date.date('n', v);
			const y = U.Date.date('Y', v);

			months.push({ m, y });
			current.forEach(add);
		};

		return ret;
	};

	const data = getData();

	const getIndex = (t: number) => {
		return data.findIndex(it => U.Date.date('j-n-Y', it.ts) == U.Date.date('j-n-Y', t));
	};

	const timelineDragHandlerRef = useRef<((e: Event) => void) | null>(null);
	const timelineDragEndHandlerRef = useRef<((e: Event) => void) | null>(null);

	const onDragStart = (e: DragEvent, item: any) => {
		e.stopPropagation();

		const unbind = () => {
			if (timelineDragHandlerRef.current) {
				U.Dom.removeEvent(window, 'drag', timelineDragHandlerRef.current);
				timelineDragHandlerRef.current = null;
			};
			if (timelineDragEndHandlerRef.current) {
				U.Dom.removeEvent(window, 'dragend', timelineDragEndHandlerRef.current);
				timelineDragEndHandlerRef.current = null;
			};
		};
		const x = e.pageX;
		const body = bodyRef.current;
		const line = lineRef.current;

		keyboard.setDragging(true);

		let dy = 0;

		const save = (d: number, cb: (message: any) => void) => {
			if (!d) {
				return;
			};

			item[startKey] = item[startKey] + d * J.Constant.day;
			item[endKey] = item[endKey] + d * J.Constant.day;

			const details: any = [
				{ key: startKey, value: item[startKey] },
				{ key: endKey, value: item[endKey] }
			];

			S.Detail.update(subId, { id: item.id, details: { [startKey]: item[startKey], [endKey]: item[endKey] } }, false);
			C.ObjectListSetDetails([ item.id ], details, cb);
		};

		timelineDragHandlerRef.current = (e: any) => {
			const bodyRect = body?.getBoundingClientRect();
			const top = (bodyRect?.top ?? 0) + window.scrollY;
			const dx = Math.ceil((e.pageX - x) / WIDTH);

			setHover(item[startKey] + dx * J.Constant.day, item[endKey] + dx * J.Constant.day);

			if (isCollection) {
				dy = Math.ceil((e.pageY - top) / HEIGHT) - 1;
				if ((dy >= 0) && (dy != item.index) && (dy != item.index + 1)) {
					if (line) {
						U.Dom.css(line, { top: `${dy * HEIGHT + 1}px`, display: 'block' });
					};
				};
			};
		};
		U.Dom.addEvent(window, 'drag', timelineDragHandlerRef.current);

		timelineDragEndHandlerRef.current = (e: any) => {
			e.stopPropagation();

			save(Math.ceil((e.pageX - x) / WIDTH), () => {
				if (isCollection && (dy >= 0)) {
					const records = arrayMove(S.Record.getRecordIds(subId, ''), item.index, dy);

					S.Record.recordsSet(subId, '', records);
					objectOrderUpdate([ { viewId: view.id, groupId: '', objectIds: records } ], records);
				};
			});

			unbind();
			keyboard.setDragging(false);
			if (line) {
				U.Dom.css(line, { display: 'none' });
			};
		};
		U.Dom.addEvent(window, 'dragend', timelineDragEndHandlerRef.current);
	};

	const resizeMoveHandlerRef = useRef<((e: Event) => void) | null>(null);
	const resizeUpHandlerRef = useRef<((e: Event) => void) | null>(null);

	const onResizeStart = (e: MouseEvent, item: any, dir: number) => {
		e.stopPropagation();
		e.preventDefault();

		const unbind = () => {
			if (resizeMoveHandlerRef.current) {
				U.Dom.removeEvent(window, 'mousemove', resizeMoveHandlerRef.current);
				resizeMoveHandlerRef.current = null;
			};
			if (resizeUpHandlerRef.current) {
				U.Dom.removeEvent(window, 'mouseup', resizeUpHandlerRef.current);
				resizeUpHandlerRef.current = null;
			};
		};
		const node = nodeRef.current;
		const el = U.Dom.select(`#item-${U.Common.esc(item.id)}`, node);
		if (!el) {
			return;
		};
		const elRect = el.getBoundingClientRect();
		const left = elRect.left + window.scrollX;
		const width = Math.floor(el.offsetWidth);
		const sl = node?.scrollLeft ?? 0;
		const duration = getDuration(item);

		unbind();
		keyboard.setResize(true);
		U.Dom.addClass(document.body, dir > 0 ? 'eResize' : 'wResize');

		let d = 0;

		const save = (cmd: boolean) => {
			if (!d) {
				return;
			};

			const details: any = [];

			if (dir < 0) {
				item[startKey] = item[startKey] + d * J.Constant.day;
				details.push({ key: startKey, value: item[startKey] });
			};

			if (dir > 0) {
				item[endKey] = item[endKey] + d * J.Constant.day;
				details.push({ key: endKey, value: item[endKey] });
			};

			if (details.length) {
				S.Detail.update(subId, { id: item.id, details: { [startKey]: item[startKey], [endKey]: item[endKey] } }, false);

				if (cmd) {
					C.ObjectListSetDetails([ item.id ], details);
				};
			};
		};

		resizeMoveHandlerRef.current = (e: any) => {
			if (dir < 0) {
				d = e.pageX - left;
			};

			if (dir > 0) {
				d = e.pageX - left - width;
			};

			onMouseLeave();

			if (d) {
				d = Math.ceil(d / WIDTH);

				let start = item[startKey];
				let end = item[endKey];

				if (dir < 0) {
					const nodeRect = node?.getBoundingClientRect();
					const nodeLeft = (nodeRect?.left ?? 0) + window.scrollX;
					U.Dom.css(el, { left: `${left - nodeLeft + sl + d * WIDTH}px`, width: `${width - d * WIDTH}px` });

					start += d * J.Constant.day;
				};

				if (dir > 0) {
					U.Dom.css(el, { width: `${width + d * WIDTH}px` });

					end += d * J.Constant.day;
				};

				if (duration + d < 1) {
					return;
				};

				setHover(start, end);
			};
		};
		U.Dom.addEvent(window, 'mousemove', resizeMoveHandlerRef.current);

		resizeUpHandlerRef.current = (e: any) => {
			e.stopPropagation();

			unbind();
			save(true);
			window.setTimeout(() => keyboard.setResize(false), 20);
			U.Dom.removeClass(document.body, 'eResize');
			U.Dom.removeClass(document.body, 'wResize');
		};
		U.Dom.addEvent(window, 'mouseup', resizeUpHandlerRef.current);
	};

	const setHover = (start: number, end: number) => {
		start = Number(start) || 0;
		end = Number(end) || 0;

		const idx1 = getIndex(start);
		const idx2 = getIndex(end);

		if ((idx1 < 0) || (idx2 < 0) || (idx1 >= idx2)) {
			return;
		};

		const node = nodeRef.current;
		const slice = data.slice(idx1, idx2);

		onMouseLeave();

		for (let i = 0; i < slice.length; i++) {
			const it = slice[i];
			const el = U.Dom.select(`#day-${it.d}-${it.m}-${it.y}`, node);

			if (!el) {
				continue;
			};

			U.Dom.addClass(el, 'hover');

			if (i == 0) {
				U.Dom.addClass(el, 'first');
			};
			if (i == slice.length - 1) {
				U.Dom.addClass(el, 'last');
			};
		};
	};

	const onMouseEnter = (e: MouseEvent, item: any) => {
		setHover(item[startKey], item[endKey]);
	};

	const onMouseLeave = () => {
		U.Dom.selectAll('.day', nodeRef.current).forEach(el => {
			U.Dom.removeClass(el, 'hover');
			U.Dom.removeClass(el, 'first');
			U.Dom.removeClass(el, 'last');
		});
	};

	const getDuration = (item: any): number => {
		const start = Number(item[startKey]) || 0;
		const param = U.Date.getDateParam(Number(item[endKey]) || 0);
		const end = U.Date.timestamp(param.y, param.m, param.d, 23, 59, 59);

		return Math.ceil((end - start) / J.Constant.day);
	};

	const rowRenderer = (param: any) => {
		const item = items[param.index];
		const start = Number(item[startKey]) || 0;
		const duration = getDuration(item);

		if (duration <= 0) {
			return null;
		}; 

		item.index = param.index;

		const idx = getIndex(start);
		const cn = [ 'item' ];

		if (idx < 0) {
			cn.push('isHidden');
		};

		const icon = hideIcon ? null : <IconObject object={item} size={18} />;
		const width = Math.max(1, duration) * WIDTH;
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
					className={cn.join(' ')}
					style={{ ...param.style, width, left }} 
					onClick={e => onClick(e, item)} 
					onContextMenu={e => onContext(e, item.id)}
					draggable={canEditStart && canEditEnd}
					onDragStart={e => onDragStart(e, item)}
					onMouseEnter={e => onMouseEnter(e, item)}
					onMouseLeave={onMouseLeave}
					{...U.Common.dataProps({ id: item.id })}
				>
					{icon}
					<ObjectName object={item} />

					{canEditStart ? <Icon name="menu/action/resize" className="resize left" onMouseDown={e => onResizeStart(e, item, -1)} /> : ''}
					{canEditEnd ? <Icon name="menu/action/resize" className="resize right" onMouseDown={e => onResizeStart(e, item, 1)} /> : ''}
				</div>
			</CellMeasurer>
		);
	};

	const Tooltip = (item: any) => (
		<>
			<Icon name="arrow/button" size={8} className="arrow" />
			<ObjectName object={item} />
		</>
	);

	const load = () => {
		if (!view || !data.length || !startRelation || !endRelation) {
			return;
		};

		const searchIds = getSearchIds();
		const subId = getSubId();
		const filters: I.Filter[] = Dataview.getFilteredFilters([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			{ relationKey: startRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: 0, quickOption: I.FilterQuickOption.ExactDate, format: startRelation.format },
			{ relationKey: endRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: 0, format: endRelation.format },
		].concat(view.filters as any[])).map(it => Dataview.filterMapper(it, { rootId }));
		const sorts: I.Sort[] = Dataview.getFilteredSorts(view.sorts).map(it => Dataview.sortMapper(it));

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Subscription.subscribe({
			subId,
			filters,
			sorts,
			keys: getKeys(view.id),
			sources: object.setOf || [],
			collectionId: (isCollection ? object.id : ''),
		});
	};

	const resize = () => {
		const node = nodeRef.current;

		if (!node) {
			return;
		};

		const items = getItems();
		const body = bodyRef.current;
		const list = itemsRef.current;
		const tooltips = tooltipRef.current;
		const scrollContainer = U.Dom.getScrollContainer(isPopup);
		const pageContainer = U.Dom.getPageContainer(isPopup);
		const bodyRect = body?.getBoundingClientRect();
		const top = (bodyRect?.top ?? 0) + window.scrollY - J.Size.header - 14 - (scrollContainer?.scrollTop ?? 0);
		const nodeRect = node.getBoundingClientRect();
		const left = nodeRect.left + window.scrollX;

		if (!isInline) {
			U.Dom.css(node, { width: '0', marginLeft: '0' });

			const cw = pageContainer?.clientWidth ?? 0;
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;

			U.Dom.css(node, { width: `${cw}px`, marginLeft: `${-margin - 2}px` });
		};

		const width = U.Dom.contentWidth(node);

		if (list) {
			U.Dom.css(list, { height: `${Math.max(20, items.length) * HEIGHT}px` });
		};
		if (tooltips) {
			U.Dom.css(tooltips, { transform: `translate3d(${left}px, ${top}px, 0)`, width: `${width}px` });
		};
	};

	const onClick = (e: MouseEvent, item: any) => {
		e.preventDefault();

		if (keyboard.isResizing || keyboard.isDragging) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const cb = {
			0: () => U.Object.openConfig(e, item),
			1: () => U.Object.openConfig(e, item),
			2: () => onContext(e, item.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if (((e.ctrlKey || e.metaKey) && (ids.length > 1)) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	const scrollTo = (t: number, animate: boolean) => {
		const node = nodeRef.current;
		const idx = getIndex(t);

		if (idx < 0) {
			return;
		};

		const item = data[idx];
		if (!item) {
			return;
		};

		const el = U.Dom.select(`#day-${item.d}-${item.m}-${item.y}`, node);

		if (!el) {
			return;
		};

		const left = el.offsetLeft - U.Dom.contentWidth(node) / 2 + WIDTH / 2;

		if (animate) {
			node?.scrollTo({ left, behavior: 'smooth' });
		} else {
			if (node) {
				node.scrollLeft = left;
			};
		};
	};

	const onArrow = (dir: number) => {
		setValue(value + dir * J.Constant.day * 30);
	};

	const onCalendar = () => {
		S.Menu.open('calendar', {
			element: `#calendar-icon-${rootId}-${block.id}`,
			horizontal: I.MenuDirection.Center,
			data: {
				value,
				canEdit: true,
				canClear: false,
				onChange: setValue,
			},
		});
	};

	const onScrollVertical = (e: any) => {
		resize();
	};

	const onScrollHorizontal = () => {
		if (!data.length) {
			return;
		};

		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const sl = node.scrollLeft;
		const wrap = U.Dom.select('.viewContent', node);
		const nw = U.Dom.contentWidth(node);
		const nodeRect = node.getBoundingClientRect();
		const nl = nodeRect.left + window.scrollX;
		const width = U.Dom.contentWidth(wrap) - nw;
		const first = data[0];
		const last = data[data.length - 1];
		const list = U.Dom.selectAll('.item', node);

		if (first && (sl <= 0)) {
			setValue(first.ts);
		};

		if (last && (sl >= width)) {
			setValue(last.ts);
		};

		list.forEach((itemEl: HTMLElement) => {
			const itemRect = itemEl.getBoundingClientRect();
			const left = itemRect.left + window.scrollX;
			const w = itemEl.offsetWidth;
			const id = itemEl.getAttribute('data-id');
			const object = items.find(it => it.id == id);
			const isLeft = left <= -w;
			const isRight = left - nl >= nw;

			const createElement = (): HTMLElement => {
				el = document.createElement('div');
				el.id = `tooltipItem-${id}`;
				el.className = 'tooltipItem';
				tooltipRef.current?.appendChild(el);

				const root = createRoot(el);
				root.render(<Tooltip {...object} />);

				U.Dom.addEvent(el, 'click', (e: any) => {
					e.stopPropagation();
					e.preventDefault();

					setValue(object[startKey]);
				});

				return el;
			};

			let el = U.Dom.get(`tooltipItem-${id}`);

			if (el) {
				U.Dom.css(el, { top: `${itemEl.offsetTop}px` });
			};

			if (isLeft || isRight) {
				if (!el) {
					el = createElement();
				};

				U.Dom.toggleClass(el, 'isLeft', isLeft);
				U.Dom.toggleClass(el, 'isRight', isRight);
			} else
			if (el) {
				el.remove();
			};
		});
	};

	const items = getItems();

	useEffect(() => {
		scrollTo(U.Date.now(), false);
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		scrollTo(value, false);
	}, [ value ]);

	useEffect(() => {
		resize();
	});

	useImperativeHandle(ref, () => ({
		load,
		resize,
	}));

	return (
		<>
			<div ref={tooltipRef} className="tooltipContainer" />
			<div className="controlsContainer">
				<div className="inner">
					<div className="grad" />
					<Icon name="arrow/button" size={8} className="arrow left" withBackground={true} onClick={() => onArrow(-1)} />
					<Icon name="arrow/button" size={8} className="arrow right" withBackground={true} onClick={() => onArrow(1)}/>
					<Icon id={`calendar-icon-${rootId}-${block.id}`} name="relation/date" withBackground={true} onClick={onCalendar} />
				</div>
			</div>

			<div 
				ref={nodeRef} 
				id="scroll" 
				className="scroll"
				onScroll={onScrollHorizontal}
			>
				<div className={cn.join(' ')} style={{ width: data.length * WIDTH }}>
					<div ref={headRef} className="head">
						<div className="months">
							{months.map((it, i) => {
								const md = U.Date.getMonthDays(it.y);
								const css = { width: md[it.m] * WIDTH };

								return (
									<div key={i} className="month" style={css}>
										{translate(`month${it.m}`)} {it.y}
									</div>
								);
							})}
						</div>

						<div className="days">
							{data.map((it, i) => {
								const cn = [ 'day' ];

								if (it.isWeekend) {
									cn.push('weekend');
								};

								if (it.isToday) {
									cn.push('today');
								};

								if ((it.d == dateParam.d) && (it.m == dateParam.m) && (it.y == dateParam.y)) {
									cn.push('active');
								};

								return (
									<div key={i} id={`day-${it.d}-${it.m}-${it.y}`} className={cn.join(' ')}>
										<div className="inner">
											<div className="marker">
												{it.d}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div ref={bodyRef} className="body">
						<div className="grid">
							{data.map((it, i) => {
								const cn = [ 'cell' ];

								if (it.d == 1) {
									cn.push('start');
								};

								if (it.isWeekend) {
									cn.push('weekend');
								};

								if (it.isToday) {
									cn.push('today');
								};

								return (
									<div key={[ it.d, it.m, it.y ].join('-')} className={cn.join(' ')} style={{ left: i * WIDTH }} />
								);
							})}
						</div>

						<div ref={lineRef} className="line" />

						<div ref={itemsRef} className="items">
							<InfiniteLoader
								loadMoreRows={() => {}}
								isRowLoaded={() => true}
								rowCount={items.length}
								threshold={10}
							>
								{({ onRowsRendered }) => (
									<WindowScroller scrollElement={U.Dom.getScrollContainer(isPopup)}>
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
		</>
	);

});

export default ViewTimeline;