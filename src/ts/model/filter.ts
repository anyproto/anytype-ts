import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Filter implements I.Filter {

	id = '';
	relationKey = '';
	operator: I.FilterOperator = I.FilterOperator.None;
	condition: I.FilterCondition = I.FilterCondition.None;
	quickOption: I.FilterQuickOption = I.FilterQuickOption.ExactDate;
	value: any = {};
	nestedFilters: I.Filter[] = [];

	constructor (props: I.Filter) {

		this.id = String(props.id || '');
		this.relationKey = String(props.relationKey || '');
		this.operator = Number(props.operator) || I.FilterOperator.None;
		this.condition = Number(props.condition) || I.FilterCondition.None;
		this.quickOption = Number(props.quickOption) || I.FilterQuickOption.ExactDate;
		this.value = props.value;
		this.nestedFilters = (Array.isArray(props.nestedFilters) ? props.nestedFilters : []).map((filter: I.Filter) => new Filter(filter));

		makeObservable(this, {
			relationKey: observable,
			operator: observable,
			condition: observable,
			value: observable,
			quickOption: observable,
			nestedFilters: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default Filter;