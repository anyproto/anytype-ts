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
	get blocks (): I.Block[] {
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
	blocksClear (rootId: string) {
		this.blockObject[rootId] = [];
	};
	
	getNextBlock (rootId: string, id: string, dir: number, check?: (item: I.Block) => any): any {
		let idx = this.blockObject[rootId].findIndex((item: I.Block) => { return item.id == id; });
		if (idx + dir < 0 || idx + dir > this.blockObject[rootId].length - 1) {
			return null;
		};
		
		let ret = this.blockObject[rootId][idx + dir];
		
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
	
	prepareTree (rootId: string, list: I.Block[]) {
		list = Util.objectCopy(list);
		
		let ret: any = [];
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
		
		if (map[rootId]) {
			ret = map[rootId].childBlocks;
		};
		
		return ret;
	};
	
	prepareBlockFromProto (block: any): I.Block {
		let type = block.content.content;
		let content = block.content[type];
		let fields = block.fields;
		
		let item: I.Block = {
			id: block.id,
			type: type,
			parentId: '',
			childrenIds: block.childrenIds || [],
			childBlocks: [] as I.Block[],
			fields: {} as any,
			content: {} as any,
			permissions: block.permissions || {} as I.Permissions,
		};
		
		if (fields) {
			item.fields = StructDecode.decodeStruct(fields);
		};
		
		if (content) {
			item.content = Util.objectCopy(content);
			
			if (type == I.BlockType.Text) {
				let style = content.style;
				let marker = content.marker;
				let marks: any = [];
				
				if (content.marks && content.marks.marks.length) {
					for (let mark of content.marks.marks) {
						let type = mark.type;
						marks.push({
							type: type,
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
		let content: any = {};
		
		content[data.type] = com.anytype.model.Block.Content[Util.toUpperCamelCase(data.type)].create(data.content);
		
		let block: any = {
			fields: fields,
			content: com.anytype.model.Block.Core.create(content),
		};
		
		if (data.id) {
			block.id = data.id;
		};
		
		return com.anytype.model.Block.create(block);
	};
	
};

export let blockStore: BlockStore = new BlockStore();