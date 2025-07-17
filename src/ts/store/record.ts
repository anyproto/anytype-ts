import { observable, action, set, intercept, makeObservable } from 'mobx';
import { S, I, M, U, J, Dataview, Relation } from 'Lib';

enum KeyMapType {
	Relation = 'relation',
	Type = 'type',
};

class RecordStore {

	public relationMap: Map<string, any[]> = observable(new Map());
	public relationKeyMap: Map<string, Map<string, string>> = new Map();
	public typeKeyMap: Map<string, Map<string, string>> = new Map();
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

	/**
	 * Clears all record-related maps in the store.
	 */
	clearAll () {
		this.relationMap.clear();
		this.relationKeyMap.clear();
		this.typeKeyMap.clear();
		this.viewMap.clear();
		this.recordMap.clear();
		this.metaMap.clear();
		this.groupMap.clear();
	};

	/**
	 * Gets or creates a key map of the specified type for a space.
	 * @param {string} type - The key map type ('relation' or 'type').
	 * @param {string} spaceId - The space ID.
	 * @returns {Map<string, string>} The key map.
	 */
	keyMapGet (type: string, spaceId: string) {
		const key = `${type}KeyMap`;

		let map = this[key].get(spaceId);
		if (!map) {
			map = new Map();
			this[key].set(spaceId, map);
		};

		return map;
	}; 

	/**
	 * Sets a relation key map entry for a space.
	 * @param {string} spaceId - The space ID.
	 * @param {string} key - The relation key.
	 * @param {string} id - The relation ID.
	 */
	relationKeyMapSet (spaceId: string, key: string, id: string) {
		if (spaceId && key && id) {
			this.keyMapGet(KeyMapType.Relation, spaceId).set(key, id);
		};
	};

	/**
	 * Gets a relation ID by key for the current space.
	 * @param {string} key - The relation key.
	 * @returns {string} The relation ID.
	 */
	relationKeyMapGet (key: string): string {
		const map = this.keyMapGet(KeyMapType.Relation, S.Common.space);
		return map?.get(key);
	};

	/**
	 * Sets a type key map entry for a space.
	 * @param {string} spaceId - The space ID.
	 * @param {string} key - The type key.
	 * @param {string} id - The type ID.
	 */
	typeKeyMapSet (spaceId: string, key: string, id: string) {
		if (spaceId && key && id) {
			this.keyMapGet(KeyMapType.Type, spaceId).set(key, id);
		};
	};

	/**
	 * Gets a type ID by key for the current space.
	 * @param {string} key - The type key.
	 * @returns {string} The type ID.
	 */
	typeKeyMapGet (key: string): string {
		const map = this.keyMapGet(KeyMapType.Type, S.Common.space);
		return map.get(key);
	};

	/**
	 * Sets the relations for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any[]} list - The relations list.
	 */
	relationsSet (rootId: string, blockId: string, list: any[]) {
		const key = this.getId(rootId, blockId);
		const relations = (this.relationMap.get(this.getId(rootId, blockId)) || []).
			concat(list.map(it => ({ relationKey: it.relationKey, format: it.format })));

		this.relationMap.set(key, U.Common.arrayUniqueObjects(relations, 'relationKey'));
	};

	/**
	 * Deletes relations by keys for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string[]} keys - The relation keys to delete.
	 */
	relationListDelete (rootId: string, blockId: string, keys: string[]) {
		const key = this.getId(rootId, blockId);
		const relations = this.getDataviewRelations(rootId, blockId).filter(it => !keys.includes(it.relationKey));
		
		this.relationMap.set(key, relations.map(it => ({ relationKey: it.relationKey, format: it.format })));
	};

	/**
	 * Sets the views for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {I.View[]} list - The views list.
	 */
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

	/**
	 * Sorts the views for a block in a root by IDs.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string[]} ids - The view IDs in order.
	 */
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

	/**
	 * Clears the views for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 */
	viewsClear (rootId: string, blockId: string) {
		this.viewMap.delete(this.getId(rootId, blockId));
	};

	/**
	 * Adds a view to a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any} item - The view item.
	 */
	viewAdd (rootId: string, blockId: string, item: any) {
		const views = this.getViews(rootId, blockId);
		const view = this.getView(rootId, blockId, item.id);

		if (view) {
			this.viewUpdate(rootId, blockId, item);
		} else {
			views.push(new M.View(item));
		};
	};

