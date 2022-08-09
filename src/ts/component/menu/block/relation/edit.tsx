import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { C, I, analytics, DataUtil, translate } from 'ts/lib';
import { Input, MenuItemVertical, Button, Icon } from 'ts/component';
import { dbStore, menuStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

const MenuBlockRelationEdit = observer(class MenuBlockRelationEdit extends React.Component<Props, {}> {

	format: I.RelationType = null;
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
		const typeId = this.objectTypes.length ? this.objectTypes[0] : '';
		const type = detailStore.get(Constant.subId.type, typeId, []);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const canDelete = allowed && relation && !Constant.systemRelationKeys.includes(relation.relationKey);
		const isReadonly = this.isReadonly();

		let opts: any = null;
		let typeProps: any = { name: 'Select object type' };

		if (isObject && !isReadonly) {
			const l = this.objectTypes.length;

			if (!type._empty_) {
				typeProps.name = type.name;
				typeProps.object = type;
			};

			typeProps.caption = l > 1 ? '+' + (l - 1) : '';
			if (typeProps.caption) {
				typeProps.withCaption = true;
			};

			opts = (
				<div className="section noLine">
					<div className="name">Limit object Types</div>
					<MenuItemVertical
						id="object-type"
						onMouseEnter={this.onObjectType}
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
							<div className="name">Include time</div>
							<Switch value={relation ? relation.includeTime : false} onChange={(e: any, v: boolean) => { this.onChangeTime(v); }} />
						</div>

						<MenuItemVertical 
							id="date-settings" 
							icon="settings" 
							name="Preferences" 
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
			<form onSubmit={this.onSubmit}>
				<div className="section">
					<div className="name">Relation name</div>

					{!isReadonly ? (
						<div className="inputWrap">
							<Input 
								ref={(ref: any) => { this.ref = ref; }} 
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
					<div className="name">Relation type</div>
					<MenuItemVertical 
						id="relation-type" 
						icon={this.format === null ? undefined : 'relation ' + DataUtil.relationClass(this.format)} 
						name={this.format === null ? 'Select relation type' : translate('relationName' + this.format)} 
						onMouseEnter={this.onRelationType} 
						readonly={isReadonly}
						arrow={!relation}
					/>
				</div>
				
				{opts}

				{!isReadonly ? (
					<div className="section">
						<div className="inputWrap">
							<Button id="button" type="input" text={relation ? 'Save' : 'Create'} color="grey" className="filled c28" />
						</div>
					</div>
				) : ''}

				{relation && (allowed || canDelete) ? (
					<div className="section">
						{/*<MenuItemVertical icon="expand" name="Open as object" onClick={this.onOpen} onMouseEnter={this.menuClose} />*/}
						{allowed ? <MenuItemVertical icon="copy" name="Duplicate" onClick={this.onCopy} onMouseEnter={this.menuClose} /> : ''}
						{canDelete ? <MenuItemVertical icon="remove" name="Delete" onClick={this.onRemove} onMouseEnter={this.menuClose} /> : ''}
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

		this.rebind();
		this.checkButton();
		this.focus();
	};

	componentDidUpdate () {
		this.checkButton();
		this.focus();
		this.props.position();
	};

	componentWillUnmount () {
		this.menuClose();
	};

	rebind () {
		const { getId } = this.props;

		this.unbind();

		$(`#${getId()}`).on('click.menu', () => { this.menuClose(); });
	};

	unbind () {
		const { getId } = this.props;

		$(window).unbind('keydown.menu');
		$(`#${getId()}`).unbind('click.menu');
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
		const canSave = name.length && (this.format !== null) && !this.isReadonly();

		if (canSave) {
			button.addClass('orange').removeClass('grey');
		} else {
			button.removeClass('orange').addClass('grey');
		};
	};

	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readonly } = data;
		const relation = this.getRelation();
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);

		return readonly || !allowed || (relation && relation.isReadonlyRelation);
	};
	
	onRelationType (e: any) {
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
		const { param } = this.props;
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
			width: 256,
			data: {
				rootId,
				blockId,
				nameAdd: 'Add object type',
				placeholderFocus: 'Filter object types...',
				value: this.objectTypes, 
				types: [ Constant.typeId.type ],
				relation: observable.box(relation),
				valueMapper: it => detailStore.get(Constant.subId.type, it.id, []),
				onChange: (value: any, callBack?: () => void) => {
					this.objectTypes = value;
					this.save();
					this.forceUpdate();

					if (callBack) {
						callBack();
					};
				},
			}
		});
	};

	onDateSettings (e: any) {
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

		const node = $(ReactDOM.findDOMNode(this));
		const button = node.find('#button');

		if (button.hasClass('grey')) {
			return;
		};

		this.save();
		this.menuClose();
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
		const { rootId, blockId, addCommand, onChange } = data;

		const details = { 
			name: newRelation.name, 
			relationFormat: newRelation.format,
			type: Constant.typeId.relation,
			layout: I.ObjectLayout.Relation,
		};

		C.ObjectCreate(details, [], (message: any) => {
			if (addCommand) {
				addCommand(rootId, blockId, message.pageId, onChange);
			};
		});
	};

	update (newRelation: any) {
		const { param } = this.props;
		const { data } = param;
		const { relationId } = data;
		const details = [ 
			{ key: 'name', value: newRelation.name },
		];

		C.ObjectSetDetails(relationId, details);
	};

	getRelation () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationId } = data;

		return dbStore.getRelationById(rootId, blockId, relationId);
	};

});

export default MenuBlockRelationEdit;