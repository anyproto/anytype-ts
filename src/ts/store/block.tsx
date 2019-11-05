import { observable, action, computed, set } from 'mobx';
import { I } from 'ts/lib';
import arrayMove from 'array-move';

class BlockStore {
	@observable public blockList: I.Block[] = [];
	
	@computed
	get blocks (): I.Block[] {
		return this.blockList;
	};
	
	
	@computed
	get tree (): I.Block[] {
		return this.getTree('', this.blockList);
	};
	
	getTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		for (let item of list) {
			if (!item.header.id || (rootId != item.header.parentId)) {
				continue;
			};
			if (ret.find((el: any) => { return el.header.id == item.header.id })) {
				continue;
			};
			
			item.childBlocks = this.getTree(item.header.id, list);
			ret.push(item);
		};
		return ret;
	};
	
	@action
	blockAdd (block: I.Block) {
		this.blockList.push(block as I.Block);
	};
	
	@action
	blockUpdate (block: I.Block) {
		let item = this.blockList.find((item: I.Block) => { return item.header.id == block.header.id; });
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
	
};

export let blockStore: BlockStore = new BlockStore();