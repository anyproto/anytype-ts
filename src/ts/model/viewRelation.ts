import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class ViewRelation implements I.ViewRelation {

	relationKey: string = '';
	width: number = 0;
	isVisible: boolean = false;
	includeTime: boolean = false;
	dateFormat: I.DateFormat = I.DateFormat.MonthAbbrBeforeDay;
	timeFormat: I.TimeFormat = I.TimeFormat.H12;

	constructor (props: I.ViewRelation) {
		this.relationKey = String(props.relationKey || '');
		this.width = Number(props.width) || 0;
		this.isVisible = Boolean(props.isVisible);
		this.includeTime = Boolean(props.includeTime);
		this.dateFormat = Number(props.dateFormat) || I.DateFormat.MonthAbbrBeforeDay;
		this.timeFormat = Number(props.timeFormat) || I.TimeFormat.H12;

		makeObservable(this, {
			width: observable,
			isVisible: observable,
			includeTime: observable, 
			dateFormat: observable,
			timeFormat: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default ViewRelation;