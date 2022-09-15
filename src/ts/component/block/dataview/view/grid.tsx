import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'Component';
import { I, C, Util, translate, keyboard, Relation } from 'Lib';
import { dbStore, menuStore, blockStore } from 'Store';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';

import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const PADDING = 46;
const HEIGHT = 48;

const ViewGrid = observer(class ViewGrid extends React.Component<Props, {}> {

	ox: number = 0;

	constructor (props: any) {
		super (props);

		this.cellPosition = this.cellPosition.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

	render () {
		const { rootId, block, getView, readonly, onRecordAdd, isPopup } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it && it.isVisible; });
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const { total } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const length = records.length;

		return (
			<div className="wrap">
				<div className="scroll">
					<div className="scrollWrap">
						<div className="viewItem viewGrid">
							<HeadRow 
								{...this.props} 
								onCellAdd={this.onCellAdd} 
								onSortStart={this.onSortStart} 
								onSortEnd={this.onSortEnd} 
								onResizeStart={this.onResizeStart}
							/>

							<InfiniteLoader
								isRowLoaded={({ index }) => !!records[index]}
								loadMoreRows={() => {}}
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
																	rowHeight={HEIGHT}
																	onRowsRendered={onRowsRendered}
																	rowRenderer={({ key, index, style }) => (
																		<BodyRow 
																			key={'grid-row-' + view.id + index} 
																			{...this.props} 
																			readonly={readonly || !allowed}
																			index={index} 
																			style={{ ...style, top: style.top + 2 }}
																			cellPosition={this.cellPosition}
																		/>
																	)}
																	scrollTop={scrollTop}
																	onScroll={this.onScroll}
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

							{!readonly && allowed ? (
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
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.off('.scroll').scroll(this.onScroll);
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.off('.scroll');
	};

	onScroll () {
		const win = $(window);

		for (let menu of menuStore.list) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};

		this.resizeColumns('', 0);
	};

	resize () {
		const { rootId, block, getView, isPopup } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const wrap = node.find('.scrollWrap');
		const grid = node.find('.ReactVirtualized__Grid__innerScrollContainer');
		const container = Util.getPageContainer(isPopup);
		const ww = container.width();
		const mw = ww - PADDING * 2;
		const length = dbStore.getRecords(dbStore.getSubId(rootId, block.id), '').length;
		const margin = (ww - mw) / 2;
		const width = view.relations.filter(it => it.isVisible).reduce((res: number, current: any) => { 
			return res + current.width;
		}, Constant.size.blockMenu);
		const vw = Math.max(mw, width) + (width > mw ? PADDING : 0);
		const pr = width > mw ? PADDING : 0;

		scroll.css({ width: ww - 4, marginLeft: -margin - 2, paddingLeft: margin });
		wrap.css({ width: vw, paddingRight: pr });
		grid.css({ height: length * HEIGHT + 4, maxHeight: length * HEIGHT + 4 });

		this.resizeColumns('', 0);
	};

	resizeColumns (relationKey: string, width: number) {
		const { getView } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const relations = view.relations.filter(it => it.isVisible);
		const size = Constant.size.dataview.cell;
		const columns = relations.map(it => {
			const el = node.find(`#${Relation.cellId('head', it.relationKey, '')}`);

			if (relationKey && (it.relationKey == relationKey)) {
				it.width = width;
			};

			it.width = Relation.width(it.width, null);
			it.width <= size.icon ? el.addClass('small') : el.removeClass('small');

			return it.width + 'px';
		}).concat([ 'auto' ]).join(' ');

		node.find('.rowHead').css({ gridTemplateColumns: columns });
		node.find('.row > .selectable').css({ gridTemplateColumns: columns });
	};

	cellPosition (cellId: string) {
		const cell = $(`#${cellId}`);
		if (!cell.hasClass('isEditing')) {
			return;
		};

		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
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
		const node = $(ReactDOM.findDOMNode(this));
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
		const idx = view.relations.findIndex(it => it.relationKey == relationKey);

		$(window).off('mousemove.cell mouseup.cell').trigger('resize');
		$('body').removeClass('colResize');

		view.relations[idx].width = this.checkWidth(e.pageX - this.ox);
		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);

		window.setTimeout(() => { keyboard.setResize(false); }, 50);
	};

	checkWidth (width: number): number {
		const { min, max } = Constant.size.dataview.cell;
		return Math.min(max, Math.max(min, Math.floor(width)));
	};

	onCellAdd (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;

		menuStore.open('dataviewRelationList', { 
			element: `#cell-add`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			data: {
				readonly: readonly,
				getData: getData,
				getView: getView,
				rootId: rootId,
				blockId: block.id,
				onAdd: () => { menuStore.closeAll(Constant.menuIds.cellAdd); }
			}
		});
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};

	onSortEnd (result: any) {
		const { rootId, block, getView, dataset } = this.props;
		const { selection } = dataset;
		const { oldIndex, newIndex } = result;
		const view = getView();
		const filtered = view.relations.filter((it: any) => { return it.isVisible; });
		const oldIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == filtered[oldIndex].relationKey; });
		const newIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == filtered[newIndex].relationKey; });
		
		view.relations = arrayMove(view.relations, oldIdx, newIdx);
		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);

		selection.preventSelect(false);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		const { rootId, block, getData, getView } = this.props;
		const { offset } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const view = getView();

        return new Promise((resolve, reject) => {
			getData(view.id, offset + Constant.limit.dataview.records, resolve);
		});
	};
	
});

export default ViewGrid;