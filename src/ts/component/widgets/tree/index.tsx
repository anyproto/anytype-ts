// Third Party
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

// Data Layer
import { blockStore, dbStore, detailStore, menuStore } from 'Store';

// Libraries
import { I, C, DataUtil, Util, keyboard, Storage, Relation, analytics } from 'Lib';

// UI Components
import { Loader } from 'Component';
import Node from './node';

// Models
import { TreeChild, TreeNode, TreeSection } from './model';

interface Props {
	dataset?: any;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const sha1 = require('sha1');

const MAX_DEPTH = 15; // Maximum depth of the tree
const LIMIT = 20; // Number of items to load at a time
const HEIGHT = 28; // Height of each row
const SKIP_TYPES_LOAD = [
	Constant.typeId.space,
]; // Types of objects to skip loading

const Tree = observer(class Tree extends React.Component<Props, State> {
	private _isMounted: boolean = false;
	state = {
		loading: false,
	};
	scrollTop: number = 0;
	id: string = '';
	cache: CellMeasurerCache = {};
	subId: string = '';
	subscriptionIds: { [ key: string ]: string } = {};
	branches: string[] = [];
	refList: React.Ref<HTMLElement> = null;

	static sections: TreeSection[] =
	[
		{ id: I.TabIndex.Favorite, name: 'Favorites', limit: 0, isSection: true, depth: 0, numChildren: 0, isOpen: true, withPadding: false},
		{ id: I.TabIndex.Recent, name: 'Recent', limit: 10, isSection: true, depth: 0, numChildren: 0, isOpen: true, withPadding: false  },
		{ id: I.TabIndex.Set, name: 'Sets', limit: 0, isSection: true, depth: 0, numChildren: 0, isOpen: true, withPadding: false  },
	];

	static getSection (sectionId: I.TabIndex): TreeSection {
		return Tree.sections.find(section => section.id === sectionId);
	};

	constructor (props: Props) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onContext = this.onContext.bind(this);		
		this.getRowHeight = this.getRowHeight.bind(this)
	};

	render () {
		const { loading } = this.state;
		const nodes = this.getNodes();

		const rowRenderer = ({ index, key, parent, style }) => {
			const node: TreeNode = nodes[index];
			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
					hasFixedWidth={() => {}}
				>
					<Node 
						{...node}
						index={index}
						treeId={this.getTreeId(node)}
						style={style}
						onClick={this.onClick} 
						onToggle={this.onToggle} 
						onContext={this.onContext}
					/>
				</CellMeasurer>
			);
		};

		return (
			<div id="body" className="body">
				{loading ? (
					<Loader />
				) : (
					<InfiniteLoader
						rowCount={nodes.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => { return true; }}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={(ref: React.Ref<HTMLUnknownElement>) => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={nodes.length}
										rowHeight={({ index }) => this.getRowHeight(nodes[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										onScroll={this.onScroll}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				)}
			</div>
		);
	};

	// Lifecycle Methods

	componentDidMount () {
		this._isMounted = true;
		this.loadSections();
	};

	componentDidUpdate () {
		const nodes = this.getNodes();

		this.restoreUIState();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (nodes[i] || {}).id; },
		});
	};

	componentWillUnmount () {
		this._isMounted = false;

		const subIds = Object.keys(this.subscriptionIds).map(id => dbStore.getSubId(Constant.subId.sidebar, id));
		if (subIds.length) {
			C.ObjectSearchUnsubscribe(subIds);
		};
		// Util.tooltipHide(true);
	};

	// Restores the scroll position and the keyboard focus
	restoreUIState () {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('#body');

		this.id = keyboard.getRootId();
		this.setActive(this.id);
		
		body.scrollTop(this.scrollTop);
	};

	loadSections (): void {
		const { root, profile } = blockStore;
		const { sections } = Tree;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [ '_anytype_profile', profile, root ] },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: SKIP_TYPES_LOAD },
		];

		let n = 0;
		let sorts: I.Sort[] = [];
		let sectionFilters: I.Filter[] = [];
		const cb = () => {
			n++;
			if (n == sections.length - 1) {
				this.setState({ loading: false });
			};
		};

		this.setState({ loading: true });

		sections.forEach((section) => {
			const subId = dbStore.getSubId(Constant.subId.sidebar, section.id);

			switch (section.id) {
				case I.TabIndex.Favorite:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes() },
						{ operator: I.FilterOperator.And, relationKey: 'isFavorite', condition: I.FilterCondition.Equal, value: true }
					];
					sorts = [];
					break;

				case I.TabIndex.Recent:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'lastOpenedDate', condition: I.FilterCondition.Greater, value: 0 }
					];
					sorts = [
						{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
					];
					break;

				case I.TabIndex.Set:
					sectionFilters = [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes() },
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set }
					];
					sorts = [
						{ relationKey: 'name', type: I.SortType.Asc },
					];
					break;

			};

			this.subscriptionIds[section.id] = '';
			DataUtil.searchSubscribe({
				subId,
				filters: filters.concat(sectionFilters),
				sorts,
				keys: Constant.sidebarRelationKeys,
				limit: section.limit,
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: true,
			}, cb);
		});
	};

	loadNodes (id: string, links: string[]): void {
		const hash = sha1(Util.arrayUnique(links).sort().join(''));
		const subId = dbStore.getSubId(Constant.subId.sidebar, id);

		if (this.subscriptionIds[id] && (this.subscriptionIds[id] == hash)) {
			return;
		};

		this.subscriptionIds[id] = hash;
		DataUtil.subscribeIds({
			subId, 
			ids: links, 
			keys: Constant.sidebarRelationKeys,
		});
	};

	filterDeletedLinks (ids: string[]): string[] {
		return ids.filter(id => !dbStore.getRecords(Constant.subId.deleted, '').includes(id));
	};

	getRecords (subId: string): any[] {
		return dbStore.getRecords(subId, "").map((id: string) => { 
			const object = detailStore.get(subId, id, [ 'id', 'type', 'links' ], true);
			let links = [];
			if (object.type !== Constant.typeId.set) {
				links = this.filterDeletedLinks(Relation.getArrayValue(object.links));
			};
			return { ...object, links };
		});
	};

	// Recursive function which returns the tree structure
	unwrap (sectionId: I.TabIndex, nodeList: TreeNode[], parentId: string, objects: { [key: string]: any }[], depth: number): TreeNode[] {
		if (!objects.length || (depth >= MAX_DEPTH)) {
			return nodeList;
		};

		const regN = new RegExp(`:${parentId}$`);
		const regS = new RegExp(`^${parentId}$`);
		const branch = this.branches.find(branchId => branchId.match(regN) || branchId.match(regS)) || parentId;

		for (let object of objects) {
			let links = this.filterDeletedLinks(Relation.getArrayValue(object.links)).filter(nodeId => {
				const branchId = [ branch, nodeId ].join('-');
				if (this.branches.includes(branchId)) {
					return false;
				} else {
					this.branches.push(branchId);
					return true;
				};
			});
			const numChildren = links.length;
			const node: TreeChild = {
				details: object,
				id: object.id,
				depth,
				numChildren,
				parentId,
				sectionId,
				isOpen: false,
				withPadding: false,
			};
			nodeList.push(node);

			if (numChildren === 0) {
				continue;
			};

			const isOpen = Storage.checkToggle(Constant.subId.sidebar, this.getTreeId(node));
			if (isOpen) {
				this.loadNodes(object.id, object.links);
				nodeList = this.unwrap(sectionId, nodeList, object.id, this.getRecords(dbStore.getSubId(Constant.subId.sidebar, node.id)), depth + 1);
			};
		};
		return nodeList;
	};

	getNodes (): TreeNode[] {
		const sections = Tree.sections;
		let nodes: TreeNode[] = [];
		this.branches = [];

		sections.forEach((section) => {
			const children = this.getRecords(dbStore.getSubId(Constant.subId.sidebar, section.id));

			if (section.id == I.TabIndex.Favorite) {
				let { root } = blockStore;
				let childrenIds = blockStore.getChildren(root, root, it => it.isLink()).map(it => it.content.targetBlockId);

				children.sort((c1, c2) => { return this.sortByIds(childrenIds, c1.id, c2.id); });
			};

			const node: TreeSection = {
				... section,
				numChildren: children.length,
			};
			node.isOpen = Storage.checkToggle(Constant.subId.sidebar, this.getTreeId(node));
			nodes.push(node);

			this.branches.push(node.id);

			if (node.isOpen) {
				nodes = this.unwrap(section.id, nodes, section.id, children, 0);
			};
		});

		const filtered = nodes.filter(node => node.isSection);
		for (let i = 0; i < filtered.length; ++i) {
			const node = filtered[i];
			const next = filtered[i + 1];

			if (next && node.isOpen) {
				next.withPadding = true;
			};
		};

		return nodes;
	};

	getTreeId (node: TreeNode): string {
		if (node.isSection === true) {
			return node.id;
		} else {
			const { sectionId, parentId, id, depth } = node;
			return [ sectionId, parentId, id, depth ].join('-');
		};
	};

	getRowHeight (node: TreeNode): number {
		let height = HEIGHT;
		if (node.isSection) {
			height = node.withPadding ? 38 : 30;
		};
		return height;
	};

	setActive (id: string): void {
		if (!this._isMounted) {
			return;
		};

		const DOMnode = $(ReactDOM.findDOMNode(this));

		DOMnode.find('.item.hover').removeClass('hover');

		if (id) {
			DOMnode.find(`.item.c${id}`).addClass('hover');
		};
	};

	sortByIds (ids: string[], id1: string, id2: string) {
		const i1 = ids.indexOf(id1);
		const i2 = ids.indexOf(id2);
		if (i1 > i2) return 1; 
		if (i1 < i2) return -1;
		return 0;
	};

	// Event handlers

	onToggle (e: React.MouseEvent, node: TreeNode): void {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const treeId = this.getTreeId(node);
		const isOpen = Storage.checkToggle(Constant.subId.sidebar, treeId);

		Storage.setToggle(Constant.subId.sidebar, treeId, !isOpen);

		let eventId = '';
		let group = '';
		if (node.isSection === true) {
			eventId = !isOpen ? 'OpenSidebarGroupToggle' : 'CloseSidebarGroupToggle';
			group = Tree.getSection(node.id).name;
		} else {
			eventId = !isOpen ? 'OpenSidebarObjectToggle' : 'CloseSidebarObjectToggle';
			group = Tree.getSection(node.sectionId).name;
		};

		analytics.event(eventId, { group });
		this.forceUpdate();
	};

	onScroll ({ scrollTop }): void {
		const { dataset } = this.props;
		const { dragProvider } = dataset || {};

		if (scrollTop) {
			this.scrollTop = scrollTop;
		};

		if (dragProvider) {
			dragProvider.onScroll();
		};
	};

	onClick (e: React.MouseEvent, node: TreeChild): void {
		e.preventDefault();
		e.stopPropagation();

		ObjectUtil.openEvent(e, node.details);
		analytics.event('OpenSidebarObject', { group: Tree.getSection(node.sectionId).name });
	};

	onContext (e: React.SyntheticEvent, node: TreeNode): void {
		e.preventDefault();
		e.stopPropagation();

		if (node.isSection) {
			return;
		};

		this.setActive(node.id);

		menuStore.open('dataviewContext', {
			recalcRect: () => {
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => { this.setActive(this.id); },
			data: {
				objectIds: [ node.id ],
				subId: dbStore.getSubId(Constant.subId.sidebar, node.isSection === true ? "" : node.parentId),
			}
		});
	};
});

export default Tree;