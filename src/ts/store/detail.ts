import { observable, action, set, intercept, makeObservable } from 'mobx';
import { I, Relation, DataUtil, translate } from 'Lib';
import { dbStore } from 'Store';

import Constant from 'json/constant.json';

interface Detail {
	relationKey: string;
	value: any;
};

class DetailStore {

    public map: Map<string, Map<string, Detail[]>> = new Map();

    constructor() {
        makeObservable(this, {
            set: action,
            update: action,
            delete: action
        });
    };

    set (rootId: string, details: any[]) {
		const map = observable.map(new Map());

		for (const item of details) {
			const list: Detail[] = [];
			for (const k in item.details) {
				const el = { relationKey: k, value: item.details[k] };
				makeObservable(el, { value: observable });

				intercept(el as any, (change: any) => { 
					return (change.newValue === el[change.name] ? null : change); 
				});

				list.push(el);
			};
			map.set(item.id, list);
		};

		this.map.set(rootId, map);
	};

    update (rootId: string, item: any, clear: boolean) {
		if (!item || !item.id || !item.details) {
			return;
		};

		let map = this.map.get(rootId);
		let createMap = false;
		let createList = false;

		if (!map) {
			map = observable.map(new Map());
			createMap = true;
		} else 
		if (clear) {
			map.delete(item.id);
		};

		let list = map.get(item.id);
		if (!list) {
			list = [];
			createList = true;
		};

		for (const k in item.details) {
			let el = list.find(it => it.relationKey == k);
			if (el) {
				set(el, { value: item.details[k] });
			} else {
				el = { relationKey: k, value: item.details[k] };
				makeObservable(el, { value: observable });
				list.push(el);
			};

			intercept(el as any, (change: any) => { 
				return (change.newValue === el[change.name] ? null : change); 
			});

			if (createList) {
				map.set(item.id, list);
			};
		};

		// Update relationKeyMap in dbStore to keep consistency
		if ((item.details.type == Constant.typeId.relation) && item.details.relationKey && item.details.id) {
			dbStore.relationKeyMap[item.details.relationKey] = item.details.id;
		};

		if (createMap) {
			this.map.set(rootId, map);
		};
	};

    delete (rootId: string, id: string, keys?: string[]) {
		const map = this.map.get(rootId) || new Map();

		let list = this.getArray(rootId, id);
		list = keys && keys.length ? list.filter(it => !keys.includes(it.relationKey)) : [];

		map.set(id, list);
	};

	getArray (rootId: string, id: string): any[] {
		return (this.map.get(rootId) || new Map()).get(id) || [];
	};

    get (rootId: string, id: string, keys?: string[], forceKeys?: boolean): any {
		let list = this.getArray(rootId, id);
		if (!list.length) {
			return { id, _empty_: true };
		};
		
		if (keys) {
			keys = [ ...new Set(keys) ];
			keys.push('id');
			if (!forceKeys) {
				keys = keys.concat(Constant.defaultRelationKeys);
			};
			list = list.filter(it => keys.includes(it.relationKey));
		};

		let object: any = {};
		list.forEach(it => {
			object[it.relationKey] = it.value;
		});

		return this.check(object);
	};

	check (object: any) {
		object.name = String(object.name || DataUtil.defaultName('page'));
		object.layout = Number(object.layout) || I.ObjectLayout.Page;
		object.snippet = Relation.getStringValue(object.snippet).replace(/\n/g, ' ');

		if (object.layout == I.ObjectLayout.Note) {
			object.coverType = I.CoverType.None;
			object.coverId = '';
			object.iconEmoji = '';
			object.iconImage = '';
			object.name = object.snippet;
		};

		if (object.isDeleted) {
			object.name = translate('commonDeletedObject');
		};

		switch (object.type) {
			case Constant.typeId.type:
			case Constant.storeTypeId.type:
				object = this.checkType(object);
				break;

			case Constant.typeId.relation:
			case Constant.storeTypeId.relation:
				object = this.checkRelation(object);
				break;

			case Constant.typeId.option:
				object = this.checkOption(object);
				break;

			case Constant.typeId.set:
				object = this.checkSet(object);
				break;
		};

		return {
			...object,
			type: Relation.getStringValue(object.type),
			iconImage: Relation.getStringValue(object.iconImage),
			iconEmoji: Relation.getStringValue(object.iconEmoji),
			layoutAlign: Number(object.layoutAlign) || I.BlockHAlign.Left,
			coverX: Number(object.coverX) || 0,
			coverY: Number(object.coverY) || 0,
			coverScale: Number(object.coverScale) || 0,
			coverType: Number(object.coverType) || I.CoverType.None,
			isArchived: Boolean(object.isArchived),
			isFavorite: Boolean(object.isFavorite),
			isHidden: Boolean(object.isHidden),
		};
	};

	checkType (object: any) {
		object.smartblockTypes = Relation.getArrayValue(object.smartblockTypes).map(it => Number(it));
		object.recommendedLayout = Number(object.recommendedLayout) || I.ObjectLayout.Page;
		object.recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		object.isInstalled = object.workspaceId != Constant.storeSpaceId;
		object.sourceObject = Relation.getStringValue(object.sourceObject);

		if (object.isDeleted) {
			object.name = translate('commonDeletedType');
		};

		return object;
	};

	checkRelation (object: any) {
		object.relationFormat = Number(object.relationFormat) || I.RelationType.LongText;
		object.format = object.relationFormat;
		object.maxCount = Number(object.relationMaxCount) || 0;
		object.objectTypes = Relation.getArrayValue(object.relationFormatObjectTypes);
		object.isReadonlyRelation = Boolean(object.isReadonly);
		object.isReadonlyValue = Boolean(object.relationReadonlyValue);
		object.isInstalled = object.workspaceId != Constant.storeSpaceId;
		object.sourceObject = Relation.getStringValue(object.sourceObject);

		if (object.isDeleted) {
			object.name = translate('commonDeletedRelation');
		};

		delete(object.relationMaxCount);
		delete(object.isReadonly);
		delete(object.relationReadonlyValue);

		return object;
	};

	checkOption (object: any) {
		object.text = Relation.getStringValue(object.name);
		object.color = Relation.getStringValue(object.relationOptionColor);

		delete(object.relationOptionColor);

		return object;
	};

	checkSet (object: any) {
		object.setOf = Relation.getArrayValue(object.setOf);

		return object;
	};

    clear (rootId: string) {
		this.map.delete(rootId);
	};

    clearAll () {
		this.map.clear();
	};
};

 export const detailStore: DetailStore = new DetailStore();
