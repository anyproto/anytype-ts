import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

@observer
class ViewGallery extends React.Component<Props, {}> {

	render () {
		const { data, view } = this.props;
		const relations = view.relations.filter((it: any) => { return it.visible; });
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell key={relation.id} id={item.index} view={view} relation={...relation} data={data[item.index]} />
				))}
			</div>
		);
		
		return (
			<div className="wrap">
				<div className="view viewGallery">
					{data.map((item: any, i: number) => (
						<Card key={i} index={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
};

export default ViewGallery;