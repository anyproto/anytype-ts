import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { Pager, Cell } from 'ts/component';
import { dbStore } from 'ts/store';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class ViewList extends React.Component<Props, {}> {

	render () {
		const { rootId, block, readOnly, getData, getRecord, getView } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = dbStore.getData(block.id);
		const { offset, total } = dbStore.getMeta(block.id);

		const Row = (item: any) => {
			return (
				<div className="item">
					{relations.map((relation: any, i: number) => (
						<Cell 
							key={'list-cell-' + relation.key} 
							{...this.props}
							id={item.index} 
							relation={...relation} 
							viewType={I.ViewType.List}
							index={item.index}
						/>
					))}
				</div>
			);
		};
		
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

	componentDidUpdate () {
		const win = $(window);
		win.trigger('resize.editor');
	};

};

export default ViewList;