import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentTableRow implements I.ContentTableRow {
	
	isHeader: boolean = false;
	
	constructor (props: I.ContentTableRow) {
		this.isHeader = Boolean(props.isHeader);

		makeObservable(this, {
			isHeader: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export {
	BlockContentTableRow,
}