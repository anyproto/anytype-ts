import React, { forwardRef, useImperativeHandle, useEffect, useRef, useState, MouseEvent } from 'react';
import sha1 from 'sha1';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { Label, Filter, Button } from 'Component';
import Item from './item';
import ItemMore from './more';
import createLinksTreeSource from './source/links';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const MAX_DEPTH = 15; // Maximum depth of the tree
const LIMIT = 20; // Number of nodes to load at a time
const HEIGHT = 28; // Height of each row

/**
 * Rendered by WidgetIndex for a widget in Tree layout, or directly as a sidebar section. A section
 * passes a synthetic widget block as both block and parent (its id keys toggles and subscriptions),
 * its own source and onContext, and no onSetPreview, which hides "See all".
 */
interface Props extends I.WidgetComponent {
	source?: I.WidgetTreeSource; // where nodes come from, the target object's links by default
	isSidebarSection?: boolean; // always shown, no drop targets or set icons, node subscriptions destroyed on unmount
	emptyText?: string;
};

interface WidgetTreeRefProps {
	updateData: () => void;
	resize: () => void;
	setSearchIds: (ids: string[]) => void;
	appendSearchIds?: (ids: string[]) => void;
	getSearchIds: () => string[];
	getFilter: () => string;
};

const WidgetTree = forwardRef<WidgetTreeRefProps, Props>((props, ref) => {

	const { block, parent, isPreview, isSystemTarget, isSidebarSection, emptyText, canCreate, getLimit, getData, addGroupLabels, checkShowAllButton, onCreate, onSetPreview } = props;
	const targetId = block?.getTargetObjectId();
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const deletedIds = new Set(S.Record.getRecordIds(U.Subscription.spaceSubId(J.Constant.subId.deleted), ''));
	const archivedIds = new Set(S.Record.getRecordIds(U.Subscription.spaceSubId(J.Constant.subId.archived), ''));
	const dl = deletedIds.size;
	const al = archivedIds.size;
	const object = targetId ? S.Detail.get(S.Block.widgets, targetId) : null;
	const source = props.source || createLinksTreeSource(object);
	const rootNodeId = targetId || block?.id; // first-level nodes are subscribed under this id
	const subKey = block ? `widget${block.id}` : '';
	const links = useRef([]);
	const top = useRef(0);
	const branches = useRef(new Set<string>());
	const [ searchIds, setSearchIds ] = useState([]);
	const [ pageLimits, setPageLimits ] = useState<{ [ nodeId: string ]: number }>({});
	const filterRef = useRef(null);
	const filter = useRef('');
	const filterTimeout = useRef(0);
	const subscriptionHashes = useRef({});
	const subIds = useRef(new Set<string>());
	const isUnmounted = useRef(false);
	const [ isRootLoaded, setIsRootLoaded ] = useState(false);
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const [ dummy, setDummy ] = useState(0);
	const isRecent = [ J.Constant.widgetId.recentOpen, J.Constant.widgetId.recentEdit ].includes(targetId);
	const isOpen = isSidebarSection || Storage.checkToggle('widget', parent?.id);
	const isShown = isOpen || isPreview;

	const clearSubscriptionHashes = () => {
		subscriptionHashes.current = {};
	};

	const updateData = () => {
		if (!isSystemTarget) {
			return;
		};

		getData(subId);
		checkShowAllButton(subId);
		resize();
	};

	const loadTree = (): I.WidgetTreeItem[] => {
		branches.current.clear();

		if (!rootNodeId || source.isLoading) {
			return [];
		};

		let children = [];
		let total = 0;

		if (isSystemTarget) {
			const subId = getSubId(targetId);
			const records = S.Record.getRecordIds(subId, '');

			children = records.map(id => S.Detail.get(subId, id, J.Relation.sidebar)).filter(it => !S.Common.hideFileObjectsInTree || !U.Object.isInFileLayouts(it.layout));
			total = children.length;
		} else {
			let ids = source.getRootIds();
			if (filter.current) {
				ids = ids.filter(it => searchIds.includes(it));
			};

			subscribeToChildNodes(rootNodeId, ids, 1);
			children = getChildNodesDetails(rootNodeId);
			total = filterDeletedLinks(ids).length;
		};

		if (filter.current) {
			children = children.filter(it => it && searchIds.includes(it.id));
		};

		if (isPreview && isRecent) {
			// add group labels
			children = addGroupLabels(children, targetId);
		};

		return loadTreeRecursive(rootNodeId, rootNodeId, [], children, 1, '', total);
	};

	// Recursive function which returns the tree structure
	const loadTreeRecursive = (rootId: string, parentId: string, treeNodeList: I.WidgetTreeItem[], childNodeList: I.WidgetTreeDetails[], depth: number, branch: string, total: number): I.WidgetTreeItem[] => {
		if (!childNodeList.length || (depth >= MAX_DEPTH)) {
			return treeNodeList;
		};

		for (const childNode of childNodeList) {
			if (!childNode) {
				continue;
			};

			const childBranch = [ branch, childNode.id ].join('-');
			const childIds = filterDeletedLinks(source.getChildIds(childNode));

			const visibleIds = childIds.filter(nodeId => {
				const branchId = [ childBranch, nodeId ].join('-');
				if (branches.current.has(branchId)) {
					return false;
				} else {
					branches.current.add(branchId);
					return true;
				};
			});

			const numChildren = visibleIds.length;
			const node: I.WidgetTreeItem = {
				id: childNode.id,
				depth,
				numChildren,
				parentId,
				rootId,
				isSection: childNode.isSection,
				branch: childBranch,
			};
			treeNodeList.push(node);

			if (!numChildren) {
				continue;
			};

			const isOpen = Storage.checkToggle(subKey, getTreeKey(node));
			if (isOpen) {
				subscribeToChildNodes(childNode.id, childIds, depth + 1);
				treeNodeList = loadTreeRecursive(rootId, childNode.id, treeNodeList, getChildNodesDetails(childNode.id), depth + 1, childBranch, childIds.length);
			};
		};

		const limit = getPageLimit(parentId, depth);
		if (limit && (total > limit)) {
			treeNodeList.push({
				id: [ parentId, 'more' ].join('-'),
				depth,
				numChildren: 0,
				parentId,
				rootId,
				isMore: true,
				branch: [ branch, 'more' ].join('-'),
			});
		};

		return treeNodeList;
	};

	const filterDeletedLinks = (ids: string[]): string[] => {
		return ids.filter(id => (id != J.Constant.missingObjectId) && !deletedIds.has(id) && !archivedIds.has(id));
	};

	// return the child nodes details for the given subId
	const getChildNodesDetails = (nodeId: string): I.WidgetTreeDetails[] => {
		return S.Record.getRecords(getSubId(nodeId), [ 'id', 'layout', 'links' ], true)
			.filter(it => !S.Common.hideFileObjectsInTree || !U.Object.isInFileLayouts(it.layout));
	};

	// How many children of a node are shown, 0 when the source doesn't page them
	const getPageLimit = (nodeId: string, depth: number): number => {
		const size = source.getPageSize(depth);
		return size ? (pageLimits[nodeId] || size) : 0;
	};

	// Subscribe to changes to child nodes for a given node Id and its child ids
	const subscribeToChildNodes = (nodeId: string, ids: string[], depth: number): void => {
		ids = filterDeletedLinks(ids);

		const sorts = source.getSorts(depth);

		let limit = getPageLimit(nodeId, depth);

		// Without paging only the first level of a sidebar widget is capped, by the widget limit
		if (!limit && (depth == 1) && !isPreview && getLimit) {
			limit = getLimit();
		};

		if (limit && !sorts.length) {
			ids = ids.slice(0, limit);
		};

		const hash = sha1(JSON.stringify([ U.Common.arrayUnique(ids), sorts, (sorts.length ? limit : 0) ]));
		const subId = getSubId(nodeId);

		// if already subscribed to the same ids, dont subscribe again
		if (subscriptionHashes.current[nodeId] && (subscriptionHashes.current[nodeId] == hash)) {
			return;
		};

		subscriptionHashes.current[nodeId] = hash;
		subIds.current.add(subId);

		// Nothing left: drop the old records too, an empty subscribeIds would keep showing them
		if (!ids.length) {
			U.Subscription.destroyList([ subId ], true);
			return;
		};

		const callBack = () => {
			if (!isUnmounted.current && (nodeId == rootNodeId)) {
				setIsRootLoaded(true);
			};
		};

		U.Subscription.destroyList([ subId ], false, () => {
			// Unmounted while unsubscribing: subscribing now would leave a subscription nobody owns
			if (isUnmounted.current) {
				return;
			};

			if (sorts.length) {
				U.Subscription.subscribe({
					subId,
					filters: [ { relationKey: 'id', condition: I.FilterCondition.In, value: ids } ],
					sorts,
					limit,
					keys: J.Relation.sidebar,
					noDeps: true,
				}, callBack);
			} else {
				U.Subscription.subscribeIds({
					subId,
					ids,
					keys: J.Relation.sidebar,
					noDeps: true,
				}, callBack);
			};
		});
	};

	// Utility methods
	const getSubId = (nodeId?: string): string => {
		return S.Record.getSubId(subKey, nodeId || targetId);
	};

	// a composite key for the tree node in the form rootId-parentId-Id-depth
	const getTreeKey = (node: I.WidgetTreeItem): string => {
		return [ block.id, node.branch, node.depth ].join('-');
	};

	// Event handlers

	const onToggle = (e: MouseEvent, node: I.WidgetTreeItem): void => {
		e.preventDefault();
		e.stopPropagation();

		const treeKey = getTreeKey(node);
		const isOpen = Storage.checkToggle(subKey, treeKey);

		Storage.setToggle(subKey, treeKey, !isOpen);
		analytics.event(!isOpen ? 'OpenSidebarObjectToggle' : 'CloseSidebarObjectToggle');

		setDummy(dummy + 1);
	};

	const onMore = (e: MouseEvent, node: I.WidgetTreeItem): void => {
		e.preventDefault();
		e.stopPropagation();

		const limit = getPageLimit(node.parentId, node.depth) + source.getPageSize(node.depth);

		setPageLimits(prev => ({ ...prev, [node.parentId]: limit }));
	};

	const onScroll = ({ scrollTop }): void => {
		const dragProvider = S.Common.getRef('dragProvider');

		top.current = scrollTop;
		dragProvider?.onScroll();
	};

	const onClick = (e: MouseEvent, item: unknown): void => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openConfig(e, item);
		analytics.event('OpenSidebarObject');
	};

	const getTotalHeight = (items?: I.WidgetTreeItem[]) => {
		return (items || nodes).reduce((acc, node, index) => acc + getRowHeight(node, index), 0);
	};

	const getRowHeight = (node: any, index: number) => {
		let h = HEIGHT;
		if (node && node.isSection && index) {
			h += 12;
		};
		return h;
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(filterTimeout.current);
		filterTimeout.current = window.setTimeout(() => {
			if (filter.current == v) {
				return;
			};

			filter.current = v;

			if (!filter.current) {
				setSearchIds([]);
				return;
			};

			U.Subscription.search({
				filters: [],
				sorts: [],
				fullText: filter.current,
				keys: [ 'id' ],
			}, (message: any) => {
				setSearchIds((message.records || []).map(it => it.id));
			});
		}, J.Constant.delay.keyboard);
	};

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const showAllBtn = U.Dom.select('#button-show-all', node);
		const showAll = showAllBtn && getComputedStyle(showAllBtn).display != 'none';
		const bh = showAll ? HEIGHT : 0;
		const css: any = { height: `${getTotalHeight() + 8 + bh}px`, paddingBottom: '' };

		if (isPreview) {
			const head = U.Dom.select(`#widget-${U.Common.esc(parent.id)} .head`);
			const body = U.Dom.select('#sidebarPageWidget #body');
			const bodyHeight = body ? U.Dom.contentHeight(body) : 0;
			const headHeight = head ? head.offsetHeight + (parseFloat(getComputedStyle(head).marginTop) || 0) + (parseFloat(getComputedStyle(head).marginBottom) || 0) : 0;
			const maxHeight = bodyHeight - headHeight;

			css.height = `${Math.min(maxHeight, getTotalHeight() + 8 + bh + 8)}px`;
		};

		if (!length) {
			css.paddingBottom = '8px';

			// The section explains itself in its empty state, which takes several lines
			css.height = isSidebarSection ? '' : `${20 + 8}px`;
		};

		U.Dom.css(node, css);
	};

	const nodes = loadTree();
	const length = nodes.length;
	const subId = getSubId();

	// Until the first level arrives there is nothing to show, yet the tree isn't known to be empty
	const isRootPending = !isSystemTarget && !isRootLoaded && (filterDeletedLinks(source.getRootIds()).length > 0);

	let content = null;
	let head = null;

	if (isPreview) {
		head = (
			<div className="head">
				<div className="filterWrapper">
					<div className="side left">
						<Filter
							ref={filterRef}
							iconParam={{ name: 'common/search' }}
							placeholder={translate('commonSearch')}
							onChange={onFilterChange}
						/>
					</div>
					{canCreate ? (
						<div className="side right">
							<Button
								id="button-object-create"
								color="blank"
								size={28}
								text={translate('commonNew')}
								onClick={e => onCreate(e, { 
									element: '#button-object-create', 
									route: analytics.route.widget,
									details: {
										name: String(filterRef.current?.getValue() || ''),
									},
								})} 
							/>
						</div>
					) : ''}
				</div>
			</div>
		);
	};
	
	if (!length) {
		if (!source.isLoading && !isRootPending) {
			const label = emptyText || ((targetId == J.Constant.widgetId.favorite) ? translate('widgetEmptyFavoriteLabel') : translate('widgetEmptyLabel'));

			content = (
				<div className="emptyWrap">
					<Label className="empty" text={label} />
				</div>
			);
		};
	} else
	if (isPreview) {
		const rowRenderer = ({ index, parent, style }) => {
			const node: I.WidgetTreeItem = nodes[index];
			const key = getTreeKey(node);

			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={cache.current}
					columnIndex={0}
					rowIndex={index}
					fixedWidth
				>
					{node.isMore ? (
						<ItemMore
							{...node}
							treeKey={key}
							style={style}
							onMore={onMore}
						/>
					) : (
						<Item
							{...props}
							{...node}
							index={index}
							treeKey={key}
							style={style}
							canDrop={!isSidebarSection}
							withSetIcon={!isSidebarSection}
							onClick={onClick}
							onToggle={onToggle}
							getSubId={getSubId}
							getSubKey={() => subKey}
						/>
					)}
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
								ref={listRef}
								width={width}
								height={height}
								deferredMeasurmentCache={cache.current}
								rowCount={nodes.length}
								rowHeight={({ index }) => getRowHeight(nodes[index], index)}
								rowRenderer={rowRenderer}
								onRowsRendered={onRowsRendered}
								overscanRowCount={LIMIT}
								onScroll={onScroll}
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
					const key = getTreeKey(node);

					if (node.isMore) {
						return (
							<ItemMore
								key={key}
								{...node}
								treeKey={key}
								onMore={onMore}
							/>
						);
					};

					return (
						<Item
							key={key}
							{...props}
							{...node}
							index={i}
							treeKey={key}
							canDrop={!isSidebarSection}
							withSetIcon={!isSidebarSection}
							onClick={onClick}
							onToggle={onToggle}
							getSubId={getSubId}
							getSubKey={() => subKey}
						/>
					);
				})}
			</div>
		);
	};

	useEffect(() => {
		links.current = object?.links;

		updateData();
		resize();

		return () => {
			isUnmounted.current = true;

			// A section unmounts when it is collapsed, so its node subscriptions and records go with
			// it. Widgets keep theirs: a remount under a new key re-subscribes the same ids while
			// rendering, and a late unsubscribe here would race it
			if (isSidebarSection) {
				U.Subscription.destroyList([ ...subIds.current ], true);
			};
		};
	}, []);

	useEffect(() => {
		// Reload the tree if the links of the target object have changed (links source only)
		if (!U.Common.compareJSON(links.current, object?.links)) {
			clearSubscriptionHashes();
			links.current = object?.links;
		};

		listRef.current?.recomputeRowHeights(0);
		listRef.current?.scrollToPosition(top.current);
	});

	useEffect(() => {
		checkShowAllButton?.(getSubId());
		resize();

		U.Dom.toggleClass(U.Dom.get(`widget-${parent?.id}`), 'isEmpty', !length);
	}, [ length ]);

	useImperativeHandle(ref, () => ({
		updateData,
		resize,
		setSearchIds,
		appendSearchIds: (ids: string[]) => setSearchIds((searchIds || []).concat(ids || [])),
		getSearchIds: () => searchIds,
		getFilter: () => filter.current,
	}));

	return (
		<div
			ref={nodeRef}
			id="innerWrap"
			className="innerWrap"
			style={{ display: isShown ? 'flex' : 'none' }}
		>
			{head}
			{content}

			{onSetPreview ? (
				<Button
					id="button-show-all"
					onClick={onSetPreview}
					text={translate('widgetSeeAll')}
					size={28}
					color="blank"
					arrow={true}
				/>
			) : ''}
		</div>
	);

});

export default WidgetTree;
