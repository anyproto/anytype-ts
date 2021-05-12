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

	getRelation (relationKey: string) {
		return this.relations.find((it: I.ViewRelation) => { return it.relationKey == relationKey; });
	};

	getFilter (index: number) {
		return this.filters[index] || {};
	};

	setFilter (index: number, filter: any) {
		this.filters[index] = Object.assign(this.getFilter(index), filter);
	};

};

class Relation implements I.Relation {

	objectId: string = '';
	relationKey: string = '';
	name: string = '';
	dataSource: number = 0;
	objectTypes: string[] = [];
	format: I.RelationType = I.RelationType.LongText;
	isHidden: boolean = false;
	isReadOnly: boolean = false;
	maxCount: number = 0;
	scope: I.RelationScope = I.RelationScope.Object;
	selectDict: any[] = [] as any[];

	constructor (props: I.Relation) {
		let self = this;

		self.objectId = String(props.objectId || '');
		self.relationKey = String(props.relationKey || '');
		self.name = String(props.name || '');
		self.dataSource = Number(props.dataSource) || 0;
		self.objectTypes = props.objectTypes || [];
		self.format = props.format || I.RelationType.LongText;
		self.isHidden = Boolean(props.isHidden);
		self.isReadOnly = Boolean(props.isReadOnly);
		self.maxCount = Number(props.maxCount) || 0;
		self.scope = props.scope || I.RelationScope.Object;
		self.selectDict = (props.selectDict || []).map((it: any) => { return new SelectOption(it); });

		decorate(self, {
			name: observable,
			format: observable,
			maxCount: observable,
			objectTypes: observable,
			selectDict: observable,
			scope: observable,
			isHidden: observable,
			isReadOnly: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

class SelectOption implements I.SelectOption {
	
	id: string = '';
	text: string = '';
	color: string = '';
	scope: I.OptionScope = I.OptionScope.Local;

	constructor (props: I.SelectOption) {
		let self = this;

		self.id = String(props.id || '');
		self.text = String(props.text || '');
		self.color = String(props.color || '');
		self.scope = Number(props.scope) || I.OptionScope.Local;

		decorate(self, {
			text: observable,
			color: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};
};

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

		decorate(self, {
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
	condition: I.FilterCondition = I.FilterCondition.None;
	value: any = {};

	constructor (props: I.Filter) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.operator = Number(props.operator) || I.FilterOperator.And;
		self.condition = Number(props.condition) || I.FilterCondition.None;
		self.value = props.value;

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