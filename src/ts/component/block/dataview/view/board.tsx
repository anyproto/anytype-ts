import * as React from 'react';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store'

import Cell from '../cell';

interface Props extends I.ViewComponent {};

interface Column {
	value: string;
	list: any[];
};

const GROUP = 'name';
const Constant = require('json/constant.json');

@observer
class ViewBoard extends React.Component<Props, {}> {

	render () {
		const { rootId, block, view, readOnly } = this.props;
		const group = view.relations.find((item: I.Relation) => { return item.id == GROUP; });
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		if (!group) {
			return null;
		};

		const data = blockStore.getDbData(block.id);
		const { offset, total } = blockStore.getDbMeta(block.id);
		const columns = this.getColumns();
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'board-cell-' + relation.id} 
						id={item.index} 
						rootId={rootId}
						block={block}
						view={view} 
						relation={...relation} 
						data={item.data} 
						readOnly={readOnly} 
					/>
				))}
			</div>
		);

		const Column = (item: any) => {
			const head = {};
			head[GROUP] = item.value;

			return (
				<div className="column">
					<div className="head">
						<Cell 
							id="" 
							rootId={rootId}
							block={block}
							view={view} 
							relation={group} 
							data={head} 
							readOnly={true} 
						/>
					</div>
					<div className="list">
						{item.list.map((child: any, i: number) => (
							<Card key={'board-card-' + i} data={...child} />
						))}
						<div className="card add">
							<Icon className="plus" />
						</div>
					</div>
				</div>
			);
		};
		
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
		const { block } = this.props;
		const data = Util.objectCopy(blockStore.getDbData(block.id));

		let r: Column[] = [];
		
		for (let i in data) {
			let item = data[i];
			let col = r.find((col) => { return col.value == item[GROUP]; });
			
			item.index = i;
			
			if (!col) {
				col = { value: item[GROUP], list: [] }
				r.push(col);
			};
			col.list.push(item);
		};
		return r;
	};
	
};

export default ViewBoard;