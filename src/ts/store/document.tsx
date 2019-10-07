import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';
import arrayMove from 'array-move';

class DocumentStore {
	@observable public documentList: I.DocumentInterface[] = [];
	
	@computed
	get documents(): I.DocumentInterface[] {
		return this.documentList;
	};
	
	@action
	documentAdd (document: I.DocumentInterface) {
		this.documentList.push(document as I.DocumentInterface);
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