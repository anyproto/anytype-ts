import { observable, action, set, intercept, makeObservable } from 'mobx';
import { I, M, UtilCommon, Dataview } from 'ts/lib';
import { detailStore } from 'ts/store';

import Constant from 'json/constant.json';

class DbStore {

    public relationMap: Map<string, any[]> = observable(new Map());
	public relationKeyMap: any = {};
    public viewMap: Map<string, I.View[]> = observable.map(new Map());
    public recordMap: Map<string, string[]> = observable.map(new Map());
    public metaMap: Map<string, any> = observable.map(new Map());
	public groupMap: Map<string, any> = observable.map(new Map());

    constructor() {
        makeObservable(this, {
			clearAll: action,
			relationsSet: action,
            viewsSet: action,
			viewsSort: action,
            viewsClear: action,
            viewAdd: action,
            viewUpdate: action,
            viewDelete: action,
            metaSet: action,
            metaClear: action,
            recordsSet: action,
            recordsClear: action,
            recordAdd: action,
            recordDelete: action,
			groupsSet: action,
			groupsAdd: action,
			groupsRemove: action,
			groupsClear: action,
        });
    }

	clearAll () {
    	this.relationMap.clear();
    	this.viewMap.clear();
    	this.recordMap.clear();
    	this.metaMap.clear();
	};

    relationsSet (rootId: string, blockId: string, list: any[]) {
		const key = this.getId(rootId, blockId);
		const relations = (this.relationMap.get(this.getId(rootId, blockId)) || []).
			concat(list.map(it => ({ relationKey: it.relationKey, format: it.format })));

		this.relationMap.set(key, UtilCommon.arrayUniqueObjects(relations, 'relationKey'));
	};

	relationListDelete (rootId: string, blockId: string, keys: string[]) {
		const key = this.getId(rootId, blockId);
		const relations = this.getObjectRelations(rootId, blockId).filter(it => !keys.includes(it.relationKey));
		
		this.relationMap.set(key, relations.map(it => ({ relationKey: it.relationKey, format: it.format })));
	};

    viewsSet (rootId: string, blockId: string, list: I.View[]) {
		const key = this.getId(rootId, blockId);
		const views = this.getViews(rootId, blockId);

		list = list.map((it: I.View) => { 
			it.relations = Dataview.viewGetRelations(rootId, blockId, it);
			return new M.View(it); 
		});

		for (const item of list) {
			const check = this.getView(rootId, blockId, item.id);
			if (check) {
				this.viewUpdate(rootId, blockId, item);
			} else {
				views.push(observable(item));
			};
		};
		
		this.viewMap.set(key, observable.array(views));
	};

	viewsSort (rootId: string, blockId: string, ids: string[]) {
		const views = this.getViews(rootId, blockId);

		views.sort((c1: any, c2: any) => {
			const i1 = ids.indexOf(c1.id);
			const i2 = ids.indexOf(c2.id);

			if (i1 > i2) return 1; 
			if (i1 < i2) return -1;
			return 0;
		});

		this.viewsSet(rootId, blockId, views);
	};

    viewsClear (rootId: string, blockId: string) {
		this.viewMap.delete(this.getId(rootId, blockId));
	};

    viewAdd (rootId: string, blockId: string, item: any) {
		const views = this.getViews(rootId, blockId);
		const view = this.getView(rootId, blockId, item.id);

		if (view) {
			this.viewUpdate(rootId, blockId, item);
		} else {
			views.push(new M.View(item));
		};
	};

    viewUpdate (rootId: string, blockId: string, item: any) {
		const views = this.getViews(rootId, blockId);
		const idx = views.findIndex(it => it.id == item.id);

		if (idx < 0) {
			return;
		};

		if (item.relations) {
			item.relations = Dataview.viewGetRelations(rootId, blockId, item);
		};
		set(views[idx], item);
	};

    viewDelete (rootId: string, blockId: string, id: string) {
		this.viewMap.set(this.getId(rootId, blockId), this.getViews(rootId, blockId).filter(it => it.id != id));
	};

