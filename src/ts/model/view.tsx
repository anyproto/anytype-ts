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

class Relation implements I.Relation {

	key: string = '';
	name: string = '';
	dataSource: string = '';
	objectType: string = '';
	format: I.RelationType = I.RelationType.Description;
	isHidden: boolean = false;
	isReadOnly: boolean = false;
	isMultiple: boolean = false;
	selectDict: any[] = [] as any[];

	constructor (props: I.ViewRelation) {
		let self = this;

		self.key = String(props.key || '');
		self.name = String(props.name || '');
		self.dataSource = String(props.dataSource || '');
		self.objectType = String(props.objectType || '');
		self.format = props.format || I.RelationType.Description;
		self.isHidden = Boolean(props.isHidden);
		self.isReadOnly = Boolean(props.isReadOnly);
		self.isMultiple = Boolean(props.isMultiple);
		self.selectDict = (props.selectDict || []).map((it: any) => {
			return new SelectOption(it);
		});
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
	};
};

class ViewRelation extends Relation implements I.ViewRelation {

	key: string = '';
	width: number = 0;
	options: any = {} as any;
	isVisible: boolean = false;

	constructor (props: I.ViewRelation) {
		super(props);

		let self = this;

		self.key = String(props.key || '');
		self.width = Number(props.width) || 0;
		self.options = props.options || {};
		self.isVisible = Boolean(props.isVisible);
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
	Relation,
	SelectOption,
	ViewRelation,
	Filter,
	Sort,
}