import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import { I, M, UtilCommon, UtilObject, UtilFile, Storage, Mark, translate, keyboard, UtilSpace } from 'Lib';
import { detailStore } from 'Store';
const Constant = require('json/constant.json');

class BlockStore {

    public profileId = '';
	public widgetsId = '';
	public rootId = '';
	public spaceviewId = '';

    public treeMap: Map<string, Map<string, I.BlockStructure>> = new Map();
    public blockMap: Map<string, Map<string, I.Block>> = new Map();
    public restrictionMap: Map<string, Map<string, any>> = new Map();

    constructor() {
        makeObservable(this, {
            profileId: observable,
            profile: computed,
			root: computed,
            profileSet: action,
            widgetsSet: action,
            set: action,
            clear: action,
            clearAll: action,
            add: action,
            update: action,
			updateContent: action,
            updateStructure: action,
            delete: action
        });
    };

    get profile (): string {
		return String(this.profileId || '');
	};

	get widgets (): string {
		return String(this.widgetsId || '');
	};

	get root (): string {
		return String(this.rootId || '');
	};

	get spaceview (): string {
		return String(this.spaceviewId || '');
	};

	profileSet (id: string) {
		this.profileId = String(id || '');
	};

	widgetsSet (id: string) {
		this.widgetsId = String(id || '');
	};

	rootSet (id: string) {
		this.rootId = String(id || '');
	};

	spaceviewSet (id: string) {
		this.spaceviewId = String(id || '');
	};
	
    set (rootId: string, blocks: I.Block[]) {
		const map: Map<string, I.Block> = new Map();
		
		blocks.forEach((it: I.Block) => {
			map.set(it.id, it);
		});

		this.blockMap.set(rootId, map);
	};

    add (rootId: string, block: I.Block) {
		const map = this.blockMap.get(rootId);
		if (map) {
			map.set(block.id, block);
		};
	};

    update (rootId: string, blockId: string, param: any) {
		const block = this.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		set(block, param);
	};

	updateContent (rootId: string, blockId: string, content: any) {
		const block = this.getLeaf(rootId, blockId);
		if (block) {
			set(block.content, content);
		};
	};

	clear (rootId: string) {
		this.blockMap.delete(rootId);
		this.treeMap.delete(rootId);
	};

    clearAll () {
		this.profileSet('');
		this.widgetsSet('');
		this.rootSet('');

		this.blockMap.clear();
		this.treeMap.clear();
		this.restrictionMap.clear();
	};

	setStructure (rootId: string, list: any[]) {
		const map: Map<string, I.BlockStructure> = new Map();

		list = UtilCommon.objectCopy(list || []);
		list.map((item: any) => {
			map.set(item.id, {
				parentId: '',
				childrenIds: item.childrenIds || [],
			});
		});

		this.treeMap.set(rootId, map);

		for (const [ id, item ] of map.entries()) {
			map.set(id, new M.BlockStructure(item));
		};
	};

    updateStructure (rootId: string, blockId: string, childrenIds: string[]) {
		const element = this.getMapElement(rootId, blockId);
		if (!element) {
			const map = this.getMap(rootId);
			map.set(blockId, new M.BlockStructure({ parentId: '', childrenIds }));
		} else {
			set(element, 'childrenIds', childrenIds);
		};
	};

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

    delete (rootId: string, id: string) {
		const blocks = this.getBlocks(rootId);
		const map = this.getMap(rootId);

		this.set(rootId, blocks.filter(it => it.id != id));
		map.delete(id);
	};

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

    getMap (rootId: string) {
		return this.treeMap.get(rootId) || new Map();
	};

    getMapElement (rootId: string, blockId: string) {
		const map = this.getMap(rootId);
		return map ? map.get(blockId) : null;
	};

    getLeaf (rootId: string, id: string): any {
		const map = this.blockMap.get(rootId);
		return map ? map.get(id) : null;
	};

	getParentLeaf (rootId: string, id: string) {
		const element = this.getMapElement(rootId, id);
		return element ? this.getLeaf(rootId, element.parentId) : null;
	};

	getParentMapElement (rootId: string, id: string) {
		const element = this.getMapElement(rootId, id);
		return element ? this.getMapElement(rootId, element.parentId) : null;
	};

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

