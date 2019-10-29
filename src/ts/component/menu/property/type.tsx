import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const Constant = require('json/constant.json');

@inject('commonStore')
@observer
class MenuPropertyType extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { properties, property } = data;
		const propertyItem = properties.find((item: any) => { return item.id == property; });
		
		const Item = (item: any) => (
			<div className={'item ' + (item.type == propertyItem.type ? 'active' : '')} onClick={(e: any) => { this.onSelect(e, item.id); }}>
				<Icon className={'property dark c' + item.type} />
				<div className="name">{Constant.propertyName[item.type]}</div>
			</div>
		);
		
		return (
			<div>
				<div className="title">Type of property</div>
				<div className="items">
					{properties.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
				</div>
			</div>
		);
	};
	
	onSelect (e: any, id: string) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(id);
	};
	
};

export default MenuPropertyType;