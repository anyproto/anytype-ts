import * as React from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, C, analytics, UtilMenu, UtilObject, Preview, translate, keyboard, Relation, UtilCommon } from 'Lib';
import { Input, MenuItemVertical, Button, Icon } from 'Component';
import { dbStore, menuStore, blockStore, detailStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

const MenuBlockRelationEdit = observer(class MenuBlockRelationEdit extends React.Component<I.Menu> {

	node: any = null;
	format: I.RelationType = null;
	objectTypes: string[] = [];
	ref = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onChange = this.onChange.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, ref, readonly, noDelete } = data;

		const relation = this.getRelation();
		const root = blockStore.getLeaf(rootId, rootId);
		const isDate = this.format == I.RelationType.Date;
		const isObject = this.format == I.RelationType.Object;
		const isReadonly = this.isReadonly();

		let canDuplicate = true;
		let canDelete = !noDelete;
		let opts: any = null;
		let deleteText = translate('commonDelete');
		let deleteIcon = 'remove';

		if (readonly) {	
			canDuplicate = canDelete = false;
		} else
		if (root) {
			if (root.isLocked() || !blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ])) {
				canDuplicate = canDelete = false;
			};
		};
		if (relation && Relation.isSystemWithoutUser(relation.relationKey)) {
			canDelete = false;
		};

		switch (ref) {
			case 'type':
				deleteText = translate('menuBlockRelationEditUnlinkFromType');
				deleteIcon = 'unlink';
				break;

			case 'object':
				deleteText = translate('menuBlockRelationEditUnlinkFromObject');
				deleteIcon = 'unlink';
				break;
		};

		if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
			const length = this.objectTypes.length;
			const typeId = length ? this.objectTypes[0] : '';
			const type = dbStore.getTypeById(typeId);
			const typeProps: any = { 
				name: translate('menuBlockRelationEditSelectObjectType'),
				caption: (length > 1 ? '+' + (length - 1) : ''),
			};

			if (type) {
				typeProps.name = type.name;
				typeProps.object = type;
			};

			opts = (
				<div className="section noLine">
					<div className="name">{translate('menuBlockRelationEditLimitObjectTypes')}</div>
					<MenuItemVertical
						id="object-type"
						onMouseEnter={this.onObjectType}
						onClick={this.onObjectType}
						arrow={!isReadonly}
						{...typeProps}
					/>
				</div>
			);
		};
		/*
		const opts = (
			<React.Fragment>

				{isDate && relation ? (
					<div className="section">
						<div className="item" onMouseEnter={this.menuClose}>
							<Icon className="clock" />
							<div className="name">{translate('menuBlockRelationEditIncludeTime')}</div>
							<Switch value={relation ? relation.includeTime : false} onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<MenuItemVertical 
							id="date-settings" 
							icon="settings" 
							name={translate('commonPreferences')}
							arrow={!isReadonly} 
							readonly={isReadonly}
							onMouseEnter={this.onDateSettings} 
						/>
					</div>
				) : ''}
			</React.Fragment>
		);
		*/

		return (
			<form 
				ref={node => this.node = node}
				className="form" 
				onSubmit={this.onSubmit} 
				onMouseDown={this.menuClose}
			>
				<div className="section">
					<div className="name">{translate('menuBlockRelationEditRelationName')}</div>

					{!isReadonly ? (
						<div className="inputWrap">
							<Input 
								ref={ref => this.ref = ref} 
								value={relation ? relation.name : ''}
								onChange={this.onChange} 
								onMouseEnter={this.menuClose}
							/>
						</div>
					) : (
						<div className="item isReadonly">
							<Icon className="lock" />
							{relation ? relation.name : ''}
						</div>
					)}
				</div>

				<div className={[ 'section', (!opts && !isReadonly ? 'noLine' : '') ].join(' ')}>
					<div className="name">{translate('menuBlockRelationEditRelationType')}</div>
					<MenuItemVertical 
						id="relation-type" 
						icon={this.format === null ? undefined : 'relation ' + Relation.className(this.format)} 
						name={this.format === null ? translate('menuBlockRelationEditSelectRelationType') : translate('relationName' + this.format)}
						onMouseEnter={this.onRelationType} 
						onClick={this.onRelationType} 
						readonly={isReadonly}
						arrow={!relation}
					/>
				</div>
				
				{opts}

				{!isReadonly ? (
					<div className="section">
						<div className="inputWrap">
							<Button id="button" type="input" text={translate(relation ? 'commonSave' : 'commonCreate')} color="blank" className="c28" />
						</div>
					</div>
				) : ''}

				{relation && (canDuplicate || canDelete) ? (
					<div className="section">
						<MenuItemVertical icon="expand" name={translate('commonOpenObject')} onClick={this.onOpen} onMouseEnter={this.menuClose} />
						{canDuplicate ? <MenuItemVertical icon="copy" name={translate('commonDuplicate')} onClick={this.onCopy} onMouseEnter={this.menuClose} /> : ''}
						{canDelete ? <MenuItemVertical icon={deleteIcon} name={deleteText} onClick={this.onRemove} onMouseEnter={this.menuClose} /> : ''}
					</div>
				) : ''}
			</form>
		);
	};

	componentDidMount () {
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

		this.checkButton();
		this.focus();
		this.rebind();
	};

	componentDidUpdate () {
		this.checkButton();
		this.focus();
		this.props.position();
	};

	componentWillUnmount () {
		this.menuClose();
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};

	checkButton () {
		const node = $(this.node);
		const name = this.ref ? this.ref.getValue() : '';
		const button = node.find('#button');
		const canSave = name.length && (this.format !== null) && !this.isReadonly();

		button.removeClass('black blank').addClass(canSave ? 'black' : 'blank');
	};

	onRelationType (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();
		
		if (relation) {
			return;
		};

		this.menuOpen('select', { 
			element: `#${getId()} #item-relation-type`,
			data: {
				...data,
				filter: '',
				value: this.format,
				options: UtilMenu.getRelationTypes(),
				noFilter: true,
				onSelect: (e: any, item: any) => {
					this.format = item.id;
					this.forceUpdate();
				},
			}
		});
	};

	onObjectType (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		if (this.isReadonly()) {
			return;
		};

		const { getId } = this.props;
		
		let relation: any = this.getRelation();
		if (!relation) {
			relation = { format: this.format };
		};

		this.menuOpen('dataviewObjectValues', { 
			element: `#${getId()} #item-object-type`,
			className: 'single',
			width: getSize().width,
			vertical: I.MenuDirection.Center,
			data: {
				rootId,
				nameAdd: translate('menuBlockRelationEditAddObjectType'),
				placeholderFocus: translate('menuBlockRelationEditFilterObjectTypes'),
				value: this.objectTypes, 
				types: [ dbStore.getTypeType()?.id ],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemLayouts() },
				],
				relation: observable.box(relation),
				valueMapper: it => dbStore.getTypeById(it.id),
				onChange: (value: any, callBack?: () => void) => {
					this.objectTypes = value;
					this.forceUpdate();

					if (relation.id) {
						this.save();
					};
					
					if (callBack) {
						callBack();
					};
				},
			}
		});
	};

	onDateSettings (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();

		if (relation && relation.isReadonlyRelation) {
			return;
		};

		this.menuOpen('dataviewDate', { 
			element: `#${getId()} #item-date-settings`,
			onClose: () => {
				menuStore.close('select');
			},
			data,
		});
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, (pressed: string) => {
			this.onSubmit(e);
		});
	};

	onChange () {
		this.checkButton();
	};

	onChangeTime (v: boolean) {
		const relation = this.getRelation();
		relation.includeTime = v;
	};

	menuOpen (id: string, options: I.MenuParam) {
		const { getSize, param } = this.props;
		const { classNameWrap } = param;

		options = Object.assign(options, {
			isSub: true,
			passThrough: true,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			classNameWrap,
		});

		options.data = Object.assign(options.data, {
			rebind: this.rebind,
		});

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
		this.props.close();
		UtilObject.openPopup(this.getRelation());
	};

	onCopy (e: any) {
		const { close } = this.props;
		const relation = this.getRelation();

		this.add({ 
			name: relation.name, 
			relationFormat: relation.format,
			relationFormatObjectTypes: (relation.format == I.RelationType.Object) ? relation.objectTypes || [] : [],
		});

		close();
		analytics.event('DuplicateRelation');
	};

	onRemove (e: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { deleteCommand } = data;

		if (deleteCommand) {
			deleteCommand();
		};

		close();
		analytics.event('DeleteRelation');
	};

	onSubmit (e: any) {
		e.preventDefault();

		const node = $(this.node);
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
		const item: any = { 
			name: name, 
			relationFormat: this.format,
			relationFormatObjectTypes: (this.format == I.RelationType.Object) ? this.objectTypes || [] : [],
		};

		relation ? this.update(item) : this.add(item);
	};

	add (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, addCommand, onChange, ref } = data;
		const object = detailStore.get(rootId, rootId, [ 'type' ], true);

		C.ObjectCreateRelation(item, commonStore.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			detailStore.update(Constant.subId.relation, { id: details.id, details }, false);

			if (addCommand) {
				addCommand(rootId, blockId, details, onChange);
			};

			Preview.toastShow({ text: UtilCommon.sprintf(translate('menuBlockRelationEditToastOnCreate'), details.name) });
			analytics.event('CreateRelation', { format: item.relationFormat, type: ref, objectType: object.type });
		});
	};

	update (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { relationId } = data;
		const details: any[] = [];

		for (const k in item) {
			details.push({ key: k, value: item[k] });
		};

		C.ObjectListSetDetails([ relationId ], details);
	};

	getRelation () {
		const { param } = this.props;
		const { data } = param;
		const { relationId } = data;

		return dbStore.getRelationById(relationId);
	};

	isAllowed () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const root = blockStore.getLeaf(rootId, rootId);
		const relation = this.getRelation();

		let ret = relation ? blockStore.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]) : true;
		if (ret && root) {
			ret = !root.isLocked() && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		};
		return ret;
	};
	
	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { readonly } = data;
		const relation = this.getRelation();
		const isAllowed = this.isAllowed();

		return readonly || !isAllowed || (relation && relation.isReadonlyRelation);
	};

});

export default MenuBlockRelationEdit;
