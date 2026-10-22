import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import sha1 from 'sha1';
import * as I from 'Interface';
import { buildCreatedForest, isSameForest, CreatedForest, CreatedTreeNode } from 'Lib/util/createdTree';

const ROOT_PAGE_SIZE = 10; // Roots shown before "Show more"
const CHILD_PAGE_SIZE = 20; // Children of an expanded node shown before "Show more"
const EDGE_KEYS = [ 'id', 'resolvedLayout', 'createdInContext', 'links' ];
const PARENT_KEYS = [ 'id', 'resolvedLayout', 'links' ];

interface Param {
	sort: I.TreeSortMode;
	showBookmarks: boolean;
};

interface Data {
	parentIds: string[];
	forest: CreatedForest;
};

const toNode = (it: any): CreatedTreeNode => {
	const layout = Number(it.resolvedLayout);

	return {
		id: it.id,
		contextId: Relation.getStringValue(it.createdInContext),
		links: Relation.getArrayValue(it.links),
		canParent: !U.Object.isChatLayout(layout) && (layout != I.ObjectLayout.ChatOld),
	};
};

/**
 * Tree nodes come from the created-in hierarchy of the whole space. While the tree is mounted two
 * subscriptions are kept: every object that has a createdInContext ("edges"), and the live
 * top-level objects those point at ("parents"). Archived, deleted and other-space parents are not
 * returned by the second one, so their children count as having no parent.
 */
const useCreatedTreeSource = (param: Param): I.WidgetTreeSource => {
	const { sort, showBookmarks } = param;
	const edgesSubId = U.Subscription.spaceSubId(J.Constant.subId.treeEdges);
	const parentsSubId = U.Subscription.spaceSubId(J.Constant.subId.treeParents);
	const [ isEdgesLoaded, setIsEdgesLoaded ] = useState(false);
	const [ isParentsLoaded, setIsParentsLoaded ] = useState(false);
	const isUnmounted = useRef(false);

	// A single computed reads every record raw: going through S.Detail.get would create a cached
	// computed per object. It only reports a change when the forest itself differs, so edits that
	// don't move anything in the tree don't re-render it
	const data = useMemo(() => computed((): Data => {
		const edgeIds = S.Record.getRecordIds(edgesSubId, '');
		const edgeIdSet = new Set(edgeIds);
		const edges = edgeIds.map(id => S.Detail.getRaw(edgesSubId, id, EDGE_KEYS));
		const parentIds = U.Common.arrayUnique(edges.map(it => Relation.getStringValue(it.createdInContext)).filter(it => it && !edgeIdSet.has(it))).sort();
		const parentIdSet = new Set(parentIds);

		// Records left over from a previous parents subscription are ignored
		const parents = S.Record.getRecordIds(parentsSubId, '').filter(id => parentIdSet.has(id)).map(id => S.Detail.getRaw(parentsSubId, id, PARENT_KEYS));

		return {
			parentIds,
			forest: buildCreatedForest(edges.concat(parents).map(toNode)),
		};
	}, {
		equals: (a: Data, b: Data) => (a.parentIds.join(',') == b.parentIds.join(',')) && isSameForest(a.forest, b.forest),
	}), []);

	const { parentIds, forest } = data.get();
	const parentsHash = sha1(parentIds.join(','));

	const getSorts = (depth: number): I.Sort[] => {
		switch (sort) {
			case I.TreeSortMode.Name: {
				return [ { relationKey: 'name', type: I.SortType.Asc } ];
			};

			case I.TreeSortMode.LastEdited: {
				return [ { relationKey: 'lastModifiedDate', type: I.SortType.Desc, includeTime: true } ];
			};

			case I.TreeSortMode.Created: {
				return [ { relationKey: 'createdDate', type: I.SortType.Asc, includeTime: true } ];
			};

			default: {
				// Roots by their manual order, then name. Children keep their parent's document order
				if (depth > 1) {
					return [];
				};

				return [
					{ relationKey: 'orderId', type: I.SortType.Asc, empty: I.EmptyType.End },
					{ relationKey: 'name', type: I.SortType.Asc },
				];
			};
		};
	};

	useEffect(() => {
		return () => {
			// The section is collapsed: drop its records too, they cover every created object of the space
			isUnmounted.current = true;
			U.Subscription.destroyList([ edgesSubId, parentsSubId ], true);
		};
	}, []);

	// Re-subscribing when bookmarks are toggled keeps the current tree until the new records arrive
	useEffect(() => {
		// Unsubscribe first: a quick collapse and expand would otherwise find the previous
		// subscription still registered and skip this one
		U.Subscription.destroyList([ edgesSubId ], false, () => {
			if (isUnmounted.current) {
				return;
			};

			U.Subscription.subscribe({
				subId: edgesSubId,
				filters: U.Subscription.createdTreeFilters(showBookmarks).concat([
					{ relationKey: 'createdInContext', condition: I.FilterCondition.NotEmpty, value: null },
				]),
				keys: EDGE_KEYS,
				noDeps: true,
			}, () => {
				if (!isUnmounted.current) {
					setIsEdgesLoaded(true);
				};
			});
		});
	}, [ showBookmarks ]);

	useEffect(() => {
		if (!isEdgesLoaded) {
			return;
		};

		const ids = parentIds;

		U.Subscription.destroyList([ parentsSubId ], !ids.length, () => {
			if (isUnmounted.current) {
				return;
			};

			if (!ids.length) {
				setIsParentsLoaded(true);
				return;
			};

			U.Subscription.subscribe({
				subId: parentsSubId,
				filters: U.Subscription.createdTreeFilters(showBookmarks).concat([
					{ relationKey: 'id', condition: I.FilterCondition.In, value: ids },
				]),
				keys: PARENT_KEYS,
				noDeps: true,
			}, () => {
				if (!isUnmounted.current) {
					setIsParentsLoaded(true);
				};
			});
		});
	}, [ isEdgesLoaded, parentsHash, showBookmarks ]);

	return {
		isLoading: !isEdgesLoaded || !isParentsLoaded,
		getRootIds: () => forest.roots,
		getChildIds: node => forest.childrenOf.get(node.id) || [],
		getSorts,
		getPageSize: depth => (depth == 1) ? ROOT_PAGE_SIZE : CHILD_PAGE_SIZE,
	};
};

export default useCreatedTreeSource;
