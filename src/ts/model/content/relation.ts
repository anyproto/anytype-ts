import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentRelation implements I.ContentRelation {
	
	key: string = '';
	
	constructor (props: I.ContentRelation) {
		this.key = String(props.key || '');

		makeObservable(this, {
			key: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default BlockContentRelation;