    // If check is present - find next block if check passes or continue to next block in "dir" direction, else just return next block;
    getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!list) {
			list = this.unwrapTree([ this.wrapTree(rootId, rootId) ]);
		};

		const idx = list.findIndex(item => item.id == id);
		if ((idx + dir < 0) || (idx + dir > list.length - 1)) {
			return null;
		};

		const ret = list[idx + dir];
		if (check && ret) {
			return check(ret) ? ret : this.getNextBlock(rootId, ret.id, dir, check, list);
		} else {
			return ret;
		};
	};

    getFirstBlock (rootId: string, dir: number, check: (item: I.Block) => any): I.Block {
		const list = this.unwrapTree([ this.wrapTree(rootId, rootId) ]).filter(check);
		return dir > 0 ? list[0] : list[list.length - 1];
	};

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

	// Check if blockId is inside parentId children recursively
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

	// Check if blockId is inside table
	checkIsInsideTable (rootId: string, blockId: string): boolean {
		const parent = this.getParentLeaf(rootId, blockId);
		return parent && parent.isTableRow();
	};

    updateNumbers (rootId: string) {
		const root = this.wrapTree(rootId, rootId);
		if (!root) {
			return;
		};

		this.updateNumbersTree([ root ]);
	};

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

    getTree (rootId: string, list: any[]): any[] {
		list = UtilCommon.objectCopy(list || []);
		for (const item of list) {
			item.childBlocks = this.getTree(item.id, this.getChildren(rootId, item.id));
		};
		return list;
	};

    wrapTree (rootId: string, blockId: string) {
		const map = this.getMap(rootId);
		const ret: any = {};

		for (const [ id, item ] of map.entries()) {
			ret[id] = this.getLeaf(rootId, id);
			if (ret[id]) {
				ret[id].parentId = String(item.parentId || '');
				ret[id].childBlocks = this.getChildren(rootId, id);
			};
		};

		return ret[blockId];
	};

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

	getTableData (rootId: string, blockId: string) {
		const childrenIds = this.getChildrenIds(rootId, blockId);
		const children = this.getChildren(rootId, blockId);
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = columnContainer ? this.getChildren(rootId, columnContainer.id, it => it.isTableColumn()) : [];
		const rows = rowContainer ? this.getChildren(rootId, rowContainer.id, it => it.isTableRow()) : [];

		return { childrenIds, columnContainer, columns, rowContainer, rows };
	};

    getRestrictions (rootId: string, blockId: string) {
		const map = this.restrictionMap.get(rootId);
		if (!map) {
			return [];
		};

		return map.get(blockId) || [];
	};

	checkFlags (rootId: string, blockId: string, flags: any[]): boolean {
		if (!rootId || !blockId) {
			return false;
		};

		return this.isAllowed(this.getRestrictions(rootId, blockId), flags);
	};

    isAllowed (restrictions: any[], flags: any[]): boolean {
		if (!UtilSpace.canMyParticipantWrite()) {
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

    toggle (rootId: string, blockId: string, v: boolean) {
		const element = $(`#block-${blockId}`);

		v ? element.addClass('isToggled') : element.removeClass('isToggled');
		Storage.setToggle(rootId, blockId, v);
		
		UtilCommon.triggerResizeEditor(keyboard.isPopup());
		element.find('.resizable').trigger('resizeInit');
	};

	updateMarkup (rootId: string) {
		const blocks = this.getBlocks(rootId, it => it && it.isText());

		for (const block of blocks) {
			let marks = block.content.marks || [];

			if (!marks.length) {
				continue;
			};

			marks = UtilCommon.objectCopy(marks);
			marks.sort(Mark.sort);

			let { text } = block.content;
			let update = false;

			for (let n = 0; n < marks.length; ++n) {
				const mark = marks[n];
				if ((mark.type != I.MarkType.Mention) || !mark.param) {
					continue;
				};

				const { from, to } = mark.range;
				const object = detailStore.get(rootId, mark.param, [ 'name', 'layout', 'snippet', 'fileExt' ], true);

				if (object._empty_) {
					continue;
				};

				const old = text.substring(from, to);

				let name = '';
				if (object.layout == I.ObjectLayout.Note) {
					name = object.name || translate('commonEmpty');
				} else
				if (UtilObject.isFileLayout(object.layout)) {
					name = UtilFile.name(object);
				} else {
					name = object.name;
				};

				name = UtilCommon.shorten(object.name.trim(), 30);

				if (old != name) {
					const d = String(old || '').length - String(name || '').length;
					text = UtilCommon.stringInsert(text, name, mark.range.from, mark.range.to);

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

	checkTypeSelect (rootId: string) {
		const header = this.getMapElement(rootId, Constant.blockId.header);
		if (!header) {
			return;
		};

		const object = detailStore.get(rootId, rootId, [ 'internalFlags' ]);
		const check = (object.internalFlags || []).includes(I.ObjectFlag.SelectType);
		const exists = this.checkBlockTypeExists(rootId);
		const change = (check && !exists) || (!check && exists);
		
		let childrenIds = header.childrenIds || [];
		if (change) {
			childrenIds = exists ? childrenIds.filter(it => it != Constant.blockId.type) : [ Constant.blockId.type ].concat(childrenIds);
		};

		if (change) {
			this.updateStructure(rootId, Constant.blockId.header, childrenIds);
		};
	};

	checkBlockTypeExists (rootId: string): boolean {
		const header = this.getMapElement(rootId, Constant.blockId.header);
		return header ? header.childrenIds.includes(Constant.blockId.type) : false;
	};

	getLayoutIds (rootId: string, ids: string[]) {
		if (!ids.length) {
			return [];
		};
		
		let ret: any[] = [];
		for (const id of ids) {
			const parent = this.getParentLeaf(rootId, id);
			if (!parent || !parent.isLayout() || parent.isLayoutDiv() || parent.isLayoutHeader()) {
				continue;
			};
			
			ret.push(parent.id);
			
			if (parent.isLayoutColumn()) {
				ret = ret.concat(this.getLayoutIds(rootId, [ parent.id ]));
			};
		};
		
		return ret;
	};

	updateWidgetViews (rootId: string) {
		this.triggerWidgetEvent('updateWidgetViews', rootId);
	};

	updateWidgetData (rootId: string) {
		this.triggerWidgetEvent('updateWidgetData', rootId);
	};

	triggerWidgetEvent (code: string, rootId: string) {
		const win = $(window);
		const blocks = this.getBlocks(this.widgets, it => it.isWidget());

		blocks.forEach(block => {
			const children = this.getChildren(this.widgets, block.id, it => it.isLink() && (it.content.targetBlockId == rootId));
			if (children.length) {
				win.trigger(`${code}.${block.id}`);
			};
		});
	};

	closeRecentWidgets () {
		const { recentEdit, recentOpen } = Constant.widgetId;
		const blocks = this.getBlocks(this.widgets, it => it.isLink() && [ recentEdit, recentOpen ].includes(it.content.targetBlockId));

		if (blocks.length) {
			blocks.forEach(it => {
				if (it.parentId) {
					Storage.setToggle('widget', it.parentId, true);
				};
			});
		};
	};

};

 export const blockStore: BlockStore = new BlockStore();