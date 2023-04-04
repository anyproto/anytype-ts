import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentDiv implements I.ContentDiv {
	
	style: I.DivStyle = I.DivStyle.Line;
	
	constructor (props: I.ContentDiv) {
		this.style = Number(props.style) || I.DivStyle.Line;

		makeObservable(this, {
			style: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
	};

};

export default BlockContentDiv;