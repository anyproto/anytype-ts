import * as React from 'react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import $ from 'jquery';
import { Icon, LoadMore } from 'Component';
import { I, C, Util, translate, keyboard, Relation } from 'Lib';
import { dbStore, menuStore, blockStore } from 'Store';
import Empty from '../empty';
import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	getWrapperWidth?(): number;
};

const PADDING = 46;

const ViewGrid = observer(class ViewGrid extends React.Component<Props> {

	node: any = null;
	ox = 0;

	constructor (props: Props) {
		super (props);

		this.cellPosition = this.cellPosition.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.getColumnWidths = this.getColumnWidths.bind(this);
	};

	render () {
		const { rootId, block, getView, onRecordAdd, isPopup, isInline, getLimit } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const { offset, total } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const limit = getLimit();
		const length = records.length;
		const isAllowedObject = this.props.isAllowedObject();

		if (!length) {
			return (
				<Empty 
					{...this.props}
					title="No objects found" 
					description="Create your first one to begin"
					button="Create object"
					className={isInline ? 'withHead' : ''}
					withButton={isAllowedObject}
					onClick={(e: any) => onRecordAdd(e, 1)}
				/>
			);
		};

		let content = null;

		if (isInline) {
			content = (
				<div>
					{records.map((id: string, index: number) => (
						<BodyRow 
							key={'grid-row-' + view.id + index} 
							{...this.props} 
							readonly={!isAllowedObject}
							index={index} 
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
					{({ onRowsRendered, registerChild }) => (
						<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
							{({ height, isScrolling, registerChild, scrollTop }) => {
								return (
									<AutoSizer disableHeight={true}>
										{({ width }) => {
											return (
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
																key={'grid-row-' + view.id + index} 
																{...this.props} 
																readonly={!isAllowedObject}
																index={index} 
																style={{ ...style, top: style.top + 2 }}
																cellPosition={this.cellPosition}
																getColumnWidths={this.getColumnWidths}
															/>
														)}
														scrollTop={scrollTop}
													/>
												</div>
											);
										}}
									</AutoSizer>
								);
							}}
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
						<div className="viewItem viewGrid">
							<HeadRow 
								{...this.props} 
								onCellAdd={this.onCellAdd} 
								onSortStart={this.onSortStart} 
								onSortEnd={this.onSortEnd} 
								onResizeStart={this.onResizeStart}
								getColumnWidths={this.getColumnWidths}
							/>

							{content}

							{isInline && (limit + offset < total) ? (
								<LoadMore limit={getLimit()} loaded={records.length} total={total} onClick={this.loadMoreRows} />
							) : ''}

							{isAllowedObject && !isInline ? (
								<div className="row add">
									<div className="cell add">
										<div className="btn" onClick={(e: any) => { onRecordAdd(e, 1); }}>
											<Icon className="plus" />
											<div className="name">{translate('blockDataviewNew')}</div>
										</div>
									</div>
								</div>
							) : null}
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
		const win = $(window);

		this.rebind();
		this.resize();
		this.onScroll();

		win.trigger('resize.editor');
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		const node = $(this.node);

		this.unbind();
		node.find('#scroll').on('scroll', () => { this.onScroll(); });
	};

	unbind () {
		const node = $(this.node);

		node.find('#scroll').off('scroll');
	};

	onScroll () {
		const win = $(window);

		for (let menu of menuStore.list) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};

		this.resizeColumns('', 0);
	};

	resize () {
		const { rootId, block, getView, isPopup, isInline } = this.props;
		const element = blockStore.getMapElement(rootId, block.id);
		const parent = blockStore.getLeaf(rootId, element.parentId);
		const view = getView();
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const wrap = node.find('#scrollWrap');
		const grid = node.find('.ReactVirtualized__Grid__innerScrollContainer');
		const container = Util.getPageContainer(isPopup);
		const width = view.getVisibleRelations().reduce((res: number, current: any) => { return res + current.width; }, Constant.size.blockMenu);
		const length = dbStore.getRecords(dbStore.getSubId(rootId, block.id), '').length;
		const cw = container.width();
		const rh = this.getRowHeight();

		if (isInline) {
			if (parent.isPage() || parent.isLayoutDiv()) {
				const wrapper = $('#editorWrapper');
				const ww = wrapper.width();
				const vw = Math.max(ww, width) + (width > ww ? PADDING : 0);
				const margin = (cw - ww) / 2;

				scroll.css({ width: cw - 4, marginLeft: -margin - 2, paddingLeft: margin });
				wrap.css({ width: vw + margin, paddingRight: margin - 8 });
			} else {
				const parentObj = $(`#block-${parent.id}`);
				const vw = parentObj.length ? (parentObj.width() - Constant.size.blockMenu) : 0;

				wrap.css({ width: Math.max(vw, width) });
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

	resizeColumns (relationKey: string, width: number) {
		const { getView } = this.props;
		const view = getView();
		const node = $(this.node);
		const relations = view.getVisibleRelations();
		const size = Constant.size.dataview.cell;
		const widths = this.getColumnWidths(relationKey, width);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');

		relations.forEach(it => {
			const width = widths[it.relationKey];
			const el = node.find(`#${Relation.cellId('head', it.relationKey, '')}`);

			width <= size.icon ? el.addClass('small') : el.removeClass('small');
		});

		node.find('.rowHead').css({ gridTemplateColumns: str });
		node.find('.row > .selectable').css({ gridTemplateColumns: str });
	};

	getColumnWidths (relationKey: string, width: number): any {
		const { getView } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
		const columns: any = {};
		
		relations.forEach(it => {
			const relation: any = dbStore.getRelationByKey(it.relationKey) || {};
			if (relationKey && (it.relationKey == relationKey)) {
				it.width = width;
			};
			columns[it.relationKey] = Relation.width(it.width, relation.format);
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
		const container = $(Util.getBodyContainer(isPopup ? 'popup' : 'page'));
		const ww = container.width();

		content.css({ left: 0, right: 'auto' });

		if (x - sx + width >= ww - 92) {
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
		win.on('mousemove.cell', (e: any) => { this.onResizeMove(e, relationKey); });
		win.on('mouseup.cell', (e: any) => { this.onResizeEnd(e, relationKey); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, relationKey: string) {
		e.preventDefault();
		e.stopPropagation();

		this.resizeColumns(relationKey, this.checkWidth(e.pageX - this.ox));
	};

	onResizeEnd (e: any, relationKey: string) {
		const { rootId, block, getView } = this.props;
		const view = getView();

		$(window).off('mousemove.cell mouseup.cell').trigger('resize');
		$('body').removeClass('colResize');

		C.BlockDataviewViewRelationReplace(rootId, block.id, view.id, relationKey, { 
			...view.getRelation(relationKey), 
			width: this.checkWidth(e.pageX - this.ox),
		});

		window.setTimeout(() => { keyboard.setResize(false); }, 50);
	};

	checkWidth (width: number): number {
		const { min, max } = Constant.size.dataview.cell;
		return Math.min(max, Math.max(min, Math.floor(width)));
	};

	onCellAdd (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;

		menuStore.open('dataviewRelationList', { 
			element: `#block-${block.id} #cell-add`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			data: {
				readonly,
				getData,
				getView,
				rootId,
				blockId: block.id,
				onAdd: () => { menuStore.closeAll(Constant.menuIds.cellAdd); }
			}
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { rootId, block, getView } = this.props;
		const { oldIndex, newIndex } = result;
		const view = getView();
		const relations = view.relations.filter(it => {
			const relation = dbStore.getRelationByKey(it.relationKey);
			return !relation.isHidden || (relation.isHidden && (it.relationKey == 'name'));
		});

		view.relations = arrayMove(relations, oldIndex, newIndex);
		C.BlockDataviewViewRelationSort(rootId, block.id, view.id, view.relations.map(it => it.relationKey));

		keyboard.disableSelection(false);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		let { rootId, block, getData, getView, getLimit } = this.props;
		let subId = dbStore.getSubId(rootId, block.id);
		let { offset } = dbStore.getMeta(subId, '');
		let view = getView();

        return new Promise((resolve, reject) => {
			offset += getLimit();
			getData(view.id, offset, false, resolve);
			dbStore.metaSet(subId, '', { offset });
		});
	};
	
});

export default ViewGrid;