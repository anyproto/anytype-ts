import { I, M, UtilCommon, UtilData } from 'Lib';
import { dbStore } from 'Store';
import { observable, intercept, makeObservable } from 'mobx';

class View implements I.View {
	
	id = '';
	name = '';
	type: I.ViewType = I.ViewType.Grid;
	coverRelationKey = '';
	coverFit = false;
	cardSize: I.CardSize = I.CardSize.Small;
	hideIcon = false;
	groupRelationKey = '';
	groupBackgroundColors = false;
	pageLimit = 0;
	defaultTemplateId = '';
	sorts: I.Sort[] = [];
	filters: I.Filter[] = [];
	relations: any[] = [];
	
	constructor (props: I.View) {
		this.id = String(props.id || '');
		this.name = String(props.name || '');
		this.type = Number(props.type) || I.ViewType.Grid;
		this.coverRelationKey = String(props.coverRelationKey || '');
		this.coverFit = Boolean(props.coverFit);
		this.hideIcon = Boolean(props.hideIcon);
		this.cardSize = Number(props.cardSize) || I.CardSize.Small;
		this.groupRelationKey = String(props.groupRelationKey || '');
		this.groupBackgroundColors = Boolean(props.groupBackgroundColors);
		this.pageLimit = Number(props.pageLimit) || 0;
		this.defaultTemplateId = String(props.defaultTemplateId || '');
		
		this.relations = (props.relations || []).map(it => new M.ViewRelation(it));
		this.filters = (props.filters || []).map(it => new M.Filter(it));
		this.sorts = (props.sorts || []).map(it => new M.Sort(it));

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
			pageLimit: observable,
			defaultTemplateId: observable,
			sorts: observable,
			filters: observable,
			relations: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

	isGrid () {
		return this.type == I.ViewType.Grid;
	};

	isList () {
		return this.type == I.ViewType.List;
	};

	isGallery () {
		return this.type == I.ViewType.Gallery;
	};

	isBoard () {
		return this.type == I.ViewType.Board;
	};

	getVisibleRelations () {
		return this.relations.filter(it => it && it.isVisible && dbStore.getRelationByKey(it.relationKey));
	};

	getRelation (relationKey: string) {
		return this.relations.find(it => it && (it.relationKey == relationKey));
	};

	getFilter (id: string) {
		return this.filters.find(it => it.id == id);
	};

	setFilter (filter: I.Filter) {
		const obj = this.getFilter(filter.id);

		if (obj) {
			Object.assign(obj, filter);
		};
	};

	getSort (id: string) {
		return this.sorts.find(it => it.id == id);
	};

};

export default View;
