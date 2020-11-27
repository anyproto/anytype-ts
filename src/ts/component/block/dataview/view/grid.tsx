import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Pager } from 'ts/component';
import { I, C, DataUtil, translate } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';

import HeadRow from './grid/head/row';
import BodyRow from './grid/body/row';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class ViewGrid extends React.Component<Props, {}> {

	constructor (props: any) {
		super (props);

		this.onRowOver = this.onRowOver.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

	render () {
		const { block, getData, getView, readOnly, onRowAdd, onCellClick, onRef } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = dbStore.getData(block.id);
		const { offset, total } = dbStore.getMeta(block.id);

		let pager = null;
		if (total) {
			pager = (
				<Pager 
					offset={offset} 
					limit={Constant.limit.dataview.records} 
					total={total} 
					onChange={(page: number) => { getData(view.id, (page - 1) * Constant.limit.dataview.records); }} 
				/>
			);
		};
		
		return (
			<div className="wrap">
				<div className="scroll">
					<table className="viewItem viewGrid">
						<thead>
							<HeadRow {...this.props} onCellAdd={this.onCellAdd} onSortEnd={this.onSortEnd} onResizeStart={this.onResizeStart} />
						</thead>
						<tbody>
							{data.map((item: any, i: number) => (
								<BodyRow 
									key={'grid-row-' + i} 
									{...this.props} 
									index={i} 
									onRowOver={this.onRowOver} 
								/>
							))}
							{!readOnly ? (
								<tr>
									<td className="cell add" colSpan={relations.length + 1} onClick={onRowAdd}>
										<Icon className="plus" />
										<div className="name">{translate('blockDataviewNew')}</div>
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>

				{pager}
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

		win.trigger('resize.editor');
	};

	componentWillUnmount () {
		this.unbind();
	};

	bind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll').scroll(() => {
			win.trigger('resize.menu');
		});
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll');
	};

	resize () {
		const { getView } = this.props;
		const view = getView();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const ww = win.width();
		const mw = ww - 192;
		
		let vw = 0;
		let margin = 0;
		let width = 0;

		for (let relation of view.relations) {
			if (!relation.isVisible) {
				continue;
			};
			width += relation.width;
		};

		if (width < mw) {
			vw = mw;
		} else {
			vw = width;
			margin = (ww - mw) / 2; 
		};

		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
		
		this.resizeLast();
	};

	resizeLast () {
		const { getView } = this.props;
		const view = getView();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const lastHead = node.find('.head.last');
		const lastCell = node.find('.cell.last');
		const ww = win.width();
		const mw = ww - 192;
		
		let width = 0;
		let lw = 48;

		for (let relation of view.relations) {
			if (!relation.isVisible) {
				continue;
			};
			width += relation.width;
		};

		if (width < mw) {
			lw = Math.max(48, mw - width);
		};

		lastHead.css({ width: lw });
		lastCell.css({ width: lw });
	};

	onResizeStart (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);

		$('body').addClass('colResize');
		win.unbind('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', (e: any) => { this.onResizeMove(e, id); });
		win.on('mouseup.cell', (e: any) => { this.onResizeEnd(e, id); });
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { getView } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#' + DataUtil.cellId('head', id, ''));
		const offset = el.offset();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == id; });

		let width = e.pageX - offset.left;
		width = Math.max(Constant.size.dataview.cell.min, width); 
		width = Math.min(Constant.size.dataview.cell.max, width);
		
		view.relations[idx].width = width;
		el.css({ width: width });
		node.find('.resizable').trigger('resize');

		this.resizeLast();
	};

	onResizeEnd (e: any, id: string) {
		const { rootId, block, getView } = this.props;
		const view = getView();

		$(window).unbind('mousemove.cell mouseup.cell');
		$('body').removeClass('colResize');

		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);
	};

	onRowOver (id: number) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.row.active').removeClass('active');
		node.find('#row-' + id).addClass('active');
	};

	onCellAdd (e: any) {
		const { rootId, block, readOnly, getData, getView } = this.props;

		commonStore.menuOpen('dataviewRelationEdit', { 
			element: '#cell-add',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				readOnly: readOnly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
			},
		});
	};

	onSortEnd (result: any) {
		const { rootId, block, getView } = this.props;
		const { oldIndex, newIndex } = result;
		const view = getView();
		const filtered = view.relations.filter((it: any) => { return it.isVisible; });
		const oldIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == filtered[oldIndex].key; });
		const newIdx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == filtered[newIndex].key; });
		
		view.relations = arrayMove(view.relations, oldIdx, newIdx);
		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);
	};
	
};

export default ViewGrid;