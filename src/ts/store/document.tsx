import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';
import arrayMove from 'array-move';

class DocumentStore {
	@observable public documentList: I.Document[] = [];
	
	@computed
	get documents(): I.Document[] {
		return this.documentList;
	};
	
	@action
	documentAdd (document: I.Document) {
		this.documentList.push(document as I.Document);
	};
	
	@action
	documentClear () {
		this.documentList = [];
	};
	
	@action
	documentSort (oldIndex: number, newIndex: number) {
		this.documentList = arrayMove(this.documentList, oldIndex, newIndex);
	};
	
};

export let documentStore: DocumentStore = new DocumentStore();