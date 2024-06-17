import { observable, action, set, intercept, makeObservable } from 'mobx';
import { I, Relation, UtilObject, translate, UtilFile } from 'Lib';
import { dbStore } from 'Store';
const Constant = require('json/constant.json');

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
		if (!rootId) {
			console.log('[detailStore].set: rootId is not defined');
			return;
		};

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
		if (!rootId) {
			console.log('[detailStore].update: rootId is not defined');
			return;
		};

		if (!item.details) {
			console.log('[detailStore].update: details are not defined');
			return;
		};

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

		// Update relationKeyMap and typeKeyMap in dbStore to keep consistency
		if (item.details.layout == I.ObjectLayout.Relation) {
			dbStore.relationKeyMapSet(item.details.spaceId, item.details.relationKey, item.details.id);
		};
		if (item.details.layout == I.ObjectLayout.Type) {
			dbStore.typeKeyMapSet(item.details.spaceId, item.details.uniqueKey, item.details.id);
		};

		if (createMap) {
			this.map.set(rootId, map);
		};
	};

	/** Idempotent. Clears any data stored with rootId, if there happens to be any.  */
	public clear (rootId: string): void {
		this.map.delete(rootId);
	};

	/** Idempotent. Clears all of the data stored in DetailStore, if there happens to be any */
	public clearAll (): void {
		this.map.clear();
	};

	/** Idempotent. Clears details by keys provided, if they exist. if no keys are provided, all details are cleared. */
    public delete (rootId: string, id: string, keys?: string[]): void {
		const map = this.map.get(rootId);

		if (!map) {
			return;
		};

		if (keys && keys.length) {
			const item = { id, details: {} };
			keys.forEach(key => item.details[key] = null);

			this.update(rootId, item, false);
		} else {
			map.set(id, []);
		};
	};

	/** gets the object. if no keys are provided, all properties are returned. if force keys is set, Constant.defaultRelationKeys are included */
    public get (rootId: string, id: string, withKeys?: string[], forceKeys?: boolean): any {
		let list = this.map.get(rootId)?.get(id) || [];
		if (!list.length) {
			return { id, _empty_: true };
		};
		
		const keys = new Set(withKeys ? [ ...withKeys, ...(!forceKeys ? Constant.defaultRelationKeys : []) ] : []);
		const object = { id };

		if (withKeys) {
			list = list.filter(it => keys.has(it.relationKey));
		};

		for (let i = 0; i < list.length; i++) {
			object[list[i].relationKey] = list[i].value;
		};

		return this.mapper(object);
	};

	/** Mutates object provided and also returns a new object. Sets defaults.
	 * This Function contains domain logic which should be encapsulated in a model */
	public mapper (object: any): any {
		object = this.mapCommon(object || {});

		const fn = `map${I.ObjectLayout[object.layout]}`;
		if (this[fn]) {
			object = this[fn](object);
		};

		if (UtilObject.isFileLayout(object.layout)) {
			object = this.mapFile(object);
		};

		return object;
	};

	private mapCommon (object: any) {
		object.name = Relation.getStringValue(object.name) || translate('defaultNamePage');
		object.snippet = Relation.getStringValue(object.snippet).replace(/\n/g, ' ');
		object.type = Relation.getStringValue(object.type);
		object.layout = Number(object.layout) || I.ObjectLayout.Page;
		object.origin = Number(object.origin) || I.ObjectOrigin.None;
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

		if (object.isDeleted) {
			object.name = translate('commonDeletedObject');
		};

		return object;
	};

	private mapNote (object: any) {
		object.coverType = I.CoverType.None;
		object.coverId = '';
		object.iconEmoji = '';
		object.iconImage = '';
		object.name = object.snippet;

		if (object.isDeleted) {
			object.name = translate('commonDeletedObject');
		};

		return object;
	};

	private mapType (object: any) {
		object.recommendedLayout = Number(object.recommendedLayout) || I.ObjectLayout.Page;
		object.recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		object.isInstalled = object.spaceId != Constant.storeSpaceId;
		object.sourceObject = Relation.getStringValue(object.sourceObject);
		object.uniqueKey = Relation.getStringValue(object.uniqueKey);
		object.defaultTemplateId = Relation.getStringValue(object.defaultTemplateId);

		if (object.isDeleted) {
			object.name = translate('commonDeletedType');
		};

		return object;
	};

	private mapRelation (object: any) {
		object.relationFormat = Number(object.relationFormat) || I.RelationType.LongText;
		object.format = object.relationFormat;
		object.maxCount = Number(object.maxCount  || object.relationMaxCount) || 0;
		object.objectTypes = Relation.getArrayValue(object.objectTypes || object.relationFormatObjectTypes);
		object.isReadonlyRelation = Boolean(object.isReadonlyRelation || object.isReadonly);
		object.isReadonlyValue = Boolean(object.isReadonlyValue || object.relationReadonlyValue);
		object.isInstalled = object.spaceId != Constant.storeSpaceId;
		object.sourceObject = Relation.getStringValue(object.sourceObject);

		if (object.isDeleted) {
			object.name = translate('commonDeletedRelation');
		};

		delete(object.isReadonly);
		delete(object.relationMaxCount);
		delete(object.relationReadonlyValue);
		delete(object.relationFormatObjectTypes);

		return object;
	};

	private mapOption (object: any) {
		object.text = object.name;
		object.color = Relation.getStringValue(object.color || object.relationOptionColor);

		delete(object.relationOptionColor);

		return object;
	};

	private mapSet (object: any) {
		object.setOf = Relation.getArrayValue(object.setOf);
		return object;
	};

	private mapDate (object: any) {
		return this.mapSet(object);
	};

	private mapSpaceView (object: any) {
		object.spaceAccessType = Number(object.spaceAccessType) || I.SpaceType.Private;
		object.spaceAccountStatus = Number(object.spaceAccountStatus) || I.SpaceStatus.Unknown;
		object.spaceLocalStatus = Number(object.spaceLocalStatus) || I.SpaceStatus.Unknown;
		object.readersLimit = Number(object.readersLimit) || 0;
		object.writersLimit = Number(object.writersLimit) || 0;
		object.sharedSpacesLimit = Number(object.sharedSpacesLimit) || 0;
		object.spaceId = Relation.getStringValue(object.spaceId);
		object.spaceDashboardId = Relation.getStringValue(object.spaceDashboardId);
		object.targetSpaceId = Relation.getStringValue(object.targetSpaceId);

		// Access type
		object.isPersonal = object.spaceAccessType == I.SpaceType.Personal;
		object.isPrivate = object.spaceAccessType == I.SpaceType.Private;
		object.isShared = object.spaceAccessType == I.SpaceType.Shared;

		// Account status
		object.isAccountActive = [ I.SpaceStatus.Unknown, I.SpaceStatus.Active ].includes(object.spaceAccountStatus);
		object.isAccountJoining = object.spaceAccountStatus == I.SpaceStatus.Joining;
		object.isAccountRemoving = object.spaceAccountStatus == I.SpaceStatus.Removing;
		object.isAccountDeleted = object.spaceAccountStatus == I.SpaceStatus.Deleted;

		// Local status
		object.isLocalOk = [ I.SpaceStatus.Unknown, I.SpaceStatus.Ok ].includes(object.spaceLocalStatus);

		return object;
	};

	private mapFile (object) {
		object.sizeInBytes = Number(object.sizeInBytes) || 0;
		object.name = UtilFile.name(object);
		return object;
	};

	private mapParticipant (object) {
		object.permissions = Number(object.permissions || object.participantPermissions) || I.ParticipantPermissions.Reader;
		object.status = Number(object.status || object.participantStatus) || I.ParticipantStatus.Joining;
		object.globalName = Relation.getStringValue(object.globalName);

		delete(object.participantPermissions);
		delete(object.participantStatus);

		// Permission flags
		object.isOwner = object.permissions == I.ParticipantPermissions.Owner;
		object.isWriter = object.permissions == I.ParticipantPermissions.Writer;
		object.isReader = object.permissions == I.ParticipantPermissions.Reader;

		// Status flags
		object.isJoining = object.status == I.ParticipantStatus.Joining;
		object.isActive = object.status == I.ParticipantStatus.Active;
		object.isRemoving = object.status == I.ParticipantStatus.Removing;
		object.isRemoved = object.status == I.ParticipantStatus.Removed;
		object.isDeclined = object.status == I.ParticipantStatus.Declined;
		object.isCanceled = object.status == I.ParticipantStatus.Canceled;

		return object;
	};

};

export const detailStore: DetailStore = new DetailStore();
