import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import Cell from '../cell';

interface Props extends I.BlockDataview {};

class ViewList extends React.Component<Props, {}> {

	render () {
		const { content } = this.props;
		const { data, properties } = content;
		
		const Card = (item: any) => (
			<div className="item">
				{properties.map((property: any, i: number) => (
					<Cell key={property.id} id={item.index} property={...property} data={data[item.index][property.id]} />
				))}
			</div>
		);
		
		return (
			<div className="view viewList">
				{data.map((item: any, i: number) => (
					<Card key={i} index={i} {...item} />
				))}
			</div>
		);
	};
	
};

export default ViewList;