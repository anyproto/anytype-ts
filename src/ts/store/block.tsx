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
	
	getTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		for (let item of list) {
			if (!item.id || (rootId != item.header.parentId)) {
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
	
};

export let blockStore: BlockStore = new BlockStore();