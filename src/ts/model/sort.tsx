import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Sort implements I.Sort {

	relationKey: string = '';
	type: I.SortType = I.SortType.Asc;

	constructor (props: I.Sort) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.type = Number(props.type) || I.SortType.Asc;

		makeObservable(self, {
			relationKey: observable,
			type: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default Sort;