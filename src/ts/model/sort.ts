import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Sort implements I.Sort {

	relationKey: string = '';
	type: I.SortType = I.SortType.Asc;
	includeTime: boolean = false;
	customOrder: string[] = [];

	constructor (props: I.Sort) {
		this.relationKey = String(props.relationKey || '');
		this.type = Number(props.type) || I.SortType.Asc;
		this.includeTime = Boolean(props.includeTime);
		this.customOrder = props.customOrder || [];

		makeObservable(this, {
			relationKey: observable,
			type: observable,
			includeTime: observable,
			customOrder: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default Sort;