import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

const $ = require('jquery');

class ViewGrid extends React.Component<Props, {}> {

	constructor (props: any) {
		super (props);

		this.onRowOver = this.onRowOver.bind(this);
	};

	render () {
		const { content, onOpen } = this.props;
		const { data, view } = content;
		
		const CellHead = (item: any) => (
			<th className={'head c-' + item.type}>
				<Icon className={'relation c-' + item.type} />
				<div className="name">{item.name}</div>
			</th>
		);
		
		const CellBody = (item: any) => {
			let cn = [ 'cell', 'c-' + item.relation.type ];
			if (item.relation.id == 'name') {
				cn.push('isName');
			};
			return (
				<td className={cn.join(' ')}>
					<Cell onOpen={onOpen} {...item} view={view} id={item.index} />
				</td>
			);
		};
		
		const RowHead = (item: any) => (
			<tr className="row">
				{view.relations.map((item: any, i: number) => (
					<CellHead key={item.id} {...item} />
				))}
				<th className="head add">
					<Icon className="plus" />
				</th>
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr id={'row-' + item.index} onMouseOver={(e: any) => { this.onRowOver(item.index); }} className="row">
				{view.relations.map((relation: any, i: number) => (
					<CellBody key={relation.id} index={item.index} relation={...relation} data={data[item.index]} />
				))}
				<td className="cell">&nbsp;</td>
			</tr>
		);
		
		return (
			<table className="view viewGrid">
				<thead>
					<RowHead />
				</thead>
				<tbody>
					{data.map((item: any, i: number) => (
						<RowBody key={i} index={i} {...item} />
					))}
					<tr>
						<td className="cell add" colSpan={view.relations.length + 1}>
							<Icon className="plus" />
							<div className="name">New</div>
						</td>
					</tr>
				</tbody>
			</table>
		);
	};

	onRowOver (id: number) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.row.active').removeClass('active');
		node.find('#row-' + id).addClass('active');
	};
	
};

export default ViewGrid;