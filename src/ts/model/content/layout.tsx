import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLayout implements I.ContentLayout {
	
	style: I.LayoutStyle = I.LayoutStyle.Row;
	
	constructor (props: I.ContentLayout) {
		let self = this;
		
		self.style = Number(props.style) || I.LayoutStyle.Row;

		makeObservable(self, {
			style: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentLayout;