import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props {
	content: any;
};

interface Column {
	value: string;
	list: any[];
};

const GROUP = 'isArchived';

class ViewBoard extends React.Component<Props, {}> {

	render () {
		const { content } = this.props;
		const { relations } = content;
		const group = relations.find((item: I.Relation) => { return item.id == GROUP; });

		if (!group) {
			return null;
		};

		const columns = this.getColumns();
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell key={relation.id} id={item.index} relation={...relation} data={item.data} />
				))}
			</div>
		);
		
		const Column = (item: any) => (
			<div className="column">
				<div className="head">
					<Cell id="" relation={group} data={item.value} />
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
		const { content } = this.props;
		const { data } = content;
		
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