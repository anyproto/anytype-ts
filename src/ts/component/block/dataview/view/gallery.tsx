import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { Pager } from 'ts/component';
import { dbStore } from 'ts/store';

import Card from './gallery/card';

interface Props extends I.ViewComponent {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const ViewGallery = observer(class ViewGallery extends React.Component<Props, {}> {

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
				<div className="viewItem viewGallery">
					{data.map((item: any, i: number) => (
						<Card key={'gallery-card-' + i} {...this.props} index={i} />
					))}
				</div>

				{pager}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	resize () {
		const size = Constant.size.dataview.gallery;

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');

		const cnt = Math.floor((node.width() + size.margin) / (size.card + size.margin));
		const width = cnt * (size.card + size.margin) - size.margin;
		const cards = viewItem.find('.card');

		viewItem.css({ width: width, columnCount: cnt });
		cards.each((i: number, item: any) => {
			$(item).css({ marginRight: ((i > 0) && ((i + 1) % cnt === 0) ? 0 : '') });
		});

		win.trigger('resize.editor');
	};
	
});

export default ViewGallery;