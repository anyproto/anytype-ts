import { observable, action, computed, set, intercept } from 'mobx';
import { I, M, Util, StructDecode, StructEncode } from 'ts/lib';

const com = require('proto/commands.js');
const Constant = require('json/constant.json');
const $ = require('jquery');

class BlockStore {
	@observable public rootId: string = '';
	@observable public archiveId: string = '';
	@observable public breadcrumbsId: string = '';
	
	public treeObject: any = new Map();
	public blockObject: any = new Map();
	
	@computed
	get root (): string {
		return this.rootId;
	};
	
	@computed
	get archive (): string {
		return this.archiveId;
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
	breadcrumbsSet (id: string) {
		this.breadcrumbsId = String(id || '');
	};
	
	@action
	blocksSet (rootId: string, blocks: I.Block[]) {
		blocks = blocks.map((it: any) => { return new M.Block(it); });
		let map = this.getStructure(blocks);
		
		this.blockObject.set(rootId, blocks);
		this.treeObject.set(rootId, map);
	};
	
	@action
	blocksClear (rootId: string) {
		this.blockObject.delete(rootId);
		this.treeObject.delete(rootId);
	};
	
	@action
	blockAdd (rootId: string, block: I.Block, index: number) {
		block = new M.Block(block);
		
		let blocks = this.blockObject.get(rootId) || [];
		let map = this.treeObject.get(rootId) || {};
		
		blocks.push(block);
		
		map[block.id] = observable({
			id: block.id,
			parentId: block.parentId,
			childrenIds: block.childrenIds,
		});
		
		intercept(map[block.id] as any, (change: any) => {
			if (change.newValue === map[block.id][change.name]) {
				return null;
			};
			console.log('Stucture change', change, map[block.id][change.name]);
			return change;
		});
	};
	
	@action
	blockUpdate (rootId: string, block: any) {
		let blocks = this.blockObject.get(rootId) || [];
		let element = blocks.find((it: any) => { return it.id == block.id; });
		
		Object.assign(element, block);
		this.setNumbers(rootId);
	};
	
	@action
	blockUpdateStructure (rootId: string, block: any) {
		let map = this.treeObject.get(rootId) || {};
		
		set(map[block.id], 'childrenIds', block.childrenIds);
		block.childrenIds.map((id: string) => {
			set(map[id], 'parentId', block.id);
		});
	};
	
	@action
	blockDelete (rootId: string, id: string) {
		let blocks = this.blockObject.get(rootId) || [];
		let map = this.treeObject.get(rootId) || {};
		
		let element = map[id] || {};
		let parent = map[element.parentId] || {};
		
		blocks = blocks.filter((it: any) => { return it.id != id; });
		delete(map[id]);
	};
	
	getMap (rootId: string) {
		return this.treeObject.get(rootId) || {};
	};
	
	getLeaf (rootId: string, id: string): any {
		let blocks = this.blockObject.get(rootId) || [];
		return blocks.find((it: any) => { return it.id == id; });
	};
	
	filterBlocks (rootId: string, filter?: (it: any) => boolean) {
		let blocks = this.blockObject.get(rootId) || [];
		return blocks.filter((it: any) => {
			if (filter) {
				return filter(it);
			};
			return true;
		});
	};
	
	getChildren (rootId: string, id: string, filter?: (it: any) => boolean) {
		let blocks = this.blockObject.get(rootId) || [];
		let map = this.treeObject.get(rootId) || {};
		let element = map[id] || {};
		
		let childBlocks = (element.childrenIds || []).map((it: string) => {
			return blocks.find((item: any) => { return item.id == it; });
		}).filter((it: any) => {
			if (!it) {
				console.log('!!!undefined!!!');
				return false;
			};
			if (filter) {
				return filter(it);
			};
			return true;
		});
		return childBlocks;
	};
	
	// If check is present find next block if check passes or continue to next block in "dir" direction, else just return next block; 
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!list) {
			let root = this.wrapTree(rootId);
			list = this.unwrapTree([ root ]);
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
	
	// Find first block if check passes, if not - continue to next block in "dir" direction
	getFirstBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!check) {
			return;
		};
		
		if (!list) {
			let root = this.wrapTree(rootId);
			list = this.unwrapTree([ root ]);
		};
		
		let idx = list.findIndex((item: I.Block) => { return item.id == id; });
		if (idx + dir < 0 || idx + dir > list.length - 1) {
			return null;
		};
		
		let ret = list[idx];
		let next = list[idx + dir];
		
		if (ret) {
			return check(ret) ? ret : this.getFirstBlock(rootId, next.id, dir, check, list);
		} else {
			return ret;
		};
	};
	
	setNumbers (rootId: string) {
		let root = this.wrapTree(rootId);
		let cb = (list: any[]) => {
			let n = 0;
			for (let item of list) {
				n = item.isNumbered() ? n + 1 : 0;
				
				if (item.isNumbered()) {
					$('.markerInner.c' + $.escapeSelector(item.id)).text(n ? n + '.' : '');
				};
				
				cb(item.childBlocks);
			};
		};
		cb(root.childBlocks);
	};
	
	getStructure (list: I.Block[]) {
		list = Util.objectCopy(list || []);
		
		let map: any = {};
		
		list.map((item: any) => {
			map[item.id] = observable({ 
				id: item.id,
				parentId: '',
				childrenIds: item.childrenIds || [],
			});
		});
		
		for (let id in map) {
			let item = map[id];
			(item.childrenIds || []).map((id: string) => {
				map[id].parentId = item.id;
			});
		};
		
		return map;
	};
	
	wrapTree (rootId: string) {
		let list = this.blockObject.get(rootId) || [];
		let map = this.treeObject.get(rootId) || {};
		
		let ret: any = {};
		for (let id in map) {
			ret[id] = this.getLeaf(rootId, id);
			ret[id].parentId = map[id].parentId;
			ret[id].childBlocks = this.getChildren(rootId, id);
		};
		return ret[rootId];
	};
	
	unwrapTree (tree: any[]): any[] {
		tree = tree || [];
		
		let ret = [] as I.Block[];
		for (let item of tree) {
			ret.push(item);
			if (item.childBlocks && item.childBlocks.length) {
				ret = ret.concat(this.unwrapTree(item.childBlocks));
			};
		};
		return ret;
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
				
				if (content.marks && content.marks.marks.length) {
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
		
		block[data.type] = com.anytype.model.Block.Content[Util.toUpperCamelCase(data.type)].create(data.content);
		block = com.anytype.model.Block.create(block);
		return block;
	};
	
};

export let blockStore: BlockStore = new BlockStore();