import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle, MouseEvent, DragEvent } from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { arrayMove } from '@dnd-kit/sortable';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, U, S, C, J, Dataview, keyboard, translate } from 'Lib';
import { InfiniteLoader, List, AutoSizer, CellMeasurer, CellMeasurerCache, WindowScroller } from 'react-virtualized';

const HEIGHT = 36;
const WIDTH = 40;
const DAY = 86400; // seconds in a day
const PADDING = 46;

const ViewTimeline = observer(forwardRef<{}, I.ViewComponent>((props, ref) => {

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
		return getRecords().map(id => S.Detail.get(subId, id))
	};

	const rebind = () => {
		unbind();
		U.Common.getScrollContainer(isPopup).on('scroll.timeline', e => onScrollVertical(e));
	};

	const unbind = () => {
		U.Common.getScrollContainer(isPopup).off('scroll.timeline');
	};

	const getData = () => {
		const ret = [];
		const add = d => {
			if (!ret.find(it => (d.y == it.y) && (d.m == it.m) && (d.d == it.d))) {
				ret.push(d);
			};
		};

		for (let i = -3; i <= 3; i++) {
			const v = value + DAY * 30 * i;
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

	const onDragStart = (e: DragEvent, item: any) => {
		e.stopPropagation();

		const win = $(window);
		const unbind = () => win.off('drag.timeline dragend.timeline');
		const x = e.pageX;
		const body = $(bodyRef.current);
		const line = $(lineRef.current);

		keyboard.setDragging(true);

		let dy = 0;

		const save = (d: number, cb: (message: any) => void) => {
			if (!d) {
				return;
			};

			item[startKey] = item[startKey] + d * DAY;
			item[endKey] = item[endKey] + d * DAY;

			const details: any = [
				{ key: startKey, value: item[startKey] },
				{ key: endKey, value: item[endKey] }
			];
				
			S.Detail.update(subId, { id: item.id, details: { [startKey]: item[startKey], [endKey]: item[endKey] } }, false);
			C.ObjectListSetDetails([ item.id ], details, cb);
		};

		win.on('drag.timeline', (e: any) => {
			const { top } = body.offset();
			const dx = Math.ceil((e.pageX - x) / WIDTH);

			setHover(item[startKey] + dx * DAY, item[endKey] + dx * DAY);

			if (isCollection) {
				dy = Math.ceil((e.pageY - top) / HEIGHT) - 1;
				if ((dy >= 0) && (dy != item.index) && (dy != item.index + 1)) {
					line.css({ top: dy * HEIGHT + 1 }).show();
				};
			};
		});

		win.on('dragend.timeline', (e: any) => {
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
			line.hide();
		});
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
		const sl = node.scrollLeft();
		const duration = getDuration(item);

		unbind();
		keyboard.setResize(true);
		body.addClass(dir > 0 ? 'eResize' : 'wResize');

		let d = 0;

		const save = (cmd: boolean) => {
			if (!d) {
				return;
			};

			const details: any = [];

			if (dir < 0) {
				item[startKey] = item[startKey] + d * DAY;
				details.push({ key: startKey, value: item[startKey] });
			};

			if (dir > 0) {
				item[endKey] = item[endKey] + d * DAY;
				details.push({ key: endKey, value: item[endKey] });
			};

			if (details.length) {
				S.Detail.update(subId, { id: item.id, details: { [startKey]: item[startKey], [endKey]: item[endKey] } }, false);

				if (cmd) {
					C.ObjectListSetDetails([ item.id ], details);
				};
			};
		};

		win.on('mousemove.timeline', (e: any) => {
			if (dir < 0) {
				d = e.pageX - left;
			};

			if (dir > 0) {
				d = e.pageX - left - width;
			};

			onMouseLeave();

			if (d) {
				d = Math.ceil(d / WIDTH);

				const css: any = {};

				let start = item[startKey];
				let end = item[endKey];

				if (dir < 0) {
					css.left = left - node.offset().left + sl + d * WIDTH;
					css.width = width - d * WIDTH;

					start += d * DAY;
				};

				if (dir > 0) {
					css.width = width + d * WIDTH;

					end += d * DAY;
				};

				if (duration + d < 1) {
					return;
				};

				el.css(css);
				setHover(start, end);
			};
		});

		win.on('mouseup.timeline', (e: any) => {
			e.stopPropagation();

			unbind();
			save(true);
			window.setTimeout(() => keyboard.setResize(false), 20);
			body.removeClass('eResize wResize');
		});
	};

	const setHover = (start: number, end: number) => {
		start = Number(start) || 0;
		end = Number(end) || 0;

		const idx1 = getIndex(start);
		const idx2 = getIndex(end);

		if ((idx1 < 0) || (idx2 < 0) || (idx1 >= idx2)) {
			return;
		};

		const node = $(nodeRef.current);
		const slice = data.slice(idx1, idx2);

		onMouseLeave();

		for (let i = 0; i < slice.length; i++) {
			const it = slice[i];
			const el = node.find(`#day-${it.d}-${it.m}-${it.y}`);

			if (!el.length) {
				continue;
			};

			el.addClass('hover');

			if (i == 0) {
				el.addClass('first');
			};
			if (i == slice.length - 1) {
				el.addClass('last');
			};
		};
	};

	const onMouseEnter = (e: MouseEvent, item: any) => {
		setHover(item[startKey], item[endKey]);
	};

	const onMouseLeave = () => {
		$(nodeRef.current).find('.day').removeClass('hover first last');
	};

	const getDuration = (item: any): number => {
		const start = Number(item[startKey]) || 0;
		const param = U.Date.getDateParam(Number(item[endKey]) || 0);
		const end = U.Date.timestamp(param.y, param.m, param.d, 23, 59, 59);

		return Math.ceil((end - start) / DAY);
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

					{canEditStart ? <Icon className="resize left" onMouseDown={e => onResizeStart(e, item, -1)} /> : ''}
					{canEditEnd ? <Icon className="resize right" onMouseDown={e => onResizeStart(e, item, 1)} /> : ''}
				</div>
			</CellMeasurer>
		);
	};

	const Tooltip = (item: any) => (
		<>
			<Icon className="arrow" />
			<ObjectName object={item} />
		</>
	);

	const load = () => {
		if (!view || !data.length || !startRelation || !endRelation) {
			return;
		};

		const searchIds = getSearchIds();
		const subId = getSubId();
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			{ relationKey: startRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: 0, quickOption: I.FilterQuickOption.ExactDate, format: startRelation.format },
			{ relationKey: endRelation.relationKey, condition: I.FilterCondition.GreaterOrEqual, value: 0, format: endRelation.format },
		].concat(view.filters as any[]);

		const sorts: I.Sort[] = [].concat(view.sorts);

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Subscription.subscribe({
			subId,
			filters: filters.map(Dataview.filterMapper),
			sorts: sorts.map(Dataview.filterMapper),
			keys: getKeys(view.id),
			sources: object.setOf || [],
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		});
	};

	const resize = () => {
		const node = $(nodeRef.current);

		if (!node.length) {
			return;
		};

		const items = getItems();
		const body = $(bodyRef.current);
		const list = $(itemsRef.current);
		const tooltips = $(tooltipRef.current);
		const scrollContainer = U.Common.getScrollContainer(isPopup);
		const pageContainer = U.Common.getPageContainer(isPopup);
		const top = body.offset().top - J.Size.header - 14 - scrollContainer.scrollTop();
		const left = node.offset().left;

		if (!isInline) {
			node.css({ width: 0, marginLeft: 0 });

			const cw = pageContainer.width();
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;

			node.css({ width: cw, marginLeft: -margin - 2 });
		};

		const width = node.width();

		list.css({ height: Math.max(20, items.length) * HEIGHT });
		tooltips.css({ transform: `translate3d(${left}px, ${top}px, 0)`, width });
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

	const scrollTo = (t: number, animate: boolean) => {
		const node = $(nodeRef.current);
		const idx = getIndex(t);

		if (idx < 0) {
			return;
		};

		const item = data[idx];
		if (!item) {
			return;
		};

		const el = node.find(`#day-${item.d}-${item.m}-${item.y}`);

		if (!el.length) {
			return;
		};

		const left = el.position().left - node.width() / 2 + WIDTH / 2;

		if (animate) {
			node.animate({ scrollLeft: left }, 200);
		} else {
			node.scrollLeft(left);
		};
	};

	const onArrow = (dir: number) => {
		setValue(value + dir * DAY * 30);
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

		const node = $(nodeRef.current);
		const sl = node.scrollLeft();
		const wrap = node.find('.viewContent');
		const nw = node.width();
		const nl = node.offset().left;
		const width = wrap.width() - nw;
		const first = data[0];
		const last = data[data.length - 1];
		const list = node.find('.item');

		if (first && (sl <= 0)) {
			setValue(first.ts);
		};

		if (last && (sl >= width)) {
			setValue(last.ts);
		};

		list.each((i, item: any) => {
			item = $(item);

			const { left } = item.offset();
			const w = item.outerWidth();
			const id = item.attr('data-id');
			const object = items.find(it => it.id == id);
			const isLeft = left <= -w;
			const isRight = left - nl >= nw;

			const createElement = () => {
				el = $(`<div id="tooltipItem-${id}" class="tooltipItem" />`).appendTo(tooltipRef.current);
				ReactDOM.render(<Tooltip {...object} />, el.get(0));

				el.off('click').on('click', (e: any) => {
					e.stopPropagation();
					e.preventDefault();

					setValue(object[startKey]);
				});

				return el;
			};

			let el = $(`#tooltipItem-${id}`);

			el.css({ top: item.position().top });

			if (isLeft || isRight) {
				if (!el.length) {
					el = createElement();
				};

				el.toggleClass('isLeft', isLeft);
				el.toggleClass('isRight', isRight);
			} else 
			if (el.length) {
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
	}));

	return (
		<>
			<div ref={tooltipRef} className="tooltipContainer" />
			<div className="controlsContainer">
				<div className="inner">
					<div className="grad" />
					<Icon className="arrow left withBackground" onClick={() => onArrow(-1)} />
					<Icon className="arrow right withBackground" onClick={() => onArrow(1)}/>
					<Icon id={`calendar-icon-${rootId}-${block.id}`} className="calendar withBackground" onClick={onCalendar} />
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
		</>
	);

}));

export default ViewTimeline;