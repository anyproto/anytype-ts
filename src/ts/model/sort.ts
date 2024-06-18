import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Sort implements I.Sort {

	id = '';
	relationKey = '';
	type: I.SortType = I.SortType.Asc;
	includeTime = false;
	customOrder: string[] = [];
	empty: I.EmptyType = I.EmptyType.None;

	constructor (props: I.Sort) {

		this.id = String(props.id || '');
		this.relationKey = String(props.relationKey || '');
		this.type = Number(props.type) || I.SortType.Asc;
		this.includeTime = Boolean(props.includeTime);
		this.customOrder = Array.isArray(props.customOrder) ? props.customOrder : [];
		this.empty = Number(props.empty) || I.SortType.Asc;

		makeObservable(this, {
			relationKey: observable,
			type: observable,
			includeTime: observable,
			customOrder: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default Sort;