import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentTableRow implements I.ContentTableRow {
	
	isHeader = false;
	
	constructor (props: I.ContentTableRow) {
		this.isHeader = Boolean(props.isHeader);

		makeObservable(this, {
			isHeader: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export {
	BlockContentTableRow,
};