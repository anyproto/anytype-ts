import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class ViewRelation implements I.ViewRelation {

	relationKey = '';
	width = 0;
	isVisible = false;
	includeTime = false;
	dateFormat: I.DateFormat = I.DateFormat.MonthAbbrBeforeDay;
	timeFormat: I.TimeFormat = I.TimeFormat.H12;
	formulaType: I.FormulaType = I.FormulaType.None;

	constructor (props: I.ViewRelation) {
		this.relationKey = String(props.relationKey || '');
		this.width = Number(props.width) || 0;
		this.isVisible = Boolean(props.isVisible);
		this.includeTime = Boolean(props.includeTime);
		this.dateFormat = Number(props.dateFormat) || I.DateFormat.MonthAbbrBeforeDay;
		this.timeFormat = Number(props.timeFormat) || I.TimeFormat.H12;
		this.formulaType = Number(props.formulaType) || I.FormulaType.None;

		makeObservable(this, {
			width: observable,
			isVisible: observable,
			includeTime: observable, 
			dateFormat: observable,
			timeFormat: observable,
			formulaType: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default ViewRelation;