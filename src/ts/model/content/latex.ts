import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLatex implements I.ContentLatex {
	
	text = '';
	
	constructor (props: I.ContentLatex) {
		this.text = String(props.text || '');

		makeObservable(this, {
			text: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

};

export default BlockContentLatex;