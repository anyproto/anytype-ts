import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, UtilData, UtilCommon, UtilObject, Relation, analytics, keyboard, translate } from 'Lib';
import { commonStore, blockStore, detailStore, dbStore, menuStore } from 'Store';
import Item from 'Component/menu/item/relationView';

const PREFIX = 'menuBlockRelationView';

const MenuBlockRelationView = observer(class MenuBlockRelationView extends React.Component<I.Menu> {

	node: any = null;
	cellRefs: Map<string, any> = new Map();

	constructor (props: I.Menu) {
		super(props);

		this.scrollTo = this.scrollTo.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onFav = this.onFav.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { rootId } = data;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const sections = this.getSections();
		const isLocked = root.isLocked();
		const readonly = data.readonly || isLocked;

		let allowedBlock = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		let allowedRelation = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		let allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		if (readonly) {
			allowedBlock = false;
			allowedRelation = false;
			allowedValue = false;
		};

		const Section = (section: any) => (
			<div id={`section-${section.id}`} className="section">
				<div className="name">
					{section.name}
				</div>
				<div className="items">
					{section.children.map((item: any, i: number) => {
						const id = Relation.cellId(PREFIX, item.relationKey, '');
						return (
							<Item 
								key={id} 
								{...this.props}
								{...item}
								rootId={rootId}
								block={root}
								onEdit={this.onEdit}
								onRef={(id: string, ref: any) => this.cellRefs.set(id, ref)}
								onFav={this.onFav}
								readonly={!(allowedValue && !item.isReadonlyValue && !readonly)}
								canEdit={allowedRelation && !item.isReadonlyRelation}
								canDrag={allowedBlock}
								canFav={allowedValue}
								isFeatured={section.id == 'featured'}
								classNameWrap={classNameWrap}
								onCellClick={this.onCellClick}
								onCellChange={this.onCellChange}
							/>
						);
					})}
				</div>
			</div>
		);

		const ItemAdd = () => (
			<div id="item-add" className="item add" onClick={this.onAdd}>
				<div className="line" />
				<div className="info">
					<Icon className="plus" />
					<div className="name">{translate('commonNew')}</div>
				</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="sections"
			>
				<div id="scrollWrap" className="scrollWrap">
					{sections.map((item: any, i: number) => (
						<Section key={i} {...item} index={i} />
					))}
				</div>
				{!readonly && allowedRelation ? <ItemAdd /> : ''}
			</div>
		);
	};

	componentDidMount () {
		const node = $(this.node);
		const scrollWrap = node.find('#scrollWrap');

		this.resize();
		this.selectionPrevent(true);

		scrollWrap.off('scroll').on('scroll', () => this.onScroll());
	};

	componentDidUpdate () {
		this.resize();

		const id = commonStore.cellId;		
		if (id) {
			commonStore.cellId = '';
			
			const ref = this.cellRefs.get(id);
			if (ref) {
				ref.onClick($.Event('click'));
			};
		};
	};

	componentWillUnmount () {
		this.selectionPrevent(false);
	};

	selectionPrevent (v: boolean) {
		keyboard.disableSelection(v);
	};

	onScroll () {
		menuStore.resizeAll();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { config } = commonStore;

		const object = detailStore.get(rootId, rootId);
		const isTemplate = UtilObject.isTemplate(object.type);
		const type = dbStore.getTypeById(isTemplate ? object.targetObjectType : object.type);
		const featured = Relation.getArrayValue(object.featuredRelations);
		const relations = dbStore.getObjectRelations(rootId, rootId);
		const relationKeys = relations.map(it => it.relationKey);
		const readonly = this.isReadonly();
		const typeRelations = (type ? type.recommendedRelations || [] : []).map(it => ({ 
			...dbStore.getRelationById(it), 
			scope: I.RelationScope.Type,
		})).filter(it => it && it.relationKey && !relationKeys.includes(it.relationKey));

		let items = relations.map(it => ({ ...it, scope: I.RelationScope.Object }));
		items = items.concat(typeRelations);
		items = items.sort(UtilData.sortByName).sort(UtilData.sortByHidden).filter((it: any) => {
			if (!it) {
				return false;
			};

			if ((readonly || it.isReadonlyValue) && Relation.isEmpty(object[it.relationKey]) && (it.scope === I.RelationScope.Type)) {
				return false;
			};

			return !config.debug.hiddenObject ? !it.isHidden : true;
		});

		const sections = [ 
			{ 
				id: 'featured', name: translate('menuBlockRelationViewFeaturedRelations'),
				children: items.filter(it => featured.includes(it.relationKey)),
			},
			{ 
				id: 'object', name: translate('menuBlockRelationViewInThisObject'),
				children: items.filter(it => !featured.includes(it.relationKey) && (it.scope == I.RelationScope.Object)),
			},
		];

		if (type) {
			sections.push({ 
				id: 'type', name: UtilCommon.sprintf(translate('menuBlockRelationViewFromType'), type.name),
				children: items.filter(it => !featured.includes(it.relationKey) && (it.scope == I.RelationScope.Type)),
			});
		};

		return sections.filter(it => it.children.length);
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onFav (e: any, relationKey: string) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const items = this.getItems();
		const object = detailStore.get(rootId, rootId, [ 'featuredRelations' ], true);
		const featured = UtilCommon.objectCopy(object.featuredRelations || []);
		const idx = featured.findIndex(it => it == relationKey);

		if (idx < 0) {
			const item = items.find(it => it.relationKey == relationKey);
			const cb = () => {
				C.ObjectRelationAddFeatured(rootId, [ relationKey ], () => analytics.event('FeatureRelation'));
			};

			if (item.scope == I.RelationScope.Type) {
				C.ObjectRelationAdd(rootId, [ relationKey ], cb);
			} else {
				cb();
			};
		} else {
			C.ObjectRelationRemoveFeatured(rootId, [ relationKey ], () => analytics.event('UnfeatureRelation'));
		};
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId } = data;

		menuStore.open('relationSuggest', { 
			element: `#${getId()} #item-add .info`,
			classNameWrap: classNameWrap,
			offsetY: -8,
			vertical: I.MenuDirection.Top,
			data: {
				...data,
				filter: '',
				ref: 'menu',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: dbStore.getObjectRelationKeys(rootId, rootId),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					C.ObjectRelationAdd(rootId, [ relation.relationKey ], onChange);
				},
			}
		});
	};

	onEdit (e: any, item: any) {
		const { param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, readonly } = data;
		const relation = dbStore.getRelationById(item.id);

		if (!relation) {
			return;
		};

		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const root = blockStore.getLeaf(rootId, rootId);
		const element = `#${getId()} #item-${item.id} .info`;

		menuStore.open('blockRelationEdit', { 
			element,
			horizontal: I.MenuDirection.Center,
			classNameWrap,
			onOpen: () => $(element).addClass('active'),
			onClose: () => $(element).removeClass('active'),
			data: {
				...data,
				readonly: Boolean(readonly || root?.isLocked() || !allowed),
				noDelete: (item.scope == I.RelationScope.Type),
				relationId: item.id,
				ref: 'menu',
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					C.ObjectRelationAdd(rootId, [ relation.relationKey ], onChange);
				},
				deleteCommand: () => {
					C.ObjectRelationDelete(rootId, [ relation.relationKey ]);
				},
			}
		});
	};

	onCellClick (e: any, relationKey: string) {
		const { param } = this.props;
		const { data } = param;
		const { readonly, rootId } = data;
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || readonly || relation.isReadonlyValue) {
			return;
		};

		const id = Relation.cellId(PREFIX, relationKey, rootId);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relation = dbStore.getRelationByKey(relationKey);

		C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value: Relation.formatValue(relation, value, true) } ], callBack);

		analytics.changeRelationValue(relation, value, 'menu');
	};

	scrollTo (relationKey: string) {
		const { getId } = this.props;
		const id = Relation.cellId(PREFIX, relationKey, '');
		const obj = $(`#${getId()}`);
		const container = obj.find('.content');
		const cell = obj.find(`#${id}`);

		if (!container.length || !cell.length) {
			return;
		};

		const y = Math.max(0, cell.offset().top - container.offset().top);
		container.scrollTop(y);
	};

	isReadonly (): boolean {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readonly } = data;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return false;
		};

		const allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		return Boolean(readonly || root.isLocked() || !allowedValue);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const obj = $(`#${getId()} .content`);
		const container = UtilCommon.getScrollContainer(isPopup);
		const offset = isPopup ? 16 : 120;
		const min = isPopup ? 480 : 640;
		const maxOffset = isPopup ? 16 : 80;

		obj.css({ 
			height: container.height() - UtilCommon.sizeHeader() - maxOffset,
			width: Math.max(min, container.width() / 2 - offset),
		});

		position();
	};

});

export default MenuBlockRelationView;
