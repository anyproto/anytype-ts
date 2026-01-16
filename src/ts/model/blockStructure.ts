import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

/**
 * BlockStructure represents the parent-child relationships in the block tree.
 *
 * While Block holds the content data, BlockStructure tracks:
 * - parentId: The ID of this block's parent
 * - childrenIds: Ordered list of child block IDs
 *
 * This separation allows efficient tree operations without loading
 * full block data. The BlockStore maintains a parallel treeMap that
 * stores BlockStructure instances keyed by rootId and blockId.
 *
 * MobX observable for reactive UI updates when structure changes.
 */
class BlockStructure implements I.BlockStructure {
	
	parentId = '';
	childrenIds: string[] = [];
	
	constructor (props: I.BlockStructure) {
		this.parentId = String(props.parentId || '');
		this.childrenIds = Array.isArray(props.childrenIds) ? props.childrenIds : [];

		makeObservable(this, {
			parentId: observable,
			childrenIds: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockStructure;