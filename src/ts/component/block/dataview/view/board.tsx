import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.BlockDataview {
	getContent(): any;
};

interface Column {
	value: string;
	list: any[];
};

const GROUP = '4';

class ViewBoard extends React.Component<Props, {}> {

	render () {
		const { data, properties } = this.props.getContent();
		const group = properties.find((item) => { return item.id == GROUP; });
		const columns = this.getColumns();
		
		const Card = (item: any) => (
			<div className="card">
				{properties.map((property: any, i: number) => (
					<Cell key={property.id} id={item.index} property={...property} data={item.data[property.id]} />
				))}
			</div>
		);
		
		const Column = (item: any) => (
			<div className="column">
				<div className="head">
					<Cell id={0} property={group} data={item.value} />
				</div>
				<div className="list">
					{item.list.map((child: any, i: number) => (
						<Card key={i} data={...child} />
					))}
					<div className="card add">
						<Icon className="plus" />
					</div>
				</div>
			</div>
		);
		
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
		const { data } = this.props.getContent();
		
		let groupBy = GROUP;
		let r: Column[] = [];
		
		for (let i in data) {
			let item = data[i];
			let col = r.find((col) => { return col.value == item[groupBy]; });
			
			item.index = i;
			
			if (!col) {
				col = { value: item[groupBy], list: [] }
				r.push(col);
			};
			col.list.push(item);
		};
		return r;
	};
	
};

export default ViewBoard;