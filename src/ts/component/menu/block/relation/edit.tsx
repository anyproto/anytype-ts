import * as React from 'react';
import { I, C, M, DataUtil } from 'ts/lib';
import { Icon, Input, Switch } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
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
		this.onCopy = this.onCopy.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const relation = this.getRelation();

		let opts = null;
		let ccn = [ 'item' ];
		if (commonStore.menuIsOpen('dataviewRelationType')) {
			ccn.push('active');
		};
		if (relation) {
			ccn.push('disabled');
		};

		const Current = (item: any) => (
			<div id="relation-type" className={ccn.join(' ')} onClick={this.onType}>
				<Icon className={'relation c-' + DataUtil.relationClass(item.format)} />
				<div className="name">{Constant.relationName[item.format]}</div>
				{!relation ? <Icon className="arrow" /> : ''}
			</div>
		);

		if (relation) {
			const isDate = relation.format == I.RelationType.Date;
			opts = (
				<React.Fragment>
					{isDate ? (
						<React.Fragment>
							<div className="line" />
							<div className="item">
								<Icon className="clock" />
								<div className="name">Include time</div>
								<Switch value={relation.includeTime} className="green" onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
							</div>

							<div id="menu-date-settings" className="item" onClick={this.onDateSettings}>
								<Icon className="settings" />
								<div className="name">Preferences</div>
								<Icon className="arrow" />
							</div>
						</React.Fragment>
					) : ''}
				</React.Fragment>
			);
		};

		return (
			<form onSubmit={this.onSubmit}>
				<div className="sectionName">Relation name</div>
				<div className="wrap">
					<Input ref={(ref: any) => { this.ref = ref; }} value={relation ? relation.name : ''}  />
				</div>
				<div className="sectionName">Relation type</div>
				<Current format={this.format} />
				
				{opts}
				
				{relation ? (
					<React.Fragment>
						<div className="line" />
						<div className="item" onClick={this.onCopy}>
							<Icon className="copy" />
							<div className="name">Duplicate</div>
						</div>
						<div className="item" onClick={this.onRemove}>
							<Icon className="remove" />
							<div className="name">Delete relation</div>
						</div>
					</React.Fragment>
				) : ''}
			</form>
		);
	};

	componentDidMount() {
		const relation = this.getRelation();
		if (relation) {
			this.format = relation.format;
			this.forceUpdate();
		};

		this.ref.focus();
	};

	componentDidUpdate () {
		this.ref.focus();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};
	
	onType (e: any) {
		const { param } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		
		if (relation) {
			return;
		};
		
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
					value: this.format,
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
		const { rootId, relationKey } = data;
		const relations = dbStore.getRelations(rootId);
		const relation = this.getRelation();
		const idx = relations.findIndex((it: I.ViewRelation) => { return it.key == relationKey; });

		relation.includeTime = v;
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
				onClose: () => {
					commonStore.menuClose('select');
				},
				data: data
			});
		}, Constant.delay.menu);
	};

	onCopy (e: any) {
		const relation = this.getRelation();
		const newRelation: any = { name: relation.name, format: relation.format };

		this.add(newRelation);
		close();
	};

	onRemove (e: any) {
		close();
	};

	onSubmit (e: any) {
		e.preventDefault();

		this.save();
		this.props.close();
	};

	save () {
		const name = this.ref.getValue();
		if (!name) {
			return;
		};

		const relation = this.getRelation();
		const newRelation: any = { name: name, format: this.format };

		relation ? this.update(newRelation) : this.add(newRelation);
	};

	add (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
	};

	update (newRelation: any) {
		const relation = this.getRelation();
	};

	getRelation () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, relationKey } = data;
		const relations = dbStore.getRelations(rootId);
		return relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
	};

};

export default MenuRelationEdit;