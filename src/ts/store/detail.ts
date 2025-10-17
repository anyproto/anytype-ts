import { observable, action, set, intercept, makeObservable } from 'mobx';
import { I, S, U, J, Relation, translate } from 'Lib';

interface Detail {
	relationKey: string;
	value: unknown;
	isDeleted: boolean;
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

	/**
	 * Creates a detail list item with observables and intercepts.
	 * @private
	 * @param {string} k - The relation key.
	 * @param {any} v - The value.
	 * @returns {Detail} The created detail item.
	 */
	private createListItem (k: string, v: any): Detail {
		const el = { relationKey: k, value: v, isDeleted: false };

		makeObservable(el, { 
			value: observable, 
			isDeleted: observable,
		});

		intercept(el as any, (change: any) => {
			return (change.newValue === el[change.name] ? null : change); 
		});
		return el;
	}; 

	/**
	 * Adds details to the detail store.
	 * @param {string} rootId - The root ID.
	 * @param {Item[]} items - The items to add.
	 */
	public set (rootId: string, items: Item[]) {
		if (!rootId) {
			console.log('[S.Detail].set: rootId is not defined');
			return;
		};

		const map = observable.map(new Map());

		for (const item of items) {
			const list: Detail[] = [];

			for (const k in item.details) {
				list.push(this.createListItem(k, item.details[k]));
			};

			map.set(item.id, list);
		};

		this.map.set(rootId, map);
	};

	/**
	 * Updates details in the detail store. If clear is set, map will delete details by item id.
	 * @param {string} rootId - The root ID.
	 * @param {Item} item - The item to update.
	 * @param {boolean} clear - Whether to clear existing details.
	 */
	public update (rootId: string, item: Item, clear: boolean): void {
		if (!rootId) {
			console.log('[S.Detail].update: rootId is not defined');
			return;
		};

		if (!item.details) {
			console.log('[S.Detail].update: details are not defined');
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
			if (clear) {
				list.push(this.createListItem(k, item.details[k]));
				continue;
			};

			const el = list.find(it => it.relationKey == k);
			if (el) {
				set(el, { value: item.details[k], isDeleted: false });
			} else {
				list.push(this.createListItem(k, item.details[k]));
			};
		};

		if (createList) {
			map.set(item.id, list);
		};

		// Update fast key maps in S.Record to keep consistency
		if (U.Object.isRelationLayout(item.details.layout)) {
			S.Record.relationKeyMapSet(item.details.spaceId, item.details.relationKey, item.details.id);
		};
		if (U.Object.isTypeLayout(item.details.layout)) {
			S.Record.typeKeyMapSet(item.details.spaceId, item.details.uniqueKey, item.details.id);
		};
		if (U.Object.isSpaceViewLayout(item.details.layout)) {
			S.Record.spaceMap.set(item.details.targetSpaceId, item.details.id);
		};

		if (createMap) {
			this.map.set(rootId, map);
		};
	};

	/**
	 * Clears any data stored with rootId, if there happens to be any.
	 * @param {string} rootId - The root ID.
	 */
	public clear (rootId: string): void {
		this.map.delete(rootId);
	};

	/**
	 * Clears all of the data stored in DetailStore, if there happens to be any.
	 */
	public clearAll (): void {
		this.map.clear();
	};

	/**
	 * Clears details by keys provided, if they exist. If no keys are provided, all details are cleared.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The item ID.
	 * @param {string[]} [keys] - The keys to clear.
	 */
	public delete (rootId: string, id: string, keys?: string[]): void {
		const map = this.map.get(rootId);

		if (!map) {
			return;
		};

		if (keys && keys.length) {
			map.set(id, (map.get(id) || []).filter(it => !keys.includes(it.relationKey)));
		} else {
			map.set(id, []);
		};
	};

	/**
	 * Gets the object. If no keys are provided, all properties are returned. If force keys is set, J.Relation.default are included.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The item ID.
	 * @param {string[]} [withKeys] - Keys to include.
	 * @param {boolean} [forceKeys] - Whether to force default keys.
	 * @param {I.ObjectLayout[]} [skipLayoutFormat] - Layouts to skip formatting.
	 * @returns {any} The object.
	 */
	public get (rootId: string, id: string, withKeys?: string[], forceKeys?: boolean, skipLayoutFormat?: I.ObjectLayout[]): any {
		let list = this.map.get(rootId)?.get(id) || [];
		if (!list.length) {
			return { id, _empty_: true };
		};
		
		const object = { id };
		const keys = new Set<string>();

		if (withKeys) {
			for (const key of withKeys) {
				keys.add(key);
			};

			if (!forceKeys) {
				for (const key of J.Relation.default) {
					keys.add(key);
				};
			};

			if (keys.has('name')) {
				keys.add('pluralName');
			};
			if (keys.has('layout')) {
				keys.add('resolvedLayout');
			};
		};

		list = list.filter(it => {
			if (it.isDeleted) {
				return false;
			};
			if (withKeys && !keys.has(it.relationKey)) {
				return false;
			};
			return true;
		});

		for (let i = 0; i < list.length; i++) {
			object[list[i].relationKey] = list[i].value;
		};

		return this.mapper(object, skipLayoutFormat);
	};

