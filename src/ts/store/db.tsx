import { observable, action, computed, set, intercept, decorate } from 'mobx';
import { I, DataUtil } from 'ts/lib';

class DbStore {
	public objectTypeMap: Map<string, I.ObjectType> = observable.map(new Map());
	public objectTypePerObjectMap: Map<string, I.ObjectTypePerObject> = observable.map(new Map());
	public relationMap: Map<string, any> = observable(new Map());
	public dataMap: Map<string, any> = observable.map(new Map());
	public metaMap: Map<string, any> = new Map();

	@action
	objectTypesSet (types: I.ObjectType[]) {
		for (let type of types) {
			this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
		};
	};

	@action
	objectTypesPerObjectSet (types: I.ObjectTypePerObject[]) {
		for (let type of types) {
			this.objectTypePerObjectMap.set(type.objectId, type);
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
		const idx = type.relations.findIndex((it: I.Relation) => { return it.key == relation.key; });

		set(type.relations[idx], relation);
		this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
	};

	@action 
	objectTypeRelationsRemove (url: string, relationKey: string) {
		const type = this.getObjectType(url);
		type.relations = type.relations.filter((it: I.Relation) => { return it.key != relationKey; });

		this.objectTypeMap.set(DataUtil.schemaField(type.url), type);
	};

	@action
	relationsSet (blockId: string, list: I.Relation[]) {
		this.relationMap.set(blockId, observable(list));
	};

	@action
	relationsRemove (blockId: string) {
		this.relationMap.delete(blockId);
	};

	@action
	relationAdd (blockId: string, item: any) {
		const relations = this.getRelations(blockId);
		const relation = relations.find((it: I.Relation) => { return it.key == item.key; });
		if (relation) {
			this.relationUpdate(blockId, item);
		} else {
			relations.push(relation);
			this.relationsSet(blockId, relations);
		};
	};

	@action
	relationUpdate (blockId: string, item: any) {
		const relations = this.getRelations(blockId);
		const relation = relations.find((it: I.Relation) => { return it.key == item.key; });
		const idx = relations.findIndex((it: I.Relation) => { return it.key == item.key; });
		if (!relation) {
			return;
		};

		set(relations[idx], item);
		this.relationsSet(blockId, relations);
	};

	@action
	relationRemove (blockId: string, key: string) {
		let relations = this.getRelations(blockId);
		relations = relations.filter((it: I.Relation) => { return it.key != key; });

		this.relationsSet(blockId, relations);
	};

	@action
	setData (blockId: string, list: any[]) {
		list = list.map((it: any) => {
			it = observable(it);
			intercept(it as any, (change: any) => {
				if (change.newValue === it[change.name]) {
					return null;
				};
				return change;
			});
			return it;
		});
		this.dataMap.set(blockId, observable.array(list));
	};

	@action
	setMeta (blockId: string, meta: any) {
		const data = this.metaMap.get(blockId);

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

			this.metaMap.set(blockId, meta);
		};
	};

	@action
	recordAdd (blockId: string, obj: any) {
		const data = this.getData(blockId);
		data.push(observable(obj));
	};

	@action
	recordUpdate (blockId: string, obj: any) {
		const data = this.getData(blockId);
		const record = data.find((it: any) => { return it.id == obj.id; });
		if (!record) {
			return;
		};

		set(record, obj);
	};

	@action
	recordDelete (blockId: string, id: string) {
		let data = this.getData(blockId);
		data = data.filter((it: any) => { return it.id == id; });
	};

	getObjectType (url: string): I.ObjectType {
		return this.objectTypeMap.get(DataUtil.schemaField(url));
	};

	getRelations (blockId: string): I.Relation[] {
		return this.relationMap.get(blockId) || [];
	};

	getRelation (blockId: string, key: string): I.Relation {
		const relations = this.relationMap.get(blockId) || [];
		return relations.find((it: I.Relation) => { return it.key == key; });
	};

	getMeta (blockId: string) {
		return this.metaMap.get(blockId) || {};
	};

	getData (blockId: string) {
		return this.dataMap.get(blockId) || [];
	};

};

export let dbStore: DbStore = new DbStore();