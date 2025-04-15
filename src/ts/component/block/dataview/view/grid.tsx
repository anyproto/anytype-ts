import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { Icon, LoadMore } from 'Component';
import { I, C, S, U, J, translate, keyboard, Relation } from 'Lib';
import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';
import FootRow from './grid/foot/row';

const PADDING = 46;

const ViewGrid = observer(class ViewGrid extends React.Component<I.ViewComponent> {

	node: any = null;
	ox = 0;

	constructor (props: I.ViewComponent) {
		super (props);

		this.cellPosition = this.cellPosition.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.getColumnWidths = this.getColumnWidths.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, className, getView, onRecordAdd, getEmpty, getRecords, getLimit, getVisibleRelations, getSubId } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const records = getRecords();
		const { offset, total } = S.Record.getMeta(getSubId(), '');
		const limit = getLimit();
		const length = records.length;
		const isAllowedObject = this.props.isAllowedObject();
		const cn = [ 'viewContent', className ];

		let content = null;
		if (!length) {
			content = getEmpty('view');
		} else
		if (isInline) {
			content = (
				<div>
					{records.map((id: string, index: number) => (
						<BodyRow 
							key={'grid-row-' + view.id + index} 
							{...this.props} 
							recordId={records[index]}
							cellPosition={this.cellPosition}
							getColumnWidths={this.getColumnWidths}
						/>
					))}
				</div>
			);
		} else {
			content = (
				<InfiniteLoader
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => !!records[index]}
					rowCount={total}
					threshold={10}
				>
					{({ onRowsRendered }) => (
						<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
							{({ height, isScrolling, registerChild, scrollTop }) => (
								<AutoSizer disableHeight={true}>
									{({ width }) => (
										<div ref={registerChild}>
											<List
												autoHeight={true}
												height={Number(height) || 0}
												width={Number(width) || 0}
												isScrolling={isScrolling}
												rowCount={length}
												rowHeight={this.getRowHeight()}
												onRowsRendered={onRowsRendered}
												rowRenderer={({ key, index, style }) => (
													<BodyRow 
														key={`grid-row-${view.id + index}`} 
														{...this.props} 
														recordId={records[index]}
														recordIdx={index}
														style={{ ...style, top: style.top + 2 }}
														cellPosition={this.cellPosition}
														getColumnWidths={this.getColumnWidths}
													/>
												)}
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

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div id="scroll" className="scroll">
					<div id="scrollWrap" className="scrollWrap">
						<div className={cn.join(' ')}>
							<HeadRow 
								{...this.props} 
								onCellAdd={this.onCellAdd} 
								onSortStart={this.onSortStart} 
								onSortEnd={this.onSortEnd} 
								onResizeStart={this.onResizeStart}
								getColumnWidths={this.getColumnWidths}
							/>

							{content}

							{isAllowedObject ? (
								<div className="row add">
									<div className="cell add">
										<div className="btn" onClick={e => onRecordAdd(e, 1)}>
											<Icon className="plus" />
											<div className="name">{translate('commonNewObject')}</div>
										</div>
									</div>
								</div>
							) : null}

							<FootRow
								{...this.props} 
								getColumnWidths={this.getColumnWidths}
							/>

							{isInline && (limit + offset < total) ? (
								<LoadMore limit={getLimit()} loaded={records.length} total={total} onClick={this.loadMoreRows} />
							) : ''}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.rebind();
		this.resize();
		this.onScrollHorizontal();
		this.onScrollVertical();

		U.Common.triggerResizeEditor(this.props.isPopup);
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		const { isPopup, block } = this.props;
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const container = U.Common.getScrollContainer(isPopup);

		this.unbind();

		scroll.on('scroll', () => this.onScrollHorizontal());
		container.off(`scroll.${block.id}`).on(`scroll.${block.id}`, () => this.onScrollVertical());
	};

	unbind () {
		const { isPopup, block } = this.props;
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const container = U.Common.getScrollContainer(isPopup);

		scroll.off('scroll');
		container.off(`scroll.${block.id}`);
	};

	onScrollHorizontal () {
		S.Menu.resizeAll();
		this.resizeColumns('', 0);

		const { isInline } = this.props;

		if (isInline) {
			return;
		};

		const node = $(this.node);
		const clone = node.find('#rowHeadClone');

		if (clone.length) {
			const scroll = node.find('#scroll');

			clone.css({ transform: `translate3d(${-scroll.scrollLeft()}px,0px,0px)` });
		};
	};

	onScrollVertical () {
		const { isPopup, isInline } = this.props;

		if (isInline) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const node = $(this.node);
		const rowHead = node.find('#rowHead');
		if (!rowHead.length) {
			return;
		};

		const scroll = node.find('#scroll');
		const hh = J.Size.header;
		const st = container.scrollTop();
		const { left, top } = rowHead.offset();
		const sl = scroll.scrollLeft();

		rowHead.removeClass('fixed');
		node.find('#rowHeadClone').remove();

		if (top - st <= hh) {
			const clone = $('<div id="rowHeadClone"></div>');

			node.append(clone);

			ReactDOM.render((
				<HeadRow 
					{...this.props} 
					onCellAdd={this.onCellAdd} 
					onSortStart={this.onSortStart} 
					onSortEnd={this.onSortEnd} 
					onResizeStart={this.onResizeStart}
					getColumnWidths={this.getColumnWidths}
				/>
			), clone.get(0));

			clone.find('.rowHead').attr({ id: '' });
			clone.css({ 
				left: left + sl, 
				top: hh, 
				width: rowHead.width(),
				transform: `translate3d(${-sl}px,0px,0px)`
			});

			rowHead.addClass('fixed');
		};
	};

	resizeColumns (relationKey: string, width: number) {
		const { getVisibleRelations } = this.props;
		const node = $(this.node);
		const relations = getVisibleRelations();
		const size = J.Size.dataview.cell;
		const widths = this.getColumnWidths(relationKey, width);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');

		relations.forEach(it => {
			const width = widths[it.relationKey];
			const el = node.find(`#${Relation.cellId('head', it.relationKey, '')}`);

			el.toggleClass('small', width <= size.icon);
		});

		node.find('.rowHead').css({ gridTemplateColumns: str });
		node.find('.rowFoot').css({ gridTemplateColumns: str });
		node.find('.row .selectionTarget').css({ gridTemplateColumns: str });
	};

	getColumnWidths (relationKey: string, width: number): any {
		const { getVisibleRelations } = this.props;
		const relations = getVisibleRelations();
		const columns: any = {};
		
		relations.forEach(it => {
			const relation: any = S.Record.getRelationByKey(it.relationKey) || {};
			const w = relationKey && (it.relationKey == relationKey) ? width : it.width;

			columns[it.relationKey] = Relation.width(w, relation.format);
		});

		return columns;
	};

	getRowHeight () {
		return this.props.isInline ? 40 : 48;
	};

	cellPosition (cellId: string) {
		const cell = $(`#${cellId}`);
		if (!cell.hasClass('isEditing')) {
			return;
		};

		const { isPopup } = this.props;
		const node = $(this.node);
		const scroll = node.find('#scroll');
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

	onResizeStart (e: any, relationKey: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const node = $(this.node);
		const el = node.find(`#${Relation.cellId('head', relationKey, '')}`);
		const offset = el.offset();

		this.ox = offset.left;

		$('body').addClass('colResize');
		win.off('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', e => this.onResizeMove(e, relationKey));
		win.on('mouseup.cell', e => this.onResizeEnd(e, relationKey));

		el.addClass('isResizing');
		keyboard.setResize(true);
	};

	onResizeMove (e: any, relationKey: string) {
		e.preventDefault();
		e.stopPropagation();

		this.resizeColumns(relationKey, this.checkWidth(e.pageX - this.ox));
	};

	onResizeEnd (e: any, relationKey: string) {
		const { rootId, block, getView, getVisibleRelations } = this.props;
		const view = getView();
		const node = $(this.node);
		const relations = getVisibleRelations();
		const width = this.checkWidth(e.pageX - this.ox);

		$(window).off('mousemove.cell mouseup.cell').trigger('resize');
		$('body').removeClass('colResize');
		node.find('.cellHead.isResizing').removeClass('isResizing');
		node.find('.cellKeyHover').removeClass('cellKeyHover');

		relations.forEach(it => {
			const relation: any = S.Record.getRelationByKey(it.relationKey) || {};
			if (it.relationKey == relationKey) {
				it.width = Relation.width(width, relation.format);
			};
		});

		C.BlockDataviewViewRelationReplace(rootId, block.id, view.id, relationKey, { 
			...view.getRelation(relationKey), 
			width: this.checkWidth(e.pageX - this.ox),
		});

		window.setTimeout(() => keyboard.setResize(false), 50);
	};

	checkWidth (width: number): number {
		const { min, max } = J.Size.dataview.cell;
		return Math.min(max, Math.max(min, Math.floor(width)));
	};

	onCellAdd (e: any) {
		const { rootId, block, readonly, loadData, getView, isInline, isCollection } = this.props;
		const blockEl = `#block-${block.id}`;
		const rowHead = $(`${blockEl} #rowHead`);
		const isFixed = rowHead.hasClass('fixed');
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const element = `${blockEl} ${headEl} #cell-add`;
		const cellLast = $(`${blockEl} ${headEl} .cellHead.last`);

		S.Menu.open('dataviewRelationList', { 
			element,
			horizontal: I.MenuDirection.Center,
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

	onSortStart () {
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { rootId, block, getView, getVisibleRelations } = this.props;
		const { oldIndex, newIndex } = result;
		const view = getView();
		const relations = getVisibleRelations();

		view.relations = arrayMove(relations, oldIndex, newIndex);
		C.BlockDataviewViewRelationSort(rootId, block.id, view.id, view.relations.map(it => it.relationKey));

		keyboard.setDragging(false);
		keyboard.disableSelection(false);
	};

	loadMoreRows () {
		const { rootId, block, loadData, getView, getLimit, getSubId } = this.props;
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

	resize () {
		const { rootId, block, isPopup, isInline, getVisibleRelations, getSubId } = this.props;
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const wrap = node.find('#scrollWrap');
		const grid = node.find('.ReactVirtualized__Grid__innerScrollContainer');
		const container = U.Common.getPageContainer(isPopup);
		const width = getVisibleRelations().reduce((res: number, current: any) => { return res + current.width; }, J.Size.blockMenu);
		const length = S.Record.getRecordIds(getSubId(), '').length;
		const cw = container.width();
		const rh = this.getRowHeight();

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

			scroll.css({ width: cw - 4, marginLeft: -margin - 2, paddingLeft: margin });
			wrap.css({ width: vw, paddingRight: pr });
		};

		grid.css({ height: length * rh + 4, maxHeight: length * rh + 4 });
		this.resizeColumns('', 0);
	};
	
});

export default ViewGrid;
