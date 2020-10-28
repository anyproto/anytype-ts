import * as React from 'react';
import { I, C, DataUtil } from 'ts/lib';
import { Icon, Input, Switch } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationEdit extends React.Component<Props, {}> {

	timeout: number = 0;
	format: I.RelationType = I.RelationType.Description;
	ref: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onType = this.onType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { relationKey, view } = data;
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });

		let current = null;
		let options = null;

		const Current = (item: any) => (
			<div id="relation-type" className={'item ' + (commonStore.menuIsOpen('dataviewRelationType') ? 'active' : '')} onClick={this.onType}>
				{item.format ? <Icon className={'relation c-' + DataUtil.relationClass(item.format)} /> : ''}
				<div className="name">{item.format ? Constant.relationName[item.format] : 'Select type'}</div>
				<Icon className="arrow" />
			</div>
		);

		if (relation) {
			current = <Current format={relation.format} />;

			if (relation.format == I.RelationType.Date) {
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
		} else 
		if (this.format) { 
			current = <Current format={this.format} />;
		} else {
			current = <Current format={0} />;
		};
		
		return (
			<form onSubmit={this.onSubmit}>
				<div className="sectionName">Relation name</div>
				<div className="wrap">
					<Input ref={(ref: any) => { this.ref = ref; }} value={relation ? relation.name : ''}  />
				</div>
				<div className="sectionName">Relation type</div>
				{current}
				{options}
				<div className="line" />
				<div className="item">
					<Icon className="copy" />
					<div className="name">Duplicate</div>
				</div>
				<div className="item">
					<Icon className="remove" />
					<div className="name">Delete relation</div>
				</div>
			</form>
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
						this.format = item.format;
						this.forceUpdate();
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
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationId; });
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == relationId; });

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

	onSubmit (e: any) {
		e.preventDefault();

		const { param, close } = this.props;
		const { data } = param;
		const { rootId, relationKey, view } = data;
		const name = this.ref.getValue();
		if (!name || !this.format) {
			return;
		};
		
		let relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		let newRelation = { name: name, format: this.format };
		if (relation) {
			C.BlockRelationUpdate(rootId, Object.assign(relation, newRelation));
		} else {
			C.BlockRelationAdd(rootId, [ newRelation ]);
		};

		close();
	};
	
};

export default MenuRelationEdit;