	/**
	 * Gets the keys for an item.
	 * @param {string} rootId - The root ID.
	 * @param {string} id - The item ID.
	 * @returns {string[]} The keys.
	 */
	public getKeys (rootId: string, id: string): string[] {
		return (this.map.get(rootId)?.get(id) || []).map(it => it.relationKey);
	};

	/**
	 * Mutates object provided and also returns a new object. Sets defaults.
	 * @param {any} object - The object to map.
	 * @param {I.ObjectLayout[]} [skipLayoutFormat] - Layouts to skip formatting.
	 * @returns {any} The mapped object.
	 */
	public mapper (object: any, skipLayoutFormat?: I.ObjectLayout[]): any {
		object = this.mapCommon(object || {});

		if (!skipLayoutFormat || !skipLayoutFormat.includes(object.layout)) {
			const fn = `map${I.ObjectLayout[object.layout]}`;
			if (this[fn]) {
				object = this[fn](object);
			};

			if (U.Object.isInFileLayouts(object.layout)) {
				object = this.mapFile(object);
			};
		};

		return object;
	};

	/**
	 * Maps common properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object with standardized properties.
	 */
	private mapCommon (object: any) {
		object.name = Relation.getStringValue(object.name) || translate('defaultNamePage');
		object.snippet = Relation.getStringValue(object.snippet).replace(/\n/g, ' ');
		object.type = Relation.getStringValue(object.type);
		object.origin = Number(object.origin) || I.ObjectOrigin.None;
		object.iconImage = Relation.getStringValue(object.iconImage);
		object.iconEmoji = Relation.getStringValue(object.iconEmoji);
		object.coverX = Number(object.coverX) || 0;
		object.coverY = Number(object.coverY) || 0;
		object.coverScale = Number(object.coverScale) || 0;
		object.coverType = Number(object.coverType) || I.CoverType.None;
		object.isArchived = Boolean(object.isArchived);
		object.isHidden = Boolean(object.isHidden);
		object.isReadonly = Boolean(object.isReadonly);
		object.isDeleted = Boolean(object.isDeleted);

		if (undefined === object.layout) {
			object.layout = object.resolvedLayout;
		};

		object.layout = Number(object.layout) || I.ObjectLayout.Page;

		if (object.isDeleted) {
			object.name = translate('commonDeletedObject');
		};

		return object;
	};

	/**
	 * Maps note-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object with note-specific properties.
	 */
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

	/**
	 * Maps type-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object with type-specific properties.
	 */
	private mapType (object: any) {
		object.recommendedLayout = Number(object.recommendedLayout) || I.ObjectLayout.Page;
		object.recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		object.recommendedFeaturedRelations = Relation.getArrayValue(object.recommendedFeaturedRelations);
		object.recommendedHiddenRelations = Relation.getArrayValue(object.recommendedHiddenRelations);
		object.recommendedFileRelations = Relation.getArrayValue(object.recommendedFileRelations);
		object.sourceObject = Relation.getStringValue(object.sourceObject);
		object.uniqueKey = Relation.getStringValue(object.uniqueKey);
		object.defaultTypeId = Relation.getStringValue(object.defaultTypeId);
		object.defaultTemplateId = Relation.getStringValue(object.defaultTemplateId);
		object.layoutAlign = Number(object.layoutAlign) || I.BlockHAlign.Left;
		object.layoutWidth = Number(object.layoutWidth) || 0;
		object.pluralName = Relation.getStringValue(object.pluralName);
		object.headerRelationsLayout = Number(object.headerRelationsLayout) || I.FeaturedRelationLayout.Inline;
		object.orderId = Relation.getStringValue(object.orderId);
		object.widgetLimit = Number(object.widgetLimit) || 0;
		object.widgetViewId = Relation.getStringValue(object.widgetViewId);

		if (undefined === object.widgetLayout) {
			object.widgetLayout = I.WidgetLayout.Compact;
		};

		object.widgetLayout = Number(object.widgetLayout) || I.WidgetLayout.Link;

		if (object.name == translate('defaultNamePage')) {
			object.name = '';
		};

		if (object.isDeleted) {
			object.name = translate('commonDeletedType');
		};

		return object;
	};

	/**
	 * Maps relation-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object with relation-specific properties.
	 */
	private mapRelation (object: any) {
		object.relationFormat = Number(object.relationFormat) || I.RelationType.LongText;
		object.format = object.relationFormat;
		object.maxCount = Number(object.maxCount || object.relationMaxCount) || 0;
		object.objectTypes = Relation.getArrayValue(object.objectTypes || object.relationFormatObjectTypes);
		object.isReadonlyRelation = Boolean(object.isReadonlyRelation || object.isReadonly);
		object.isReadonlyValue = Boolean(object.isReadonlyValue || object.relationReadonlyValue);
		object.sourceObject = Relation.getStringValue(object.sourceObject);
		object.includeTime = Boolean(object.relationFormatIncludeTime) || false;

		if (object.isDeleted) {
			object.name = translate('commonDeletedRelation');
		};

		delete(object.isReadonly);
		delete(object.relationMaxCount);
		delete(object.relationReadonlyValue);
		delete(object.relationFormatObjectTypes);

		return object;
	};

