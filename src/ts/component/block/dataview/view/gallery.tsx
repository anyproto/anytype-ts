import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.BlockDataview {};

class ViewGallery extends React.Component<Props, {}> {

	render () {
		const { header, content } = this.props;
		const { data, properties } = content;
		
		const Cell = (item: any) => (
			<div className={'cell c' + item.property.type}>
				{item.data}
			</div>
		);
		
		const Card = (item: any) => (
			<div className="card">
				{properties.map((property: any, i: number) => (
					<Cell key={property.id} property={...property} data={data[item.index][property.id]} />
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