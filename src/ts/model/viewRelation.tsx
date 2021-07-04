import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class ViewRelation implements I.ViewRelation {

	relationKey: string = '';
	width: number = 0;
	isVisible: boolean = false;
	includeTime: boolean = false;
	dateFormat: I.DateFormat = I.DateFormat.MonthAbbrBeforeDay;
	timeFormat: I.TimeFormat = I.TimeFormat.H12;

	constructor (props: I.ViewRelation) {
		let self = this;

		self.relationKey = String(props.relationKey || '');
		self.width = Number(props.width) || 0;
		self.isVisible = Boolean(props.isVisible);
		self.includeTime = Boolean(props.includeTime);
		self.dateFormat = Number(props.dateFormat) || I.DateFormat.MonthAbbrBeforeDay;
		self.timeFormat = Number(props.timeFormat) || I.TimeFormat.H12;

		makeObservable(self, {
			width: observable,
			isVisible: observable,
			includeTime: observable, 
			dateFormat: observable,
			timeFormat: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default ViewRelation;