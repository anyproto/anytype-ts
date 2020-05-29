import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.BlockDataview {
	getContent(): any;
};

class ViewGrid extends React.Component<Props, {}> {

	render () {
		const { data, relations } = this.props.getContent();
		
		const CellHead = (item: any) => (
			<th className={'head c' + item.type}>
				<Icon className={'relation ' + item.type} />
				{item.name}
			</th>
		);
		
		const CellBody = (item: any) => (
			<td className={'cell ' + item.relation.type}>
				<Cell {...item} id={item.index} />
			</td>
		);
		
		const RowHead = (item: any) => (
			<tr className="row">
				{relations.map((item: any, i: number) => (
					<CellHead key={item.id} {...item} />
				))}
				<th className="head">
					<Icon className="plus" />
				</th>
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr className="row">
				{relations.map((relation: any, i: number) => (
					<CellBody key={relation.id} index={item.index} relation={...relation} data={data[item.index][relation.id]} />
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
						<td className="cellBody" colSpan={relations.length + 1}>
							<Icon className="plus" />
						</td>
					</tr>
				</tbody>
			</table>
		);
	};
	
};

export default ViewGrid;