import $ from 'jquery';
import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, M, S, U, J, Storage, Mark, translate, keyboard } from 'Lib';

/**
 * BlockStore manages the block data structure for all open objects.
 *
 * Key responsibilities:
 * - Block storage: Maps storing blocks by root ID and block ID
 * - Tree structure: Parent-child relationships between blocks
 * - Restrictions: Block-level permissions and capabilities
 * - Participants: Tracking who created/modified blocks
 * - Block traversal: Navigation through block hierarchies
 * - Widget management: Updating widget views and data
 *
 * Blocks are the fundamental content units in Anytype - text, images,
 * links, tables, etc. are all represented as blocks with specific types.
 *
 * The store maintains several Maps:
 * - blockMap: rootId -> blockId -> Block
 * - treeMap: rootId -> blockId -> BlockStructure (parent/children)
 * - restrictionMap: rootId -> blockId -> restrictions
 * - participantMap: rootId -> blockId -> participantId
 */
class BlockStore {

	public profileId = '';
	public widgetsId = '';
	public spaceviewId = '';
	public workspaceId = '';

	public treeMap: Map<string, Map<string, I.BlockStructure>> = new Map();
	public blockMap: Map<string, Map<string, I.Block>> = new Map();
	public restrictionMap: Map<string, Map<string, any>> = new Map();
	public participantMap: Map<string, Map<string, string>> = new Map();

	constructor() {
		makeObservable(this, {
			profileId: observable,
			spaceviewId: observable,
			widgetsId: observable,
			workspaceId: observable,

			profile: computed,
			spaceview: computed,
			widgets: computed,
			workspace: computed,

			profileSet: action,
			widgetsSet: action,
			spaceviewSet: action,
			workspaceSet: action,

			set: action,
			clear: action,
			clearAll: action,
			add: action,
			update: action,
			updateContent: action,
			updateStructure: action,
			delete: action,
		});
	};

	get profile (): string {
		return String(this.profileId || '');
	};

	get widgets (): string {
		return String(this.widgetsId || '');
	};

	get spaceview (): string {
		return String(this.spaceviewId || '');
	};

	get workspace (): string {
		return String(this.workspaceId || '');
	};

	/**
	 * Sets the profile ID.
	 * @param {string} id - The profile ID.
	 */
	profileSet (id: string) {
		this.profileId = String(id || '');
	};

	/**
	 * Sets the widgets ID.
	 * @param {string} id - The widgets ID.
	 */
	widgetsSet (id: string) {
		this.widgetsId = String(id || '');
	};

	/**
	 * Sets the spaceview ID.
	 * @param {string} id - The spaceview ID.
	 */
	spaceviewSet (id: string) {
		this.spaceviewId = String(id || '');
	};

	/**
	 * Sets the workspace ID.
	 * @param {string} id - The workspace ID.
	 */
	workspaceSet (id: string) {
		this.workspaceId = String(id || '');
	};
	
	/**
	 * Sets the block map for a root ID.
	 * @param {string} rootId - The root ID.
	 * @param {I.Block[]} blocks - The blocks to set.
	 */
	set (rootId: string, blocks: I.Block[]) {
		const map: Map<string, I.Block> = new Map();
		
		blocks.forEach((it: I.Block) => {
			map.set(it.id, it);
		});

		this.blockMap.set(rootId, map);
	};

	/**
	 * Adds a block to the block map for a root ID.
	 * @param {string} rootId - The root ID.
	 * @param {I.Block} block - The block to add.
	 */
	add (rootId: string, block: I.Block) {
		const map = this.blockMap.get(rootId);
		if (map) {
			map.set(block.id, block);
		};
	};

	/**
	 * Updates a block in the block map.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any} param - The parameters to update.
	 */
	update (rootId: string, blockId: string, param: any) {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		set(block, param);
	};

	/**
	 * Updates the content of a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any} content - The new content.
	 */
	updateContent (rootId: string, blockId: string, content: any) {
		const block = this.getLeaf(rootId, blockId);
		if (block) {
			set(block.content, content);
		};
	};

