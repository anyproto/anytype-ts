import { I } from 'Lib';
import { observable,  makeObservable } from 'mobx';

class BlockContentTableRow implements I.ContentTableRow {
	
	isHeader = false;
	
	constructor (props: I.ContentTableRow) {
		this.isHeader = Boolean(props.isHeader);

		makeObservable(this, {
			isHeader: observable,
		});

		return this;
	};

};

export {
	BlockContentTableRow,
};