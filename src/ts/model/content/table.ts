import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentTableRow implements I.ContentTableRow {
	
	isHeader: boolean = false;
	
	constructor (props: I.ContentTableRow) {
		const self = this;
		
		self.isHeader = Boolean(props.isHeader);

		makeObservable(self, {
			isHeader: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export {
	BlockContentTableRow,
}