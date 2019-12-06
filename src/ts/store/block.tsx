import { observable, action, computed, set } from 'mobx';
import { I, Util, StructDecode, StructEncode  } from 'ts/lib';
import arrayMove from 'array-move';

const com = require('proto/commands.js');

class BlockStore {
	@observable public rootId: string = '';
	@observable public blockObject: any = {};
	
	@computed
	get root (): string {
		return this.rootId;
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
	
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any): any {
		let tree = this.prepareTree(rootId, this.blockObject[rootId]);
		let list = this.unwrapTree(tree);
		let idx = list.findIndex((item: I.Block) => { return item.id == id; });
		
		if (idx + dir < 0 || idx + dir > list.length - 1) {
			return null;
		};
		
		let ret = list[idx + dir];
		
		if (check && ret) {
			if (check(ret)) {
				return ret;
			} else {
				return this.getNextBlock(rootId, ret.id, dir, check);
			};
		} else {
			return ret;
		};
	};
	
	getMap (list: I.Block[]) {
		list = Util.objectCopy(list);
		
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
		list = Util.objectCopy(list);
		
		let ret: any = [];
		let map: any = this.getMap(list);
		
		if (map[rootId]) {
			ret = map[rootId].childBlocks;
		};
		
		return ret;
	};
	
	unwrapTree (tree: I.Block[]) {
		tree = tree || [] as I.Block[];
		
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
		};
		
		if (content) {
			item.content = Util.objectCopy(content);
			
			if (content.fields) {
				item.content.fields = StructDecode.decodeStruct(content.fields);
			};
			
			if (type == I.BlockType.Text) {
				let style = content.style;
				let marker = content.marker;
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
				
				item.content.style = style;
				item.content.marker = marker;
				item.content.marks = marks;
			};
						
			if (type == I.BlockType.Layout) {
				let style = content.style;
				
				item.content.style = style;
			};
		};
		
		return item;
	};
	
	prepareBlockToProto (data: any) {
		let fields = (new StructEncode()).encodeStruct(data.fields || {});
		let block: any = {
			id: String(data.id || ''),
			fields: fields,
		};
		
		block[data.type] = com.anytype.model.Block.Content[Util.toUpperCamelCase(data.type)].create(data.content);
		return com.anytype.model.Block.create(block);
	};
	
};

export let blockStore: BlockStore = new BlockStore();