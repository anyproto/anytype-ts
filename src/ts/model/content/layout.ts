import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLayout implements I.ContentLayout {
	
	style: I.LayoutStyle = I.LayoutStyle.Row;
	
	constructor (props: I.ContentLayout) {
		this.style = Number(props.style) || I.LayoutStyle.Row;

		makeObservable(this, {
			style: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default BlockContentLayout;