import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

import View from '../view';

class BlockContentDataview implements I.ContentDataview {
	
	sources: string[] = [];
	views: I.View[] = [];
	
	constructor (props: I.ContentDataview) {
		let self = this;

		self.sources = props.sources || [];
		self.views = (props.views || []).map((it: I.View) => { return new View(it); });
		
		makeObservable(self, {
			sources: observable,
			views: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentDataview;