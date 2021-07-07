import { observable, action, computed, set, intercept } from 'mobx';
import { I, M, DataUtil, Util } from 'ts/lib';

const Constant = require('json/constant.json');

class DbStore {
	public objectTypeList: I.ObjectType[] = observable.array([]);
	public relationMap: Map<string, I.Relation[]> = observable.map(new Map());
	public viewMap: Map<string, I.View[]> = observable.map(new Map());
	public dataMap: Map<string, any[]> = observable.map(new Map());
	public metaMap: Map<string, any> = new Map();

	@computed
	get objectTypes (): I.ObjectType[] {
		return this.objectTypeList;
	};

	@action
	objectTypesSet (types: I.ObjectType[]) {
		let list = this.objectTypeList;

		types = types.map((it: any) => { return new M.ObjectType(it); });

		for (let type of types) {
			const check = this.getObjectType(type.id);
			if (check) {
				this.objectTypeUpdate(type);
			} else {
				list.push(type);
			};
		};
	};

	@action
	objectTypeAdd (type: any) {
		this.objectTypeList.push(new M.ObjectType(type));
	};

	@action
	objectTypeUpdate (type: any) {
		console.log('[objectTypeUpdate]', type);

		const item = this.getObjectType(type.id);
		if (item) {
			set(item, type);
		};
	};

	@action
	objectTypesClear () {
		this.objectTypeList = [];
	};

	@action
	relationsSet (rootId: string, blockId: string, list: I.Relation[]) {
		const key = this.getId(rootId, blockId);
		const relations = this.getRelations(rootId, blockId);

		list = list.map((it: I.Relation) => { return new M.Relation(it); });
		for (let item of list) {
			const check = this.getRelation(rootId, blockId, item.relationKey);
			if (check) {
				this.relationUpdate(rootId, blockId, item);
			} else {
				relations.push(item);
			};
		};
		
		this.relationMap.set(key, relations);
	};

	@action
	relationsClear (rootId: string, blockId: string) {
		this.relationMap.delete(this.getId(rootId, blockId));
	};

	@action
	relationAdd (rootId: string, blockId: string, item: any) {
		const relations = this.getRelations(rootId, blockId);
		const relation = this.getRelation(rootId, blockId, item.relationKey);

		if (relation) {
			this.relationUpdate(rootId, blockId, item);
		} else {
			relations.push(new M.Relation(item));
		};
	};

	@action
	relationUpdate (rootId: string, blockId: string, item: any) {
		const relations = this.getRelations(rootId, blockId);
		const idx = relations.findIndex((it: I.Relation) => { return it.relationKey == item.relationKey; });

		if (idx < 0) {
			return;
		};

		set(relations[idx], item);
	};

	@action
	relationDelete (rootId: string, blockId: string, key: string) {
		let relations = this.getRelations(rootId, blockId);
		relations = relations.filter((it: I.Relation) => { return it.relationKey != key; });
		this.relationMap.set(this.getId(rootId, blockId), relations);
	};

	@action
	viewsSet (rootId: string, blockId: string, list: I.View[]) {
		const key = this.getId(rootId, blockId);
		const views = this.getViews(rootId, blockId);

		list = list.map((it: I.View) => { 
			it.relations = DataUtil.viewGetRelations(rootId, blockId, it);
			return new M.View(it); 
		});

		for (let item of list) {
			const check = this.getView(rootId, blockId, item.id);
			if (check) {
				this.viewUpdate(rootId, blockId, item);
			} else {
				views.push(observable(item));
			};
		};
		
		this.viewMap.set(key, observable.array(views));
	};

	@action
	viewsClear (rootId: string, blockId: string) {
		this.viewMap.delete(this.getId(rootId, blockId));
	};

	@action
	viewAdd (rootId: string, blockId: string, item: any) {
		const views = this.getViews(rootId, blockId);
		const view = this.getView(rootId, blockId, item.id);

		if (view) {
			this.viewUpdate(rootId, blockId, item);
		} else {
			views.push(new M.View(item));
		};
	};

