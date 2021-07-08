import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, translate } from 'ts/lib';
import { Input, MenuItemVertical, Button, Icon, Switch } from 'ts/component';
import { dbStore, menuStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {
	history: any; 
};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class MenuBlockRelationEdit extends React.Component<Props, {}> {

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
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		const relation = this.getRelation();
		const isDate = this.format == I.RelationType.Date;
		const isObject = this.format == I.RelationType.Object;
		const type = this.objectTypes.length ? this.objectTypes[0] : '';
		const objectType = dbStore.getObjectType(type);
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Relation ]);

		const opts = null;
		/*
		const opts = (
			<React.Fragment>
				{isObject ? (
					<div className="section">
						<div className="name">Type of target object</div>
						<MenuItemVertical 
							id="object-type" 
							object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} 
							name={objectType ? objectType.name : 'Select object type'} 
							onMouseEnter={this.onObjectType} 
							arrow={relation && !relation.isReadonly}
						/>
					</div>
				) : ''}

				{isDate && relation ? (
					<div className="section">
						<div className="item" onMouseEnter={this.menuClose}>
							<Icon className="clock" />
							<div className="name">Include time</div>
							<Switch value={relation ? relation.includeTime : false} onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<MenuItemVertical 
							id="date-settings" 
							icon="settings" 
							name="Preferences" 
							arrow={relation && !relation.isReadonly} 
							onMouseEnter={this.onDateSettings} 
						/>
					</div>
				) : ''}
			</React.Fragment>
		);
		*/

		return (
			<form onSubmit={this.onSubmit}>
				<div className="section">
					<div className="name">Relation name</div>

					{!this.isReadonly() ? (
						<div className="inputWrap">
							<Input 
								ref={(ref: any) => { this.ref = ref; }} 
								value={relation ? relation.name : ''} 
								onChange={this.onChange} 
							/>
						</div>
					) : (
						<div className="item isReadonly">
							<Icon className="lock" />
							{relation ? relation.name : ''}
						</div>
					)}
				</div>

				<div className={[ 'section', (!opts && !this.isReadonly() ? 'noLine' : '') ].join(' ')}>
					<div className="name">Relation type</div>
					<MenuItemVertical 
						id="relation-type" 
						icon={'relation ' + DataUtil.relationClass(this.format)} 
						className={this.isReadonly() ? 'isReadonly' : ''}
						name={translate('relationName' + this.format)} 
						onMouseEnter={this.onRelationType} 
						arrow={!relation}
					/>
				</div>
				
				{opts}

				{!this.isReadonly() ? (
					<div className="section">
						<div className="inputWrap">
							<Button id="button" type="input" text={relation ? 'Save' : 'Create'} color="grey" className="filled c28" />
						</div>
					</div>
				) : ''}

				{relation && (allowed || !this.isReadonly()) ? (
					<div className="section">
						{/*<MenuItemVertical icon="expand" name="Open as object" onClick={this.onOpen} onMouseEnter={this.menuClose} />*/}
						{allowed ? <MenuItemVertical icon="copy" name="Duplicate" onClick={this.onCopy} onMouseEnter={this.menuClose} /> : ''}
						{!this.isReadonly() ? <MenuItemVertical icon="remove" name="Delete relation" onClick={this.onRemove} onMouseEnter={this.menuClose} /> : ''}
					</div>
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

		this.unbind();
		
		if (rebind) {
			rebind();
		};

		this.menuClose();
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
		const name = this.ref ? this.ref.getValue() : '';
		const button = node.find('#button');
		const canSave = name.length && !this.isReadonly();

		if (canSave) {
			button.addClass('orange').removeClass('grey');
		} else {
			button.removeClass('orange').addClass('grey');
		};
	};

	isReadonly () {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, readonly } = data;
		const relation = this.getRelation();
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Relation ]);

		return readonly || !allowed || (relation && (relation.isReadonly || ([ Constant.relationKey.name, Constant.relationKey.description ].indexOf(relation.relationKey) >= 0)));
	};
	
	onRelationType (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		
		if (relation) {
			return;
		};

		this.menuOpen('relationType', { 
			element: `#${getId()} #item-relation-type`,
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

		if (relation && relation.isReadonly) {
			return;
		};

		const value = relation && relation.objectTypes.length ? relation.objectTypes[0] : '';

		this.menuOpen('searchObject', { 
			element: `#${getId()} #item-object-type`,
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

	onDateSettings (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();

		if (relation.isReadonly) {
			return;
		};

		this.menuOpen('dataviewDate', { 
			element: `#${getId()} #item-date-settings`,
			onClose: () => {
				menuStore.close('select');
			},
			data: data
		});
	};

	onChangeTime (v: boolean) {
		const relation = this.getRelation();
		relation.includeTime = v;
	};

	menuOpen (id: string, options: I.MenuParam) {
		const { getSize, param } = this.props;
		const { classNameWrap } = param;

		options.isSub = true;
		options.passThrough = true;
		options.offsetX = getSize().width;
		options.vertical = I.MenuDirection.Center;
		options.classNameWrap = classNameWrap;

		if (!menuStore.isOpen(id)) {
			menuStore.closeAll(Constant.menuIds.relationEdit, () => {
				menuStore.open(id, options);
			});
		};
	};

	menuClose () {
		 menuStore.closeAll(Constant.menuIds.relationEdit);
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
		const name = this.ref ? this.ref.getValue() : '';
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
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, addCommand } = data;

		if (addCommand) {
			addCommand(rootId, blockId, newRelation);
		};
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