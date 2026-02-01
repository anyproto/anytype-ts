import { I } from 'Lib';
import { observable, makeObservable } from 'mobx';

class BlockContentDiv implements I.ContentDiv {
	
	style: I.DivStyle = I.DivStyle.Line;
	
	constructor (props: I.ContentDiv) {
		this.style = Number(props.style) || I.DivStyle.Line;

		makeObservable(this, {
			style: observable,
		});

		return this;
	};

};

export default BlockContentDiv;