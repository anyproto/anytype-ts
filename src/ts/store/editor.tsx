import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class EditorStore {
	@observable public focusedId: string = '';
	@observable public rangeObj: I.TextRange = { from: 0, to: 0 };
	
	@computed
	get focused(): string {
		return this.focusedId;
	};
	
	@computed
	get range(): I.TextRange {
		return this.rangeObj;
	};
	
	@action
	rangeSave (id: string, range: I.TextRange) {
		range = range || { from: 0, to: 0 };
		range.from = Number(range.from) || 0;
		range.to = Number(range.to) || 0;
		
		this.focusedId = String(id || '');
		this.rangeObj = range;
	};
	
	@action
	rangeClear () {
		this.focusedId = '';
		this.rangeObj = { from: 0, to: 0 };
	};
	
};

export let editorStore: EditorStore = new EditorStore();