import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class EditorStore {
	@observable public focused: string = '';
	@observable public range: any = { start: 0, end: 0 };
	
	@action
	rangeSave (id: string, range: any) {
		range = range || {};
		range.start = Number(range.start) || 0;
		range.end = Number(range.end) || 0;
		
		this.focused = String(id || '');
		this.range = range;
	};
	
	@action
	rangeClear () {
		this.focused = '';
		this.range = { start: 0, end: 0 };
	};
	
};

export let editorStore: EditorStore = new EditorStore();