import { observable, action, computed, set, makeObservable } from 'mobx';
import $ from 'jquery';
import { I, M, Util, Storage, Mark, translate, keyboard } from 'Lib';
import { detailStore } from 'Store';
import Constant from 'json/constant.json';

class BlockStore {

    public rootId = '';
    public profileId = '';
	public widgetsId = '';
    public recentId = '';

    public treeMap: Map<string, Map<string, I.BlockStructure>> = new Map();
    public blockMap: Map<string, Map<string, I.Block>> = new Map();
    public restrictionMap: Map<string, Map<string, any>> = new Map();

    constructor() {
        makeObservable(this, {
            rootId: observable,
            profileId: observable,
            recentId: observable,
            root: computed,
            profile: computed,
            recent: computed,
            rootSet: action,
            profileSet: action,
            widgetsSet: action,
            recentSet: action,
            set: action,
            clear: action,
            clearAll: action,
            add: action,
            update: action,
			updateContent: action,
            updateStructure: action,
            delete: action
        });
    }

    get root (): string {
		return this.rootId;
	};

    get profile (): string {
		return this.profileId;
	};

	get widgets (): string {
		return this.widgetsId;
	};

    get recent (): string {
		return this.recentId;
	};

    rootSet (id: string) {
		this.rootId = String(id || '');
	};

	profileSet (id: string) {
		this.profileId = String(id || '');
	};

	widgetsSet (id: string) {
		this.widgetsId = String(id || '');
	};

    recentSet (id: string) {
		this.recentId = String(id || '');
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
		this.recentSet('');
		this.rootSet('');

		this.blockMap.clear();
		this.treeMap.clear();
		this.restrictionMap.clear();
	};

	setStructure (rootId: string, list: any[]) {
		const map: Map<string, I.BlockStructure> = new Map();

		list = Util.objectCopy(list || []);
		list.map((item: any) => {
			map.set(item.id, {
				parentId: '',
				childrenIds: item.childrenIds || [],
			});
		});

		for (const [ id, item ] of map.entries()) {
			(item.childrenIds || []).map((it: string) => {
				const check = map.get(it);
				if (check && (check.parentId != id)) {
					check.parentId = id;
					map.set(it, check);
				};
			});
		};

		for (const [ id, item ] of map.entries()) {
			map.set(id, new M.BlockStructure(item));
		};

		this.treeMap.set(rootId, map);
	};

    updateStructure (rootId: string, blockId: string, childrenIds: string[]) {
		const map = this.getMap(rootId);

		let element = this.getMapElement(rootId, blockId);
		if (!element) {
			element = new M.BlockStructure({ parentId: '', childrenIds: childrenIds });
		} else {
			set(element, 'childrenIds', childrenIds);
		};

		map.set(blockId, element);

		// Update parentId
		for (const [ id, item ] of map.entries()) {
			(item.childrenIds || []).map((it: string) => {
				const check = map.get(it);
				if (check && (check.parentId != id)) {
					check.parentId = id;
					map.set(it, check);
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

    getBlocks (rootId: string, filter?: (it: any) => boolean): I.Block[] {
		const map = this.blockMap.get(rootId);
		if (!map) {
			return [];
		};

		const blocks = Array.from(map.values());
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
		const block = blockStore.getLeaf(rootId, blockId);
		const parent = blockStore.getLeaf(rootId, block.parentId);

		if (parent.isPage() || parent.isLayoutDiv()) {
			return block;
		} else {
			return this.getHighestParent(rootId, parent.id);
		};
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

				cb(item.childBlocks);
			};
		};

		cb(unwrap(tree));
	};

    getTree (rootId: string, list: any[]): any[] {
		list = Util.objectCopy(list || []);
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
		
		Util.triggerResizeEditor(keyboard.isPopup());
		element.find('.resizable').trigger('resizeInit');
	};

	updateMarkup (rootId: string) {
		const blocks = Util.objectCopy(this.getBlocks(rootId, it => it.isText()));

		for (const block of blocks) {
			const marks = block.content.marks || [];

			if (!marks.length) {
				continue;
			};

			marks.sort(Mark.sort);

			let { text } = block.content;
			let update = false;

			for (let n = 0; n < marks.length; ++n) {
				const mark = marks[n];
				if ((mark.type != I.MarkType.Mention) || !mark.param) {
					continue;
				};

				const { from, to } = mark.range;
				const object = detailStore.get(rootId, mark.param, [ 'name', 'layout', 'snippet' ], true);

				if (object._empty_) {
					continue;
				};

				const old = text.substr(from, to - from);

				let name = Util.shorten(object.name, 30);
				if (object.layout == I.ObjectLayout.Note) {
					name = name || translate('commonEmpty');
				};
				name = Mark.fromUnicode(name).trim();

				if (old != name) {
					const d = String(old || '').length - String(name || '').length;
					text = Util.stringInsert(text, name, mark.range.from, mark.range.to);

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

		let change = false;
		if (check) {
			if (!this.checkBlockTypeExists(rootId)) {
				header.childrenIds.push(Constant.blockId.type);
				change = true;
			};
		} else {
			header.childrenIds = header.childrenIds.filter(it => it != Constant.blockId.type);
			change = true;
		};
		
		if (change) {
			this.updateStructure(rootId, Constant.blockId.header, header.childrenIds);
		};
	};

	checkBlockTypeExists (rootId: string): boolean {
		const header = this.getMapElement(rootId, Constant.blockId.header);
		return header ? header.childrenIds.includes(Constant.blockId.type) : false;
	};

};

 export const blockStore: BlockStore = new BlockStore();
