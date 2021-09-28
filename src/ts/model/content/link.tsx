import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLink implements I.ContentLink {
	
	style: I.LinkStyle = I.LinkStyle.Page;
	targetBlockId: string = '';
	fields: any = {};
	
	constructor (props: I.ContentLink) {
		let self = this;
		
		self.style = Number(props.style) || I.LinkStyle.Page;
		self.targetBlockId = String(props.targetBlockId || '');
		self.fields = props.fields || {};

		makeObservable(self, {
			style: observable,
			targetBlockId: observable,
			fields: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentLink;