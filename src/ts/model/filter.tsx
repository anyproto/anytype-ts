import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class Filter implements I.Filter {

	relationKey: string = '';
	operator: I.FilterOperator = I.FilterOperator.And;
	condition: I.FilterCondition = I.FilterCondition.None;
	quickOption: I.FilterQuickOption = I.FilterQuickOption.None;
	value: any = {};

	constructor (props: I.Filter) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.operator = Number(props.operator) || I.FilterOperator.And;
		self.condition = Number(props.condition) || I.FilterCondition.None;
		self.quickOption = Number(props.quickOption) || I.FilterQuickOption.None;
		self.value = props.value;

		makeObservable(self, {
			relationKey: observable,
			operator: observable,
			condition: observable,
			value: observable,
			quickOption: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default Filter;