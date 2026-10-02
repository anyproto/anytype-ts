/**
 * Pure builder for the "created in" hierarchy shown by the Tree sidebar section.
 * No store / DOM / global dependencies — keep this module unit-testable.
 *
 * B is a child of A iff B.createdInContext == A, A is present among the nodes, A may act as a
 * parent, and A still links to B (link block, mention, property value or collection membership).
 * Anything else has no parent. A parent that is gone (archived, deleted, other space) is simply
 * absent from the input, so its children fall back to having no parent.
 */

export interface CreatedTreeNode {
	id: string;
	/** The createdInContext value, empty when there is none */
	contextId: string;
	/** Outgoing links of the node, in document order */
	links: string[];
	/** False for objects that never act as parents (chats). Excluded layouts and templates should not be passed at all */
	canParent: boolean;
};

export interface CreatedForest {
	/** Nodes without a parent that have at least one child, in input order */
	roots: string[];
	/** Children of each parent, ordered by the parent's links */
	childrenOf: Map<string, string[]>;
};

/**
 * Builds the created-in forest. Within a cycle, which can only come from the API or from
 * importing cyclic data, the lowest id loses its parent so no node disappears.
 * When an id appears twice the first entry wins, so pass objects that have a createdInContext
 * before the top-level parents.
 */
export const buildCreatedForest = (nodes: CreatedTreeNode[]): CreatedForest => {
	const byId = new Map<string, CreatedTreeNode>();
	const linkSets = new Map<string, Set<string>>();

	for (const node of nodes) {
		if (node?.id && !byId.has(node.id)) {
			byId.set(node.id, node);
			linkSets.set(node.id, new Set(node.links || []));
		};
	};

	const parentOf = new Map<string, string>();

	for (const node of byId.values()) {
		const contextId = node.contextId;
		const context = contextId ? byId.get(contextId) : null;

		if (
			context &&
			(contextId != node.id) &&
			context.canParent &&
			linkSets.get(contextId).has(node.id)
		) {
			parentOf.set(node.id, contextId);
		};
	};

	breakCycles(parentOf);

	const childrenOf = new Map<string, string[]>();

	for (const [ childId, parentId ] of parentOf) {
		if (!childrenOf.has(parentId)) {
			childrenOf.set(parentId, []);
		};
		childrenOf.get(parentId).push(childId);
	};

	// Order children by the parent's links, dropping duplicate link entries
	for (const [ parentId, children ] of childrenOf) {
		const set = new Set(children);
		const seen = new Set<string>();
		const ordered: string[] = [];

		for (const id of byId.get(parentId).links || []) {
			if (set.has(id) && !seen.has(id)) {
				ordered.push(id);
				seen.add(id);
			};
		};

		childrenOf.set(parentId, ordered);
	};

	const roots: string[] = [];
	for (const id of byId.keys()) {
		if (!parentOf.has(id) && childrenOf.has(id)) {
			roots.push(id);
		};
	};

	return { roots, childrenOf };
};

/**
 * Whether two forests describe the same tree, including the order of roots and children.
 */
export const isSameForest = (a: CreatedForest, b: CreatedForest): boolean => {
	if (a === b) {
		return true;
	};

	if (!a || !b || !isSameList(a.roots, b.roots) || (a.childrenOf.size != b.childrenOf.size)) {
		return false;
	};

	for (const [ id, children ] of a.childrenOf) {
		if (!isSameList(children, b.childrenOf.get(id))) {
			return false;
		};
	};

	return true;
};

const isSameList = (a: string[], b: string[]): boolean => {
	if (!a || !b || (a.length != b.length)) {
		return false;
	};

	for (let i = 0; i < a.length; i++) {
		if (a[i] != b[i]) {
			return false;
		};
	};

	return true;
};

/**
 * Walks every parent chain once and removes the parent of the lowest id in each cycle found.
 */
const breakCycles = (parentOf: Map<string, string>) => {
	const done = new Set<string>();

	for (const start of [ ...parentOf.keys() ]) {
		if (done.has(start)) {
			continue;
		};

		const path: string[] = [];
		const onPath = new Set<string>();

		let current = start;
		while (current && !done.has(current) && !onPath.has(current)) {
			path.push(current);
			onPath.add(current);
			current = parentOf.get(current);
		};

		if (current && onPath.has(current)) {
			const cycle = path.slice(path.indexOf(current));
			const lowest = cycle.reduce((min, id) => (id < min ? id : min), cycle[0]);

			parentOf.delete(lowest);
		};

		path.forEach(id => done.add(id));
	};
};
