import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentBookmark implements I.ContentBookmark {
	
	targetObjectId = '';
	state: I.BookmarkState = I.BookmarkState.Empty;
	url = '';
	
	constructor (props: I.ContentBookmark) {
		this.targetObjectId = String(props.targetObjectId || '');
		this.state = Number(props.state) || I.BookmarkState.Empty;
		this.url = String(props.url || '');

		makeObservable(this, {
			targetObjectId: observable,
			state: observable,
			url: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentBookmark;