import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockStructure implements I.BlockStructure {
	
	parentId = '';
	childrenIds: string[] = [];
	
	constructor (props: I.BlockStructure) {
		this.parentId = String(props.parentId || '');
		this.childrenIds = Array.isArray(props.childrenIds) ? props.childrenIds : [];

		makeObservable(this, {
			parentId: observable,
			childrenIds: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockStructure;