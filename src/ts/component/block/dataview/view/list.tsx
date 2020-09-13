import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { Pager } from 'ts/component';
import { blockStore } from 'ts/store';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

const Constant = require('json/constant.json');

@observer
class ViewList extends React.Component<Props, {}> {

	render () {
		const { rootId, block, view, readOnly, getData } = this.props;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = blockStore.getDbData(block.id);
		const { offset, total } = blockStore.getDbMeta(block.id);
		
		const Row = (item: any) => (
			<div className="item">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'list-cell-' + relation.id} 
						id={item.index} 
						rootId={rootId}
						block={block}
						view={view} 
						relation={...relation} 
						data={data[item.index]} 
						readOnly={readOnly}
					/>
				))}
			</div>
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
				<div className="viewItem viewList">
					{data.map((item: any, i: number) => (
						<Row key={'list-row-' + i} index={i} {...item} />
					))}
				</div>

				{total ? pager : ''}
			</div>
		);
	};

};

export default ViewList;