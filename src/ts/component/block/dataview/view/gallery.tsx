import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class ViewGallery extends React.Component<Props, {}> {

	render () {
		const { rootId, block, data, view, readOnly } = this.props;
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'gallery-cell-' + relation.id} 
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
		
		return (
			<div className="wrap">
				<div className="viewItem viewGallery">
					{data.map((item: any, i: number) => (
						<Card key={'gallery-card-' + i} index={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	resize () {
		const size = Constant.size.dataview.gallery;

		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');
		const cnt = Math.floor(node.width() / (size.card + size.margin));
		const width = cnt * (size.card + size.margin) - size.margin;
		const cards = viewItem.find('.card');

		viewItem.css({ width: width, columnCount: cnt });
		cards.each((i: number, item: any) => {
			$(item).css({ marginRight: ((i > 0) && ((i + 1) % cnt === 0) ? 0 : '') });
		});
	};
	
};

export default ViewGallery;