	/**
	 * Updates a view for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any} item - The view item.
	 */
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

	/**
	 * Deletes a view by ID for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} id - The view ID.
	 */
	viewDelete (rootId: string, blockId: string, id: string) {
		this.viewMap.set(this.getId(rootId, blockId), this.getViews(rootId, blockId).filter(it => it.id != id));
	};

	/**
	 * Sets the meta information for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any} meta - The meta information.
	 */
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

	/**
	 * Clears the meta information for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 */
	metaClear (rootId: string, blockId: string) {
		this.metaMap.delete(this.getId(rootId, blockId));
	};

	/**
	 * Sets the record IDs for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string[]} list - The record IDs.
	 */
	recordsSet (rootId: string, blockId: string, list: string[]) {
		this.recordMap.set(this.getId(rootId, blockId), observable.array(list));
	};

	/**
	 * Clears the record IDs for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 */
	recordsClear (rootId: string, blockId: string) {
		this.recordMap.delete(this.getId(rootId, blockId));
	};

	/**
	 * Adds a record ID at a specific index for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} id - The record ID.
	 * @param {number} index - The index to insert at.
	 */
	recordAdd (rootId: string, blockId: string, id: string, index: number) {
		const records = this.getRecordIds(rootId, blockId);
		
		records.splice(index, 0, id);
		this.recordsSet(rootId, blockId, records);
	};

	/**
	 * Deletes a record ID for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} id - The record ID.
	 */
	recordDelete (rootId: string, blockId: string, id: string) {
		this.recordMap.set(this.getId(rootId, blockId), this.getRecordIds(rootId, blockId).filter(it => it != id));
	};

	/**
	 * Sets the groups for a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any[]} groups - The groups array.
	 */
	groupsSet (rootId: string, blockId: string, groups: any[]) {
		this.groupMap.set(this.getGroupSubId(rootId, blockId, 'groups'), observable(groups));
	};

	/**
	 * Adds groups to a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {any[]} groups - The groups array.
	 */
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

	/**
	 * Removes groups by IDs from a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string[]} ids - The group IDs to remove.
	 */
	groupsRemove (rootId: string, blockId: string, ids: string[]) {
		const groups = this.getGroups(rootId, blockId);

		ids.forEach((id: string) => {
			const subId = this.getSubId(rootId, [ blockId, id ].join('-'));
			this.recordsClear(subId, '');
		});

		this.groupsSet(rootId, blockId, groups.filter(it => !ids.includes(it.id)));
	};

	/**
	 * Clears all groups from a block in a root.
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 */
	groupsClear (rootId: string, blockId: string) {
		this.groupsRemove(rootId, blockId, this.getGroups(rootId, blockId).map(it => it.id));
	};

	/**
	 * Gets a type object by its ID.
	 * @private
	 * @param {string} id - The type ID.
	 * @returns {any|null} The type object or null.
	 */
	getTypeById (id: string) {
		if (!id) {
			return null;
		};

		const object = S.Detail.get(J.Constant.subId.type, id, J.Relation.type);
		return object._empty_ ? null : object;
	};

	/**
	 * Gets a type object by its key.
	 * @private
	 * @param {string} key - The type key.
	 * @returns {any|null} The type object or null.
	 */
	getTypeByKey (key: string): any {
		if (!key) {
			return null;
		};

		const id = this.typeKeyMapGet(key);
		return id ? this.getTypeById(id) : null;
	};

	/**
	 * Gets the featured relations for a type.
	 * @private
	 * @param {string} id - The type ID.
	 * @returns {any[]} The featured relations.
	 */
	getTypeFeaturedRelations (id: string) {
		const type = this.getTypeById(id);
		return (type?.recommendedFeaturedRelations || []).map(it => this.getRelationById(it)).filter(it => it);
	};

	/**
	 * Gets the recommended relations for a type.
	 * @private
	 * @param {string} id - The type ID.
	 * @returns {any[]} The recommended relations.
	 */
	getTypeRecommendedRelations (id: string) {
		const type = this.getTypeById(id);
		return (type?.recommendedRelations || []).map(it => this.getRelationById(it)).filter(it => it);
	};

	/**
	 * Gets the template type object.
	 * @private
	 * @returns {any|null} The template type object or null.
	 */
	getTemplateType () {
		return this.getTypeByKey(J.Constant.typeKey.template);
	};

