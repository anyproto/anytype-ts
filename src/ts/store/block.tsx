import { observable, action, computed, set, intercept } from 'mobx';
import { I, M, Util, StructDecode, StructEncode } from 'ts/lib';
import { MacUpdater } from 'electron-updater';

const com = require('proto/commands.js');
const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');

class BlockStore {
	@observable public rootId: string = '';
	@observable public archiveId: string = '';
	@observable public profileId: string = '';
	@observable public breadcrumbsId: string = '';
	
	public treeObject: Map<string, any[]> = new Map();
	public blockObject: Map<string, any[]> = new Map();
	public detailObject: Map<string, Map<string, any>> = new Map();
	
	@computed
	get root (): string {
		return this.rootId;
	};
	
	@computed
	get archive (): string {
		return this.archiveId;
	};
	
	@computed
	get profile (): string {
		return this.profileId;
	};
	
	@computed
	get breadcrumbs (): string {
		return this.breadcrumbsId;
	};
	
	@action
	rootSet (id: string) {
		this.rootId = String(id || '');
	};
	
	@action
	archiveSet (id: string) {
		this.archiveId = String(id || '');
	};
	
	@action
	profileSet (id: string) {
		this.profileId = String(id || '');
	};
	
	@action
	breadcrumbsSet (id: string) {
		this.breadcrumbsId = String(id || '');
	};
	
	@action
	detailsSet (rootId: string, details: any[]) {
		let map = observable(new Map());
		
		for (let item of details) {
			if (!item.id || !item.details) {
				continue;
			};
			
			map.set(item.id, StructDecode.decodeStruct(item.details));
		};
		
		intercept(map as any, (change: any) => {
			let item = map.get(change.name);
			if (Util.objectCompare(change.newValue, item)) {
				return null;
			};
			return change;
		});
		
		this.detailObject.set(rootId, map);
	};
	
	@action
	detailsUpdate (rootId: string, item: any, decode: boolean) {
		if (!item.id || !item.details) {
			return;
		};
		
		let map = this.detailObject.get(rootId);
		let create = false;
		
		if (!map) {
			map = observable(new Map());
			create = true;
		};
		
		map.set(item.id, decode ? StructDecode.decodeStruct(item.details) : item.details);
		
		if (create) {
			intercept(map as any, (change: any) => {
				let item = map.get(change.name);
				if (Util.objectCompare(change.newValue, item)) {
					return null;
				};
				return change;
			});
			
			this.detailObject.set(rootId, map);
		};
	};
	
	@action
	blocksSet (rootId: string, blocks: I.Block[]) {
		this.blockObject.set(rootId, blocks);
		this.treeObject.set(rootId, this.getStructure(blocks));
	};
	
	@action
	blocksClear (rootId: string) {
		this.blockObject.delete(rootId);
		this.treeObject.delete(rootId);
	};

	@action
	blocksClearAll () {
		this.blockObject = new Map();
		this.treeObject = new Map();
		this.detailObject = new Map();
	};
	
	@action
	blockAdd (rootId: string, block: I.Block, index: number) {
		block = new M.Block(block);
		
		let blocks = this.getBlocks(rootId);
		let map = this.getMap(rootId);
		
		blocks.push(block);
		
		map[block.id] = observable({
			parentId: block.parentId,
			childrenIds: block.childrenIds,
		});
		
		intercept(map[block.id] as any, (change: any) => {
			if (change.newValue === map[block.id][change.name]) {
				return null;
			};
			return change;
		});
	};
	
	@action
	blockUpdate (rootId: string, param: any) {
		let block = this.getLeaf(rootId, param.id);
		if (!block) {
			return;
		};

		set(block, param);
	};
	
	@action
	blockUpdateStructure (rootId: string, id: string, childrenIds: string[]) {
		let map = this.getMap(rootId);
		
		set(map[id], 'childrenIds', childrenIds);
		
		// Update parentId
		for (let id in map) {
			(map[id].childrenIds || []).map((it: string) => { 
				if (map[it]) {
					map[it].parentId = id;
				};
			});
		};
	};
	
