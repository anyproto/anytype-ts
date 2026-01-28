import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import $ from 'jquery';
import raf from 'raf';
import { arrayMove } from '@dnd-kit/sortable';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, InfiniteLoader, CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { LoadMore, StickyScrollbar } from 'Component';
import { I, C, S, U, J, keyboard, Relation } from 'Lib';
import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';
import AddRow from './grid/body/add';
import FootRow from './grid/foot/row';

const PADDING = 46;
const HEIGHT = 48;

const ViewGrid = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

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

	useEffect(() => {
		resize();
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		cache.current.clearAll();
		listRef.current?.recomputeRowHeights(0);
	}, [ view.wrapContent, relations.length ]);

	useEffect(() => {
		rebind();
		resize();
		onScrollHorizontal();
		onScrollVertical();

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		if (ids.length) {
			selection?.renderSelection();
		};

		U.Common.triggerResizeEditor(isPopup);
	});

	if (!view) {
		return null;
	};

	const rebind = () => {
		const scroll = $(scrollRef.current);
		const container = U.Common.getScrollContainer(isPopup);

		unbind();

		scroll.on('scroll', () => onScrollHorizontal());
		container.off(`scroll.${block.id}`).on(`scroll.${block.id}`, () => raf(() => onScrollVertical()));

		if (!isInline) {
			stickyScrollbarRef.current?.bind(scroll, isSyncingScroll.current);
		};
	};

	const unbind = () => {
		const scroll = $(scrollRef.current);
		const container = U.Common.getScrollContainer(isPopup);

		scroll.off('scroll');
		container.off(`scroll.${block.id}`);
		stickyScrollbarRef.current?.unbind();
	};

	const onScrollHorizontal = () => {
		S.Menu.resizeAll();
		resizeColumns('', 0);

		if (isInline) {
			return;
		};

		const node = $(nodeRef.current);
		const scroll = $(scrollRef.current);
		const clone = node.find('#rowHeadClone');

		if (clone.length) {
			clone.css({ transform: `translate3d(${-scroll.scrollLeft()}px,0px,0px)` });
		};

		if (stickyScrollbarRef) {
			isSyncingScroll.current = stickyScrollbarRef.current?.sync(scroll, isSyncingScroll.current);
		};
	};

	const onScrollVertical = () => {
		if (isInline || isPopup) {
			return;
		};
		
		const node = $(nodeRef.current);
		const rowHead = node.find('#rowHead');

		if (!rowHead.length) {
			return;
		};

		const scroll = $(scrollRef.current);
		const { left, top } = rowHead.offset();
		const sx = scroll.scrollLeft();
		
		let clone = node.find('#rowHeadClone');

		if (!clone.length) {
			clone = $('<div id="rowHeadClone"></div>');

			node.append(clone);

			const root = createRoot(clone.get(0));

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

			clone.find('.rowHead').attr({ id: '' });
		};

		if (top <= J.Size.header) {
			clone.css({ 
				left: left + sx, 
				top: J.Size.header, 
				width: rowHead.outerWidth() + 2, 
				transform: `translate3d(${-sx}px,0px,0px)`,	
			});
		} else {
			clone.remove();
		};

		rowHead.toggleClass('fixed', top <= J.Size.header);
	};

	const resizeColumns = (relationKey: string, width: number) => {
		const node = $(nodeRef.current);
		const widths = getColumnWidths(relationKey, width);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const size = J.Size.dataview.cell;

		relations.forEach(it => {
			const width = widths[it.relationKey];
			const el = node.find(`#${Relation.cellId('head', it.relationKey, '')}`);

			el.toggleClass('small', width <= size.small);
			el.toggleClass('medium', (width > size.small) && (width <= size.medium));
		});

		node.find('.rowHead').css({ gridTemplateColumns: str });
		node.find('.rowFoot').css({ gridTemplateColumns: str });
		node.find('.row .selectionTarget').css({ gridTemplateColumns: str });
	};

	const getColumnWidths = (relationKey: string, width: number): any => {
		const columns: any = {};
		
		relations.forEach(it => {
			const w = relationKey && (it.relationKey == relationKey) ? width : it.width;
			columns[it.relationKey] = Relation.width(w, it.relation.format);
		});

		return columns;
	};

	const getRowHeight = () => {
		return props.isInline ? 40 : 48;
	};

	const cellPosition = (cellId: string) => {
		const cell = $(`#${cellId}`);
		if (!cell.hasClass('isEditing')) {
			return;
		};

		const scroll = $(scrollRef.current);
		const content = cell.find('.cellContent');
		const x = cell.position().left;
		const width = content.outerWidth();
		const sx = scroll.scrollLeft();
		const sw = scroll.width();
		const container = $(isPopup ? '#popupPage-innerWrap' : 'body');
		const ww = container.width();
		const rx = x - sx + width;

		content.css({ left: 0, right: 'auto' });

		if ((rx >= ww - 92) || (rx > sw)) {
			content.css({ left: 'auto', right: 0 });
		};
	};

	const onResizeStart = (e: any, relationKey: string) => {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const node = $(nodeRef.current);
		const el = node.find(`#${Relation.cellId('head', relationKey, '')}`);
		const { left } = el.offset();

		$('body').addClass('colResize');
		win.off('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', e => onResizeMove(e, relationKey, left));
		win.on('mouseup.cell', e => onResizeEnd(e, relationKey, left));

		el.addClass('isResizing');
		keyboard.setResize(true);
	};

	const onResizeMove = (e: any, relationKey: string, ox: number) => {
		e.preventDefault();
		e.stopPropagation();

		resizeColumns(relationKey, checkWidth(e.pageX - ox));
	};

	const onResizeEnd = (e: any, relationKey: string, ox: number) => {
		const node = $(nodeRef.current);
		const width = checkWidth(e.pageX - ox);

		$(window).off('mousemove.cell mouseup.cell').trigger('resize');
		$('body').removeClass('colResize');
		node.find('.cellHead.isResizing').removeClass('isResizing');
		node.find('.cellKeyHover').removeClass('cellKeyHover');

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
		const blockEl = `#block-${block.id}`;
		const rowHead = $(`${blockEl} #rowHead`);
		const isFixed = rowHead.hasClass('fixed');
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const element = `${blockEl} ${headEl} #cell-add`;
		const cellLast = $(`${blockEl} ${headEl} .cellHead.last`);

		S.Menu.open('dataviewRelationList', { 
			classNameWrap: 'fromBlock',
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 10,
			className: isFixed ? 'fixed' : '',
			onOpen: () => cellLast.addClass('hover'),
			onClose: () => cellLast.removeClass('hover'),
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

		const ids = relations.map(it => it.relationKey);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		view.relations = arrayMove(relations, oldIndex, newIndex);
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
		const scroll = $(scrollRef.current);
		const wrap = $(scrollWrapRef.current);
		const container = U.Common.getPageContainer(isPopup);
		const width = getVisibleRelations().reduce((res: number, current: any) => res + current.width, J.Size.blockMenu);
		const cw = container.width();
		const ch = container.height();

		if (isInline) {
			if (parent) {
				if (parent.isPage() || parent.isLayoutDiv()) {
					const wrapper = container.find('#editorWrapper');
					const ww = wrapper.width();
					const vw = Math.max(ww, width) + (width > ww ? PADDING : 0);
					const margin = Math.max(0, (cw - ww) / 2);
					const offset = 8;

					scroll.css({ width: cw, marginLeft: -margin });
					wrap.css({ width: vw + margin - offset, paddingLeft: margin, paddingRight: offset * 2 });
				} else {
					const parentObj = $(`#block-${parent.id}`);
					const vw = parentObj.length ? (parentObj.width() - J.Size.blockMenu) : 0;

					wrap.css({ width: Math.max(vw, width) });
				};
			};
		} else {
			const mw = cw - PADDING * 2;
			const vw = Math.max(mw, width) + (width > mw ? PADDING : 0);
			const margin = (cw - mw) / 2;
			const pr = width > mw ? PADDING : 0;

			scroll.css({ 
				width: cw - 4, 
				marginLeft: -margin - 2, 
				paddingLeft: margin, 
				minHeight: (ch - scroll.offset()?.top),
			});

			wrap.css({ width: vw, paddingRight: pr });

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
					<WindowScroller scrollElement={U.Common.getScrollContainer(isPopup).get(0)}>
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

}));

export default ViewGrid;