	/**
	 * Gets the collection type object.
	 * @private
	 * @returns {any|null} The collection type object or null.
	 */
	getCollectionType () {
		return this.getTypeByKey(J.Constant.typeKey.collection);
	};

	/**
	 * Gets the set type object.
	 * @private
	 * @returns {any|null} The set type object or null.
	 */
	getSetType () {
		return this.getTypeByKey(J.Constant.typeKey.set);
	};

	/**
	 * Gets the chat type object.
	 * @private
	 * @returns {any|null} The chat type object or null.
	 */
	getChatType () {
		return this.getTypeByKey(J.Constant.typeKey.chat);
	};

	/**
	 * Gets the space type object.
	 * @private
	 * @returns {any|null} The space type object or null.
	 */
	getSpaceType () {
		return this.getTypeByKey(J.Constant.typeKey.space);
	};

	/**
	 * Gets the type type object.
	 * @private
	 * @returns {any|null} The type type object or null.
	 */
	getTypeType () {
		return this.getTypeByKey(J.Constant.typeKey.type);
	};

	/**
	 * Gets the bookmark type object.
	 * @private
	 * @returns {any|null} The bookmark type object or null.
	 */
	getBookmarkType () {
		return this.getTypeByKey(J.Constant.typeKey.bookmark);
	};

	/**
	 * Gets the page type object.
	 * @private
	 * @returns {any|null} The page type object or null.
	 */
	getPageType () {
		return this.getTypeByKey(J.Constant.typeKey.page);
	};

	/**
	 * Gets the file type object.
	 * @private
	 * @returns {any|null} The file type object or null.
	 */
	getFileType () {
		return this.getTypeByKey(J.Constant.typeKey.file);
	};

	/**
	 * Gets all type objects.
	 * @private
	 * @returns {any[]} The type objects.
	 */
	getTypes () {
		return this.getRecordIds(J.Constant.subId.type, '').map(id => S.Detail.get(J.Constant.subId.type, id)).
			filter(it => it && !it._empty_ && !it.isArchived && !it.isDeleted);
	};

	/**
	 * Gets all relation objects.
	 * @private
	 * @returns {any[]} The relation objects.
	 */
	getRelations () {
		return this.getRecordIds(J.Constant.subId.relation, '').map(id => this.getRelationById(id)).
			filter(it => it && !it.isArchived && !it.isDeleted);
	};

	/**
	 * Gets the dataview relation keys for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any[]} The relation keys.
	 */
	getDataviewRelationKeys (rootId: string, blockId: string): any[] {
		return [ 'name' ].concat((this.relationMap.get(this.getId(rootId, blockId)) || []).map(it => it.relationKey)).filter(it => it);
	};

	/**
	 * Gets the dataview relations for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any[]} The dataview relations.
	 */
	getDataviewRelations (rootId: string, blockId: string): any[] {
		return this.getDataviewRelationKeys(rootId, blockId).map(it => this.getRelationByKey(it)).filter(it => it);
	};

	/**
	 * Gets the object relations for a root and type.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} typeId - The type ID.
	 * @returns {any[]} The object relations.
	 */
	getObjectRelations (rootId: string, typeId: string): any[] {
		const type = S.Record.getTypeById(typeId);
		const recommended = Relation.getArrayValue(type?.recommendedRelations);
		const typeRelations = recommended.map(it => this.getRelationById(it)).filter(it => it);
		const objectRelations = S.Detail.getKeys(rootId, rootId).map(it => this.getRelationByKey(it)).filter(it => it && !recommended.includes(it.id));

		return this.checkHiddenObjects(typeRelations.concat(objectRelations));
	};

	/**
	 * Gets the conflict relations for a block in a root and type.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} typeId - The type ID.
	 * @returns {any[]} The conflict relations.
	 */
	getConflictRelations (rootId: string, blockId: string, typeId: string): any[] {
		const objectKeys = S.Detail.getKeys(rootId, blockId);
		const typeKeys = U.Object.getTypeRelationKeys(typeId);
		const skipKeys = [ 'name', 'description' ];

		let conflictKeys = [];

		if (typeKeys.length) {
			objectKeys.forEach((key) => {
				if (!typeKeys.includes(key)) {
					conflictKeys.push(key);
				};
			});
		} else {
			conflictKeys = objectKeys;
		};

		conflictKeys = conflictKeys.filter(it => !skipKeys.includes(it));
		conflictKeys = conflictKeys.map(it => this.getRelationByKey(it)).filter(it => it);

		return this.checkHiddenObjects(conflictKeys);
	};