	/**
	 * Maps option-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object with option-specific properties.
	 */
	private mapOption (object: any) {
		object.text = object.name;
		object.color = Relation.getStringValue(object.color || object.relationOptionColor);
		object.orderId = Relation.getStringValue(object.orderId);

		delete(object.relationOptionColor);

		return object;
	};

	/**
	 * Maps set-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapSet (object: any) {
		object.setOf = Relation.getArrayValue(object.setOf);
		return object;
	};

	/**
	 * Maps date-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapDate (object: any) {
		object.timestamp = Number(object.timestamp) || 0;

		if (object.timestamp) {
			const { showRelativeDates, dateFormat } = S.Common;
			const day = showRelativeDates ? U.Date.dayString(object.timestamp) : null;

			object.name = day ? day : U.Date.dateWithFormat(dateFormat, object.timestamp);
		};

		return this.mapSet(object);
	};

	/**
	 * Maps space view-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapSpaceView (object: any) {
		object.spaceAccessType = Number(object.spaceAccessType) || I.SpaceType.Private;
		object.spaceAccountStatus = Number(object.spaceAccountStatus) || I.SpaceStatus.Unknown;
		object.spaceLocalStatus = Number(object.spaceLocalStatus) || I.SpaceStatus.Unknown;
		object.readersLimit = Number(object.readersLimit) || 0;
		object.writersLimit = Number(object.writersLimit) || 0;
		object.spaceId = Relation.getStringValue(object.spaceId);
		object.spaceDashboardId = Relation.getStringValue(object.spaceDashboardId);
		object.chatId = Relation.getStringValue(object.chatId);
		object.targetSpaceId = Relation.getStringValue(object.targetSpaceId);
		object.iconOption = Number(object.iconOption) || 1;
		object.notificationMode = Number(object.notificationMode || object.spacePushNotificationMode) || I.NotificationMode.All;
		object.orderId = Relation.getStringValue(object.orderId || object.spaceOrder);
		object.spaceJoinDate = Number(object.spaceJoinDate) || 0;

		if (object.iconOption > 10) {
			object.iconOption = object.iconOption - 10;
		};

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
		object.isLocalLoading = object.spaceLocalStatus == I.SpaceStatus.Loading;

		// UX type
		object.uxType = Number(object.uxType || object.spaceUxType) || I.SpaceUxType.Data;
		object.isChat = object.spaceUxType == I.SpaceUxType.Chat;
		object.isSpace = object.spaceUxType == I.SpaceUxType.Data;
		object.isStream = object.spaceUxType == I.SpaceUxType.Stream;

		// Chat
		object.isMuted = [ I.NotificationMode.Nothing, I.NotificationMode.Mentions ].includes(object.notificationMode);

		delete(object.spacePushNotificationMode);
		delete(object.spaceUxType);
		delete(object.spaceOrder);

		return object;
	};

	/**
	 * Maps file-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapFile (object) {
		object.sizeInBytes = Number(object.sizeInBytes) || 0;
		return object;
	};

	/**
	 * Maps bookmark-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapBookmark (object) {
		object.source = Relation.getStringValue(object.source);

		if (object.source && (!object.name || (object.name == translate('defaultNamePage')))) {
			object.name = U.Common.shortUrl(object.source);
		};

		return object;
	};

	/**
	 * Maps participant-specific properties for an object.
	 * @private
	 * @param {any} object - The object to map.
	 * @returns {any} The mapped object.
	 */
	private mapParticipant (object) {
		object.permissions = Number(object.permissions || object.participantPermissions) || I.ParticipantPermissions.Reader;
		object.status = Number(object.status || object.participantStatus) || I.ParticipantStatus.Joining;
		object.identity = Relation.getStringValue(object.identity);
		object.globalName = Relation.getStringValue(object.globalName);
		object.resolvedName = object.globalName || object.identity;

		delete(object.participantPermissions);
		delete(object.participantStatus);

		// Permission flags
		object.isOwner = object.permissions == I.ParticipantPermissions.Owner;
		object.isWriter = object.permissions == I.ParticipantPermissions.Writer;
		object.isReader = object.permissions == I.ParticipantPermissions.Reader;

		// Status flags
		object.isJoining = object.status == I.ParticipantStatus.Joining;
		object.isActive = object.status == I.ParticipantStatus.Active;
		object.isRemoved = object.status == I.ParticipantStatus.Removed;
		object.isDeclined = object.status == I.ParticipantStatus.Declined;
		object.isCanceled = object.status == I.ParticipantStatus.Canceled;

		return object;
	};

};

export const Detail: DetailStore = new DetailStore();
