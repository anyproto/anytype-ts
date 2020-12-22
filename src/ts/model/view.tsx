import { I, Util } from 'ts/lib';
import { decorate, observable, intercept } from 'mobx';

const Constant = require('json/constant.json');

class View implements I.View {
	
	id: string = '';
	name: string = '';
	type: I.ViewType = I.ViewType.Grid;
	sorts: I.Sort[] = [];
	filters: I.Filter[] = [];
	relations: any[] = [];
	
	constructor (props: I.View) {
		let self = this;
		
		self.id = String(props.id || '');
		self.name = String(props.name || Constant.default.name);
		self.type = Number(props.type) || I.ViewType.Grid;
		
		self.relations = (props.relations || []).map((it: I.ViewRelation) => { return new ViewRelation(it); });
		self.filters = (props.filters || []).map((it: I.Filter) => { return new Filter(it); });
		self.sorts = (props.sorts || []).map((it: I.Sort) => { return new Sort(it); });

		decorate(self, {
			id: observable,
			name: observable,
			type: observable,
			sorts: observable,
			filters: observable,
			relations: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

class Relation implements I.Relation {

	relationKey: string = '';
	name: string = '';
	dataSource: string = '';
	objectTypes: string[] = [];
	format: I.RelationType = I.RelationType.Description;
	isHidden: boolean = false;
	isReadOnly: boolean = false;
	isMultiple: boolean = false;
	selectDict: any[] = [] as any[];

	constructor (props: I.ViewRelation) {
		let self = this;

		self.relationKey = String(props.relationKey || '');
		self.name = String(props.name || '');
		self.dataSource = String(props.dataSource || '');
		self.objectTypes = props.objectTypes || [];
		self.format = props.format || I.RelationType.Description;
		self.isHidden = Boolean(props.isHidden);
		self.isReadOnly = Boolean(props.isReadOnly);
		self.isMultiple = Boolean(props.isMultiple);
		self.selectDict = (props.selectDict || []).map((it: any) => { return new SelectOption(it); });
	};

};

class SelectOption implements I.SelectOption {
	
	id: string = '';
	text: string = '';
	color: string = '';

	constructor (props: I.SelectOption) {
		let self = this;

		self.id = String(props.id || '');
		self.text = String(props.text || '');
		self.color = String(props.color || '');

		decorate(self, {
			text: observable,
			color: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};
};

class ViewRelation extends Relation implements I.ViewRelation {

	width: number = 0;
	isVisible: boolean = false;
	includeTime: boolean = false;
	dateFormat: I.DateFormat = I.DateFormat.MonthAbbrBeforeDay;
	timeFormat: I.TimeFormat = I.TimeFormat.H12;

	constructor (props: I.ViewRelation) {
		super(props);

		let self = this;

		self.width = Number(props.width) || 0;
		self.isVisible = Boolean(props.isVisible);
		self.includeTime = Boolean(props.includeTime);
		self.dateFormat = Number(props.dateFormat) || I.DateFormat.MonthAbbrBeforeDay;
		self.timeFormat = Number(props.timeFormat) || I.TimeFormat.H12;

		decorate(self, {
			name: observable,
			selectDict: observable,
			width: observable,
			isVisible: observable,
			includeTime: observable, 
			dateFormat: observable,
			timeFormat: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

class Filter implements I.Filter {

	relationKey: string = '';
	operator: I.FilterOperator = I.FilterOperator.And;
	condition: I.FilterCondition = I.FilterCondition.Equal;
	value: any = {};

	constructor (props: I.Filter) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.operator = Number(props.operator) || I.FilterOperator.And;
		self.condition = Number(props.condition) || I.FilterCondition.Equal;
		self.value = props.value || '';

		decorate(self, {
			relationKey: observable,
			operator: observable,
			condition: observable,
			value: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

class Sort implements I.Sort {

	relationKey: string = '';
	type: I.SortType = I.SortType.Asc;

	constructor (props: I.Sort) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.type = Number(props.type) || I.SortType.Asc;

		decorate(self, {
			relationKey: observable,
			type: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export {
	View,
	Relation,
	SelectOption,
	ViewRelation,
	Filter,
	Sort,
};