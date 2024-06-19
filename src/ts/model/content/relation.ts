import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentRelation implements I.ContentRelation {
	
	key = '';
	
	constructor (props: I.ContentRelation) {
		this.key = String(props.key || '');

		makeObservable(this, {
			key: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentRelation;