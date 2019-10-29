import * as React from 'react';
import { I, Util } from 'ts/lib';
import { Icon, Input } from 'ts/component';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

class MenuPropertyEdit extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { properties, property } = data;
		const propertyItem = properties.find((item: any) => { return item.id == property; });
		
		let current = null;
		if (property) {
			current = (
				<div className="item">
					<Icon className={'property dark c' + propertyItem.type} />
					<div className="name">{Constant.propertyName[propertyItem.type]}</div>
					<Icon className="arrow" />
				</div>
			);
		} else {
			current = (
				<div className="item">
					<div className="name">Select type</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		return (
			<div>
				<div className="wrap">
					<Input value={propertyItem ? propertyItem.name : ''} placeHolder="Property name"  />
				</div>
				{current}
				<div className="line" />
				<div className="item">
					<Icon className="copy" />
					<div className="name">Duplicate</div>
				</div>
				<div className="item">
					<Icon className="trash" />
					<div className="name">Delete property</div>
				</div>
			</div>
		);
	};
	
};

export default MenuPropertyEdit;