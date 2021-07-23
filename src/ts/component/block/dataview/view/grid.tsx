import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Pager } from 'ts/component';
import { I, C, Util, DataUtil, translate, keyboard } from 'ts/lib';
import { dbStore, menuStore, blockStore } from 'ts/store';
import { AutoSizer, WindowScroller, List } from 'react-virtualized';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';

import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';

interface Props extends I.ViewComponent {}

const $ = require('jquery');
const Constant = require('json/constant.json');
const PADDING = 46;
const HEIGHT = 48;

const ViewGrid = observer(class ViewGrid extends React.Component<Props, {}> {

	constructor (props: any) {
		super (props);

		this.cellPosition = this.cellPosition.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

	render () {
		const { rootId, block, getData, getView, readonly, onRowAdd, isPopup, scrollContainer } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const length = data.length;

		return (
			<div className="wrap">
				<div className="scroll">
					<div className="scrollWrap">
						<div className="viewItem viewGrid">
							<HeadRow {...this.props} onCellAdd={this.onCellAdd} onSortEnd={this.onSortEnd} onResizeStart={this.onResizeStart} />

							<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
								{({ height, isScrolling, registerChild, scrollTop }) => {
									return (
										<AutoSizer disableHeight>
											{({ width }) => {
												return (
													<div ref={registerChild}>
														<List
															autoHeight
															height={Number(height) || 0}
															width={Number(width) || 0}
															isScrolling={isScrolling}
															rowCount={data.length}
															rowHeight={HEIGHT}
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
														/>
													</div>
												);
											}}
										</AutoSizer>
									);
								}}
							</WindowScroller>

							{!readonly && allowed ? (
								<div className="row add">
									<div className="cell add">
										<div className="btn" onClick={(e: any) => { onRowAdd(e, 1); }}>
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
		this.bind();
	};

	componentDidUpdate () {
		const win = $(window);

		this.bind();
		this.resize();
		this.onScroll();

		win.trigger('resize.editor');
	};

	componentWillUnmount () {
		this.unbind();
	};

	bind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll').scroll(this.onScroll);
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll');
	};

	onScroll () {
		const win = $(window);
		const { list } = menuStore;

		for (let menu of list) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};
	};

	resize () {
		const { rootId, block, getView, scrollContainer } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const wrap = node.find('.scrollWrap');
		const grid = node.find('.ReactVirtualized__Grid__innerScrollContainer');
		const ww = $(scrollContainer).width();
		const mw = ww - PADDING * 2;
		const data = dbStore.getData(rootId, block.id);
		const length = data.length;

		let vw = 0;
		let margin = 0;
		let width = 48;
		let pr = 0;

		for (let relation of view.relations) {
			if (relation.isVisible) {
				width += relation.width;
			};
		};

		vw = width <= mw ? mw : width;
		margin = (ww - mw) / 2;

		if (width > mw) {
			pr = PADDING;
			vw += PADDING;
		};

		scroll.css({ width: ww - 4, marginLeft: -margin - 2, paddingLeft: margin });
		wrap.css({ width: vw, paddingRight: pr });
		grid.css({ height: length * HEIGHT + 4, maxHeight: length * HEIGHT + 4 });
		
		this.resizeLast();
	};

	cellPosition (cellId: string) {
		const cell = $(`#${cellId}`);
		if (!cell.hasClass('isEditing')) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const content = cell.find('.cellContent');
		const x = cell.position().left;
		const width = content.outerWidth();
		const sx = scroll.scrollLeft();
		const ww = $(window).width();

		content.css({ left: 0, right: 'auto' });

		if (x - sx + width >= ww - 64) {
			content.css({ left: 'auto', right: 0 });
		};
	};

	resizeLast () {
		const { getView } = this.props;
		const view = getView();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const lastHead = node.find('.cellHead.last');
		const ww = win.width();
		const mw = ww - 192;
		
		let width = 0;
		for (let relation of view.relations) {
			if (!relation.isVisible) {
				continue;
			};
			width += relation.width;
		};

		lastHead.css({ width: (width > mw ? 48 : 'auto') });
	};

	onResizeStart (e: any, relationKey: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);

		$('body').addClass('colResize');
		win.unbind('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', (e: any) => { this.onResizeMove(e, relationKey); });
		win.on('mouseup.cell', (e: any) => { this.onResizeEnd(e, relationKey); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, relationKey: string) {
		e.preventDefault();
		e.stopPropagation();

		const { getView } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#${DataUtil.cellId('head', relationKey, '')}`);
		const offset = el.offset();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == relationKey; });
		const size = Constant.size.dataview.cell;

		let width = e.pageX - offset.left;
		width = Math.max(size.min, width); 
		width = Math.min(size.max, width);

		view.relations[idx].width = width;

		el.css({ width: width });
		width <= size.icon ? el.addClass('small') : el.removeClass('small');
		
		this.resizeLast();
	};

	onResizeEnd (e: any, relationKey: string) {
		const { rootId, block, getView } = this.props;
		const view = getView();

		$(window).unbind('mousemove.cell mouseup.cell').trigger('resize');
		$('body').removeClass('colResize');

		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);

		window.setTimeout(() => { keyboard.setResize(false); }, 50);
	};

	onCellAdd (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();

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

	onSortEnd (result: any) {
		const { rootId, block, getView } = this.props;
		const { oldIndex, newIndex } = result;
		const view = getView();
		const filtered = view.relations.filter((it: any) => { return it.isVisible; });
		const oldIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == filtered[oldIndex].relationKey; });
		const newIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == filtered[newIndex].relationKey; });
		
		view.relations = arrayMove(view.relations, oldIdx, newIdx);
		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);
	};
	
});

export default ViewGrid;