	/**
	 * Clears all data for a root ID.
	 * @param {string} rootId - The root ID.
	 */
	clear (rootId: string) {
		this.blockMap.delete(rootId);
		this.treeMap.delete(rootId);
		this.restrictionMap.delete(rootId);
		this.participantMap.delete(rootId);
	};

	/**
	 * Clears all data in the store.
	 */
	clearAll () {
		this.profileSet('');
		this.widgetsSet('');

		this.blockMap.clear();
		this.treeMap.clear();
		this.restrictionMap.clear();
		this.participantMap.clear();
	};

	/**
	 * Sets the structure map for a root ID.
	 * @param {string} rootId - The root ID.
	 * @param {any[]} list - The structure list.
	 */
	setStructure (rootId: string, list: any[]) {
		list.forEach((item: any) => {
			this.updateStructure(rootId, item.id, item.childrenIds || []);
		});
	};

	/**
	 * Updates the structure of a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string[]} childrenIds - The children IDs.
	 */
	updateStructure (rootId: string, blockId: string, childrenIds: string[]) {
		const element = this.getMapElement(rootId, blockId);

		if (!element) {
			const map = this.getMap(rootId);
			map.set(blockId, new M.BlockStructure({ parentId: '', childrenIds }));
			this.treeMap.set(rootId, map);
		} else {
			set(element, 'childrenIds', childrenIds);
		};
	};

	/**
	 * Updates parent references in the structure map.
	 * @param {string} rootId - The root ID.
	 */
	updateStructureParents (rootId: string) {
		const map = this.getMap(rootId);

		for (const [ id, item ] of map.entries()) {
			(item.childrenIds || []).forEach(childId => {
				const child = map.get(childId);
				if (child && (child.parentId !== id)) {
					child.parentId = id;
					map.set(childId, child);
				};
			});
		};
	};

	/**
	 * Deletes a block from the block and structure maps.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The block ID to delete.
	 */
	delete (rootId: string, id: string) {
		const blocks = this.getBlocks(rootId);
		const map = this.getMap(rootId);

		this.set(rootId, blocks.filter(it => it.id != id));
		map.delete(id);
	};

	/**
	 * Sets restrictions for a root ID.
	 * @param {string} rootId - The root ID.
	 * @param {any} restrictions - The restrictions object.
	 */
	restrictionsSet (rootId: string, restrictions: any) {
		let map = this.restrictionMap.get(rootId);

		if (!map) {
			map = new Map();
		};

		map.set(rootId, restrictions.object);

		for (const item of restrictions.dataview) {
			map.set(item.blockId, item.restrictions);
		};

		this.restrictionMap.set(rootId, map);
	};

	/**
	 * Sets participants for a root ID.
	 * @param {string} rootId - The root ID.
	 * @param {I.BlockParticipant[]} participants - The participants array.
	 */
	participantsSet (rootId: string, participants: I.BlockParticipant[]) {
		let map = this.participantMap.get(rootId);

		if (!map) {
			map = new Map();
		};

		for (const item of participants) {
			map.set(item.blockId, item.participantId);
		};

		this.participantMap.set(rootId, map);
	};

	/**
	 * Gets the structure map for a root ID.
	 * @param {string} rootId - The root ID.
	 * @returns {Map<string, I.BlockStructure>} The structure map.
	 */
	getMap (rootId: string) {
		return this.treeMap.get(rootId) || new Map();
	};

	/**
	 * Gets a structure element by block ID.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {I.BlockStructure|null} The structure element or null.
	 */
	getMapElement (rootId: string, blockId: string): I.BlockStructure {
		const map = this.getMap(rootId);
		return map ? map.get(blockId) : null;
	};

	/**
	 * Gets the parent structure element for a block ID.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The block ID.
	 * @returns {I.BlockStructure|null} The parent structure element or null.
	 */
	getParentMapElement (rootId: string, id: string): I.BlockStructure {
		const element = this.getMapElement(rootId, id);
		return element ? this.getMapElement(rootId, element.parentId) : null;
	};

	/**
	 * Gets a block by ID.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The block ID.
	 * @returns {I.Block|null} The block or null.
	 */
	getLeaf (rootId: string, id: string): I.Block {
		const map = this.blockMap.get(rootId);
		return map ? map.get(id) : null;
	};

