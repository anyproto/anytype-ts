import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Pager } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class ViewGrid extends React.Component<Props, {}> {

	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super (props);

		this.onRowOver = this.onRowOver.bind(this);
		this.onRowAdd = this.onRowAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
	};

	render () {
		const { rootId, block, data, view, onOpen, getData, readOnly } = this.props;
		const { content } = block;
		const { offset, total } = content;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		const CellHead = (item: any) => {
			const { relation } = item;
			const id = DataUtil.cellId('head', relation.id, '');

			return (
				<th id={id} className={'head c-' + relation.type} style={{ width: relation.width }}>
					<div className="cellContent">
						<Icon className={'relation c-' + relation.type} />
						<div className="name">{relation.name}</div>
						<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, relation.id); }}>
							<div className="line" />
						</div>
					</div>
				</th>
			);
		};
		
		const CellBody = (item: any) => {
			let { relation, index } = item;
			let id = DataUtil.cellId('cell', relation.id, index);
			let cn = [ 'cell', 'c-' + relation.type, (!readOnly ? 'canEdit' : '') ];

			if (item.relation.id == 'name') {
				cn.push('isName');
			};

			return (
				<td id={id} className={cn.join(' ')} onClick={(e: any) => { this.onCellClick(e, item); }}>
					<Cell 
						ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
						{...item} 
						rootId={rootId}
						block={block}
						view={view} 
						id={index} 
						readOnly={readOnly}
						onOpen={onOpen}
					/>
				</td>
			);
		};
		
		const RowHead = (item: any) => (
			<tr className="row">
				{relations.map((relation: any, i: number) => (
					<CellHead key={'grid-head-' + relation.id} relation={relation} />
				))}
				<th className="head last">
					{!readOnly ? <Icon className="plus" /> : ''}
				</th>
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr id={'row-' + item.index} onMouseOver={(e: any) => { this.onRowOver(item.index); }} className="row">
				{relations.map((relation: any, i: number) => (
					<CellBody key={'grid-cell-' + relation.id} index={item.index} relation={relation} data={data[item.index]} />
				))}
				<td className="cell last">&nbsp;</td>
			</tr>
		);

		const pager = (
			<Pager 
				offset={offset} 
				limit={Constant.limit.dataview.records} 
				total={total} 
				onChange={(page: number) => { getData(view.id, (page - 1) * Constant.limit.dataview.records); }} 
			/>
		);
		
		return (
			<div className="wrap">
				<div className="scroll">
					<table className="viewItem viewGrid">
						<thead>
							<RowHead />
						</thead>
						<tbody>
							{data.map((item: any, i: number) => (
								<RowBody key={'grid-row-' + i} index={i} {...item} />
							))}
							{!readOnly ? (
								<tr>
									<td className="cell add" colSpan={view.relations.length + 1} onClick={this.onRowAdd}>
										<Icon className="plus" />
										<div className="name">New</div>
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>

				{total ? pager : ''}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	resize () {
		const { view } = this.props;
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
	};

	onResizeStart (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		win.unbind('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', (e: any) => { this.onResizeMove(e, id); });
		win.on('mouseup.cell', (e: any) => { this.onResizeEnd(e, id); });
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { view } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#' + DataUtil.cellId('head', id, ''));
		const offset = el.offset();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.id == id; });

		let width = e.pageX - offset.left;
		width = Math.max(Constant.size.dataview.cell.min, width); 
		width = Math.min(Constant.size.dataview.cell.max, width);
		
		view.relations[idx].width = width;
		el.css({ width: width });
	};

	onResizeEnd (e: any, id: string) {
		const { rootId, block, view } = this.props;

		$(window).unbind('mousemove.cell mouseup.cell');
		C.BlockSetDataviewView(rootId, block.id, view.id, view);
	};

	onRowOver (id: number) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.row.active').removeClass('active');
		node.find('#row-' + id).addClass('active');
	};

	onRowAdd (e: any) {
		const { rootId, block } = this.props;

		C.BlockCreateDataviewRecord(rootId, block.id, {}, (message: any) => {
			if (message.error.code) {
				return;
			};

			block.content.data.push(message.record);
			blockStore.blockUpdate(rootId, block);
		});
	};

	onCellClick (e: any, item: any) {
		const { readOnly } = this.props;
		const { index, relation } = item;
		
		if (readOnly || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId('cell', relation.id, index);
		const node = $(ReactDOM.findDOMNode(this));
		const cell = node.find('#' + id);
		const ref = this.cellRefs.get(id);

		cell.addClass('isEditing');
		if (ref) {
			ref.onClick(e);
		};
	};
	
};

export default ViewGrid;