	/**
	 * Gets a relation object by its key.
	 * @private
	 * @param {string} relationKey - The relation key.
	 * @returns {any|null} The relation object or null.
	 */
	getRelationByKey (relationKey: string): any {
		if (!relationKey) {
			return null;
		};

		const id = this.relationKeyMapGet(relationKey);
		return id ? this.getRelationById(id) : null;
	};

	/**
	 * Gets a relation object by its ID.
	 * @private
	 * @param {string} id - The relation ID.
	 * @returns {any|null} The relation object or null.
	 */
	getRelationById (id: string): any {
		if (!id) {
			return null;
		};

		const object = S.Detail.get(J.Constant.subId.relation, id, J.Relation.relation, true);
		return object._empty_ ? null : object;
	};

	/**
	 * Gets an option object by its ID.
	 * @private
	 * @param {string} id - The option ID.
	 * @returns {any|null} The option object or null.
	 */
	getOption (id: string) {
		const object = S.Detail.get(J.Constant.subId.option, id, J.Relation.option, true);
		return object._empty_ ? null : object;
	};

	/**
	 * Gets the views for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {I.View[]} The views.
	 */
	getViews (rootId: string, blockId: string): I.View[] {
		return this.viewMap.get(this.getId(rootId, blockId)) || [];
	};

	/**
	 * Gets a view by ID for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} id - The view ID.
	 * @returns {I.View} The view.
	 */
	getView (rootId: string, blockId: string, id: string): I.View {
		return this.getViews(rootId, blockId).find(it => it.id == id);
	};

	/**
	 * Gets the meta information for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any} The meta information.
	 */
	getMeta (rootId: string, blockId: string) {
		const map = this.metaMap.get(this.getId(rootId, blockId)) || {};

		return {
			total: Number(map.total) || 0,
			offset: Number(map.offset) || 0,
			viewId: String(map.viewId || ''),
			keys: map.keys || [],
		};
	};

	/**
	 * Gets the record IDs for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {string[]} The record IDs.
	 */
	getRecordIds (rootId: string, blockId: string) {
		return this.recordMap.get(this.getId(rootId, blockId)) || [];
	};

	/**
	 * Gets the records for a subId.
	 * @private
	 * @param {string} subId - The sub ID.
	 * @param {string[]} [keys] - Optional keys to include.
	 * @param {boolean} [forceKeys] - Whether to force default keys.
	 * @returns {any[]} The records.
	 */
	getRecords (subId: string, keys?: string[], forceKeys?: boolean): any[] {
		return this.getRecordIds(subId, '').map(id => S.Detail.get(subId, id, keys, forceKeys));
	};

	/**
	 * Gets the groups for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {any[]} The groups.
	 */
	getGroups (rootId: string, blockId: string) {
		return this.groupMap.get(this.getGroupSubId(rootId, blockId, 'groups')) || [];
	};

	/**
	 * Gets a group by ID for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} groupId - The group ID.
	 * @returns {any} The group.
	 */
	getGroup (rootId: string, blockId: string, groupId: string) {
		return this.getGroups(rootId, blockId).find(it => it.id == groupId);
	};

	/**
	 * Gets the combined ID for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {string} The combined ID.
	 */
	getId (rootId: string, blockId: string) {
		return [ rootId, blockId ].join('-');
	};

	/**
	 * Gets the sub ID for a block in a root.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @returns {string} The sub ID.
	 */
	getSubId (rootId: string, blockId: string) {
		return this.getId(rootId, blockId);
	};

	/**
	 * Gets the group sub ID for a block in a root and group.
	 * @private
	 * @param {string} rootId - The root ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} groupId - The group ID.
	 * @returns {string} The group sub ID.
	 */
	getGroupSubId (rootId: string, blockId: string, groupId: string): string {
		return [ rootId, blockId, groupId ].join('-');
	};

	/**
	 * Filters out hidden objects from a list of records.
	 * @private
	 * @param {any[]} records - The records to filter.
	 * @returns {any[]} The filtered records.
	 */
	checkHiddenObjects (records: any[]): any[] {
		const { config } = S.Common;
		const { hiddenObject } = config.debug;

		if (!Array.isArray(records)) {
			return [];
		};

		return records.filter(it => it && (hiddenObject ? true : !it.isHidden));
	};

};

export const Record: RecordStore = new RecordStore();
