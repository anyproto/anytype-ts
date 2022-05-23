import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentBookmark implements I.ContentBookmark {
	
	targetObjectId: string = '';
	
	constructor (props: I.ContentBookmark) {
		let self = this;
		
		self.targetObjectId = String(props.targetObjectId || '');

		makeObservable(self, {
			targetObjectId: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentBookmark;