import * as React from 'react';
import { Icon } from 'ts/component';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationType extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { relationKey, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { it.key == relationKey; });
		
		let relations: any[] = [
			{ format: I.RelationType.Description },
			{ format: I.RelationType.Title },
			{ format: I.RelationType.Number },
			{ format: I.RelationType.Select },
			{ format: I.RelationType.Date },
			{ format: I.RelationType.File },
			{ format: I.RelationType.Url },
			{ format: I.RelationType.Email },
			{ format: I.RelationType.Phone },
			{ format: I.RelationType.Object },
		];
		for (let item of relations) {
			item.name = Constant.relationName[item.format];
		};

		const Item = (item: any) => {
			return (
				<div className={'item ' + (relation && (item.format == relation.format) ? 'active' : '')} onClick={(e: any) => { this.onSelect(e, item); }}>
					<Icon className={'relation c-' + DataUtil.relationClass(item.format)} />
					<div className="name">{item.name}</div>
				</div>
			);
		};

		return (
			<div className="section">
				<div className="name">Type of relation</div>
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