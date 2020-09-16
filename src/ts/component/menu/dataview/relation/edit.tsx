import * as React from 'react';
import { I, Util } from 'ts/lib';
import { Icon, Input } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationEdit extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
		
		this.onType = this.onType.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { relationId, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { it.id == relationId; });
		
		let current = null;
		if (relation) {
			current = (
				<div id="relation-type" className={'item ' + (commonStore.menuIsOpen('dataviewRelationType') ? 'active' : '')} onClick={this.onType}>
					<Icon className={'relation c-' + relation.type} />
					<div className="name">{Constant.relationName[relation.type]}</div>
					<Icon className="arrow" />
				</div>
			);
		} else {
			current = (
				<div id="relation-type" className={'item ' + (commonStore.menuIsOpen('dataviewRelationType') ? 'active' : '')} onClick={this.onType}>
					<div className="name">Select type</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		return (
			<div>
				<div className="sectionName">Relation name</div>
				<div className="wrap">
					<Input value={relation ? relation.name : ''}  />
				</div>
				<div className="sectionName">Relation type</div>
				{current}
				<div className="line" />
				<div className="item">
					<Icon className="copy" />
					<div className="name">Duplicate</div>
				</div>
				<div className="item">
					<Icon className="trash" />
					<div className="name">Delete relation</div>
				</div>
			</div>
		);
	};
	
	onType (e: any) {
		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('dataviewRelationType', { 
			element: '#relation-type',
			offsetX: 208,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (item: any) => {
					console.log('Type', item);
				},
				...data
			}
		});
	};
	
};

export default MenuRelationEdit;