	@action
	blockDelete (rootId: string, id: string) {
		let blocks = this.getBlocks(rootId);
		let map = this.getMap(rootId);
		
		blocks = blocks.filter((it: any) => { return it.id != id; });
		delete(map[id]);
	};
	
	getMap (rootId: string) {
		return this.treeObject.get(rootId) || {};
	};
	
	getLeaf (rootId: string, id: string): any {
		let blocks = this.getBlocks(rootId);
		return blocks.find((it: any) => { return it.id == id; });
	};
	
	getBlocks (rootId: string, filter?: (it: any) => boolean) {
		let blocks = this.blockObject.get(rootId) || [];
		
		if (!filter) {
			return blocks;
		};
		
		return blocks.filter((it: any) => {
			if (filter) {
				return filter(it);
			};
			return true;
		});
	};
	
	getChildrenIds (rootId: string, id: string): string[] {
		const map = this.getMap(rootId);
		const element = map[id] || {};
		
		return element.childrenIds || [];	
	};
	
	getChildren (rootId: string, id: string, filter?: (it: any) => boolean) {
		let blocks = this.getBlocks(rootId);
		let map = this.getMap(rootId);
		let element = map[id] || {};
		
		let childBlocks = (element.childrenIds || []).map((it: string) => {
			return blocks.find((item: any) => { return item.id == it; });
		}).filter((it: any) => {
			if (!it) {
				return false;
			};
			if (filter) {
				return filter(it);
			};
			return true;
		});
		return childBlocks;
	};
	
