import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, translate } from 'ts/lib';
import { Icon, Input, Switch, MenuItemVertical, Button } from 'ts/component';
import { commonStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {
	history: any; 
};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class MenuBlockRelationEdit extends React.Component<Props, {}> {

	timeout: number = 0;
	format: I.RelationType = I.RelationType.LongText;
	objectTypes: string[] = [];
	ref: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const relation = this.getRelation();
		const isDate = this.format == I.RelationType.Date;
		const isObject = this.format == I.RelationType.Object;
		const type = this.objectTypes.length ? this.objectTypes[0] : '';
		const objectType = dbStore.getObjectType(type);

		let ccn = [ 'item' ];
		if (menuStore.isOpen('dataviewRelationType')) {
			ccn.push('active');
		};
		if (relation) {
			ccn.push('disabled');
		};

		const opts = (
			<React.Fragment>
				{isObject ? (
					<React.Fragment>
						<div className="sectionName">Type of target object</div>
						<MenuItemVertical 
							id="object-type" 
							object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} 
							name={objectType ? objectType.name : 'Select object type'} 
							onClick={this.onObjectType} 
							arrow={true}
						/>
					</React.Fragment>
				) : ''}

				{isDate ? (
					<React.Fragment>
						<div className="line" />
						<div className="item">
							<Icon className="clock" />
							<div className="name">Include time</div>
							<Switch value={relation ? relation.includeTime : false} className="green" onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<MenuItemVertical id="date-settings" icon="settings" name="Preferences" arrow={true} onClick={this.onDateSettings} />
					</React.Fragment>
				) : ''}
			</React.Fragment>
		);

		return (
			<form onSubmit={this.onSubmit}>
				<div className="sectionName">Relation name</div>
				<div className="inputWrap">
					<Input ref={(ref: any) => { this.ref = ref; }} value={relation ? relation.name : ''} readOnly={this.isReadOnly()} onChange={this.onChange}  />
				</div>

				<div className="sectionName">Relation type</div>
				<MenuItemVertical 
					id="relation-type" 
					icon={'relation ' + DataUtil.relationClass(this.format)} 
					name={translate('relationName' + this.format)} 
					onClick={this.onRelationType} 
					arrow={!relation}
				/>
				
				{opts}

				<div className="inputWrap">
					<Button id="button" type="input" text={relation ? 'Save' : 'Create'} className="grey filled c28" onClick={this.onSubmit} />
				</div>
				
				{relation ? (
					<React.Fragment>
						<div className="line" />
						<MenuItemVertical icon="expand" name="Open to edit" onClick={this.onOpen} />
						<MenuItemVertical icon="copy" name="Duplicate" onClick={this.onCopy} />
						<MenuItemVertical icon="remove" name="Delete relation" onClick={this.onRemove} />
					</React.Fragment>
				) : ''}
			</form>
		);
	};

	componentDidMount() {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const relation = this.getRelation();

		if (relation) {
			this.format = relation.format;
			this.objectTypes = relation.objectTypes;
			this.forceUpdate();
		};

		if (this.ref && filter) {
			this.ref.setValue(filter);
		};

		this.unbind();
		this.checkButton();
		this.focus();
	};

	componentDidUpdate () {
		this.checkButton();
		this.focus();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		window.clearTimeout(this.timeout);
		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};

	unbind () {
		$(window).unbind('keydown.menu');
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};

	onChange () {
		this.checkButton();
	};

	checkButton () {
		const node = $(ReactDOM.findDOMNode(this));
		const name = this.ref.getValue();
		const button = node.find('#button');
		const canSave = name.length && !this.isReadOnly();

		if (canSave) {
			button.addClass('orange').removeClass('grey');
		} else {
			button.removeClass('orange').addClass('grey');
		};
	};

	isReadOnly () {
		const { param } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		return relation && relation.isReadOnly;
	};
	
	onRelationType (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		
		if (relation) {
			return;
		};

		this.menuOpen('dataviewRelationType', { 
			element: `#${getId()} #item-relation-type`,
			offsetX: 224,
			offsetY: 4,
			vertical: I.MenuDirection.Center,
			data: {
				...data,
				value: this.format,
				onSelect: (item: any) => {
					this.format = item.format;
					this.forceUpdate();
				},
			}
		});
	};

	onObjectType (e: any) {
		const { getId } = this.props;
		const relation = this.getRelation();
		const value = relation && relation.objectTypes.length ? relation.objectTypes[0] : '';

		menuStore.open('searchObject', { 
			element: `#${getId()} #item-object-type`,
			offsetX: 224,
			offsetY: 0,
			vertical: I.MenuDirection.Center,
			className: 'single',
			data: {
				value: value,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.ObjectType ] }
				],
				onSelect: (item: any) => {
					this.objectTypes = [ item.id ];
					this.forceUpdate();
				}
			}
		});
	};

	onChangeTime (v: boolean) {
		const relation = this.getRelation();
		relation.includeTime = v;
	};

	onDateSettings (e: any) {
		const { param } = this.props;
		const { data } = param;

		this.menuOpen('dataviewDate', { 
			element: '#item-date-settings',
			offsetX: 224,
			offsetY: -38,
			onClose: () => {
				menuStore.close('select');
			},
			data: data
		});
	};

	menuOpen (id: string, param: I.MenuParam) {
		menuStore.closeAll([ 'select', 'dataviewRelationType', 'dataviewDate' ]);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { menuStore.open(id, param); }, Constant.delay.menu);
	};

	onOpen (e: any) {
		const relation = this.getRelation();
		DataUtil.objectOpenPopup({ id: relation.objectId, layout: I.ObjectLayout.Relation });
	};

	onCopy (e: any) {
		const { close } = this.props;
		const relation = this.getRelation();
		const newRelation: any = { name: relation.name, format: relation.format };

		this.add(newRelation);
		close();
	};

	onRemove (e: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { rootId, relationKey } = data;

		C.ObjectRelationDelete(rootId, relationKey);
		close();
	};

	onSubmit (e: any) {
		e.preventDefault();

		const node = $(ReactDOM.findDOMNode(this));
		const button = node.find('#button');

		if (button.hasClass('grey')) {
			return;
		};

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

		if (this.format == I.RelationType.Object) {
			newRelation.objectTypes = this.objectTypes;
		};

		relation ? this.update(newRelation) : this.add(newRelation);
	};

	add (newRelation: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, addCommand } = data;

		if (addCommand) {
			addCommand(rootId, blockId, newRelation);
		};

		close();
	};

	update (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, updateCommand } = data;
		const relation = this.getRelation();
		
		if (updateCommand) {
			updateCommand(rootId, blockId, Object.assign(relation, newRelation));
		};
	};

	getRelation () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, relationKey } = data;

		return dbStore.getRelation(rootId, rootId, relationKey);
	};

};

export default MenuBlockRelationEdit;