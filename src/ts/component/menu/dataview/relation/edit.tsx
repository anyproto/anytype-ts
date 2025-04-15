import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { I, C, S, U, J, Relation, translate, Dataview, keyboard, analytics, Preview, Action } from 'Lib';
import { Icon, Input, MenuItemVertical, Button } from 'Component';

const MenuRelationEdit = observer(class MenuRelationEdit extends React.Component<I.Menu> {

	node: any = null;
	format: I.RelationType = null;
	objectTypes: string[] = [];
	ref = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { readonly } = data;
		const relation = this.getRelation();
		const viewRelation = this.getViewRelation();
		const isDate = this.format == I.RelationType.Date;
		const isObject = this.format == I.RelationType.Object;
		const isReadonly = this.isReadonly();
		const sections = this.getSections();
		const ccn = [ 'item' ];
		
		if (relation) {
			ccn.push('disabled');
		};

		let opts = null;
		let name = '';

		if (relation) {
			name = relation.name;
		};

		if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
			const length = this.objectTypes.length;
			const typeId = length ? this.objectTypes[0] : '';
			const type = S.Record.getTypeById(typeId);
			const typeProps: any = { 
				name: translate('menuDataviewRelationEditSelectObjectType'),
				caption: (length > 1 ? '+' + (length - 1) : ''),
			};

			if (type) {
				typeProps.name = type.name;
				typeProps.object = type;
			};

			opts = (
				<div className="section noLine">
					<div className="name">{translate('menuDataviewRelationEditLimitObjectTypes')}</div>
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

		if (isDate && relation) {
			opts = (
				<div className="section">
					<MenuItemVertical 
						id="includeTime" 
						icon="clock" 
						name={translate('menuDataviewRelationEditIncludeTime')}
						onMouseEnter={this.menuClose}
						readonly={readonly}
						withSwitch={true}
						switchValue={viewRelation?.includeTime}
						onSwitch={(e: any, v: boolean) => this.onChangeTime(v)}
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
					<div className="name">{translate('menuDataviewRelationEditRelationName')}</div>
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
					<div className="name">{translate('menuDataviewRelationEditRelationType')}</div>
					<MenuItemVertical 
						id="relation-type" 
						icon={this.format === null ? undefined : `relation ${Relation.className(this.format)}`} 
						name={this.format === null ? translate('menuDataviewRelationEditSelectRelationType') : translate('relationName' + this.format)}
						onMouseEnter={this.onRelationType} 
						readonly={isReadonly}
						arrow={!relation}
					/>
				</div>
				
				{opts}

				{!isReadonly ? (
					<div className="section" onMouseEnter={this.menuClose}>
						<div className="inputWrap">
							<Button id="button" type="input" text={translate(relation ? 'commonSave' : 'commonCreate')} color="blank" className="c28" />
						</div>
					</div>
				) : ''}

				{sections.map((section: any, i: number) => (
					<div key={i} className="section">
						{section.children.map((action: any, c: number) => (
							<MenuItemVertical 
								key={c}
								{...action}
								onClick={e => this.onClick(e, action)} 
								onMouseEnter={e => this.onMouseEnter(e, action)}
							/>
						))}
					</div>
				))}
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
			this.objectTypes = Relation.getArrayValue(relation.objectTypes);
			this.forceUpdate();
		};

		if (this.ref && filter) {
			this.ref.setValue(filter);
		};

		this.focus();
		this.checkButton();
		this.rebind();
	};

	componentDidUpdate () {
		this.focus();
		this.checkButton();
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

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, extendedOptions, readonly, noUnlink } = data;
		const relation = this.getRelation();

		if (!relation) {
			return [];
		};

		const viewRelation = this.getViewRelation();
		const object = S.Detail.get(rootId, rootId);
		const isFile = relation && (relation.format == I.RelationType.File);
		const isName = relation && (relation.relationKey == 'name');
		const isDescription = relation && (relation.relationKey == 'description');
		const canFilter = !isFile;
		const canSort = !isFile;
		const canHide = !isName;
		const canAlign = !isName; 
		const canCalculate = relation;
		const isType = U.Object.isTypeLayout(object.layout);
		
		let unlinkText = translate('commonUnlink');
		if (U.Object.isCollectionLayout(object.layout)) {
			unlinkText = translate('commonUnlinkFromCollection');
		};
		if (U.Object.isSetLayout(object.layout)) {
			unlinkText = translate('commonUnlinkFromSet');
		};
		if (isType) {
			unlinkText = translate('commonUnlinkFromType');
		};

		let canDuplicate = true;
		let canDelete = true;
		let canUnlink = !noUnlink && !isName;

		if (isType && isDescription) {
			canUnlink = false;
		};

		if (relation) {
			const isAllowedRelation = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.Relation ]);

			canDuplicate = canDuplicate && isAllowedRelation;
			canDelete = canDelete && S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Delete ]);

			if (isType) {
				canUnlink = canUnlink && S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
			} else {
				canUnlink = canUnlink && isAllowedRelation;
			};
		};

		if (!relation || readonly) {
			canDuplicate = false;
			canDelete = false;
		};

		let sections: any[] = [
			{
				children: [
					relation ? { id: 'open', icon: 'expand', name: translate('commonOpenObject') } : null,
					canDuplicate ? { id: 'copy', icon: 'copy', name: translate('commonDuplicate') } : null,
					canUnlink ? { id: 'unlink', icon: 'unlink', name: unlinkText } : null,
					canDelete ? { id: 'remove', icon: 'remove', name: translate('commonMoveToBin') } : null,
				]
			}
		];

		if (extendedOptions && !readonly) {
			sections = sections.concat([
				{
					children: [
						canFilter ? { id: 'filter', icon: 'relation-filter', name: translate('menuDataviewRelationEditAddFilter') } : null,
						canSort ? { id: 'sort0', icon: 'relation-sort0', name: translate('menuDataviewRelationEditSortAscending'), type: I.SortType.Asc } : null,
						canSort ? { id: 'sort1', icon: 'relation-sort1', name: translate('menuDataviewRelationEditSortDescending'), type: I.SortType.Desc } : null,
						{ id: 'insert-left', icon: 'relation-insert-left', name: translate('menuDataviewRelationEditInsertLeft'), dir: -1 },
						{ id: 'insert-right', icon: 'relation-insert-right', name: translate('menuDataviewRelationEditInsertRight'), dir: 1 },
						canHide ? { id: 'hide', icon: 'relation-hide', name: translate('menuDataviewRelationEditHideRelation') } : null,
					]
				},
				{
					children: [
						canAlign ? { id: 'align', icon: U.Data.alignHIcon(viewRelation?.align), name: translate('commonAlign'), arrow: true } : null,
						canCalculate ? { id: 'calculate', icon: 'relation c-number', name: translate('commonCalculate'), arrow: true } : null,
					]
				},
			]);
		};

		sections = sections.map(s => {
			s.children = s.children.filter(c => c);
			return s;
		});

		sections = sections.filter(s => s.children.length);
		return sections;
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};

		return items;
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!item.arrow) {
			this.menuClose();
			return;
		};

		const { id, getId, getSize, param, close } = this.props;
		const { classNameWrap, data } = param;
		const { rootId } = data;
		const relation = this.getRelation();

		if (!relation) {
			return;
		};

		const viewRelation = this.getViewRelation();
		const object = S.Detail.get(rootId, rootId);

		let menuContext = null;
		let menuId = '';

		const menuParam: any = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			vertical: I.MenuDirection.Center,
			isSub: true,
			offsetX: getSize().width,
			classNameWrap,
			onOpen: context => menuContext = context,
			rebind: this.rebind,
			parentId: id,
			data: {},
		};

		switch (item.id) {
			case 'align': {
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: viewRelation?.align,
					restricted: [ I.BlockHAlign.Justify ],
					onSelect: (align: I.BlockHAlign) => {
						this.saveViewRelation('align', align);
						close();
					}
				});
				break;
			};

			case 'calculate': {
				const save = (id: any) => {
					id = Number(id) || 0;

					this.saveViewRelation('formulaType', id);
					analytics.event('ChangeGridFormula', { type: id, format: relation.format, objectType: object.type });
				};

				menuId = 'select';
				menuParam.subIds = [ 'select2' ];
				menuParam.data = Object.assign(menuParam.data, {
					options: U.Menu.getFormulaSections(relation.relationKey),
					onOver: (e: any, item: any) => {
						if (!item.arrow) {
							S.Menu.closeAll([ 'select2' ]);
							return;
						};

						const options = Relation.formulaByType(relation.relationKey, relation.format).filter(it => it.section == item.id);

						S.Menu.closeAll([ 'select2' ], () => {
							S.Menu.open('select2', {
								component: 'select',
								element: `#${menuContext.getId()} #item-${item.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								rebind: menuContext.ref?.rebind,
								parentId: menuContext.props.id,
								data: {
									rootId,
									options,
									onSelect: (e: any, item: any) => {
										save(item.id);
										menuContext.close();
									},
								}
							});
						});
					},
					onSelect: (e: any, item: any) => {
						save(item.id);
					},
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, loadData, unlinkCommand } = data;
		const view = getView();
		const relation = this.getRelation();

		if (!relation) {
			return;
		};

		const object = S.Detail.get(rootId, rootId);
		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const idx = view.relations.findIndex(it => it && (it.relationKey == relation.relationKey));

		let close = true;

		switch (item.id) {
			case 'open': {
				U.Object.openConfig(relation);
				break;
			};

			case 'copy': {
				this.add({ 
					name: relation.name, 
					relationFormat: relation.format,
					relationFormatObjectTypes: relation.objectTypes || [],
					_index_: idx,
				});
				break;
			};

			case 'unlink': {
				if (unlinkCommand) {
					unlinkCommand(rootId, blockId, relation, () => this.props.close());
				} else {
					C.BlockDataviewRelationDelete(rootId, blockId, [ relation.relationKey ], () => this.props.close());
				};
				break;
			};

			case 'remove': {
				Action.archive([ relation.id ], '', () => {
					C.BlockDataviewRelationDelete(rootId, blockId, [ relation.relationKey ], () => this.props.close());
				});
				break;
			};

			case 'filter': {
				const conditions = Relation.filterConditionsByType(relation.format);
				const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				const filter = {
					
					relationKey: relation.relationKey,
					condition: condition as I.FilterCondition,
					value: Relation.formatValue(relation, null, false),
				};

				C.BlockDataviewFilterAdd(rootId, blockId, view.id, filter, () => {
					S.Menu.open('dataviewFilterList', { 
						element: `#button-${blockId}-filter`,
						horizontal: I.MenuDirection.Center,
						offsetY: 10,
						onOpen: () => $(`#block-${blockId} .hoverArea`).addClass('active'),
						onClose: () => $(`#block-${blockId} .hoverArea`).removeClass('active'),
						data: {
							...data,
							view: observable.box(view),
						},
					});
				});
				break;
			};

			case 'sort0':
			case 'sort1': {
				C.BlockDataviewSortRemove(rootId, blockId, view.id, view.sorts.map(it => it.id), () => {
					C.BlockDataviewSortAdd(rootId, blockId, view.id, { 
						relationKey: relation.relationKey, 
						type: item.type,
					});
				});
				break;
			};

			case 'insert-left':
			case 'insert-right': {
				S.Menu.open('relationSuggest', { 
					element: `#${getId()} #item-${item.id}`,
					offsetX: getSize().width,
					vertical: I.MenuDirection.Center,
					noAnimation: true,
					data: {
						rootId,
						blockId,
						menuIdEdit: 'blockRelationEdit',
						filter: '',
						ref: 'dataview',
						skipKeys: relations.map(it => it.relationKey),
						addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
							const index = Math.max(0, idx + item.dir);

							const cb = (message: any) => {
								S.Menu.closeAll([ this.props.id, 'relationSuggest' ]);
								loadData(view.id, 0);

								if (onChange) {
									onChange(message);
								};
							};

							Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, index, cb);
						},
					}
				});

				close = false;
				break;
			};

			case 'hide': {
				this.saveViewRelation('isVisible', false);
				break;
			};
		};

		if (close) {
			this.props.close();
		};

	};

	onRelationType (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { id, param, getId } = this.props;
		const { data } = param;
		const relation = this.getViewRelation();
		
		if (relation || S.Menu.isAnimating(id)) {
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

		const { id, param, getSize } = this.props;
		const { data } = param;
		const { rootId } = data;

		if (this.isReadonly() || S.Menu.isAnimating(id)) {
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
			data: {
				rootId,
				nameAdd: translate('menuDataviewRelationEditAddObjectType'),
				nameCreate: translate('commonCreateObjectTypeWithName'),
				placeholderFocus: translate('menuDataviewRelationEditFilterObjectTypes'),
				canEdit: true,
				value: this.objectTypes, 
				types: [ S.Record.getTypeType()?.id ],
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

	menuOpen (id: string, options: I.MenuParam) {
		const { getSize, param } = this.props;
		const { classNameWrap } = param;

		options = Object.assign(options, {
			isSub: true,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			classNameWrap,
			rebind: this.rebind,
			parentId: this.props.id,
		});

		if (!S.Menu.isOpen(id)) {
			S.Menu.closeAll(J.Menu.relationEdit, () => {
				S.Menu.open(id, options);
			});
		};
	};

	menuClose () {
		S.Menu.closeAll(J.Menu.relationEdit);
	};

	onChangeTime (v: boolean) {
		this.saveViewRelation('includeTime', v);
	};

	onSubmit (e: any) {
		e.preventDefault();

		const node = $(this.node);
		const button = node.find('#button');

		if (button.hasClass('blank')) {
			return;
		};

		this.save();
		this.props.close();
	};

	onChange () {
		this.checkButton();
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, (pressed: string) => {
			this.onSubmit(e);
		});
	};

	checkButton () {
		const node = $(this.node);
		const name = this.ref ? this.ref.getValue() : '';
		const button = node.find('#button');
		const canSave = name.length && (this.format !== null) && !this.isReadonly();

		button.removeClass('black blank').addClass(canSave ? 'black' : 'blank');
	};

	isAllowed () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = this.getRelation();

		let ret = relation ? S.Block.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]) : true;
		if (ret) {
			ret = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.Relation ]);
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

	saveViewRelation (k: string, v: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const relation = this.getViewRelation();
		const view = getView();

		if (view && relation) {
			C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relation.relationKey, { ...relation, [k]: v });
		};
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
		const { rootId, blockId, addCommand, onChange, ref } = data;
		const object = S.Detail.get(rootId, rootId);

		C.ObjectCreateRelation(item, S.Common.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			S.Detail.update(J.Constant.subId.relation, { id: details.id, details }, false);

			if (addCommand) {
				addCommand(rootId, blockId, { ...details, _index_: item._index_ }, onChange);
			};

			Preview.toastShow({ text: U.Common.sprintf(translate('menuDataviewRelationEditToastOnCreate'), details.name) });
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

	getViewRelation (): I.ViewRelation {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const relation = this.getRelation();

		if (!getView) {
			return null;
		};

		return relation ? getView()?.getRelation(relation.relationKey) : null;
	};

});

export default MenuRelationEdit;
