import { observable, action, computed, set, intercept, decorate } from 'mobx';
import { I, DataUtil } from 'ts/lib';

class DbStore {
	public objectTypeMap: Map<string, I.ObjectType> = observable.map(new Map());
	public relationMap: Map<string, any> = observable.map(new Map());
	public dataMap: Map<string, any> = observable.map(new Map());
	public metaMap: Map<string, any> = new Map();

	@computed
	get objectTypes (): I.ObjectType[] {
		return Array.from(this.objectTypeMap.values());
	};

	@action
	objectTypesSet (types: I.ObjectType[]) {
		for (let type of types) {
			this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
		};
	};

	@action 
	objectTypeRelationsAdd (url: string, relations: I.Relation[]) {
		const type = this.getObjectType(url);
		type.relations = type.relations.concat(relations);

		this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
	};

	@action 
	objectTypeRelationUpdate (url: string, relation: I.Relation) {
		const type = this.getObjectType(url);
		const idx = type.relations.findIndex((it: I.Relation) => { return it.relationKey == relation.relationKey; });

		set(type.relations[idx], relation);
		this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
	};

	@action 
	objectTypeRelationsRemove (url: string, relationKey: string) {
		const type = this.getObjectType(url);
		type.relations = type.relations.filter((it: I.Relation) => { return it.relationKey != relationKey; });

		this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
	};

	@action
	relationsSet (rootId: string, blockId: string, list: I.Relation[]) {
		this.relationMap.set(this.getId(rootId, blockId), observable(list));
	};

	@action
	relationsRemove (rootId: string, blockId: string) {
		this.relationMap.delete(this.getId(rootId, blockId));
	};

	@action
	relationAdd (rootId: string, blockId: string, item: any) {
		const relations = this.getRelations(rootId, blockId);
		const relation = relations.find((it: I.Relation) => { return it.relationKey == item.relationKey; });

		if (relation) {
			this.relationUpdate(rootId, blockId, item);
		} else {
			relations.push(item);
			this.relationsSet(rootId, blockId, relations);
		};
	};

	@action
	relationUpdate (rootId: string, blockId: string, item: any) {
		const relations = this.getRelations(rootId, blockId);
		const relation = relations.find((it: I.Relation) => { return it.relationKey == item.relationKey; });
		if (!relation) {
			return;
		};

		const idx = relations.findIndex((it: I.Relation) => { return it.relationKey == item.relationKey; });
		set(relations[idx], item);
	};

	@action
	relationRemove (rootId: string, blockId: string, key: string) {
		let relations = this.getRelations(rootId, blockId);
		relations = relations.filter((it: I.Relation) => { return it.relationKey != key; });
		this.relationsSet(rootId, blockId, relations);
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
	recordsSet (rootId: string, blockId: string, list: any[]) {
		list = list.map((obj: any) => {
			obj = observable(obj);
			intercept(obj as any, (change: any) => {
				if (JSON.stringify(change.newValue) === JSON.stringify(obj[change.name])) {
					return null;
				};
				return change;
			});
			return obj;
		});

		this.dataMap.set(this.getId(rootId, blockId), observable.array(list));
	};

	@action
	recordAdd (rootId: string, blockId: string, obj: any) {
		const data = this.getData(rootId, blockId);
		obj = observable(obj);

		intercept(obj as any, (change: any) => {
			if (JSON.stringify(change.newValue) === JSON.stringify(obj[change.name])) {
				return null;
			};
			return change;
		});

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
		data = data.filter((it: any) => { return it.id == id; });
	};

	getId (rootId: string, blockId: string) {
		return [ rootId, blockId ].join(':');
	};

	getObjectType (url: string): I.ObjectType {
		return this.objectTypeMap.get(DataUtil.schemaField(url));
	};

	getRelations (rootId: string, blockId: string): I.Relation[] {
		return this.relationMap.get(this.getId(rootId, blockId)) || [];
	};

	getRelation (rootId: string, blockId: string, relationKey: string): I.Relation {
		const relations = this.getRelations(rootId, blockId);
		return relations.find((it: I.Relation) => { return it.relationKey == relationKey; });
	};

	getMeta (rootId: string, blockId: string) {
		return this.metaMap.get(this.getId(rootId, blockId)) || {};
	};

	getData (rootId: string, blockId: string) {
		return this.dataMap.get(this.getId(rootId, blockId)) || [];
	};

};

export let dbStore: DbStore = new DbStore();