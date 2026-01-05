import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentTransclusion implements I.ContentTransclusion {

	source: I.BlockReference = { rootId: '', blockId: '' };

	constructor (props: I.ContentTransclusion) {
		this.source = {
			rootId: String(props.source?.rootId || ''),
			blockId: String(props.source?.blockId || ''),
		};

		makeObservable(this, {
			source: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentTransclusion;
