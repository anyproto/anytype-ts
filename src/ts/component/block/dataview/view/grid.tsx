import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props {
	content: any;
};

class ViewGrid extends React.Component<Props, {}> {

	render () {
		const { content } = this.props;
		const { data, view } = content;
		
		const CellHead = (item: any) => (
			<th className={'head c-' + item.type}>
				<Icon className={'relation c-' + item.type} />
				<div className="name">{item.name}</div>
			</th>
		);
		
		const CellBody = (item: any) => (
			<td className={'cell c-' + item.relation.type}>
				<Cell {...item} view={view} id={item.index} />
			</td>
		);
		
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
			<tr className="row">
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
	
};

export default ViewGrid;