    metaSet (rootId: string, blockId: string, meta: any) {
		const data = this.metaMap.get(this.getId(rootId, blockId));

		if (data) {
			set(data, Object.assign(data, meta));
		} else {
			meta.total = Number(meta.total) || 0;
			meta.offset = Math.max(0, Number(meta.offset) || 0);
			meta.viewId = String(meta.viewId || '');
			meta.keys = meta.keys || [];
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

    metaClear (rootId: string, blockId: string) {
		this.metaMap.delete(this.getId(rootId, blockId));
	};

    recordsSet (rootId: string, blockId: string, list: string[]) {
		this.recordMap.set(this.getId(rootId, blockId), observable.array(list));
	};

    recordsClear (rootId: string, blockId: string) {
		this.recordMap.delete(this.getId(rootId, blockId));
	};

    recordAdd (rootId: string, blockId: string, id: string, index: number) {
		const records = this.getRecords(rootId, blockId);
		
		records.splice(index, 0, id);
		this.recordsSet(rootId, blockId, records);
	};

    recordDelete (rootId: string, blockId: string, id: string) {
		this.recordMap.set(this.getId(rootId, blockId), this.getRecords(rootId, blockId).filter(it => it != id));
	};

	groupsSet (rootId: string, blockId: string, groups: any[]) {
		this.groupMap.set(this.getGroupSubId(rootId, blockId, 'groups'), observable(groups));
	};

	groupsAdd (rootId: string, blockId: string, groups: any[]) {
		const list = this.getGroups(rootId, blockId);

		for (const group of groups) {
			if (list.find(it => it.id == group.id)) {
				continue;
			};
			list.push(group);
		};

		this.groupMap.set(this.getGroupSubId(rootId, blockId, 'groups'), list);
	};

	groupsRemove (rootId: string, blockId: string, ids: string[]) {
		const groups = this.getGroups(rootId, blockId);

		ids.forEach((id: string) => {
			const subId = this.getSubId(rootId, [ blockId, id ].join('-'));
			dbStore.recordsClear(subId, '');
		});

		this.groupsSet(rootId, blockId, groups.filter(it => !ids.includes(it.id)));
	};

	groupsClear (rootId: string, blockId: string) {
		this.groupsRemove(rootId, blockId, this.getGroups(rootId, blockId).map(it => it.id));
	};

	getType (id: string) {
		const object = detailStore.get(Constant.subId.type, id, Constant.typeRelationKeys);
		return object._empty_ ? null : object;
	};

	getTypes () {
		return dbStore.getRecords(Constant.subId.type, '').map(id => this.getType(id)).
			filter(it => it && !it.isArchived && !it.isDeleted);
	};

	getRelations () {
		return dbStore.getRecords(Constant.subId.relation, '').map(id => this.getRelationById(id)).
			filter(it => it && !it.isArchived);
	};

	getObjectRelationKeys (rootId: string, blockId: string): any[] {
		return (this.relationMap.get(this.getId(rootId, blockId)) || []).map(it => it.relationKey);
	};

    getObjectRelations (rootId: string, blockId: string): any[] {
		return this.getObjectRelationKeys(rootId, blockId).map(it => this.getRelationByKey(it)).filter(it => it);
	};

    getRelationByKey (relationKey: string): any {
		const id = relationKey ? this.relationKeyMap[relationKey] : '';
		return id ? this.getRelationById(id) : null;
	};

	getRelationById (id: string): any {
		if (!id) {
			return null;
		};

		const object = detailStore.get(Constant.subId.relation, id, Constant.relationRelationKeys, true);
		return object._empty_ ? null : object;
	};

	getOption (id: string) {
		const object = detailStore.get(Constant.subId.option, id, Constant.optionRelationKeys, true);
		return object._empty_ ? null : object;
	};

    getViews (rootId: string, blockId: string): I.View[] {
		return this.viewMap.get(this.getId(rootId, blockId)) || [];
	};

    getView (rootId: string, blockId: string, id: string): I.View {
		return this.getViews(rootId, blockId).find(it => it.id == id);
	};

    getMeta (rootId: string, blockId: string) {
		const map = this.metaMap.get(this.getId(rootId, blockId)) || {};

		return {
			total: Number(map.total) || 0,
			offset: Number(map.offset) || 0,
			viewId: String(map.viewId || ''),
			keys: map.keys || [],
		};
	};

    getRecords (rootId: string, blockId: string) {
		return this.recordMap.get(this.getId(rootId, blockId)) || [];
	};

	getGroups (rootId: string, blockId: string) {
		return this.groupMap.get(this.getGroupSubId(rootId, blockId, 'groups')) || [];
	};

	getGroup (rootId: string, blockId: string, groupId: string) {
		return this.getGroups(rootId, blockId).find(it => it.id == groupId);
	};

	getId (rootId: string, blockId: string) {
		return [ rootId, blockId ].join('-');
	};

	getSubId (rootId: string, blockId: string) {
		return this.getId(rootId, blockId);
	};

	getGroupSubId (rootId: string, blockId: string, groupId: string): string {
		return [ rootId, blockId, groupId ].join('-');
	};

};

 export const dbStore: DbStore = new DbStore();