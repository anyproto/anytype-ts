import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';

import raf from 'raf';
import { arrayMove } from '@dnd-kit/sortable';
import { AutoSizer, WindowScroller, List, InfiniteLoader, CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { LoadMore, StickyScrollbar } from 'Component';
import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';
import AddRow from './grid/body/add';
import FootRow from './grid/foot/row';
import * as I from 'Interface';

const PADDING = 46;
const HEIGHT = 48;

const ViewGrid = forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { 
		rootId, block, isPopup, isInline, className, readonly, loadData, isCollection, getView, onRecordAdd, getEmptyView, getRecords, 
		getLimit, getVisibleRelations, getSubId, isAllowedObject,
	} = props;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const stickyScrollbarRef = useRef(null);
	const isSyncingScroll = useRef(false);
	const scrollRef = useRef(null);
	const scrollWrapRef = useRef(null);
	const view = getView();
	const relations = getVisibleRelations();
	const relationsRef = useRef(relations);
	relationsRef.current = relations;

	useEffect(() => {
		resize();
		rebind();

		return () => {
			unbind();
		};
	}, [ relations.length ]);

	useEffect(() => {
		cache.current.clearAll();
		listRef.current?.recomputeRowHeights(0);
	}, [ view.wrapContent, relations.length ]);

	useEffect(() => {
		resize();
		onScrollHorizontal();
		onScrollVertical();

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		if (ids.length) {
			selection?.renderSelection();
		};

		U.Dom.triggerResizeEditor(isPopup);
	}, [ relations.length, view?.id ]);

	if (!view) {
		return null;
	};

	const scrollVerticalHandlerRef = useRef<(() => void) | null>(null);

	const scrollHorizontalHandlerRef = useRef<(() => void) | null>(null);

	const rebind = () => {
		const scroll = scrollRef.current;
		const container = U.Dom.getScrollContainer(isPopup);

		unbind();

		scrollHorizontalHandlerRef.current = () => onScrollHorizontal();
		if (scroll) {
			U.Dom.addEvent(scroll, 'scroll', scrollHorizontalHandlerRef.current);
		};
		scrollVerticalHandlerRef.current = () => raf(() => onScrollVertical());
		if (container) {
			U.Dom.addEvent(container, 'scroll', scrollVerticalHandlerRef.current);
		};

		if (!isInline) {
			stickyScrollbarRef.current?.bind(scroll, isSyncingScroll.current);
		};
	};

	const unbind = () => {
		const scroll = scrollRef.current;
		const container = U.Dom.getScrollContainer(isPopup);

		if (scrollHorizontalHandlerRef.current && scroll) {
			U.Dom.removeEvent(scroll, 'scroll', scrollHorizontalHandlerRef.current);
			scrollHorizontalHandlerRef.current = null;
		};
		if (scrollVerticalHandlerRef.current && container) {
			U.Dom.removeEvent(container, 'scroll', scrollVerticalHandlerRef.current);
			scrollVerticalHandlerRef.current = null;
		};
		stickyScrollbarRef.current?.unbind();
	};

	const onScrollHorizontal = () => {
		S.Menu.resizeAll();

		if (!keyboard.isResizing) {
			resizeColumns('', 0);
		};

		if (isInline) {
			return;
		};

		const node = nodeRef.current;
		const scroll = scrollRef.current;
		const clone = U.Dom.select('#rowHeadClone', node);

		if (clone) {
			U.Dom.css(clone, { transform: `translate3d(${-(scroll?.scrollLeft ?? 0)}px,0px,0px)` });
		};

		if (stickyScrollbarRef) {
			isSyncingScroll.current = stickyScrollbarRef.current?.sync(scroll, isSyncingScroll.current);
		};
	};

	const onScrollVertical = () => {
		if (isInline || isPopup) {
			return;
		};

		const node = nodeRef.current;
		const rowHead = U.Dom.select('#rowHead', node);

		if (!rowHead) {
			return;
		};

		const scroll = scrollRef.current;
		const { left, top } = rowHead.getBoundingClientRect();
		const sx = scroll?.scrollLeft ?? 0;

		let clone = U.Dom.select('#rowHeadClone', node);

		if (!clone) {
			clone = document.createElement('div');
			clone.id = 'rowHeadClone';

			node.appendChild(clone);

			const root = createRoot(clone);

			root.render((
				<HeadRow
					{...props}
					onCellAdd={onCellAdd}
					onSortStart={onSortStart}
					onSortEnd={onSortEnd}
					onResizeStart={onResizeStart}
					getColumnWidths={getColumnWidths}
				/>
			));

			const rowHeadInClone = U.Dom.select('.rowHead', clone);
			if (rowHeadInClone) {
				rowHeadInClone.id = '';
			};
		};

		if (top <= J.Size.header) {
			U.Dom.css(clone, {
				left: `${left + sx}px`,
				top: `${J.Size.header}px`,
				width: `${rowHead.offsetWidth + 2}px`,
				transform: `translate3d(${-sx}px,0px,0px)`,
			});
		} else {
			clone.remove();
		};

		U.Dom.toggleClass(rowHead, 'fixed', top <= J.Size.header);
	};

	const resizeColumns = (relationKey: string, width: number) => {
		const node = nodeRef.current;
		const rels = relationsRef.current;
		const widths = getColumnWidths(relationKey, width);
		const str = rels.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const size = J.Size.dataview.cell;

		rels.forEach(it => {
			const width = widths[it.relationKey];
			const el = U.Dom.select(`#${U.Common.esc(Relation.cellId('head', it.relationKey, ''))}`, node);

			if (el) {
				U.Dom.toggleClass(el, 'small', width <= size.small);
				U.Dom.toggleClass(el, 'medium', (width > size.small) && (width <= size.medium));
			};
		});

		U.Dom.selectAll('.rowHead', node).forEach(el => U.Dom.css(el, { gridTemplateColumns: str }));
		U.Dom.selectAll('.rowFoot', node).forEach(el => U.Dom.css(el, { gridTemplateColumns: str }));
		U.Dom.selectAll('.row .selectionTarget', node).forEach(el => U.Dom.css(el, { gridTemplateColumns: str }));
	};

	const getColumnWidths = (relationKey: string, width: number): any => {
		const columns: any = {};

		relationsRef.current.forEach(it => {
			if (!it.relation) {
				return;
			};
			const w = relationKey && (it.relationKey == relationKey) ? width : it.width;
			columns[it.relationKey] = Relation.width(w, it.relation.format);
		});

		return columns;
	};

	const getRowHeight = () => {
		return props.isInline ? 40 : 48;
	};

	const cellPosition = (cellId: string) => {
		const cell = U.Dom.get(cellId);
		if (!cell || !U.Dom.hasClass(cell, 'isEditing')) {
			return;
		};

		const scroll = scrollRef.current;
		const content = U.Dom.select('.cellContent', cell);
		if (!content) {
			return;
		};

		const x = cell.offsetLeft;
		const width = content.offsetWidth;
		const sx = scroll?.scrollLeft ?? 0;
		const sw = U.Dom.contentWidth(scroll);
		const container = isPopup ? U.Dom.get('popupPage-innerWrap') : document.body;
		const ww = U.Dom.contentWidth(container);
		const rx = x - sx + width;

		U.Dom.css(content, { left: '0', right: 'auto' });

		if ((rx >= ww - 92) || (rx > sw)) {
			U.Dom.css(content, { left: 'auto', right: '0' });
		};
	};

	const resizeMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
	const resizeEndHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

	const onResizeStart = (e: any, relationKey: string) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		const el = U.Dom.select(`#${U.Common.esc(Relation.cellId('head', relationKey, ''))}`, node);
		const rect = el?.getBoundingClientRect();
		const left = (rect?.left ?? 0) + window.scrollX;

		U.Dom.addClass(document.body, 'colResize');

		if (resizeMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', resizeMoveHandlerRef.current);
		};
		if (resizeEndHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', resizeEndHandlerRef.current);
		};

		resizeMoveHandlerRef.current = (e: MouseEvent) => onResizeMove(e, relationKey, left);
		resizeEndHandlerRef.current = (e: MouseEvent) => onResizeEnd(e, relationKey, left);

		U.Dom.addEvents(window, [
			['mousemove', resizeMoveHandlerRef.current],
			['mouseup', resizeEndHandlerRef.current],
		]);

		if (el) {
			U.Dom.addClass(el, 'isResizing');
		};
		keyboard.setResize(true);
	};

	const onResizeMove = (e: any, relationKey: string, ox: number) => {
		e.preventDefault();
		e.stopPropagation();

		resizeColumns(relationKey, checkWidth(e.pageX - ox));
	};

	const onResizeEnd = (e: any, relationKey: string, ox: number) => {
		const node = nodeRef.current;
		const width = checkWidth(e.pageX - ox);

		if (resizeMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', resizeMoveHandlerRef.current);
			resizeMoveHandlerRef.current = null;
		};
		if (resizeEndHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', resizeEndHandlerRef.current);
			resizeEndHandlerRef.current = null;
		};
		U.Dom.eventDispatch(window, 'resize');
		U.Dom.removeClass(document.body, 'colResize');
		U.Dom.selectAll('.cellHead.isResizing', node).forEach(el => U.Dom.removeClass(el, 'isResizing'));
		U.Dom.selectAll('.cellKeyHover', node).forEach(el => U.Dom.removeClass(el, 'cellKeyHover'));

		relations.forEach(it => {
			if (it.relationKey == relationKey) {
				it.width = Relation.width(width, it.relation.format);
			};
		});

		C.BlockDataviewViewRelationReplace(rootId, block.id, view.id, relationKey, {
			...view.getRelation(relationKey),
			width,
		});

		cache.current.clearAll();
		listRef.current?.recomputeRowHeights(0);

		window.setTimeout(() => keyboard.setResize(false), 50);
	};

	const checkWidth = (width: number): number => {
		const { min, max } = J.Size.dataview.cell;
		return Math.min(max, Math.max(min, Math.floor(width)));
	};

	const onCellAdd = (e: any) => {
		const blockEl = U.Dom.get(`block-${block.id}`);
		const rowHead = U.Dom.select('#rowHead', blockEl);
		const isFixed = rowHead ? U.Dom.hasClass(rowHead, 'fixed') : false;
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const element = `#block-${U.Common.esc(block.id)} ${headEl} .cellHead.last`;
		const cellLast = blockEl ? U.Dom.select(`${headEl} .cellHead.last`, blockEl) : null;

		S.Menu.open('dataviewRelationList', { 
			classNameWrap: 'fromBlock',
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 10,
			noAutoHover: true,
			className: isFixed ? 'fixed' : '',
			onOpen: () => { if (cellLast) U.Dom.addClass(cellLast, 'hover'); },
			onClose: () => { if (cellLast) U.Dom.removeClass(cellLast, 'hover'); },
			data: {
				readonly,
				loadData,
				getView,
				rootId,
				isInline,
				isCollection,
				blockId: block.id,
				onAdd: () => S.Menu.closeAll(J.Menu.cellAdd)
			}
		});
	};

	const onSortStart = () => {
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		const { active, over } = result;

		if (!active || !over) {
			return;
		};

		const oldIndex = view.relations.findIndex(it => it.relationKey == active.id);
		const newIndex = view.relations.findIndex(it => it.relationKey == over.id);

		view.relations = arrayMove(view.relations, oldIndex, newIndex);
		C.BlockDataviewViewRelationSort(rootId, block.id, view.id, view.relations.map(it => it.relationKey));

		keyboard.setDragging(false);
		keyboard.disableSelection(false);
	};

	const loadMoreRows = () => {
		const subId = getSubId();
		const view = getView();
		const limit = getLimit();

		let { offset } = S.Record.getMeta(subId, '');

		return new Promise((resolve, reject) => {
			offset += limit;

			loadData(view.id, offset, false, resolve);
			S.Record.metaSet(subId, '', { offset });
		});
	};

	const resize = () => {
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const scroll = scrollRef.current;
		const wrap = scrollWrapRef.current;
		const container = U.Dom.getPageContainer(isPopup);
		const width = getVisibleRelations().reduce((res: number, current: any) => res + current.width, J.Size.blockMenu);
		const cw = container?.clientWidth ?? 0;
		const ch = container?.clientHeight ?? 0;

		if (isInline) {
			if (parent) {
				if (parent.isPage() || parent.isLayoutDiv()) {
					const wrapper = U.Dom.select('#editorWrapper', container);
					const ww = U.Dom.contentWidth(wrapper);
					const vw = Math.max(ww, width) + (width > ww ? PADDING : 0);
					const margin = Math.max(0, (cw - ww) / 2);
					const offset = 8;

					if (scroll) {
						U.Dom.css(scroll, { width: `${cw}px`, marginLeft: `${-margin}px` });
					};
					if (wrap) {
						U.Dom.css(wrap, { width: `${vw + margin - offset}px`, paddingLeft: `${margin}px`, paddingRight: `${offset * 2}px` });
					};
				} else {
					const parentObj = U.Dom.get(`block-${parent.id}`);
					const vw = parentObj ? (U.Dom.contentWidth(parentObj) - J.Size.blockMenu) : 0;

					if (wrap) {
						U.Dom.css(wrap, { width: `${Math.max(vw, width)}px` });
					};
				};
			};
		} else {
			const mw = cw - PADDING * 2;
			const vw = Math.max(mw, width) + (width > mw ? PADDING : 0);
			const margin = (cw - mw) / 2;
			const pr = width > mw ? PADDING : 0;
			const scrollRect = scroll?.getBoundingClientRect();

			if (scroll) {
				U.Dom.css(scroll, {
					width: `${cw - 4}px`,
					marginLeft: `${-margin - 2}px`,
					paddingLeft: `${margin}px`,
					minHeight: `${ch - (scrollRect?.top ?? 0)}px`,
				});
			};

			if (wrap) {
				U.Dom.css(wrap, { width: `${vw}px`, paddingRight: `${pr}px` });
			};

			stickyScrollbarRef.current?.resize({
				width: mw,
				left: margin,
				paddingLeft: margin,
				display: vw <= mw ? 'none' : '',
				trackWidth: vw,
			});
		};

		resizeColumns('', 0);
	};

	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const records = getRecords();
	const { offset, total } = S.Record.getMeta(getSubId(), '');
	const limit = getLimit();
	const length = records.length;
	const cn = [ 'viewContent', className ];

	if (view.wrapContent) {
		cn.push('wrapContent');
	};

	const rowRenderer = ({ key, index, parent, style }) => (
		<CellMeasurer
			key={key}
			parent={parent}
			cache={cache.current}
			columnIndex={0}
			rowIndex={index}
			hasFixedWidth={() => {}}
		>
			{({ registerChild, measure }) => (
				<div 
					ref={registerChild} 
					style={style}
				>
					<BodyRow 
						key={`grid-row-${view.id + index}`} 
						{...props} 
						recordId={records[index]}
						recordIdx={index}
						cellPosition={cellPosition}
						getColumnWidths={getColumnWidths}
						onUpdate={view.wrapContent ? measure : undefined}
					/>
				</div>
			)}
		</CellMeasurer>
	);

	let content = null;
	if (!length) {
		content = getEmptyView(I.ViewType.Grid);
	} else
	if (isInline) {
		content = (
			<div>
				{records.map((id: string, index: number) => (
					<BodyRow 
						key={`grid-row-${view.id}${index}`} 
						{...props} 
						recordId={records[index]}
						cellPosition={cellPosition}
						getColumnWidths={getColumnWidths}
					/>
				))}
			</div>
		);
	} else {
		content = (
			<InfiniteLoader
				loadMoreRows={loadMoreRows}
				isRowLoaded={({ index }) => !!records[index]}
				rowCount={total}
				threshold={10}
			>
				{({ onRowsRendered }) => (
					<WindowScroller scrollElement={U.Dom.getScrollContainer(isPopup)}>
						{({ height, isScrolling, registerChild, scrollTop }) => (
							<AutoSizer disableHeight={true}>
								{({ width }) => (
									<div ref={registerChild}>
										<List
											ref={listRef}
											autoHeight={true}
											height={Number(height) || 0}
											width={Number(width) || 0}
											isScrolling={isScrolling}
											rowCount={length}
											rowHeight={param => Math.max(cache.current.rowHeight(param), getRowHeight())}
											onRowsRendered={onRowsRendered}
											deferredMeasurementCache={cache.current}
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
		);
	};

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div
			ref={nodeRef}
			className="wrap"
		>
			<div ref={scrollRef} id="scroll" className="scroll">
				<div ref={scrollWrapRef} id="scrollWrap" className="scrollWrap">
					<div className={cn.join(' ')}>
						<HeadRow
							{...props}
							onCellAdd={onCellAdd}
							onSortStart={onSortStart}
							onSortEnd={onSortEnd}
							onResizeStart={onResizeStart}
							getColumnWidths={getColumnWidths}
						/>

						{content}
						{isAllowedObject() ? <AddRow onClick={e => onRecordAdd(e, 1)} /> : ''}

						<FootRow
							{...props}
							getColumnWidths={getColumnWidths}
						/>

						{isInline && (limit + offset < total) ? (
							<LoadMore limit={getLimit()} loaded={records.length} total={total} onClick={loadMoreRows} />
						) : ''}
					</div>
				</div>
			</div>
			{!isInline ? <StickyScrollbar ref={stickyScrollbarRef} /> : ''}
		</div>
	);

});

export default ViewGrid;