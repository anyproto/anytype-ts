import * as React from 'react';
import { I, C, M, DataUtil } from 'ts/lib';
import { Icon, Input, Switch } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationEdit extends React.Component<Props, {}> {

	timeout: number = 0;
	format: I.RelationType = I.RelationType.Description;
	isMultiple: boolean = false;
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
		const { param } = this.props;
		const { data } = param;
		const { relationKey, getView } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });

		let options: any = {};
		let opts = null;
		let ccn = [ 'item' ];
		if (commonStore.menuIsOpen('dataviewRelationType')) {
			ccn.push('active');
		};
		if (relation) {
			options = relation.options || {};
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
			const hasMultiple = false;//[ I.RelationType.File, I.RelationType.Select, I.RelationType.Object ].indexOf(relation.format) >= 0;

			opts = (
				<React.Fragment>
					{isDate ? (
						<React.Fragment>
							<div className="line" />
							<div className="item">
								<Icon className="clock" />
								<div className="name">Include time</div>
								<Switch value={options.includeTime} className="green" onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
							</div>

							<div id="menu-date-settings" className="item" onClick={this.onDateSettings}>
								<Icon className="settings" />
								<div className="name">Preferences</div>
								<Icon className="arrow" />
							</div>
						</React.Fragment>
					) : ''}

					{hasMultiple ? (
						<React.Fragment>
							<div className="item">
								<Icon className="clock" />
								<div className="name">Is multiple</div>
								<Switch value={relation.isMultiple} className="green" onChange={(e: any, v: boolean) => { this.isMultiple = v; this.save(); }} />
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
		const { param } = this.props;
		const { data } = param;
		const { relationKey, getView } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });

		if (relation) {
			this.format = relation.format;
			this.isMultiple = relation.isMultiple;
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
		const { relationKey, getView } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		
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
		const { rootId, blockId, relationKey, getView } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == relationKey; });

		relation.options.includeTime = v;
		view.relations[idx] = relation;

		C.BlockSetDataviewView(rootId, blockId, view.id, view);
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
		const { param, close } = this.props;
		const { data } = param;
		const { relationKey, getView } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		const newRelation: any = { name: relation.name, format: relation.format };

		this.add(newRelation);
		close();
	};

	onRemove (e: any) {
		let { param, close } = this.props;
		let { data } = param;
		let { rootId, blockId, relationKey, getView } = data;
		let view = getView();

		DataUtil.dataviewRelationDelete (rootId, blockId, relationKey, view);
		close();
	};

	onSubmit (e: any) {
		e.preventDefault();

		this.save();
		this.props.close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationKey, getView } = data;
		const name = this.ref.getValue();
		const block = blockStore.getLeaf(rootId, blockId);

		if (!name || !block) {
			return;
		};

		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		const newRelation: any = { name: name, format: this.format, isMultiple: this.isMultiple };

		relation ? this.update(newRelation) : this.add(newRelation);
	};

	add (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		DataUtil.dataviewRelationAdd(rootId, blockId, newRelation, view);
	};

	update (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, relationKey } = data;
		const view = getView();
		const relation = view.relations.find((it: I.ViewRelation) => { return it.key == relationKey; });
		
		DataUtil.dataviewRelationUpdate(rootId, blockId, Object.assign(relation, newRelation), view);
	};

};

export default MenuRelationEdit;