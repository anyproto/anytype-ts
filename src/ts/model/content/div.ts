import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentDiv implements I.ContentDiv {
	
	style: I.DivStyle = I.DivStyle.Line;
	
	constructor (props: I.ContentDiv) {
		let self = this;
		
		self.style = Number(props.style) || I.DivStyle.Line;

		makeObservable(self, {
			style: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentDiv;