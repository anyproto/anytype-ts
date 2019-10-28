import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.BlockDataview {};

interface Column {
	value: string;
	list: any[];
};

const GROUP = '4';

class ViewBoard extends React.Component<Props, {}> {

	render () {
		const { header, content } = this.props;
		const { data, properties } = content;
		const group = properties.find((item) => { return item.id == GROUP; });
		
		const Card = (item: any) => (
			<div className="card">
				{properties.map((property: any, i: number) => (
					<Cell key={property.id} property={...property} data={data[item.index][property.id]} />
				))}
			</div>
		);
		
		const Column = (item: any) => (
			<div className="column">
				<div className="head">
					<Cell property={group} data={item.value} />
				</div>
				<div className="list">
					{item.list.map((child: any, i: number) => (
						<Card key={i} index={i} {...child} />
					))}
					<div className="card add">
						<Icon className="plus" />
					</div>
				</div>
			</div>
		);
		
		let columns = this.getColumns();
		
		return (
			<div className="view viewBoard">
				<div className="columns">
					{columns.map((item: any, i: number) => (
						<Column key={i} index={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	getColumns (): Column[] {
		const { header, content } = this.props;
		const { data, properties } = content;
		
		let groupBy = GROUP;
		let r: Column[] = [];
		
		for (let item of data) {
			let col = r.find((col) => { return col.value == item[groupBy]; });
			if (!col) {
				col = { value: item[groupBy], list: [] }
				r.push(col);
			};
			
			col.list.push(item);
		};
		
		console.log(r);
		
		return r;
	};
	
};

export default ViewBoard;