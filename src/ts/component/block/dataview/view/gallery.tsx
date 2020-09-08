import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

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
	
};

export default ViewGallery;