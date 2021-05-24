import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Icon } from 'ts/component';
import { commonStore, blockStore, detailStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { trace } from 'mobx';
import 'react-virtualized/styles.css';

import Item from 'ts/component/menu/item/relationView';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const PREFIX = 'menuBlockRelationView';

@observer
class MenuBlockRelationView extends React.Component<Props, {}> {

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
		const { data } = param;
		const { rootId, readOnly } = data;
		const sections = this.getSections();
		const block = blockStore.getLeaf(rootId, rootId);

		const Section = (section: any) => (
			<div id={'section-' + section.id} className="section">
				<div className="name">
					{section.name}
				</div>
				<div className="items">
					{section.children.map((item: any, i: number) => {
						const id = DataUtil.cellId(PREFIX, item.relationKey, '0');
						item.isFeatured = section.id == 'featured';

						return (
							<Item 
								key={id} 
								{...item}
								rootId={rootId}
								block={block}
								onEdit={this.onEdit}
								onRef={(id: string, ref: any) => { this.cellRefs.set(id, ref); }}
								onFav={this.onFav}
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
			<div id="item-add" className="item sides add" onClick={(e: any) => { this.onAdd(e); }}>
				<div className="info">
					<Icon className="plus" />
					<div className="name">New</div>
				</div>
			</div>
		);

		return (
			<div className="sections">
				{sections.map((item: any, i: number) => {
					return <Section key={i} {...item} index={i} />;
				})}
				{!readOnly ? <ItemAdd /> : ''}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		$('body').addClass('over');
	};

	componentDidUpdate () {
		this.resize();
		
		if (commonStore.cellId) {
			$(`#${commonStore.cellId}`).addClass('isEditing');
		};
	};

	componentWillUnmount () {
		$('body').removeClass('over');
	};

	getSections () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ]);
		
		let items = Util.objectCopy(dbStore.getRelations(rootId, rootId));
		let featured = object[Constant.relationKey.featured] || [];

		if (!config.debug.ho) {
			items = items.filter((it: any) => { return !it.isHidden; });
		};
		items.sort(DataUtil.sortByHidden);

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
				id: 'setType', name: 'Set of the same type', 
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
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.featured ]);

		let featured = Util.objectCopy(object[Constant.relationKey.featured] || []);
		let idx = featured.findIndex((it: string) => { return it == relationKey; });

		if (idx >= 0) {
			featured = featured.filter((it: any) => { return it != relationKey; });
		} else {
			featured.push(relationKey);
		};

		const details = [ 
			{ key: Constant.relationKey.featured, value: featured },
		];
		C.BlockSetDetails(rootId, details);
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relations = dbStore.getRelations(rootId, rootId);

		menuStore.open('relationSuggest', { 
			element: `#${getId()} #item-add .info`,
			offsetX: 32,
			data: {
				...data,
				filter: '',
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationAdd(rootId, relation, () => { menuStore.close('relationSuggest'); });
				},
			}
		});
	};

	onEdit (e: any, relationKey: string) {
		const { param, getId } = this.props;
		const { data } = param;
		
		menuStore.open('blockRelationEdit', { 
			element: `#${getId()} #item-${relationKey}`,
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				relationKey: relationKey,
				updateCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationUpdate(rootId, relation);
				},
			}
		});
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readOnly } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || readOnly || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	scrollTo (relationKey: string, index: number) {
		const { getId } = this.props;
		const id = DataUtil.cellId(PREFIX, relationKey, index);
		const obj = $(`#${getId()}`);
		const container = obj.find('.content');
		const cell = obj.find(`#${id}`);
		const y = Math.max(0, cell.offset().top - container.offset().top);

		container.scrollTop(y);
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value, true) },
		];
		C.BlockSetDetails(rootId, details, callBack);
	};

	optionCommand (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) {
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
		const { getId, position } = this.props;
		const obj = $('#' + getId() + ' .content');
		const sections = obj.find('.sections');
		const win = $(window);
		const height = Math.max(92, Math.min(win.height() - 56, sections.outerHeight() + 48));

		obj.css({ height: height });
		position();
	};

};

export default MenuBlockRelationView;