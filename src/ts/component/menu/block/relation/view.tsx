import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, Relation, analytics } from 'ts/lib';
import { commonStore, blockStore, detailStore, dbStore, menuStore } from 'ts/store';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';

import Item from 'ts/component/menu/item/relationView';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const PREFIX = 'menuBlockRelationView';

const MenuBlockRelationView = observer(class MenuBlockRelationView extends React.Component<Props, {}> {

	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super(props);

		this.scrollTo = this.scrollTo.bind(this);
		this.onFav = this.onFav.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.optionCommand = this.optionCommand.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, readonly } = data;
		const sections = this.getSections();
		const root = blockStore.getLeaf(rootId, rootId);
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ]);

		if (!root) {
			return null;
		};

		let allowedBlock = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		let allowedRelation = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		let allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		if (root.isLocked()) {
			allowedBlock = false;
			allowedRelation = false;
			allowedValue = false;
		};

		const Section = (section: any) => (
			<div id={'section-' + section.id} className="section">
				<div className="name">
					{section.name}
				</div>
				<div className="items">
					{section.children.map((item: any, i: number) => {
						const id = Relation.cellId(PREFIX, item.relationKey, '0');
						
						let canFav = allowedValue;
						if (([ I.ObjectLayout.Set ].indexOf(object.layout) >= 0) && (item.relationKey == Constant.relationKey.description)) {
							canFav = false;
						};

						return (
							<Item 
								key={id} 
								{...this.props}
								{...item}
								rootId={rootId}
								block={root}
								onEdit={this.onEdit}
								onRef={(id: string, ref: any) => { this.cellRefs.set(id, ref); }}
								onFav={this.onFav}
								readonly={!(allowedValue && !item.isReadonlyValue)}
								canEdit={allowedRelation && !item.isReadonlyRelation}
								canDrag={allowedBlock}
								canFav={canFav}
								isFeatured={section.id == 'featured'}
								classNameWrap={classNameWrap}
								onCellClick={this.onCellClick}
								onCellChange={this.onCellChange}
								optionCommand={this.optionCommand}
							/>
						);
					})}
				</div>
			</div>
		);

		const ItemAdd = (item: any) => (
			<div id="item-add" className="item add" onClick={(e: any) => { this.onAdd(e); }}>
				<div className="line" />
				<div className="info">
					<Icon className="plus" />
					<div className="name">New</div>
				</div>
			</div>
		);

		return (
			<div className="sections">
				<div id="scrollWrap" className="scrollWrap">
					{sections.map((item: any, i: number) => {
						return <Section key={i} {...item} index={i} />;
					})}
				</div>
				{!readonly ? <ItemAdd /> : ''}
			</div>
		);
	};

	componentDidMount () {
		const node = $(ReactDOM.findDOMNode(this));
		const scrollWrap = node.find('#scrollWrap');

		this.resize();
		scrollWrap.unbind('scroll').on('scroll', (e: any) => { this.onScroll(); });

		this.selectionPrevent(true);
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
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(v);
		};
	};

	onScroll () {
		const win = $(window);
		const { list } = menuStore;

		for (let menu of list) {
			win.trigger('resize.' + Util.toCamelCase('menu-' + menu.id));
		};
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ]);
		
		let items = Util.objectCopy(dbStore.getRelations(rootId, rootId)).sort(DataUtil.sortByHidden);
		let featured = object[Constant.relationKey.featured] || [];
		let sections = [ 
			{ 
				id: 'featured', name: 'Featured relations', 
				children: items.filter((it: any) => { return featured.indexOf(it.relationKey) >= 0; }),
			},
			{ 
				id: 'object', name: 'In this object', 
				children: items.filter((it: any) => { return (it.scope == I.RelationScope.Object) && (featured.indexOf(it.relationKey) < 0); }),
			},
			{ 
				id: 'type', name: 'Type', 
				children: items.filter((it: any) => { return (it.scope == I.RelationScope.Type) && (featured.indexOf(it.relationKey) < 0); }),
			},
			{ 
				id: 'setType', name: 'Suggested', 
				children: items.filter((it: any) => { return (it.scope == I.RelationScope.SetOfTheSameType) && (featured.indexOf(it.relationKey) < 0); }),
			},
			{ 
				id: 'objectType', name: 'Objects of the same type', 
				children: items.filter((it: any) => { return (it.scope == I.RelationScope.ObjectsOfTheSameType) && (featured.indexOf(it.relationKey) < 0); }),
			},
			{ 
				id: 'library', name: 'Library', 
				children: items.filter((it: any) => { return (it.scope == I.RelationScope.Library) && (featured.indexOf(it.relationKey) < 0); }),
			},
		];

		sections = sections.filter((it: any) => { return it.children.length; });
		return sections;
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onFav (e: any, relationKey: string) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ], true);
		const featured = Util.objectCopy(object[Constant.relationKey.featured] || []);
		const idx = featured.findIndex((it: string) => { return it == relationKey; });

		if (idx < 0) {
			C.ObjectRelationAddFeatured(rootId, [ relationKey ], () => {
				analytics.event('FeatureRelation');
			});
		} else {
			C.ObjectRelationRemoveFeatured(rootId, [ relationKey ], () => {
				analytics.event('UnfeatureRelation');
			});
		};
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId } = data;
		const relations = dbStore.getRelations(rootId, rootId);

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
				skipIds: relations.map(it => it.relationKey),
				addCommand: (rootId: string, blockId: string, relationId: string) => {
					C.ObjectRelationAdd(rootId, [ relationId ], () => { 
						menuStore.close('relationSuggest'); 
					});
				},
			}
		});
	};

	onEdit (e: any, id: string) {
		const { param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId } = data;
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);

		if (!allowed) {
			return;
		};
		
		menuStore.open('blockRelationEdit', { 
			element: `#${getId()} #item-${id}`,
			horizontal: I.MenuDirection.Center,
			classNameWrap: classNameWrap,
			data: {
				...data,
				relationId: id,
				addCommand: (rootId: string, blockId: string, relation: any, onChange?: (relation: any) => void) => {
					C.ObjectRelationAdd(rootId, [ relation.id ], () => {
						if (onChange) {
							onChange(relation);
						};
					});
				},
				deleteCommand: () => {
					C.ObjectRelationDelete(rootId, id);
				},
			}
		});
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readonly } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || readonly || relation.isReadonlyValue) {
			return;
		};

		const id = Relation.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	scrollTo (relationKey: string, index: number) {
		const { getId } = this.props;
		const id = Relation.cellId(PREFIX, relationKey, index);
		const obj = $(`#${getId()}`);
		const container = obj.find('.content');
		const cell = obj.find(`#${id}`);
		
		if (!container.length || !cell.length) {
			return;
		};

		const y = Math.max(0, cell.offset().top - container.offset().top);
		container.scrollTop(y);
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: Relation.formatValue(relation, value, true) },
		];
		C.ObjectSetDetails(rootId, details, callBack);

		const key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';	
		analytics.event(key, { type: 'menu' });
	};

	optionCommand (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void) {
		switch (code) {
			case 'add':
				C.ObjectRelationOptionAdd(rootId, relationKey, option, callBack);
				break;

			case 'update':
				C.ObjectRelationOptionUpdate(rootId, relationKey, option, callBack);
				break;

			case 'delete':
				C.ObjectRelationOptionDelete(rootId, relationKey, option.id, callBack);
				break;
		};
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const obj = $(`#${getId()} .content`);
		const container = Util.getScrollContainer(isPopup);
		const offset = isPopup ? 16 : 120;
		const min = isPopup ? 480 : 640;

		obj.css({ 
			height: container.height() - Util.sizeHeader() - 16,
			width: Math.max(min, container.width() / 2 - offset),
		});

		position();
	};

});

export default MenuBlockRelationView;