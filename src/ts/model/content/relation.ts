import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentRelation implements I.ContentRelation {
	
	key = '';
	
	constructor (props: I.ContentRelation) {
		this.key = String(props.key || '');

		makeObservable(this, {
			key: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

};

export default BlockContentRelation;