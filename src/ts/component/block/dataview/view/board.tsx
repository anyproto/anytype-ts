import * as React from 'react';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

interface Column {
	value: string;
	list: any[];
};

const GROUP = 'isArchived';

@observer
class ViewBoard extends React.Component<Props, {}> {

	render () {
		const { view, readOnly } = this.props;
		const group = view.relations.find((item: I.Relation) => { return item.id == GROUP; });
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		if (!group) {
			return null;
		};

		const columns = this.getColumns();
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={relation.id} 
						id={item.index} 
						view={view} 
						relation={...relation} 
						data={item.data} 
						readOnly={readOnly} 
					/>
				))}
			</div>
		);
		
		const Column = (item: any) => (
			<div className="column">
				<div className="head">
					<Cell id="" view={view} relation={group} data={item.value} />
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
			<div className="wrap">
				<div className="viewItem viewBoard">
					<div className="columns">
						{columns.map((item: any, i: number) => (
							<Column key={i} index={i} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
	getColumns (): Column[] {
		let data = Util.objectCopy(this.props.data);
		
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