import { I, M, Util } from 'ts/lib';
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
		
		self.relations = (props.relations || []).map((it: I.ViewRelation) => { return new M.ViewRelation(it); });
		self.filters = (props.filters || []).map((it: I.Filter) => { return new M.Filter(it); });
		self.sorts = (props.sorts || []).map((it: I.Sort) => { return new M.Sort(it); });

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

export default View;