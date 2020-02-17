import { observable, action, computed, set, toJS } from 'mobx';
import { I, Util, StructDecode, StructEncode } from 'ts/lib';

const com = require('proto/commands.js');
const Constant = require('json/constant.json');

class BlockStore {
	@observable public rootId: string = '';
	@observable public archiveId: string = '';
	@observable public breadcrumbsId: string = '';
	@observable public blockObject: any = {};
	
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
	
	@computed
	get blocks (): any {
		return this.blockObject;
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
		this.blockObject[rootId] = blocks;
	};
	
	@action
	blockAdd (rootId: string, block: I.Block) {
		this.blockObject[rootId] = this.blockObject[rootId] || [];
		this.blockObject[rootId].push(block as I.Block);
	};
	
	@action
	blockUpdate (rootId: string, block: any) {
		let item = (this.blockObject[rootId] || []).find((item: I.Block) => { return item.id == block.id; });
		if (!item) {
			return;
		};
		
		set(item, block);
	};
	
	@action
	blockDelete (rootId: string, id: string) {
		if (!this.blockObject[rootId]) {
			return;
		};
		
		this.blockObject[rootId] = this.blockObject[rootId].filter((item: I.Block) => { return item.id != id; });
	};
	
	@action
	blocksClear (rootId: string) {
		this.blockObject[rootId] = [];
	};
	
	// If check is present find next block if check passes or continue to next block in "dir" direction, else just return next block; 
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any, list?: any): any {
		if (!list) {
			let tree = this.prepareTree(rootId, this.blockObject[rootId]);
			list = this.unwrapTree(tree);
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
			let tree = this.prepareTree(rootId, this.blockObject[rootId]);
			list = this.unwrapTree(tree);
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
	
	setNumbers (list: I.Block[]) {
		let n = 0;
		for (let item of list) {
			n = (item.type == I.BlockType.Text && item.content.style == I.TextStyle.Numbered) ? n + 1 : 0;
			item.content.number = n;
			
			this.setNumbers(item.childBlocks);
		};
	};
	
	getMap (list: I.Block[]) {
		list = Util.objectCopy(list || []);
		
		let map: any = {};
		
		for (let item of list) {
			map[item.id] = item;
		};
		
		for (let item of list) {
			let childrenIds = item.childrenIds || [];
			for (let id of childrenIds) {
				if (!map[id]) {
					continue;
				};
				
				map[id].parentId = item.id;
				
				if (map[item.id]) {
					map[item.id].childBlocks.push(map[id]);
				};
			};
		};
		
		return map;
	};
	
	prepareTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		let map: any = this.getMap(list);
		
		if (map[rootId]) {
			ret = map[rootId].childBlocks;
			this.setNumbers(ret);
		};
		
		return ret;
	};
	
	unwrapTree (tree: I.Block[]) {
		tree = tree || [] as I.Block[];
		
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
	
	prepareBlockFromProto (block: any): I.Block {
		let type = block.content;
		let content = block[type];
		let fields = block.fields;
		let file = block.file;
		
		let item: I.Block = {
			id: block.id,
			type: type,
			parentId: '',
			childrenIds: block.childrenIds || [],
			childBlocks: [] as I.Block[],
			fields: {} as any,
			content: {} as any,
			restrictions: block.restrictions || {} as I.Restrictions,
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
				
				item.content.bgColor = content.backgroundColor;
				item.content.style = content.style;
				item.content.marker = content.marker;
				item.content.marks = marks;
			};
						
			if (type == I.BlockType.Layout) {
				//item.content.style = content.style;
			};
			
			if (type == I.BlockType.Div) {
				//item.content.style = content.style;
			};
			
			if (type == I.BlockType.Link) {
				//item.content.style = content.style;
				
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
		
		console.log(data);
		
		if (data.fields) {
			block.fields = (new StructEncode()).encodeStruct(data.fields || {});
		};
		
		block[data.type] = com.anytype.model.Block.Content[Util.toUpperCamelCase(data.type)].create(data.content);
		block = com.anytype.model.Block.create(block);
		return block;
	};
	
};

export let blockStore: BlockStore = new BlockStore();