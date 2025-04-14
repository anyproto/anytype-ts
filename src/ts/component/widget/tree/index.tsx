import React, { forwardRef, useImperativeHandle, useEffect, useRef, useState, MouseEvent } from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { Label, Button } from 'Component';
import { I, C, S, U, J, analytics, Relation, Storage, translate } from 'Lib';
import Item from './item';

const MAX_DEPTH = 15; // Maximum depth of the tree
const LIMIT = 20; // Number of nodes to load at a time
const HEIGHT = 28; // Height of each row

interface WidgetTreeRefProps {
	updateData: () => void;
	resize: () => void;
};

const WidgetTree = observer(forwardRef<WidgetTreeRefProps, I.WidgetComponent>((props, ref) => {

	const { block, parent, isPreview, canCreate, onCreate, isSystemTarget, getData, getTraceId, sortFavorite, addGroupLabels } = props;
	const targetId = block ? block.getTargetObjectId() : '';
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const deletedIds = new Set(S.Record.getRecordIds(J.Constant.subId.deleted, ''));
	const object = S.Detail.get(S.Block.widgets, targetId);
	const subKey = block ? `widget${block.id}` : '';
	const links = useRef([]);
	const top = useRef(0);
	const branches = useRef([]);
	const subscriptionHashes = useRef({});
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT }));
	const [ dummy, setDummy ] = useState(0);
	const isRecent = [ J.Constant.widgetId.recentOpen, J.Constant.widgetId.recentEdit ].includes(targetId);

	const unsubscribe = () => {	
		const subIds = Object.keys(subscriptionHashes.current).map(getSubId);

		if (subIds.length) {
			C.ObjectSearchUnsubscribe(subIds);
			clear();
		};
	};

	const clear = () => {
		const subIds = Object.keys(subscriptionHashes.current).map(getSubId);

		subscriptionHashes.current = {};
		branches.current = [];

		subIds.forEach(subId => {
			S.Record.recordsClear(subId, '');
			S.Record.recordsClear(`${subId}/dep`, '');
		});
	};

	const updateData = () => {
		if (isSystemTarget) {
			getData(getSubId(), initCache);
		};
	};

	const initCache = () => {
		const nodes = loadTree();

		cache.current = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => getRowHeight(nodes[i], i),
			keyMapper: i => (nodes[i] || {}).id,
		});

		setDummy(dummy + 1);
	};

	const loadTree = (): I.WidgetTreeItem[] => {
		branches.current = [];

		let children = [];
		if (isSystemTarget) {
			const subId = getSubId(targetId);
			
			let records = S.Record.getRecordIds(subId, '');
			if (targetId == J.Constant.widgetId.favorite) {
				records = sortFavorite(records);
			};

			children = records.map(id => mapper(S.Detail.get(subId, id, J.Relation.sidebar)));
		} else {
			children = getChildNodesDetails(object.id);
			subscribeToChildNodes(object.id, Relation.getArrayValue(object.links));
		};

		if (isPreview && isRecent) {
			// add group labels
			children = addGroupLabels(children, targetId);
		};

		return loadTreeRecursive(object.id, object.id, [], children, 1, '');
	};

	// Recursive function which returns the tree structure
	const loadTreeRecursive = (rootId: string, parentId: string, treeNodeList: I.WidgetTreeItem[], childNodeList: I.WidgetTreeDetails[], depth: number, branch: string): I.WidgetTreeItem[] => {
		if (!childNodeList.length || depth >= MAX_DEPTH) {
			return treeNodeList;
		};

		for (const childNode of childNodeList) {
			const childBranch = [ branch, childNode.id ].join('-');

			const links = filterDeletedLinks(Relation.getArrayValue(childNode.links)).filter(nodeId => {
				const branchId = [ childBranch, nodeId ].join('-');
				if (branches.current.includes(branchId)) {
					return false;
				} else {
					branches.current.push(branchId);
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
				isSection: childNode.isSection,
				branch: childBranch,
			};
			treeNodeList.push(node);

			if (!numChildren) {
				continue;
			};

			const isOpen = Storage.checkToggle(subKey, getTreeKey(node));
			if (isOpen) {
				subscribeToChildNodes(childNode.id, childNode.links);
				treeNodeList = loadTreeRecursive(rootId, childNode.id, treeNodeList, getChildNodesDetails(childNode.id), depth + 1, childBranch);
			};
		};

		return treeNodeList;
	};

	const filterDeletedLinks = (ids: string[]): string[] => {
		return ids.filter(id => !deletedIds.has(id));
	};

	// return the child nodes details for the given subId
	const getChildNodesDetails = (nodeId: string): I.WidgetTreeDetails[] => {
		return S.Record.getRecords(getSubId(nodeId), [ 'id', 'layout', 'links' ], true).map(it => mapper(it));
	};

	const mapper = (o) => {
		o.links = U.Object.isSetLayout(o.layout) ? [] : filterDeletedLinks(Relation.getArrayValue(o.links));
		return o;
	};

	// Subscribe to changes to child nodes for a given node Id and its links
	const subscribeToChildNodes = (nodeId: string, links: string[]): void => {
		if (!links.length) {
			return;
		};

		const hash = sha1(U.Common.arrayUnique(links).join('-'));
		const subId = getSubId(nodeId);

		// if already subscribed to the same links, dont subscribe again
		if (subscriptionHashes.current[nodeId] && (subscriptionHashes.current[nodeId] == hash)) {
			return;
		};

		subscriptionHashes.current[nodeId] = hash;
		U.Data.subscribeIds({
			subId,
			ids: links,
			keys: J.Relation.sidebar,
			noDeps: true,
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

	const onScroll = ({ scrollTop }): void => {
		const dragProvider = S.Common.getRef('dragProvider');

		top.current = scrollTop;
		dragProvider?.onScroll();
	};

	const onClick = (e: MouseEvent, item: unknown): void => {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, item);
		analytics.event('OpenSidebarObject', { widgetType: analytics.getWidgetType(parent.content.autoAdded) });
	};

	const getTotalHeight = () => {
		return loadTree().reduce((acc, node, index) => acc + getRowHeight(node, index), 0);
	};

	const getRowHeight = (node: any, index: number) => {
		let h = HEIGHT;
		if (node && node.isSection && index) {
			h += 12;
		};
		return h;
	};

	const resize = () => {
		const nodes = loadTree();
		const node = $(nodeRef.current);
		const length = nodes.length;
		const css: any = { height: getTotalHeight() + 8, paddingBottom: '' };
		const emptyWrap = node.find('.emptyWrap');

		if (isPreview) {
			const head = $(`#widget-${parent.id} .head`);
			const maxHeight = $('#sidebarLeft #containerWidget #body').height() - head.outerHeight(true);

			css.height = Math.min(maxHeight, css.height + 8);
		};

		if (!length) {
			css.paddingBottom = 8;
			css.height = emptyWrap.outerHeight() + css.paddingBottom;
		};

		node.css(css);
	};


	const nodes = loadTree();
	const length = nodes.length;

	let content = null;

	if (!length) {
		content = (
			<div className="emptyWrap">
				<Label className="empty" text={canCreate ? translate('widgetEmptyLabelCreate') : translate('widgetEmptyLabel')} />
				{canCreate ? (
					<Button 
						text={translate('commonCreateObject')} 
						color="blank" 
						className="c28" 
						onClick={() => onCreate({ route: analytics.route.inWidget })} 
					/> 
				) : ''}
			</div>
		);
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
					<Item
						{...props}
						{...node}
						index={index}
						treeKey={key}
						style={style}
						onClick={onClick}
						onToggle={onToggle}
						getSubId={getSubId}
						getSubKey={() => subKey}
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

					return (
						<Item
							key={key}
							{...props}
							{...node}
							index={i}
							treeKey={key}
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
		links.current = object.links;

		if (isSystemTarget) {
			getData(getSubId(), initCache);
		} else {
			initCache();
			C.ObjectShow(targetId, getTraceId(), U.Router.getRouteSpaceId());
		};

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		resize();

		// Reload the tree if the links have changed
		if (!U.Common.compareJSON(links.current, object.links)) {
			clear();
			initCache();

			links.current = object.links;
		};

		listRef.current?.recomputeRowHeights(0);
		listRef.current?.scrollToPosition(top.current);
	});

	useImperativeHandle(ref, () => ({
		updateData,
		resize,
	}));

	return (
		<div
			ref={nodeRef}
			id="innerWrap"
			className="innerWrap"
		>
			{content}
		</div>
	);

}));

export default WidgetTree;