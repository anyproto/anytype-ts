import { observable, action, computed } from 'mobx';
import { I } from 'ts/lib';

class DocumentStore {
	@observable public documentItem: I.DocumentInterface = null;
	@observable public documentList: I.DocumentInterface[] = [];
	
	@computed
	get documents(): I.DocumentInterface[] {
		return this.documentList;
	};
	
	@computed
	get document(): I.DocumentInterface {
		return this.documentItem;
	};
	
	@action
	documentSet (document: I.DocumentInterface) {
		this.documentItem = document as I.DocumentInterface;
	};
	
};

export let documentStore: DocumentStore = new DocumentStore();