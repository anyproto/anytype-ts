import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Icon, Cell } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const PREFIX = 'menuBlockRelationViewCell';

@observer
class MenuBlockRelationView extends React.Component<Props, {}> {

	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super(props);

		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.optionCommand = this.optionCommand.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readOnly } = data;
		const block = blockStore.getLeaf(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const sections = this.getSections();

		const Section = (section: any) => (
			<div id={'section-' + section.id} className="section">
				<div className="name">
					{section.name}
				</div>
				<div className="items">
					{section.children.map((item: any, i: number) => {
						if (section.id == 'featured') {
							item.isFeatured = true;
						};
						return <Item key={i} {...item} />;
					})}
					{!readOnly && (section.index == sections.length - 1) ? <ItemAdd /> : ''}
				</div>
			</div>
		);

		const ItemAdd = (item: any) => (
			<div id="item-add" className="item sides add" onClick={(e: any) => { this.onAdd(e); }}>
				<div className="info">
					<Icon className="plus" />
					<div className="name">New</div>
				</div>
				<div className="cell" />
			</div>
		);

		const Item = (item: any) => {
			const id = DataUtil.cellId(PREFIX, item.relationKey, '0');
			const fcn = [ 'fav', (item.isFeatured ? 'active' : '') ];

			if (Constant.featuredRelations.indexOf(item.relationKey) >= 0) {
				fcn.push('disabled');
			};

			return (
				<div className={[ 'item', 'sides', (item.isHidden ? 'isHidden' : '') ].join(' ')}>
					<div id={`item-${item.relationKey}`} className="info" onClick={(e: any) => { this.onEdit(e, item.relationKey); }}>
						<Icon className={'relation ' + DataUtil.relationClass(item.format)} />
						{item.name}
					</div>
					<div
						id={id} 
						className={[ 'cell', DataUtil.relationClass(item.format), 'canEdit' ].join(' ')} 
						onClick={(e: any) => { this.onCellClick(e, item.relationKey, 0); }}
					>
						<Cell 
							ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
							rootId={rootId}
							storeId={rootId}
							block={block}
							relationKey={item.relationKey}
							getRecord={() => { return details; }}
							viewType={I.ViewType.Grid}
							index={0}
							idPrefix={PREFIX}
							menuClassName="fromBlock"
							scrollContainer={Util.getEditorScrollContainer('menuBlockRelationView')}
							pageContainer={Util.getEditorPageContainer('menuBlockRelationView')}
							readOnly={false}
							onCellChange={this.onCellChange}
							optionCommand={this.optionCommand}
						/>
					</div>
					<Icon className={fcn.join(' ')} onClick={(e: any) => { this.onFav(e, item); }} />
				</div>
			);
		};

		return (
			<div className="sections">
				{sections.map((item: any, i: number) => {
					return <Section key={i} {...item} index={i} />;
				})}
			</div>
		);
	};

	componentDidMount () {
		this.resize();

		$('body').addClass('over');
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		$('body').removeClass('over');
	};

	getSections () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = blockStore.getDetails(rootId, rootId);
		
		let items = Util.objectCopy(dbStore.getRelations(rootId, rootId));
		let featured = Constant.featuredRelations.concat(object.featuredRelations);

		if (!config.debug.ho) {
			items = items.filter((it: any) => { return !it.isHidden; });
		};

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

	onFav (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = blockStore.getDetails(rootId, rootId);

		let featured = Util.objectCopy(object.featuredRelations);
		let idx = featured.findIndex((it: string) => { return it == item.relationKey; });

		if (idx >= 0) {
			featured = featured.filter((it: any) => { return it != item.relationKey; });
		} else {
			featured.push(item.relationKey);
		};

		const details = [ 
			{ key: 'featuredRelations', value: featured },
		];

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details);

	};

	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relations = dbStore.getRelations(rootId, rootId);

		commonStore.menuOpen('relationSuggest', { 
			type: I.MenuType.Vertical,
			element: $(e.currentTarget),
			offsetX: 32,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				...data,
				filter: '',
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationAdd(rootId, relation, () => { commonStore.menuClose('relationSuggest'); });
				},
			}
		});
	};

	onEdit (e: any, relationKey: string) {
		const { param, getId } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('blockRelationEdit', { 
			type: I.MenuType.Vertical,
			element: `#${getId()} #item-${relationKey}`,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
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

	onCellChange (id: string, relationKey: string, value: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value) },
		]

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details);
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