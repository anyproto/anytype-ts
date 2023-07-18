import { observable, action, set, intercept, makeObservable } from 'mobx';
import { I, Relation, UtilObject, translate } from 'Lib';
import { dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Detail {
	relationKey: string;
	value: unknown;
};

interface Item {
	id: string;
	details: any;
};

class DetailStore {

    private map: Map<string, Map<string, Detail[]>> = new Map();

    constructor() {
        makeObservable(this, {
            set: action,
            update: action,
            delete: action
        });
    };

	/** Idempotent. adds details to the detail store. */
    public set (rootId: string, items: Item[]) {
		const map = observable.map(new Map());

		for (const item of items) {
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

	/** Idempotent. updates details in the detail store. if clear is set, map wil delete details by item id. */
    public update (rootId: string, item: Item, clear: boolean): void {
		let map = this.map.get(rootId);
		let createMap = false;
		let createList = false;

		if (!map) {
			map = observable.map(new Map());
			createMap = true;
		};

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

				intercept(el as any, (change: any) => { 
					return (change.newValue === el[change.name] ? null : change); 
				});
			};
		};

		if (createList) {
			map.set(item.id, list);
		};

		// Update relationKeyMap in dbStore to keep consistency
		if (item.details && (item.details.type == Constant.typeId.relation) && item.details.relationKey && item.details.id) {
			dbStore.relationKeyMap[item.details.relationKey] = item.details.id;
		};

		if (createMap) {
			this.map.set(rootId, map);
		};
	};

	/** Idempotent. Clears any data stored with rootId, if there happens to be any.  */
	public clear (rootId: string):  void {
		this.map.delete(rootId);
	};

	/** Idempotent. Clears all of the data stored in DetailStore, if there happens to be any */
	public clearAll ():  void {
		this.map.clear();
	};

	/** Idempotent. Clears details by keys provided, if they exist. if no keys are provided, all details are cleared. */
    public delete (rootId: string, id: string, keys?: string[]): void {
		const map = this.map.get(rootId);

		if (!map) {
			return;
		};

		if (keys && keys.length) {
			const list = this.getDetailList(rootId, id).filter(it => !keys.includes(it.relationKey));
			map.set(id, list);
		} else {
			map.set(id, []);
		};
	};

	/** gets the object. if no keys are provided, all properties are returned. if force keys is set, Constant.defaultRelationKeys are included */
    public get (rootId: string, id: string, withKeys?: string[], forceKeys?: boolean): any {
		let list = this.getDetailList(rootId, id);		
		if (!list.length) {
			return { id, _empty_: true };
		};
		
		if (withKeys) {
			let keys = [ 'id', ...withKeys ];
			if (!forceKeys) {
				keys = keys.concat(Constant.defaultRelationKeys);
			};
			list = list.filter(it => keys.includes(it.relationKey));
		};

		const object = { id };
		list.forEach(it => object[it.relationKey] = it.value);

		return this.mapper(object);
	};

	/** Mutates object provided and also returns a new object. Sets defaults.
	 * This Function contains domain logic which should be encapsulated in a model */
	public mapper (object: any): any {
		object = this.mapCommon(object);

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
			case Constant.storeTypeId.type: {
				object = this.mapObjectType(object);
				break;
			};

			case Constant.typeId.relation:
			case Constant.storeTypeId.relation: {
				object = this.mapRelation(object);
				break;
			};

			case Constant.typeId.option: {
				object = this.mapOption(object);
				break;
			};

			case Constant.typeId.set: {
				object = this.mapSet(object);
				break;
			};

			case Constant.typeId.space: {
				object = this.mapSpace(object);
				break;
			};

			case Constant.typeId.template: {
				object = this.mapTemplate(object);
				break;
			};
		};

		return object;
	};

	private mapCommon (object: any) {
		object.name = Relation.getStringValue(object.name) || UtilObject.defaultName('Page');
		object.snippet = Relation.getStringValue(object.snippet).replace(/\n/g, ' ');
		object.type = Relation.getStringValue(object.type);
		object.layout = Number(object.layout) || I.ObjectLayout.Page;
		object.iconImage = Relation.getStringValue(object.iconImage);
		object.iconEmoji = Relation.getStringValue(object.iconEmoji);
		object.layoutAlign = Number(object.layoutAlign) || I.BlockHAlign.Left;
		object.coverX = Number(object.coverX) || 0;
		object.coverY = Number(object.coverY) || 0;
		object.coverScale = Number(object.coverScale) || 0;
		object.coverType = Number(object.coverType) || I.CoverType.None;
		object.isArchived = Boolean(object.isArchived);
		object.isFavorite = Boolean(object.isFavorite);
		object.isHidden = Boolean(object.isHidden);
		object.isReadonly = Boolean(object.isReadonly);
		object.isDeleted = Boolean(object.isDeleted);
		return object;
	};

	private mapObjectType (object: any) {
		object.recommendedLayout = Number(object.recommendedLayout) || I.ObjectLayout.Page;
		object.recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		object.isInstalled = object.workspaceId != Constant.storeSpaceId;
		object.sourceObject = Relation.getStringValue(object.sourceObject);
		object.defaultTemplateId = Relation.getStringValue(object.defaultTemplateId);

		if (object.isDeleted) {
			object.name = translate('commonDeletedType');
		};

		return object;
	};

	private mapRelation (object: any) {
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

	private mapOption (object: any) {
		object.text = Relation.getStringValue(object.name);
		object.color = Relation.getStringValue(object.relationOptionColor);

		delete(object.relationOptionColor);

		return object;
	};

	private mapSet (object: any) {
		object.setOf = Relation.getArrayValue(object.setOf);
		return object;
	};

	private mapSpace (object: any) {
		object.spaceType = Number(object.spaceAccessibility) || I.SpaceType.Personal;

		delete(object.spaceAccessibility);

		return object;
	};

	private mapTemplate (object: any) {
		object.targetObjectType = Relation.getStringValue(object.targetObjectType);
		object.templateIsBundled = Boolean(object.templateIsBundled);

		return object;
	};

	/** return detail list by rootId and id. returns empty if none found */
	private getDetailList (rootId: string, id: string): Detail[] {
		return this.map.get(rootId)?.get(id) || [];
	};

};

export const detailStore: DetailStore = new DetailStore();