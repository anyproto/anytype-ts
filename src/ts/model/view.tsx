import { I } from 'ts/lib';
import { observable } from 'mobx';

const Constant = require('json/constant.json');

class View implements I.View {
	
	@observable id: string = '';
	@observable name: string = '';
	@observable type: I.ViewType = I.ViewType.Grid;
	@observable sorts: I.Sort[] = [];
	@observable filters: I.Filter[] = [];
	@observable relations: any[] = [];
	
	constructor (props: I.View) {
		let self = this;
		
		self.id = String(props.id || '');
		self.name = String(props.name || Constant.default.name);
		self.type = Number(props.type) || I.ViewType.Grid;
		
		self.relations = (props.relations || []).map((it: I.ViewRelation) => { return new ViewRelation(it); });
		self.filters = (props.filters || []).map((it: I.Filter) => { return new Filter(it); });
		self.sorts = (props.sorts || []).map((it: I.Sort) => { return new Sort(it); });
	};

};

class ViewRelation implements I.ViewRelation {

	id: string = '';
	key: string = '';
	name: string = '';
	format: string = '';
	dataSource: string = '';
	objectType: string = '';
	options: any[] = [] as any[];
	type: I.RelationType = I.RelationType.None;
	isHidden: boolean = false;
	isReadOnly: boolean = false;
	isVisible: boolean = false;
	isMultiple: boolean = false;
	order: number = 0;
	width: number = 0;

	constructor (props: I.ViewRelation) {
		let self = this;
		
		self.id = String(props.id || '');
		self.name = String(props.name || '');
		self.type = props.type || I.RelationType.None;
		self.isHidden = Boolean(props.isHidden);
		self.isReadOnly = Boolean(props.isReadOnly);
		self.isVisible = Boolean(props.isVisible);
		self.order = Number(props.order) || 0;
		self.width = Number(props.width) || 0;
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
	};

};

class Sort implements I.Sort {

	relationKey: string = '';
	type: I.SortType = I.SortType.Asc;

	constructor (props: I.Sort) {
		let self = this;
		
		self.relationKey = String(props.relationKey || '');
		self.type = Number(props.type) || I.SortType.Asc;
	};

};

export {
	View,
	ViewRelation,
	Filter,
	Sort,
}