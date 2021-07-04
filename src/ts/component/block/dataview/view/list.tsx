import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { Pager, Cell } from 'ts/component';
import { dbStore } from 'ts/store';

import Row from './list/row';

interface Props extends I.ViewComponent {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const ViewList = observer(class ViewList extends React.Component<Props, {}> {

	render () {
		const { rootId, block, getData, getView } = this.props;
		const view = getView();
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);

		let pager = null;
		if (total && data.length) {
			pager = (
				<Pager 
					offset={offset} 
					limit={Constant.limit.dataview.records} 
					total={total} 
					onChange={(page: number) => { getData(view.id, (page - 1) * Constant.limit.dataview.records); }} 
				/>
			);
		};

		return (
			<div className="wrap">
				<div className="viewItem viewList">
					{data.map((item: any, i: number) => (
						<Row key={'list-row-' + i} {...this.props} index={i}  />
					))}
				</div>

				{pager}
			</div>
		);
	};

	componentDidUpdate () {
		const win = $(window);
		win.trigger('resize.editor');
	};

});

export default ViewList;