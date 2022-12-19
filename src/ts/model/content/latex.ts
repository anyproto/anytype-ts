import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLatex implements I.ContentLatex {
	
	text: string = '';
	
	constructor (props: I.ContentLatex) {
		const self = this;
		
		self.text = String(props.text || '');

		makeObservable(self, {
			text: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentLatex;