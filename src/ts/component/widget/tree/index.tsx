import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { Loader, Label } from 'Component';
import { analytics, C, UtilData, I, UtilObject, Relation, Storage, UtilCommon, translate } from 'Lib';
import { blockStore, dbStore, detailStore } from 'Store';
import Item from './item';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const MAX_DEPTH = 15; // Maximum depth of the tree
const LIMIT = 20; // Number of nodes to load at a time
const HEIGHT = 28; // Height of each row

const WidgetTree = observer(class WidgetTree extends React.Component<I.WidgetComponent, State> {

	private _isMounted: boolean = false;

	node: any = null;
	state = {
		loading: false,
	};
	scrollTop: number = 0;
	id: string = '';
	cache: CellMeasurerCache = null;
	subscriptionHashes: { [key: string]: string } = {};
	branches: string[] = [];

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.getSubId = this.getSubId.bind(this);
		this.initCache = this.initCache.bind(this);
	};

	render () {
		const { loading } = this.state;
		const { isPreview } = this.props;
		const nodes = this.loadTree();
		const length = nodes.length;

		if (!this.cache) {
			return null;
		};

		let content = null;

		if (loading) {
			content = <Loader />;
		} else
		if (!length) {
			content = <Label className="empty" text={translate('widgetEmptyLabel')} />;
		} else 
		if (isPreview) {
			const rowRenderer = ({ index, parent, style }) => {
				const node: I.WidgetTreeItem = nodes[index];
				const key = this.getTreeKey(node);

				return (
					<CellMeasurer
						key={key}
						parent={parent}
						cache={this.cache}
						columnIndex={0}
						rowIndex={index}
						fixedWidth
					>
						<Item
							{...this.props}
							{...node}
							index={index}
							treeKey={this.getTreeKey(node)}
							style={style}
							onClick={this.onClick}
							onToggle={this.onToggle}
							getSubId={this.getSubId}
						/>
					</CellMeasurer>
				);
			};

			content = (
				<InfiniteLoader
					rowCount={nodes.length}
					loadMoreRows={() => {}}
					isRowLoaded={() => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={nodes.length}
									rowHeight={HEIGHT}
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
			);
		} else {
			content = (
				<div className="ReactVirtualized__List">
					{nodes.map((node, i: number) => {
						const key = this.getTreeKey(node);
						return (
							<Item
								key={key}
								{...this.props}
								{...node}
								index={i}
								treeKey={key}
								onClick={this.onClick}
								onToggle={this.onToggle}
								getSubId={this.getSubId}
							/>
						);
					})}
				</div>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id="body" 
				className="body"
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		
		const { block, isCollection, getData } = this.props;
		const { targetBlockId } = block.content;

		if (isCollection(targetBlockId)) {
			getData(this.getSubId(targetBlockId), this.initCache);
		} else {
			this.initCache();
		};
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;

		const subIds = Object.keys(this.subscriptionHashes).map(this.getSubId);
		if (subIds.length) {
			C.ObjectSearchUnsubscribe(subIds);
		};
	};

	updateData () {
		const { block, isCollection, getData } = this.props;
		const { targetBlockId } = block.content;

		if (isCollection(targetBlockId)) {
			getData(this.getSubId(targetBlockId), this.initCache);
		};
	};

	initCache () {
		const nodes = this.loadTree();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (nodes[i] || {}).id,
		});

		this.forceUpdate();
	};

	loadTree (): I.WidgetTreeItem[] {
		const { block, isCollection, sortFavorite } = this.props;
		const { targetBlockId } = block.content;
		const { widgets } = blockStore;
		const object = detailStore.get(widgets, targetBlockId, [ 'links' ]);

		this.branches = [];

		let children = [];
		if (isCollection(targetBlockId)) {
			const subId = this.getSubId(targetBlockId);
			
			let records = dbStore.getRecords(subId, '');
			if (targetBlockId == Constant.widgetId.favorite) {
				records = sortFavorite(records);
			};

			children = records.map(id => this.mapper(detailStore.get(subId, id, Constant.sidebarRelationKeys)));
		} else {
			children = this.getChildNodesDetails(object.id);
			this.subscribeToChildNodes(object.id, Relation.getArrayValue(object.links));
		};

		return this.loadTreeRecursive(object.id, object.id, [], children, 1);
	};

	// Recursive function which returns the tree structure
	loadTreeRecursive (rootId: string, parentId: string, treeNodeList: I.WidgetTreeItem[], childNodeList: I.WidgetTreeDetails[], depth: number): I.WidgetTreeItem[] {
		if (!childNodeList.length || depth >= MAX_DEPTH) {
			return treeNodeList;
		};

		const regN = new RegExp(`-${parentId}$`);
		const regS = new RegExp(`^${parentId}$`);
		const branch = this.branches.find((branchId) => branchId.match(regN) || branchId.match(regS)) || parentId;

		for (const childNode of childNodeList) {
			const links = this.filterDeletedLinks(Relation.getArrayValue(childNode.links)).filter((nodeId) => {
				const branchId = [ branch, nodeId ].join('-');
				if (this.branches.includes(branchId)) {
					return false;
				} else {
					this.branches.push(branchId);
					return true;
				};
			});

			const numChildren = links.length;
			const node: I.WidgetTreeItem = {
				id: childNode.id,
				depth,
				numChildren,
				parentId,
				rootId,
			};
			treeNodeList.push(node);

			if (!numChildren) {
				continue;
			};

			const isOpen = Storage.checkToggle(this.getSubKey(), this.getTreeKey(node));
			if (isOpen) {
				this.subscribeToChildNodes(childNode.id, childNode.links);
				treeNodeList = this.loadTreeRecursive(rootId, childNode.id, treeNodeList, this.getChildNodesDetails(childNode.id), depth + 1);
			};
		};

		return treeNodeList;
	};

	filterDeletedLinks (ids: string[]): string[] {
		const deleted = dbStore.getRecords(Constant.subId.deleted, '');

		return ids.filter(id => !deleted.includes(id));
	};

	// return the child nodes details for the given subId
	getChildNodesDetails (nodeId: string): I.WidgetTreeDetails[] {
		const subId = this.getSubId(nodeId);

		return dbStore.getRecords(subId, '').map(id => this.mapper(detailStore.get(subId, id, [ 'id', 'type', 'links' ], true)));
	};

	mapper (item) {
		let links = [];

		if (item.type != Constant.typeId.set) {
			links = this.filterDeletedLinks(Relation.getArrayValue(item.links));
		};

		item.links = links;

		return item;
	};

	// Subscribe to changes to child nodes for a given node Id and its links
	subscribeToChildNodes (nodeId: string, links: string[]): void {
		if (!links.length) {
			return;
		};

		const hash = sha1(UtilCommon.arrayUnique(links).join('-'));
		const subId = this.getSubId(nodeId);

		// if already subscribed to the same links, dont subscribe again
		if (this.subscriptionHashes[nodeId] && (this.subscriptionHashes[nodeId] == hash)) {
			return;
		};

		this.subscriptionHashes[nodeId] = hash;
		UtilData.subscribeIds({
			subId,
			ids: links,
			keys: Constant.sidebarRelationKeys,
			noDeps: true,
		});
	};

	// Utility methods

	getSubKey () {
		return `widget${this.props.block.id}`;
	};

	getSubId (nodeId: string): string {
		return dbStore.getSubId(this.getSubKey(), nodeId);
	};

	// a composite key for the tree node in the form rootId-parentId-Id-depth
	getTreeKey (node: I.WidgetTreeItem): string {
		const { block } = this.props;
		const { rootId, parentId, id, depth } = node;

		return [ block.id, rootId, parentId, id, depth ].join('-');
	};

	sortByIds (ids: string[], id1: string, id2: string) {
		const i1 = ids.indexOf(id1);
		const i2 = ids.indexOf(id2);
		if (i1 > i2) return 1;
		if (i1 < i2) return -1;
		return 0;
	};

	// Event handlers

	onToggle (e: React.MouseEvent, node: I.WidgetTreeItem): void {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const subKey = this.getSubKey();
		const treeKey = this.getTreeKey(node);
		const isOpen = Storage.checkToggle(subKey, treeKey);

		Storage.setToggle(subKey, treeKey, !isOpen);
		analytics.event(!isOpen ? 'OpenSidebarObjectToggle' : 'CloseSidebarObjectToggle');
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

	onClick (e: React.MouseEvent, item: unknown): void {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		UtilObject.openEvent(e, item);
		analytics.event('OpenSidebarObject');
	};

	resize () {
		const { parent, isPreview } = this.props;
		const nodes = this.loadTree();
		const node = $(this.node);
		const length = nodes.length;
		const css: any = { height: HEIGHT * length + 8, paddingBottom: '' };

		if (isPreview) {
			const head = $(`#widget-${parent.id} .head`);
			const maxHeight = $('#listWidget').height() - head.outerHeight(true);

			css.height = Math.min(maxHeight, css.height);
		};

		if (!length) {
			css.paddingBottom = 12;
			css.height = 36 + css.paddingBottom;
		};

		node.css(css);
	};

});

export default WidgetTree;
