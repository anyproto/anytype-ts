import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class EditorStore {
	@observable public focused: string = '';
	@observable public range: I.TextRange = { from: 0, to: 0 };
	
	@action
	rangeSave (id: string, range: I.TextRange) {
		range = range || { from: 0, to: 0 };
		range.from = Number(range.from) || 0;
		range.to = Number(range.to) || 0;
		
		this.focused = String(id || '');
		this.range.from = range.from;
		this.range.to = range.to;
	};
	
	@action
	rangeClear () {
		this.focused = '';
		this.range = { from: 0, to: 0 };
	};
	
};

export let editorStore: EditorStore = new EditorStore();