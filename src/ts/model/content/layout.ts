import { I } from 'Lib';
import { observable, makeObservable } from 'mobx';

class BlockContentLayout implements I.ContentLayout {
	
	style: I.LayoutStyle = I.LayoutStyle.Row;
	
	constructor (props: I.ContentLayout) {
		this.style = Number(props.style) || I.LayoutStyle.Row;

		makeObservable(this, {
			style: observable,
		});

		return this;
	};

};

export default BlockContentLayout;