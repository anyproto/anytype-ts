import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, translate } from 'ts/lib';
import { Icon, Input, Switch, MenuItemVertical, Button } from 'ts/component';
import { commonStore, blockStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {
	history: any;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

class MenuRelationEdit extends React.Component<Props, {}> {

	format: I.RelationType = I.RelationType.LongText;
	objectTypes: string[] = [];
	ref: any = null;
	
	constructor(props: any) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = this.getRelation();
		const viewRelation = this.getViewRelation();
		const isDate = this.format == I.RelationType.Date;
		const isObject = this.format == I.RelationType.Object;
		const type = this.objectTypes.length ? this.objectTypes[0] : '';
		const objectType = dbStore.getObjectType(type);
		const allowed = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.Relation ]);
		const canDelete = allowed && relation && Constant.systemRelationKeys.indexOf(relation.relationKey) < 0;

		let ccn = [ 'item' ];
		if (relation) {
			ccn.push('disabled');
		};

		const opts = (
			<React.Fragment>
				{/*isObject ? (
					<div className="section">
						<div className="name">Type of target object</div>
						<MenuItemVertical 
							id="object-type" 
							name={objectType ? (objectType.name || DataUtil.defaultName('page')) : 'Select object type'} 
							object={{ ...objectType, layout: I.ObjectLayout.Type }} 
							onMouseEnter={this.onObjectType} 
							arrow={!this.isReadonly()}
						/>
					</div>
				) : ''*/}

				{isDate && relation ? (
					<div className="section">
						<div className="item" onMouseEnter={this.menuClose}>
							<Icon className="clock" />
							<div className="name">Include time</div>
							<Switch value={viewRelation ? viewRelation.includeTime : false} onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<MenuItemVertical 
							id="date-settings" 
							icon="settings" 
							name="Preferences" 
							arrow={true} 
							onMouseEnter={this.onDateSettings} 
						/>
					</div>
				) : ''}
			</React.Fragment>
		);

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
						name={translate('relationName' + this.format)} 
						className={this.isReadonly() ? 'isReadonly' : ''}
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
						{/*<MenuItemVertical icon="expand" name="Open to edit" onClick={this.onOpen} onMouseEnter={this.menuClose} />*/}
						{allowed ? <MenuItemVertical icon="copy" name="Duplicate" onClick={this.onCopy} onMouseEnter={this.menuClose} /> : ''}
						{canDelete ? <MenuItemVertical icon="remove" name="Delete" onClick={this.onRemove} onMouseEnter={this.menuClose} /> : ''}
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
		this.focus();
		this.checkButton();
	};

	componentDidUpdate () {
		this.focus();
		this.checkButton();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

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
	
	onRelationType (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getViewRelation();
		
		if (relation) {
			return;
		};

		this.menuOpen('select', { 
			element: `#${getId()} #item-relation-type`,
			data: {
				...data,
				value: this.format,
				options: DataUtil.menuGetRelationTypes(),
				noFilter: true,
				onSelect: (e: any, item: any) => {
					this.format = item.id;
					this.forceUpdate();
				},
			}
		});
	};

	onObjectType (e: any) {
		if (this.isReadonly()) {
			return;
		};

		const { getId } = this.props;
		const relation = this.getRelation();
		const value = relation && relation.objectTypes.length ? relation.objectTypes[0] : '';

		this.menuOpen('searchObject', { 
			element: `#${getId()} #item-object-type`,
			className: 'single',
			data: {
				placeholder: 'Find a type of object...',
				label: 'Your object type library',
				value: value,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.Type ] }
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

		this.menuOpen('dataviewDate', { 
			element: `#${getId()} #item-date-settings`,
			onClose: () => {
				menuStore.close('select');
			},
			data: data
		});
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

	onChangeTime (v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationKey, getView } = data;
		const view = getView();
		const relation = this.getViewRelation();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == relationKey; });

		relation.includeTime = v;
		view.relations[idx] = relation;
		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view);
	};

	onOpen (e: any) {
		const relation = this.getRelation();

		DataUtil.objectOpenPopup({ id: relation.objectId, layout: I.ObjectLayout.Relation });
	};

	onCopy (e: any) {
		const { close } = this.props;
		const relation = this.getRelation();

		if (!relation) {
			return;
		};

		this.add({ name: relation.name, format: relation.format });
		close();
	};

	onRemove (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, relationKey, getView } = data;
		const view = getView();

		DataUtil.dataviewRelationDelete(rootId, blockId, relationKey, view);
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
		const { param } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId } = data;
		const relation = this.getRelation();
		const allowed = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.Relation ]);

		return readonly || !allowed || (relation && relation.isReadonlyRelation);
	};

	save () {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const name = this.ref ? this.ref.getValue() : '';
		const block = blockStore.getLeaf(rootId, blockId);

		if (!name || !block) {
			return;
		};

		const relation = this.getViewRelation();
		const newRelation: any = { name: name, format: this.format };

		if (this.format == I.RelationType.Object) {
			newRelation.objectTypes = this.objectTypes;
		};

		relation ? this.update(newRelation) : this.add(newRelation);

		this.menuClose();
		close();
	};

	add (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, onChange } = data;
		const view = getView();

		DataUtil.dataviewRelationAdd(rootId, blockId, newRelation, view, onChange);
	};

	update (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, onChange } = data;
		const view = getView();
		const relation = this.getViewRelation();
		
		DataUtil.dataviewRelationUpdate(rootId, blockId, Object.assign(relation, newRelation), view, onChange);
	};

	getRelation (): I.Relation {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationKey } = data;

		return dbStore.getRelation(rootId, blockId, relationKey);
	};

	getViewRelation (): I.ViewRelation {
		const { param } = this.props;
		const { data } = param;
		const { relationKey, getView } = data;

		return getView()?.getRelation(relationKey);
	};

};

export default MenuRelationEdit;