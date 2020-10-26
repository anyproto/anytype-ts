import * as React from 'react';
import { I, C } from 'ts/lib';
import { Icon, Input, Switch } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationEdit extends React.Component<Props, {}> {

	timeout: number = 0;
	
	constructor(props: any) {
		super(props);
		
		this.onType = this.onType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { relationId, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { return it.id == relationId; });

		let current = null;
		let options = null;

		console.log(relation);

		if (relation) {
			current = (
				<div id="relation-type" className={'item ' + (commonStore.menuIsOpen('dataviewRelationType') ? 'active' : '')} onClick={this.onType} onMouseEnter={this.onType}>
					<Icon className={'relation c-' + relation.type} />
					<div className="name">{Constant.relationName[relation.type]}</div>
					<Icon className="arrow" />
				</div>
			);

			if (relation.type == I.RelationType.Date) {
				options = (
					<React.Fragment>
						<div className="line" />
						<div className="item">
							<Icon className="clock" />
							<div className="name">Include time</div>
							<Switch value={relation.options.includeTime} className="green" onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<div id="menu-date-settings" className="item" onClick={this.onDateSettings} onMouseEnter={this.onDateSettings}>
							<Icon className="settings" />
							<div className="name">Preferences</div>
							<Icon className="arrow" />
						</div>
					</React.Fragment>
				);
			};
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
				<div className="wrap">
					<Input value={relation ? relation.name : ''} placeHolder="Relation name"  />
				</div>
				{current}
				{options}
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

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};
	
	onType (e: any) {
		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuClose('dataviewRelationType');
		commonStore.menuClose('dataviewDate');

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
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
		}, Constant.delay.menu);
	};

	onChangeTime (v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationId, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { return it.id == relationId; });
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.id == relationId; });

		relation.options.includeTime = v;
		view.relations[idx] = relation;

		C.BlockSetDataviewView(rootId, blockId, view.id, view, (message: any) => {
			console.log(message);
		});
	};

	onDateSettings (e: any) {
		const { param } = this.props;
		const { data } = param;

		commonStore.menuClose('dataviewRelationType');
		commonStore.menuClose('dataviewDate');

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			commonStore.menuOpen('dataviewDate', { 
				element: '#menu-date-settings',
				offsetX: 224,
				offsetY: -38,
				type: I.MenuType.Vertical,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Left,
				data: data
			});
		}, Constant.delay.menu);
	};
	
};

export default MenuRelationEdit;