	/**
	 * Gets the parent block for a block ID.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The block ID.
	 * @returns {I.Block|null} The parent block or null.
	 */
	getParentLeaf (rootId: string, id: string): I.Block {
		const element = this.getMapElement(rootId, id);
		return element ? this.getLeaf(rootId, element.parentId) : null;
	};

	/**
	 * Gets all blocks for a root ID, optionally filtered.
	 * @param {string} rootId - The root ID.
	 * @param {(it: any) => boolean} [filter] - Optional filter function.
	 * @returns {I.Block[]} The blocks array.
	 */
	getBlocks (rootId: string, filter?: (it: any) => boolean): I.Block[] {
		const map = this.blockMap.get(rootId);
		if (!map) {
			return [];
		};

		const blocks = Array.from(map.values()).filter(it => it);
		return filter ? blocks.filter(it => filter(it)) : blocks;
	};

	getChildrenIds (rootId: string, blockId: string): string[] {
		const element = this.getMapElement(rootId, blockId);
		return element ? (element.childrenIds || []) : [];
	};

	getChildren (rootId: string, blockId: string, filter?: (it: any) => boolean): I.Block[] {
		return this.getChildrenIds(rootId, blockId).map(id => this.getLeaf(rootId, id)).filter((it: any) => {
			return it ? (filter ? filter(it) : true) : false;
		});
	};

	/**
	 * Gets the next block in a given direction, optionally using a check function.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The current block ID.
	 * @param {number} dir - The direction (1 for next, -1 for previous).
	 * @param {(item: I.Block) => any} [check] - Optional check function.
	 * @param {any[]} [list] - Optional list of blocks.
	 * @returns {any} The next block or null.
	 */
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		// If list is provided, use the legacy flat-list approach for compatibility
		if (list) {
			const idx = list.findIndex(item => item.id == id);
			const nidx = idx + dir;

			if ((nidx < 0) || (nidx > list.length - 1)) {
				return null;
			};

			const ret = list[nidx];
			if (check && ret) {
				return check(ret) ? ret : this.getNextBlock(rootId, ret.id, dir, check, list);
			} else {
				return ret;
			};
		};

		// Optimized: Use tree traversal instead of flattening entire tree
		const block = this.getLeaf(rootId, id);
		if (!block) {
			return null;
		};

		let nextBlock: I.Block = null;

		if (dir > 0) {
			// Going forward: try children first, then siblings, then parent's siblings
			const children = this.getChildren(rootId, id);
			if (children.length > 0) {
				nextBlock = children[0];
			} else {
				// No children, find next sibling or parent's next sibling
				nextBlock = this.getNextSiblingOrAncestorSibling(rootId, id, dir);
			};
		} else {
			// Going backward: try previous sibling's last descendant, then parent
			const element = this.getMapElement(rootId, id);
			if (!element) {
				return null;
			};

			const parent = this.getParentLeaf(rootId, id);
			if (!parent) {
				return null;
			};

			const siblings = this.getChildren(rootId, parent.id);
			const idx = siblings.findIndex(s => s.id === id);

			if (idx > 0) {
				// Has previous sibling, get its last descendant
				const prevSibling = siblings[idx - 1];
				nextBlock = this.getLastDescendant(rootId, prevSibling.id);
			} else {
				// No previous sibling, return parent
				nextBlock = parent.id === rootId ? null : parent;
			};
		};

		// Apply check filter
		if (nextBlock && check) {
			return check(nextBlock) ? nextBlock : this.getNextBlock(rootId, nextBlock.id, dir, check);
		};

