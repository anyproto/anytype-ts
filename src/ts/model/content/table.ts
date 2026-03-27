import { observable, makeObservable } from 'mobx';
import * as I from 'Interface';

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