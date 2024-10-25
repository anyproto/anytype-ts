import { I, M, S, U } from 'Lib';
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
	defaultTypeId = '';
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
		this.defaultTypeId = String(props.defaultTypeId || '');
		
		this.relations = Array.isArray(props.relations) ? props.relations : [];
		this.relations = this.relations.map(it => new M.ViewRelation(it));

		this.filters = Array.isArray(props.filters) ? props.filters : [];
		this.filters = this.filters.map(it => new M.Filter(it));

		this.sorts = Array.isArray(props.sorts) ? props.sorts : [];
		this.sorts = this.sorts.map(it => new M.Sort(it));

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
			defaultTypeId: observable,
			sorts: observable,
			filters: observable,
			relations: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
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

	getRelations () {
		return this.relations.filter(it => it);
	};

	getVisibleRelations () {
		return this.getRelations().filter(it => it.isVisible && S.Record.getRelationByKey(it.relationKey));
	};

	getRelation (relationKey: string) {
		return this.getRelations().find(it => it.relationKey == relationKey);
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