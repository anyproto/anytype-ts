import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Filter implements I.Filter {

	id = '';
	relationKey = '';
	operator: I.FilterOperator = I.FilterOperator.And;
	condition: I.FilterCondition = I.FilterCondition.None;
	quickOption: I.FilterQuickOption = I.FilterQuickOption.ExactDate;
	value: any = {};

	constructor (props: I.Filter) {

		this.id = String(props.id || '');
		this.relationKey = String(props.relationKey || '');
		this.operator = Number(props.operator) || I.FilterOperator.And;
		this.condition = Number(props.condition) || I.FilterCondition.None;
		this.quickOption = Number(props.quickOption) || I.FilterQuickOption.ExactDate;
		this.value = props.value;

		makeObservable(this, {
			relationKey: observable,
			operator: observable,
			condition: observable,
			value: observable,
			quickOption: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
	};

};

export default Filter;