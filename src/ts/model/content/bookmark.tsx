import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentBookmark implements I.ContentBookmark {
	
	url: string = '';
	title: string = '';
	description: string = '';
	imageHash: string = '';
	faviconHash: string = '';
	type: I.BookmarkType = I.BookmarkType.Unknown;
	targetObjectId: string = '';
	
	constructor (props: I.ContentBookmark) {
		let self = this;
		
		self.url = String(props.url || '');
		self.title = String(props.title || '');
		self.description = String(props.description || '');
		self.imageHash = String(props.imageHash || '');
		self.faviconHash = String(props.faviconHash || '');
		self.targetObjectId = String(props.targetObjectId || '');
		self.type = Number(props.type) || I.BookmarkType.Unknown;

		makeObservable(self, {
			url: observable,
			title: observable,
			description: observable,
			imageHash: observable,
			faviconHash: observable,
			type: observable,
			targetObjectId: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentBookmark;