import * as React from 'react';
import { I, C, DataUtil } from 'ts/lib';
import { Icon, Input, Switch, MenuItemVertical } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationEdit extends React.Component<Props, {}> {

	timeout: number = 0;
	format: I.RelationType = I.RelationType.Description;
	objectTypes: string[] = [];
	ref: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
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
			<MenuItemVertical 
				id="relation-type" 
				icon={'relation c-' + DataUtil.relationClass(item.format)} 
				name={Constant.relationName[item.format]} 
				onClick={this.onRelationType} 
				arrow={!relation}
			/>
		);

		if (relation) {
			const isDate = relation.format == I.RelationType.Date;
			const isObject = relation.format == I.RelationType.Object;

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

							<MenuItemVertical id="date-settings" icon="settings" name="Preferences" arrow={true} onClick={this.onDateSettings} />
						</React.Fragment>
					) : ''}

					{isObject ? (
						<React.Fragment>
							<div className="line" />

							<div className="sectionName">Object types</div>
							<div id="item-object-type" className="item" onClick={this.onObjectType}>
								List
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
						<MenuItemVertical icon="copy" name="Duplicate" onClick={this.onCopy} />
						<MenuItemVertical icon="remove" name="Delete relation" onClick={this.onRemove} />
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

		this.focus();
	};

	componentDidUpdate () {
		this.focus();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};
	
	onRelationType (e: any) {
		const { param } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		
		if (relation) {
			return;
		};
		
		this.menuOpen('dataviewRelationType', { 
			element: '#item-relation-type',
			offsetX: 224,
			offsetY: 0,
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
	};

	onObjectType (e: any) {
		const relation = this.getRelation();
		const value = relation && relation.objectTypes.length ? relation.objectTypes[0] : '';

		const cb = (message: any) => {
			const options = message.objectTypes.map((it: I.ObjectType) => {
				return {
					id: DataUtil.schemaField(it.url), 
					name: it.name, 
					icon: it.iconEmoji,
					hash: '',
					withSmile: true,
					url: it.url,
				};
			});
			options.sort((c1: any, c2: any) => {
				if (c1.name > c2.name) return 1;
				if (c1.name < c2.name) return -1;
				return 0;
			});

			this.menuOpen('select', { 
				element: '#item-object-type',
				offsetX: 224,
				offsetY: 4,
				width: 280,
				type: I.MenuType.Vertical,
				vertical: I.MenuDirection.Center,
				horizontal: I.MenuDirection.Left,
				data: {
					value: value,
					options: options,
					onSelect: (e: any, item: any) => {
						this.objectTypes = [ item.url ];

						if (relation) {
							this.save();
						};
					},
				}
			});
		};

		C.ObjectTypeList(cb);
	};

	menuOpen (id: string, param: I.MenuParam) {
		commonStore.menuCloseAll([ 'select', 'dataviewRelationType', 'dataviewDate' ]);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { commonStore.menuOpen(id, param); }, Constant.delay.menu);
	};

	onChangeTime (v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationKey, getView } = data;
		const view = getView();
		const relation = this.getRelation();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == relationKey; });

		relation.includeTime = v;
		view.relations[idx] = relation;
		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view);
	};

	onDateSettings (e: any) {
		const { param } = this.props;
		const { data } = param;

		commonStore.menuCloseAll([ 'dataviewRelationType', 'dataviewDate' ]);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			commonStore.menuOpen('dataviewDate', { 
				element: '#item-date-settings',
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
		if (!relation) {
			return;
		};

		this.add({ name: relation.name, format: relation.format });
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
		const { rootId, blockId } = data;
		const name = this.ref.getValue();
		const block = blockStore.getLeaf(rootId, blockId);

		if (!name || !block) {
			return;
		};

		const relation = this.getRelation();
		const newRelation: any = { name: name, format: this.format };

		if (this.format == I.RelationType.Object) {
			newRelation.objectTypes = this.objectTypes;
		};

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
		const { rootId, blockId, getView } = data;
		const view = getView();
		const relation = this.getRelation();
		
		DataUtil.dataviewRelationUpdate(rootId, blockId, Object.assign(relation, newRelation), view);
	};

	getRelation (): I.ViewRelation {
		const { param } = this.props;
		const { data } = param;
		const { relationKey, getView } = data;
		const view = getView();

		return view.relations.find((it: I.ViewRelation) => { return it.relationKey == relationKey; });
	};

};

export default MenuRelationEdit;