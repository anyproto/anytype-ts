import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class EditorStore {
	@observable public blockList: I.BlockInterface[] = [];
	
	@computed
	get blocks(): I.BlockInterface[] {
		return this.blockList;
	};
	
	@action
	blockAdd (block: I.BlockInterface) {
		this.blockList.push(block as I.BlockInterface);
	};
	
	@action
	blockClear () {
		this.blockList = [];
	};
	
};

export let editorStore: EditorStore = new EditorStore();