		return nextBlock;
	};

	/**
	 * Helper: Gets the next sibling or ancestor's sibling.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The current block ID.
	 * @param {number} dir - The direction.
	 * @returns {I.Block|null} The next sibling or ancestor's sibling.
	 */
	private getNextSiblingOrAncestorSibling (rootId: string, id: string, dir: number): I.Block {
		// If we've reached the root itself, there's no next block
		if (id === rootId) {
			return null;
		};

		const element = this.getMapElement(rootId, id);
		if (!element) {
			return null;
		};

		const parent = this.getParentLeaf(rootId, id);
		if (!parent) {
			return null;
		};

		const siblings = this.getChildren(rootId, parent.id);
		const idx = siblings.findIndex(s => s.id === id);

		if (idx >= 0 && idx < siblings.length - 1) {
			// Has next sibling
			return siblings[idx + 1];
		};

		// No next sibling. If parent is root, we're at the end
		if (parent.id === rootId) {
			return null;
		};

		// Otherwise, check parent's next sibling
		return this.getNextSiblingOrAncestorSibling(rootId, parent.id, dir);
	};

	/**
	 * Helper: Gets the last descendant of a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The block ID.
	 * @returns {I.Block} The last descendant.
	 */
	private getLastDescendant (rootId: string, id: string): I.Block {
		const children = this.getChildren(rootId, id);
		if (children.length === 0) {
			return this.getLeaf(rootId, id);
		};

		return this.getLastDescendant(rootId, children[children.length - 1].id);
	};

	/**
	 * Gets the first block in a direction that passes a check.
	 * @param {string} rootId - The root ID.
	 * @param {number} dir - The direction (1 for first, -1 for last).
	 * @param {(item: I.Block) => any} check - The check function.
	 * @returns {I.Block} The first block passing the check.
	 */
	getFirstBlock (rootId: string, dir: number, check: (item: I.Block) => any): I.Block {
		// Optimized: Use tree traversal instead of flattening entire tree
		if (dir > 0) {
			// Find first block in depth-first order that passes check
			return this.findFirstInOrder(rootId, rootId, check);
		} else {
			// Find last block in depth-first order that passes check
			return this.findLastInOrder(rootId, rootId, check);
		};
	};

	/**
	 * Helper: Finds the first block in depth-first order that passes the check.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The current block ID.
	 * @param {(item: I.Block) => any} check - The check function.
	 * @returns {I.Block|null} The first matching block or null.
	 */
	private findFirstInOrder (rootId: string, blockId: string, check: (item: I.Block) => any): I.Block {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return null;
		};

		// Check current block
		if (check(block)) {
			return block;
		};

		// Check children in order
		const children = this.getChildren(rootId, blockId);
		for (const child of children) {
			const result = this.findFirstInOrder(rootId, child.id, check);
			if (result) {
				return result;
			};
		};

		return null;
	};

	/**
	 * Helper: Finds the last block in depth-first order that passes the check.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The current block ID.
	 * @param {(item: I.Block) => any} check - The check function.
	 * @returns {I.Block|null} The last matching block or null.
	 */
	private findLastInOrder (rootId: string, blockId: string, check: (item: I.Block) => any): I.Block {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return null;
		};

		// Check children in reverse order first (to get last descendant)
		const children = this.getChildren(rootId, blockId);
		for (let i = children.length - 1; i >= 0; i--) {
			const result = this.findLastInOrder(rootId, children[i].id, check);
			if (result) {
				return result;
			};
		};

		// Then check current block
		if (check(block)) {
			return block;
		};

		return null;
	};

	/**
	 * Gets the highest parent block for a block ID.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {I.Block|null} The highest parent block or null.
	 */
	getHighestParent (rootId: string, blockId: string): I.Block {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return null;
		};

		const parent = this.getLeaf(rootId, block.parentId);

		if (!parent || (parent && (parent.isPage() || parent.isLayoutDiv()))) {
			return block;
		} else {
			return this.getHighestParent(rootId, parent.id);
		};
	};

	/**
	 * Gets the next table row block in a direction.
	 * @param {string} rootId - The root ID.
	 * @param {string} rowId - The row block ID.
	 * @param {number} dir - The direction (1 for next, -1 for previous).
	 * @returns {I.Block|null} The next table row block or null.
	 */
	getNextTableRow (rootId: string, rowId: string, dir: number): I.Block {
		const rowContainer = this.getParentMapElement(rootId, rowId);
		if (!rowContainer) {
			return null;
		};

		const idx = rowContainer.childrenIds.indexOf(rowId);
		if (idx < 0) {
			return null;
		};

		const next = rowContainer.childrenIds[idx + dir];
		if (!next) {
			return null;
		};

		return this.getLeaf(rootId, next);
	};

	/**
	 * Checks if a block is a child of a parent block recursively.
	 * @param {string} rootId - The root ID.
	 * @param {string} parentId - The parent block ID.
	 * @param {string} blockId - The block ID to check.
	 * @returns {boolean} True if blockId is a child of parentId, false otherwise.
	 */
	checkIsChild (rootId: string, parentId: string, blockId: string): boolean {
		const element = this.getMapElement(rootId, parentId);

		if (!element.childrenIds.length) {
			return false;
		};

		if (element.childrenIds.includes(blockId)) {
			return true;
		};

		let ret = false;

		for (const childId of element.childrenIds) {
			ret = this.checkIsChild(rootId, childId, blockId);
			if (ret) {
				break;
			};
		};

		return ret;
	};

	/**
	 * Checks if a block is inside a table row.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {boolean} True if inside a table row, false otherwise.
	 */
	checkIsInsideTable (rootId: string, blockId: string): boolean {
		const parent = this.getParentLeaf(rootId, blockId);
		return parent && parent.isTableRow();
	};

	/**
	 * Updates the numbering for blocks in a tree.
	 * @param {string} rootId - The root ID.
	 */
	updateNumbers (rootId: string) {
		const root = this.wrapTree(rootId, rootId);
		if (!root) {
			return;
		};

		this.updateNumbersTree([ root ]);
	};

	/**
	 * Updates the numbering for a tree of blocks.
	 * @param {any[]} tree - The tree of blocks.
	 */
	updateNumbersTree (tree: any[]) {
		tree = (tree || []).filter(it => it);

		const unwrap = (list: any) => {
			list = list || [];

			const ret = [] as any[];
			for (const item of list) {
				item.childBlocks = item.childBlocks || [];

				for (let i = 0; i < item.childBlocks.length; i++) {
					const child = item.childBlocks[i];
					if (child.isLayoutDiv()) {
						item.childBlocks.splice(i, 1);
						i--;
						item.childBlocks = item.childBlocks.concat(unwrap(child.childBlocks));
					};
				};

				ret.push(item);
			};
			return ret;
		};

		const cb = (list: any[]) => {
			list = list || [];

			let n = 0;
			for (const item of list) {
				if (!item.isLayout()) {
					if (item.isTextNumbered()) {
						n++;
						$(`#marker-${item.id}`).text(`${n}.`);
					} else {
						n = 0;
					};
				};

				cb(unwrap(item.childBlocks));
			};
		};

		cb(unwrap(tree));
	};

	/**
	 * Gets the tree structure for a root ID and list of blocks.
	 * @param {string} rootId - The root ID.
	 * @param {any[]} list - The list of blocks.
	 * @returns {any[]} The tree structure.
	 */
	getTree (rootId: string, list: any[]): any[] {
		list = U.Common.objectCopy(list || []);
		for (const item of list) {
			item.childBlocks = this.getTree(item.id, this.getChildren(rootId, item.id));
		};
		return list;
	};

	/**
	 * Wraps the tree structure for a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any} The wrapped tree structure.
	 */
	wrapTree (rootId: string, blockId: string) {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return null;
		};

		const element = this.getMapElement(rootId, blockId);

		// Preserve the actual block object to maintain prototype methods
		const result: any = block;
		result.parentId = String(element?.parentId || '');
		result.childBlocks = this.getChildren(rootId, blockId);

		// Recursively wrap children
		result.childBlocks = result.childBlocks.map((child: I.Block) =>
			this.wrapTree(rootId, child.id)
		).filter(it => it);

		return result;
	};

	/**
	 * Unwraps a tree structure into a flat list of blocks.
	 * @param {any[]} tree - The tree structure.
	 * @returns {I.Block[]} The flat list of blocks.
	 */
	unwrapTree (tree: any[]): any[] {
		tree = (tree || []).filter(it => it);

		let ret = [] as I.Block[];
		for (const item of tree) {
			const cb = item.childBlocks;
			
			ret.push(item);
			
			if (cb && cb.length) {
				ret = ret.concat(this.unwrapTree(cb));
			};

			delete(item.childBlocks);
		};
		return ret;
	};

	/**
	 * Gets table data for a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {object} The table data including childrenIds, columns, rows, etc.
	 */
	getTableData (rootId: string, blockId: string) {
		const childrenIds = this.getChildrenIds(rootId, blockId);
		const children = this.getChildren(rootId, blockId);
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = columnContainer ? this.getChildren(rootId, columnContainer.id, it => it.isTableColumn()) : [];
		const rows = rowContainer ? this.getChildren(rootId, rowContainer.id, it => it.isTableRow()) : [];

		return { childrenIds, columnContainer, columns, rowContainer, rows };
	};

	/**
	 * Gets restrictions for a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any[]} The restrictions array.
	 */
	getRestrictions (rootId: string, blockId: string) {
		const map = this.restrictionMap.get(rootId);
		if (!map) {
			return [];
		};

		return map.get(blockId) || [];
	};

	/**
	 * Gets the participant IDs map for a root ID.
	 * @param {string} rootId - The root ID.
	 * @returns {Map<string, string>} The participant IDs map.
	 */
	getParticipantIds (rootId: string) {
		return this.participantMap.get(rootId) || new Map();
	};

	/**
	 * Gets the participant ID for a block.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {string} The participant ID.
	 */
	getParticipantId (rootId: string, blockId: string): string {
		const map = this.getParticipantIds(rootId);
		return map ? String(map.get(blockId) || '') : '';
	};

	/**
	 * Checks if a block has the required flags.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any[]} flags - The flags to check.
	 * @returns {boolean} True if allowed, false otherwise.
	 */
	checkFlags (rootId: string, blockId: string, flags: any[]): boolean {
		if (!rootId || !blockId) {
			return false;
		};

		return this.isAllowed(this.getRestrictions(rootId, blockId), flags);
	};

	/**
	 * Checks if the given restrictions and flags allow an action.
	 * @param {any[]} restrictions - The restrictions array.
	 * @param {any[]} flags - The flags to check.
	 * @param {boolean} [noSpaceCheck] - Whether to skip the space check.
	 * @returns {boolean} True if allowed, false otherwise.
	 */
	isAllowed (restrictions: any[], flags: any[], noSpaceCheck?: boolean): boolean {
		if (!noSpaceCheck && !U.Space.canMyParticipantWrite()) {
			return false;
		};

		restrictions = restrictions || [];
		flags = flags || [];

		for (const flag of flags) {
			if (restrictions.indexOf(flag) >= 0) {
				return false;
			};
		};
		return true;
	};

	/**
	 * Toggles a block's toggled state in the UI and storage.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {boolean} v - The toggled value.
	 */
	toggle (rootId: string, blockId: string, v: boolean) {
		const element = $(`#block-${blockId}`);
		if (!element.length) {
			return;
		};

		element.toggleClass('isToggled', v);
		Storage.setToggle(rootId, blockId, v);

		U.Common.triggerResizeEditor(keyboard.isPopup());
		element.find('.resizable').trigger('resizeInit');
	};


	/**
	 * Updates the markup for all text blocks in a root.
	 * @param {string} rootId - The root ID.
	 */
	updateMarkup (rootId: string) {
		const blocks = this.getBlocks(rootId, it => it && it.isText());

		for (const block of blocks) {
			let marks = block.content.marks || [];
			if (!marks.length) {
				continue;
			};

			marks = U.Common.objectCopy(marks);
			marks.sort(Mark.sort);

			let { text } = block.content;
			let update = false;

			for (let n = 0; n < marks.length; ++n) {
				const mark = marks[n];
				if ((mark.type != I.MarkType.Mention) || !mark.param) {
					continue;
				};

				const { from, to } = mark.range;
				const object = S.Detail.get(rootId, mark.param, [ 'name', 'layout', 'snippet', 'fileExt', 'timestamp' ], true);

				if (object._empty_) {
					continue;
				};

				const old = text.substring(from, to);
				const name = U.String.shorten(U.Object.name(object, true).trim(), J.Constant.limit.string.mention);

				if (old != name) {
					const d = String(old || '').length - String(name || '').length;
					text = U.String.insert(text, name, mark.range.from, mark.range.to);

					if (d != 0) {
						mark.range.to -= d;

						for (let i = 0; i < marks.length; ++i) {
							const m = marks[i];
							if ((n == i) || (m.range.to <= from)) {
								continue;
							};
							if (m.range.from >= to) {
								marks[i].range.from -= d;
							};
							marks[i].range.to -= d;
						};
					};

					update = true;
				};
			};

			if (update) {
				this.updateContent(rootId, block.id, { text, marks });
			};
		};
	};

	/**
	 * Gets layout IDs for a list of block IDs.
	 * @param {string} rootId - The root ID.
	 * @param {string[]} ids - The block IDs.
	 * @returns {string[]} The layout IDs.
	 */
	getLayoutIds (rootId: string, ids: string[]) {
		if (!ids.length) {
			return [];
		};
		
		let ret = [];

		for (const id of ids) {
			const parent = this.getParentLeaf(rootId, id);
			if (!parent || !parent.isLayout() || parent.isLayoutHeader()) {
				continue;
			};
			
			if (ret.indexOf(parent.id) < 0) {
				ret.push(parent.id);
			};
			
			if (parent.isLayoutColumn()) {
				ret = ret.concat(this.getLayoutIds(rootId, [ parent.id ]));
			};
		};
		
		return ret;
	};

	/**
	 * Triggers an update event for widget views for a root.
	 * @param {string} rootId - The root ID.
	 */
	updateWidgetViews (rootId: string) {
		this.triggerWidgetEvent('updateWidgetViews', rootId);
	};

	/**
	 * Triggers an update event for widget data for a root.
	 * @param {string} rootId - The root ID.
	 */
	updateWidgetData (rootId: string) {
		this.triggerWidgetEvent('updateWidgetData', rootId);
	};

	/**
	 * Triggers a widget event for a root.
	 * @param {string} code - The event code.
	 * @param {string} rootId - The root ID.
	 */
	triggerWidgetEvent (code: string, rootId: string) {
		const win = $(window);
		const blocks = this.getBlocks(this.widgets, it => it.isWidget());

		blocks.forEach(block => {
			const children = this.getChildren(this.widgets, block.id, it => it.isLink() && (it.getTargetObjectId() == rootId));
			if (children.length) {
				win.trigger(`${code}.${block.id}`);
			};
		});
	};

	/**
	 * Returns structure for Table of contents
	 */
	getTableOfContents (rootId: string, withTitle?: boolean) {
		const list: any[] = [];
		
		let hasH1 = false;
		let hasH2 = false;

		// Optimized: Direct traversal instead of wrapTree/unwrapTree
		const collectHeaders = (blockId: string) => {
			const block = this.getLeaf(rootId, blockId);
			if (!block) {
				return;
			};

			// Check if this block should be included
			const isHeader = block.isTextHeader();
			const isTitle = withTitle && block.isTextTitle();

			if (isHeader || isTitle) {
				let depth = 0;

				if (block.isTextHeader1()) {
					depth = 0;
					hasH1 = true;
					hasH2 = false;
				};

				if (block.isTextHeader2()) {
					hasH2 = true;
					if (hasH1) depth++;
				};

				if (block.isTextHeader3()) {
					if (hasH1) depth++;
					if (hasH2) depth++;
				};

				list.push({
					depth,
					id: block.id,
					text: U.String.htmlSpecialChars(String(block.content.text || translate('defaultNamePage'))),
					block,
				});
			};

			// Recursively process children
			const childrenIds = this.getChildrenIds(rootId, blockId);
			for (const childId of childrenIds) {
				collectHeaders(childId);
			};
		};

		// Start traversal from root
		collectHeaders(rootId);

		// Adjust depth if withTitle is true
		if (withTitle) {
			list.forEach((it: any) => {
				if (!it.block.isTextTitle()) {
					it.depth++;
				};
			});
		};

		return list;
	};

	getWidgetsForTarget (id: string): I.Block[] {
		const { widgets } = this;
		const childrenIds = this.getChildrenIds(widgets, widgets); // Subscription

		const list = this.getBlocks(widgets, (block: I.Block) => {
			if (!block.isWidget()) {
				return false;
			};

			const childrenIds = this.getChildrenIds(widgets, block.id);
			if (!childrenIds.length) {
				return false;
			};

			const child = this.getLeaf(widgets, childrenIds[0]);
			if (!child) {
				return false;
			};

			const target = child.getTargetObjectId();
			return id == target;
		});

		return list;
	};

};

export const Block: BlockStore = new BlockStore();