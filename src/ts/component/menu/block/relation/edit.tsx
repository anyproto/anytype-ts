import * as React from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, C, S, U, J, analytics, Preview, translate, keyboard, Relation, Action } from 'Lib';
import { Input, MenuItemVertical, Button, Icon } from 'Component';

const MenuBlockRelationEdit = observer(class MenuBlockRelationEdit extends React.Component<I.Menu> {

	node: any = null;
	format: I.RelationType = null;
	objectTypes: string[] = [];
	ref = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, ref, readonly, noDelete, noUnlink } = data;
		const relation = this.getRelation();
		const root = S.Block.getLeaf(rootId, rootId);
		const isObject = this.format == I.RelationType.Object;
		const isReadonly = this.isReadonly();
		const object = S.Detail.get(rootId, rootId);
		const isType = U.Object.isTypeLayout(object.layout);
		const isName = relation && (relation.relationKey == 'name');
		const isDescription = relation && (relation.relationKey == 'description');

		let canDuplicate = true;
		let canDelete = !noDelete;
		let canUnlink = !noUnlink && !isName;
		let opts: any = null;
		let unlinkText = '';
		let name = '';

		if (relation) {
			name = relation.name;
		};

		if (readonly) {	
			canDuplicate = canDelete = false;
		} else
		if (root) {
			if (root.isLocked() || !S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ])) {
				canDuplicate = canDelete = false;
			};
		};

		if (relation) {
			canDelete = relation ? S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Delete ]) : false;
		};

		switch (ref) {
			case 'type':
				unlinkText = translate('commonUnlinkFromType');
				break;

			case 'object':
				unlinkText = translate('commonUnlinkFromObject');
				break;
		};

		canUnlink = canUnlink && !!unlinkText;

		if (isType && isDescription) {
			canUnlink = false;
		};

		if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
			const length = this.objectTypes.length;
			const typeId = length ? this.objectTypes[0] : '';
			const type = S.Record.getTypeById(typeId);
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
								value={name}
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
						{canUnlink ? <MenuItemVertical icon="unlink" name={unlinkText} onClick={this.onUnlink} onMouseEnter={this.menuClose} /> : ''}
						{canDelete ? <MenuItemVertical icon="remove" name={translate('commonMoveToBin')} onClick={this.onRemove} onMouseEnter={this.menuClose} /> : ''}
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
			this.objectTypes = Relation.getArrayValue(relation.objectTypes);
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

		const { id, param, getId } = this.props;
		const { data } = param;
		const relation = this.getRelation();

		if ((relation && relation.id) || S.Menu.isAnimating(id)) {
			return;
		};

		this.menuOpen('select', { 
			element: `#${getId()} #item-relation-type`,
			data: {
				...data,
				filter: '',
				value: this.format,
				options: U.Menu.getRelationTypes(),
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

		const { id ,param, getSize } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { getId } = this.props;
		const type = S.Record.getTypeType();

		if (!type || S.Menu.isAnimating(id)) {
			return;
		};
		
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
				canEdit: !this.isReadonly(),
				nameAdd: translate('menuBlockRelationEditAddObjectType'),
				nameCreate: translate('commonCreateObjectTypeWithName'),
				addParam: {
					details: { type: type.id }
				},
				placeholderFocus: translate('menuBlockRelationEditFilterObjectTypes'),
				value: this.objectTypes, 
				types: [ type.id ],
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
				],
				relation: observable.box(relation),
				valueMapper: it => S.Record.getTypeById(it.id),
				onChange: (value: any, callBack?: () => void) => {
					this.objectTypes = Relation.getArrayValue(value);
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
			rebind: this.rebind,
			parentId: this.props.id,
		});

		if (!S.Menu.isOpen(id) && !S.Menu.isAnimating(id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => {
				S.Menu.open(id, options);
			});
		};
	};

	menuClose () {
		S.Menu.closeAll(J.Menu.relationEdit);
	};

	onOpen (e: any) {
		this.props.close();
		U.Object.openConfig(this.getRelation());
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

	onUnlink (e: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { deleteCommand } = data;
		const relation = this.getRelation();

		if (deleteCommand) {
			deleteCommand();
		};

		close();

		if (relation) {
			analytics.event('DeleteRelation', { relationKey: relation?.relationKey, format: relation?.format });
		};
	};

	onRemove (e: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { deleteCommand } = data;
		const relation = this.getRelation();

		Action.archive([ relation.id ], '', () => {
			if (deleteCommand) {
				deleteCommand();
			};

			close();
		});
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
			name, 
			relationFormat: this.format,
			relationFormatObjectTypes: (this.format == I.RelationType.Object) ? this.objectTypes || [] : [],
		};

		relation && relation.id ? this.update(item) : this.add(item);
	};

	add (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, addCommand, onChange, ref, route } = data;
		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);

		C.ObjectCreateRelation(item, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			S.Detail.update(J.Constant.subId.relation, { id: details.id, details }, false);

			if (addCommand) {
				addCommand(rootId, blockId, details, onChange);
			};

			Preview.toastShow({ text: U.Common.sprintf(translate('menuBlockRelationEditToastOnCreate'), details.name) });
			analytics.event('CreateRelation', { format: item.relationFormat, type: ref, objectType: object.type, route: route || '' });
		});
	};

	update (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, relationId, saveCommand } = data;
		const details: any[] = [];
		const object = {};

		for (const k in item) {
			object[k] = item[k];
			details.push({ key: k, value: item[k] });
		};

		C.ObjectListSetDetails([ relationId ], details, () => {
			if (saveCommand) {
				saveCommand();
			};
		});
	};

	getRelation (): any {
		const { param } = this.props;
		const { data } = param;
		const { relationId, addParam } = data;

		let ret: any = null;

		if (relationId) {
			ret = S.Record.getRelationById(relationId);
		} else 
		if (addParam) {
			ret = addParam;
			ret.format = Number(ret.format) || I.RelationType.LongText;
		};

		return ret;
	};

	isAllowed () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const root = S.Block.getLeaf(rootId, rootId);
		const relation = this.getRelation();

		let ret = relation ? S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]) : true;
		if (ret && root) {
			ret = !root.isLocked() && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
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
