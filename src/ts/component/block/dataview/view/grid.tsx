import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Pager } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
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
		this.onCellClick = this.onCellClick.bind(this);
	};

	render () {
		const { block, data, view, onOpen, readOnly, getData } = this.props;
		const { content } = block;
		const { offset, total } = content;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		
		const CellHead = (item: any) => (
			<th className={'head c-' + item.type}>
				<Icon className={'relation c-' + item.type} />
				<div className="name">{item.name}</div>
			</th>
		);
		
		const CellBody = (item: any) => {
			let { relation, index } = item;
			let id = DataUtil.cellId(relation.id, index);
			let cn = [ 'cell', 'c-' + relation.type, (!readOnly ? 'canEdit' : '') ];

			if (item.relation.id == 'name') {
				cn.push('isName');
			};

			return (
				<td id={id} className={cn.join(' ')} onClick={(e: any) => { this.onCellClick(e, item); }}>
					<Cell 
						ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
						onOpen={onOpen} 
						{...item} 
						view={view} 
						id={item.index} 
						readOnly={readOnly}
					/>
				</td>
			);
		};
		
		const RowHead = (item: any) => (
			<tr className="row">
				{relations.map((item: any, i: number) => (
					<CellHead key={'grid-head-' + item.id} {...item} />
				))}
				{!readOnly ? (
					<th className="head add">
						<Icon className="plus" />
					</th>
				) : null}
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr id={'row-' + item.index} onMouseOver={(e: any) => { this.onRowOver(item.index); }} className="row">
				{relations.map((relation: any, i: number) => (
					<CellBody key={'grid-cell-' + relation.id} index={item.index} relation={...relation} data={data[item.index]} />
				))}
				{!readOnly ? (
					<td className="cell">&nbsp;</td>
				) : null}
			</tr>
		);

		const pager = null;
		/*
		const pager = (
			<Pager 
				offset={offset} 
				limit={Constant.limit.dataview.records} 
				total={total} 
				onChange={(page: number) => { getData(view.id, (page - 1) * Constant.limit.dataview.records); }} 
			/>
		);
		*/
		
		return (
			<div className="wrap">
				{total ? pager : ''}
				
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
								<td className="cell add" colSpan={view.relations.length + 1}>
									<Icon className="plus" />
									<div className="name">New</div>
								</td>
							</tr>
						) : null}
					</tbody>
				</table>

				{total ? pager : ''}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		let ww = Math.max(Constant.size.dataview, win.width() - 48);
		let margin = (ww - Constant.size.dataview) / 2;

		node.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
	};

	onRowOver (id: number) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.row.active').removeClass('active');
		node.find('#row-' + id).addClass('active');
	};

	onCellClick (e: any, item: any) {
		const { readOnly } = this.props;
		if (readOnly) {
			return;
		};

		const { index, relation } = item;
		const id = DataUtil.cellId(relation.id, index);
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