	// If check is present - find next block if check passes or continue to next block in "dir" direction, else just return next block; 
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!list) {
			list = this.unwrapTree([ this.wrapTree(rootId) ]);
		};
		
		let idx = list.findIndex((item: I.Block) => { return item.id == id; });
		if (idx + dir < 0 || idx + dir > list.length - 1) {
			return null;
		};
		
		let ret = list[idx + dir];
		if (check && ret) {
			return check(ret) ? ret : this.getNextBlock(rootId, ret.id, dir, check, list);
		} else {
			return ret;
		};
	};
	
	getFirstBlock (rootId: string, dir: number, check: (item: I.Block) => any): I.Block {
		const list = this.unwrapTree([ this.wrapTree(rootId) ]).filter(check);
		return dir > 0 ? list[0] : list[list.length - 1];
	};
	
	setNumbers (rootId: string) {
		const root = this.wrapTree(rootId);
		if (!root) {
			return;
		};
		
		const cb = (list: any[]) => {
			list = list || [];
			
			let n = 0;
			for (let item of list) {
				if (!item.isLayout()) {
					if (item.isNumbered()) {
						n++;
						$('#marker-' + item.id).text(`${n}.`);
					} else {
						n = 0;
					};
				};
				
				cb(item.childBlocks);
			};
		};
		
		window.setTimeout(() => { cb(root.childBlocks); }, 10);
	};
	
	getStructure (list: I.Block[]) {
		list = Util.objectCopy(list || []);
		
		let map: any = {};
		
		list.map((item: any) => {
			map[item.id] = observable({
				parentId: '',
				childrenIds: item.childrenIds || [],
			});
		});
		
		for (let id in map) {
			(map[id].childrenIds || []).map((it: string) => { 
				if (map[it]) {
					map[it].parentId = id;
				};
			});
		};
		
		return map;
	};
	
	getTree (rootId: string, list: I.Block[]): I.Block[] {
		list = Util.objectCopy(list || []);
		
		let map: any = {};
		
		for (let item of list) {
			map[item.id] = item;
		};

		for (let item of list) {
			let element = map[item.id];
			if (!element) {
				continue;
			};

			let childBlocks = element.childBlocks || [];
			let childrenIds = item.childrenIds || [];

			for (let id of childrenIds) {
				const child = map[id];
				if (!child) {
					continue;
				};
				
				child.parentId = item.id;
				childBlocks.push(child);
			};

			map[item.id].childBlocks = Util.arrayUniqueObjects(childBlocks, 'id');
		};
		
		return (map[rootId] || {}).childBlocks || [];
	};
	
	wrapTree (rootId: string) {
		let map = this.getMap(rootId);
		let ret: any = {};
		for (let id in map) {
			ret[id] = this.getLeaf(rootId, id);
			ret[id].parentId = String(map[id].parentId || '');
			ret[id].childBlocks = this.getChildren(rootId, id);
		};
		return ret[rootId];
	};
	
	unwrapTree (tree: any[]): any[] {
		tree = tree || [];
		
		let ret = [] as I.Block[];
		for (let item of tree) {
			let cb = item.childBlocks;
			delete(item.childBlocks);
			
			ret.push(item);
			if (cb && cb.length) {
				ret = ret.concat(this.unwrapTree(cb));
			};
		};
		return ret;
	};
	
	getDetailsMap (rootId: string) {
		return this.detailObject.get(rootId) || new Map();
	};
	
	getDetails (rootId: string, id: string): any {
		const map = this.getDetailsMap(rootId);
		const item = Util.objectCopy(map.get(id) || {});
		
		item.name = String(item.name || Constant.default.name);
		return item;
	};
	
	prepareBlockFromProto (block: any): I.Block {
		let type = block.content;
		let content = block[type];
		let fields = block.fields;
		let file = block.file;
		
		let item: I.Block = {
			id: block.id,
			type: type,
			childrenIds: block.childrenIds || [],
			fields: {} as any,
			content: {} as any,
			align: Number(block.align) || 0,
			bgColor: String(block.backgroundColor || ''),
		};
		
		if (block.fields) {
			item.fields = StructDecode.decodeStruct(block.fields);
			
			if (type == I.BlockType.Page) {
				item.fields.name = String(item.fields.name || Constant.default.name);
			};
		};
		
		if (content) {
			item.content = Util.objectCopy(content);
			item.content.style = content.style;
			
			if (content.fields) {
				item.content.fields = StructDecode.decodeStruct(content.fields);
			};
			
			if (type == I.BlockType.Text) {
				let marks: any = [];
				
				if (content.marks && content.marks.marks && content.marks.marks.length) {
					for (let mark of content.marks.marks) {
						marks.push({
							type: Number(mark.type) || 0,
							param: String(mark.param || ''),
							range: {
								from: Number(mark.range.from) || 0,
								to: Number(mark.range.to) || 0,
							}
						});
					};
				};
				
				item.content.style = content.style;
				item.content.marker = content.marker;
				item.content.marks = marks;
			};
			
			if (type == I.BlockType.Link) {
				if (item.content.style == I.LinkStyle.Page) {
					item.content.fields = item.content.fields || {};
					item.content.fields.name = String(item.content.fields.name || Constant.default.name);
				};
			};
			
			if (type == I.BlockType.File) {
				item.content = Util.objectCopy(content);
				item.content.type = content.type;
				item.content.state = content.state;
			};
		};
		
		return item;
	};
	
	prepareBlockToProto (data: any) {
		data.content = Util.objectCopy(data.content || {});
		
		let block: any = {
			id: String(data.id || ''),
			align: Number(data.align) || 0,
			backgroundColor: String(data.bgColor || ''),
		};
		
		if (data.childrenIds) {
			block.childrenIds = data.childrenIds || [];
		};
		
		if (data.type == I.BlockType.Text) {
			data.content.marks = { marks: data.content.marks };
		};
		
		if (data.type == I.BlockType.File) {
			if (data.content.size) {
				data.content.size = parseFloat(data.content.size);
			};
			if (data.content.addedAt) {
				data.content.addedAt = parseFloat(data.content.addedAt);
			};
		};
		
		if (data.type == I.BlockType.Page) {
			data.fields = data.fields || {};
			data.fields.name = String(data.fields.name || Constant.default.name);
			data.fields.icon = String(data.fields.icon || '');
		};
		
		if (data.fields) {
			block.fields = (new StructEncode()).encodeStruct(data.fields || {});
		};

		const model = com.anytype.model.Block.Content[Util.toUpperCamelCase(data.type)];
		if (model) {
			block[data.type] = model.create(data.content);
		};
		
		block = com.anytype.model.Block.create(block);
		return block;
	};
	
};

export let blockStore: BlockStore = new BlockStore();