import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { I, C, UtilObject, UtilMenu, Relation, translate, Dataview, keyboard, analytics, Preview, UtilData, UtilCommon } from 'Lib';
import { Icon, Input, MenuItemVertical, Button } from 'Component';
import { blockStore, dbStore, menuStore, detailStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

const MenuRelationEdit = observer(class MenuRelationEdit extends React.Component<I.Menu> {

	node: any = null;
	format: I.RelationType = null;
	objectTypes: string[] = [];
	ref = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onRelationType = this.onRelationType.bind(this);
		this.onObjectType = this.onObjectType.bind(this);
		this.onDateSettings = this.onDateSettings.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
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

		if (isObject && !isReadonly && (!relation || !relation.isReadonlyValue)) {
			const length = this.objectTypes.length;
			const typeId = length ? this.objectTypes[0] : '';
			const type = dbStore.getTypeById(typeId);
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
						withSwitch={true}
						switchValue={viewRelation?.includeTime}
						onSwitch={(e: any, v: boolean) => { this.onChangeTime(v); }}
					/>

					<MenuItemVertical 
						id="date-settings" 
						icon="settings" 
						name={translate('commonPreferences')}
						arrow={true} 
						onMouseEnter={this.onDateSettings} 
						onClick={this.onDateSettings} 
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
					<div className="name">{translate('menuDataviewRelationEditRelationType')}</div>
					<MenuItemVertical 
						id="relation-type" 
						icon={this.format === null ? undefined : 'relation ' + Relation.className(this.format)} 
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
								onMouseEnter={this.menuClose} 
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
			this.objectTypes = relation.objectTypes;
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
		const { rootId, blockId, extendedOptions, readonly } = data;
		const relation = this.getRelation();
		const isFile = relation && (relation.format == I.RelationType.File);
		const canFilter = !isFile;
		const canSort = !isFile;
		const canHide = relation && (relation.relationKey != 'name');

		let canDuplicate = true;
		let canDelete = true;

		if (relation) {
			canDuplicate = canDelete = relation && blockStore.checkFlags(rootId, blockId, [ I.RestrictionObject.Relation ]);
		};
		if (relation && Relation.isSystem(relation.relationKey)) {
			canDelete = false;
		};
		if (readonly) {
			canDuplicate = false;
			canDelete = false
		};

		let sections: any[] = [
			{
				children: [
					relation ? { id: 'open', icon: 'expand', name: translate('commonOpenObject') } : null,
					canDuplicate ? { id: 'copy', icon: 'copy', name: translate('commonDuplicate') } : null,
					canDelete ? { id: 'remove', icon: 'remove', name: translate('commonDelete') } : null,
				]
			}
		];

		if (extendedOptions && !readonly) {
			sections.push({
				children: [
					canFilter ? { id: 'filter', icon: 'relation-filter', name: translate('menuDataviewRelationEditAddFilter') } : null,
					canSort ? { id: 'sort0', icon: 'relation-sort0', name: translate('menuDataviewRelationEditSortAscending'), type: I.SortType.Asc } : null,
					canSort ? { id: 'sort1', icon: 'relation-sort1', name: translate('menuDataviewRelationEditSortDescending'), type: I.SortType.Desc } : null,
					{ id: 'insert-left', icon: 'relation-insert-left', name: translate('menuDataviewRelationEditInsertLeft'), dir: -1 },
					{ id: 'insert-right', icon: 'relation-insert-right', name: translate('menuDataviewRelationEditInsertRight'), dir: 1 },
					canHide ? { id: 'hide', icon: 'relation-hide', name: translate('menuDataviewRelationEditHideRelation') } : null,
				]
			});
		};

		sections = sections.filter((s: any) => {
			s.children = s.children.filter(c => c);
			return s.children.length > 0;
		});

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

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, loadData } = data;
		const view = getView();
		const relation = this.getRelation();

		if (!relation) {
			return;
		};

		const relations = Dataview.viewGetRelations(rootId, blockId, view);
		const idx = view.relations.findIndex(it => it && (it.relationKey == relation.relationKey));

		let close = true;

		switch (item.id) {
			case 'open': {
				UtilObject.openPopup(relation);
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

			case 'remove': {
				C.BlockDataviewRelationDelete(rootId, blockId, [ relation.relationKey ]);
				break;
			};

			case 'filter': {
				const conditions = Relation.filterConditionsByType(relation.format);
				const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				const filter = {
					operator: I.FilterOperator.And, 
					relationKey: relation.relationKey,
					condition: condition as I.FilterCondition,
					value: Relation.formatValue(relation, null, false),
				};

				C.BlockDataviewFilterAdd(rootId, blockId, view.id, filter, () => {
					menuStore.open('dataviewFilterList', { 
						element: `#button-dataview-filter`,
						horizontal: I.MenuDirection.Center,
						offsetY: 10,
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
				menuStore.open('relationSuggest', { 
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
							Dataview.relationAdd(rootId, blockId, relation.relationKey, Math.max(0, idx + item.dir), view, (message: any) => {
								menuStore.closeAll([ this.props.id, 'relationSuggest' ]);
								loadData(view.id, 0);

								if (onChange) {
									onChange(message);
								};
							});
						},
					}
				});

				close = false;
				break;
			};

			case 'hide': {
				C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relation.relationKey, {
					...view.getRelation(relation.relationKey),
					isVisible: false,
				});
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
		const { rootId } = data;

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
			data: {
				rootId,
				nameAdd: translate('menuDataviewRelationEditAddObjectType'),
				placeholderFocus: translate('menuDataviewRelationEditFilterObjectTypes'),
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

		this.menuOpen('dataviewDate', { 
			element: `#${getId()} #item-date-settings`,
			onClose: () => {
				menuStore.close('select');
			},
			data: {
				...data,
				relationKey: relation.relationKey,
			}
		});
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

	onChangeTime (v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const relation = this.getViewRelation();

		C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, relation.relationKey, { ...relation, includeTime: v });
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

		let ret = relation ? blockStore.isAllowed(relation.restrictions, [ I.RestrictionObject.Details ]) : true;
		if (ret) {
			ret = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.Relation ]);
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

	save () {
		const name = this.ref ? this.ref.getValue() : '';
		if (!name) {
			return;
		};

		const relation = this.getViewRelation();
		const item: any = { 
			name, 
			relationFormat: this.format,
			relationFormatObjectTypes: (this.format == I.RelationType.Object) ? this.objectTypes || [] : [],
		};

		relation ? this.update(item) : this.add(item);
	};

	add (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, addCommand, onChange, ref } = data;
		const object = detailStore.get(rootId, rootId);

		C.ObjectCreateRelation(item, commonStore.space, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			
			data.relationId = details.id;
			detailStore.update(Constant.subId.relation, { id: details.id, details }, false);

			if (addCommand) {
				addCommand(rootId, blockId, { ...details, _index_: item._index_ }, onChange);
			};

			Preview.toastShow({ text: UtilCommon.sprintf(translate('menuDataviewRelationEditToastOnCreate'), details.name) });
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
		const { relationId } = data;

		return dbStore.getRelationById(relationId);
	};

	getViewRelation (): I.ViewRelation {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const relation = this.getRelation();

		return relation ? getView()?.getRelation(relation.relationKey) : null;
	};

});

export default MenuRelationEdit;
