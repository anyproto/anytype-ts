import * as I from 'Interface';

/**
 * Tree nodes come from links: the first level is the target object's links and every node's
 * children are its own links. Sets and (optionally) files don't expand.
 */
const createLinksTreeSource = (object: any): I.WidgetTreeSource => {
	const isLeaf = (layout: I.ObjectLayout): boolean => {
		return U.Object.isSetLayout(layout) || (S.Common.hideFileObjectsInTree && U.Object.isInFileLayouts(layout));
	};

	return {
		isLoading: false,
		getRootIds: () => Relation.getArrayValue(object?.links),
		getChildIds: node => isLeaf(node.layout) ? [] : Relation.getArrayValue(node.links),
		getSorts: () => [],
		getPageSize: () => 0,
	};
};

export default createLinksTreeSource;
