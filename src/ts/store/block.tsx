import { observable, action, computed, set } from 'mobx';
import { I, Util } from 'ts/lib';
import arrayMove from 'array-move';

class BlockStore {
	@observable public blockList: I.Block[] = [];
	
	@computed
	get blocks (): I.Block[] {
		return this.blockList;
	};
	
	@action
	blockAdd (block: I.Block) {
		this.blockList.push(block as I.Block);
	};
	
	@action
	blockUpdate (block: any) {
		let item = this.blockList.find((item: I.Block) => { return item.id == block.id; });
		if (!item) {
			return;
		};
		
		set(item, block);
	};
	
	@action
	blockClear () {
		this.blockList = [];
	};
	
	@action
	blockSort (oldIndex: number, newIndex: number) {
		this.blockList = arrayMove(this.blockList, oldIndex, newIndex);
	};
	
	prepareTree (rootId: string, list: I.Block[]) {
		let ret: any = Util.objectCopy(list); 
		for (let item of ret) {
			if (!item.childrenIds.length) {
				continue;
			};
			
			if (item.id == rootId) {
				item.parentId = '';
			};
			
			for (let id of item.childrenIds) {
				let idx = ret.findIndex((it: I.Block) => { return it.id == id; });
				if (idx >= 0) {
					ret[idx].parentId = item.id;
				};
			};
		};
		return ret;
	};
	
	getTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		for (let item of list) {
			if (!item.id || (rootId != item.parentId)) {
				continue;
			};
			
			let obj = Util.objectCopy(item);
			obj.childBlocks = this.getTree(obj.id, list);
			ret.push(obj);
		};
		return ret;
	};
	
	getNextBlock (id: string, dir: number, check?: (item: I.Block) => any): any {
		let idx = this.blockList.findIndex((item: I.Block) => { return item.id == id; });
		if (idx + dir < 0 || idx + dir > this.blockList.length - 1) {
			return null;
		};
		
		let ret = this.blockList[idx + dir];
		
		if (check && ret) {
			if (check(ret)) {
				return ret;
			} else {
				return this.getNextBlock(ret.id, dir, check);
			};
		} else {
			return ret;
		};
	};
	
	prepareBlock (block: any): I.Block {
		let type = block.content;
		let content = block[block.content];
					
		let item: I.Block = {
			id: block.id,
			type: type,
			parentId: '',
			childrenIds: block.childrenIds || [],
			childBlocks: [] as I.Block[],
			fields: block.fields || {},
			content: {} as any,
		};
					
		if (content) {
			item.content = Util.objectCopy(content);
						
			if (type == I.BlockType.Text) {
				let style = content.style;
				let marker = content.marker;
				let marks: any = [];
				
				if (content.marks && content.marks.length) {
					for (let mark of content.marks) {
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
	
};

export let blockStore: BlockStore = new BlockStore();