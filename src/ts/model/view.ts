import { I, M, Util, DataUtil } from 'Lib';
import { dbStore } from 'Store';
import { observable, intercept, makeObservable } from 'mobx';

class View implements I.View {
	
	id: string = '';
	name: string = '';
	type: I.ViewType = I.ViewType.Grid;
	coverRelationKey: string = '';
	coverFit: boolean = false;
	cardSize: I.CardSize = I.CardSize.Small;
	hideIcon: boolean = false;
	groupRelationKey: string = '';
	groupBackgroundColors: boolean = false;
	sorts: I.Sort[] = [];
	filters: I.Filter[] = [];
	relations: any[] = [];
	
	constructor (props: I.View) {
		this.id = String(props.id || '');
		this.name = String(props.name || DataUtil.defaultName('view'));
		this.type = Number(props.type) || I.ViewType.Grid;
		this.coverRelationKey = String(props.coverRelationKey || '');
		this.coverFit = Boolean(props.coverFit);
		this.hideIcon = Boolean(props.hideIcon);
		this.cardSize = Number(props.cardSize) || I.CardSize.Small;
		this.groupRelationKey = String(props.groupRelationKey || '');
		this.groupBackgroundColors = Boolean(props.groupBackgroundColors);
		
		this.relations = (props.relations || []).map((it: I.ViewRelation) => { return new M.ViewRelation(it); });
		this.filters = (props.filters || []).map((it: I.Filter) => { return new M.Filter(it); });
		this.sorts = (props.sorts || []).map((it: I.Sort) => { return new M.Sort(it); });

		makeObservable(this, {
			id: observable,
			name: observable,
			type: observable,
			coverRelationKey: observable,
			coverFit: observable,
			cardSize: observable,
			hideIcon: observable,
			groupRelationKey: observable,
			groupBackgroundColors: observable,
			sorts: observable,
			filters: observable,
			relations: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

	getVisibleRelations () {
		return this.relations.filter(it => it && it.isVisible && dbStore.getRelationByKey(it.relationKey));
	};

	getRelation (relationKey: string) {
		return this.relations.find(it => it.relationKey == relationKey);
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