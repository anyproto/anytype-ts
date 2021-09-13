import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

import View from '../view';

class BlockContentDataview implements I.ContentDataview {
	
	source: string = '';
	views: I.View[] = [];
	
	constructor (props: I.ContentDataview) {
		let self = this;

		self.source = String(props.source || '');
		self.views = (props.views || []).map((it: I.View) => { return new View(it); });
		
		makeObservable(self, {
			source: observable,
			views: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentDataview;