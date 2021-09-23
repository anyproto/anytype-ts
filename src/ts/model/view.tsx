import { I, M, Util, DataUtil } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class View implements I.View {
	
	id: string = '';
	name: string = '';
	type: I.ViewType = I.ViewType.Grid;
	coverRelationKey: string = '';
	sorts: I.Sort[] = [];
	filters: I.Filter[] = [];
	relations: any[] = [];
	
	constructor (props: I.View) {
		let self = this;
		
		self.id = String(props.id || '');
		self.name = String(props.name || DataUtil.defaultName('view'));
		self.type = Number(props.type) || I.ViewType.Grid;
		self.coverRelationKey = String(props.coverRelationKey || '');
		
		self.relations = (props.relations || []).map((it: I.ViewRelation) => { return new M.ViewRelation(it); });
		self.filters = (props.filters || []).map((it: I.Filter) => { return new M.Filter(it); });
		self.sorts = (props.sorts || []).map((it: I.Sort) => { return new M.Sort(it); });

		makeObservable(self, {
			id: observable,
			name: observable,
			type: observable,
			coverRelationKey: observable,
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

	getSort (index: number) {
		return this.sorts[index] || {};
	};

};

export default View;