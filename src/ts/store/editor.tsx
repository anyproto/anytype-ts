import { observable, action, computed } from 'mobx';
import { I, Util } from 'ts/lib';

class EditorStore {
	@observable public blockList: I.Block[] = [];
	
	@computed
	get blocks(): I.Block[] {
		return this.blockList;
	};
	
	@action
	blockAdd (block: I.Block) {
		this.blockList.push(block as I.Block);
	};
	
	@action
	blockClear () {
		this.blockList = [];
	};
	
};

export let editorStore: EditorStore = new EditorStore();