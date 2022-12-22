import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

import View from '../view';

class BlockContentDataview implements I.ContentDataview {
	
	sources: string[] = [];
	views: I.View[] = [];
	relationLinks: any[] = [];
	groupOrder: any[] = [];
	objectOrder: any[] = [];
	targetObjectId: string = '';
	
	constructor (props: I.ContentDataview) {
		this.sources = props.sources || [];
		this.views = (props.views || []).map(it => new View(it));
		this.relationLinks = props.relationLinks || [];
		this.groupOrder = props.groupOrder || [];
		this.objectOrder = props.objectOrder || [];
		this.targetObjectId = String(props.targetObjectId || '');
		
		makeObservable(this, {
			sources: observable,
			views: observable,
			groupOrder: observable,
			objectOrder: observable,
			relationLinks: observable,
			targetObjectId: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default BlockContentDataview;