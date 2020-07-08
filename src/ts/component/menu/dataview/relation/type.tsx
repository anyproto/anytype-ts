import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const Schema = {
	relation: require('json/schema/relation.json'),
};

@observer
class MenuRelationType extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { relationId, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { it.id == relationId; });
		
		let relations = [];
		for (let i in Schema.relation.definitions) {
			let item = Schema.relation.definitions[i];
			item.code = i;
			relations.push(item);
		};

		const Item = (item: any) => {
			return (
				<div className={'item ' + (relation && (item.code == relation.type) ? 'active' : '')} onClick={(e: any) => { this.onSelect(e, item); }}>
					<Icon className={'relation c-' + item.code} />
					<div className="name">{Constant.relationName[item.code] || item.code}</div>
				</div>
			);
		};

		return (
			<div>
				<div className="title">Type of relation</div>
				<div className="items">
					{relations.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.props.close();
		onSelect(item);
	};
	
};

export default MenuRelationType;