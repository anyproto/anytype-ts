import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';
import arrayMove from 'array-move';

class DocumentStore {
	@observable public documentItem: I.DocumentInterface = null;
	@observable.shallow public documentList: I.DocumentInterface[] = [];
	
	@computed
	get documents(): I.DocumentInterface[] {
		return this.documentList;
	};
	
	@computed
	get document(): I.DocumentInterface {
		return this.documentItem;
	};
	
	@action
	documentAdd (document: I.DocumentInterface) {
		this.documentList.push(document as I.DocumentInterface);
	};
	
	@action
	documentSort (oldIndex: number, newIndex: number) {
		this.documentList = arrayMove(this.documentList, oldIndex, newIndex);
	};
	
	@action
	documentSet (document: I.DocumentInterface) {
		this.documentItem = document as I.DocumentInterface;
	};
	
};

export let documentStore: DocumentStore = new DocumentStore();