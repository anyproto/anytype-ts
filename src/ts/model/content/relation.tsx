import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentRelation implements I.ContentRelation {
	
	key: string = '';
	
	constructor (props: I.ContentRelation) {
		let self = this;
		
		self.key = String(props.key || '');

		makeObservable(self, {
			key: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentRelation;