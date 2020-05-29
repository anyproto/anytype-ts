import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.BlockDataview {
	getContent(): any;
};

class ViewGallery extends React.Component<Props, {}> {

	render () {
		const { data, relations } = this.props.getContent();
		
		const Card = (item: any) => (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell key={relation.id} id={item.index} relation={...relation} data={data[item.index][relation.id]} />
				))}
			</div>
		);
		
		return (
			<div className="view viewGallery">
				{data.map((item: any, i: number) => (
					<Card key={i} index={i} {...item} />
				))}
			</div>
		);
	};
	
};

export default ViewGallery;