	@action
	viewUpdate (rootId: string, blockId: string, item: any) {
		const views = this.getViews(rootId, blockId);
		const idx = views.findIndex((it: I.View) => { return it.id == item.id; });

		if (idx < 0) {
			return;
		};

		item.relations = DataUtil.viewGetRelations(rootId, blockId, item);
		set(views[idx], item);
	};

	@action
	viewDelete (rootId: string, blockId: string, id: string) {
		let views = this.getViews(rootId, blockId);
		views = views.filter((it: I.View) => { return it.id != id; });

		this.viewMap.set(this.getId(rootId, blockId), views);
	};

	@action
	metaSet (rootId: string, blockId: string, meta: any) {
		const data = this.metaMap.get(this.getId(rootId, blockId));

		if (data) {
			set(data, meta);
		} else {
			meta.offset = 0;
			meta = observable(meta);

			intercept(meta as any, (change: any) => {
				if (change.newValue === meta[change.name]) {
					return null;
				};
				return change;
			});

			this.metaMap.set(this.getId(rootId, blockId), meta);
		};
	};

	@action
	metaClear (rootId: string, blockId: string) {
		this.metaMap.delete(this.getId(rootId, blockId));
	};

	@action
	recordsSet (rootId: string, blockId: string, list: any[]) {
		list = list.map((obj: any) => {
			obj = observable(obj);
			intercept(obj as any, (change: any) => { return Util.intercept(self, change); });
			return obj;
		});

		this.dataMap.set(this.getId(rootId, blockId), observable.array(list));
	};

	@action
	recordsClear (rootId: string, blockId: string) {
		this.dataMap.delete(this.getId(rootId, blockId));
	};

	@action
	recordAdd (rootId: string, blockId: string, obj: any) {
		const data = this.getData(rootId, blockId);
		obj = observable(obj);

		intercept(obj as any, (change: any) => { return Util.intercept(self, change); });

		data.push(obj);
	};

	@action
	recordUpdate (rootId: string, blockId: string, obj: any) {
		const data = this.getData(rootId, blockId);
		const record = data.find((it: any) => { return it.id == obj.id; });
		if (!record) {
			return;
		};

		set(record, obj);
	};

	@action
	recordDelete (rootId: string, blockId: string, id: string) {
		let data = this.getData(rootId, blockId);
		data = data.filter((it: any) => { return it.id != id; });

		this.dataMap.set(this.getId(rootId, blockId), data);
	};

	getId (rootId: string, blockId: string) {
		return [ rootId, blockId ].join(':');
	};

	getObjectType (id: string): I.ObjectType {
		return this.objectTypeList.find((it: I.ObjectType) => { return it.id == id; });
	};

	getObjectTypesForSBType (SBType: I.SmartBlockType): I.ObjectType[] {
		return this.objectTypes.filter((it: I.ObjectType) => {
			return (it.types.indexOf(SBType) >= 0) && !it.isArchived;
		});
	};

	getRelations (rootId: string, blockId: string): I.Relation[] {
		return this.relationMap.get(this.getId(rootId, blockId)) || [];
	};

	getRelation (rootId: string, blockId: string, relationKey: string): I.Relation {
		const relations = this.getRelations(rootId, blockId);
		return relations.find((it: I.Relation) => { return it.relationKey == relationKey; });
	};

	getViews (rootId: string, blockId: string): I.View[] {
		return this.viewMap.get(this.getId(rootId, blockId)) || [];
	};

	getView (rootId: string, blockId: string, id: string): I.View {
		const views = this.getViews(rootId, blockId);
		return views.find((it: I.View) => { return it.id == id; });
	};

	getMeta (rootId: string, blockId: string) {
		return this.metaMap.get(this.getId(rootId, blockId)) || {};
	};

	getData (rootId: string, blockId: string) {
		return this.dataMap.get(this.getId(rootId, blockId)) || [];
	};

};

export let dbStore: DbStore = new DbStore();