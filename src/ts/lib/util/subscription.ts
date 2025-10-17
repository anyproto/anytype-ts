import { I, S, J, C, U, Action, Relation } from 'Lib';
import sha1 from 'sha1';

/**
 * Utility class for managing subscriptions, search, and data synchronization in the application.
 * Provides methods for subscribing to object changes, searching, and managing subscription state.
 */
class UtilSubscription {

	private map = new Map<string, string>();

	/**
	 * Generates a SHA-1 hash from the provided arguments.
	 * @param {...any[]} args - Arguments to hash.
	 * @returns {string} The resulting SHA-1 hash.
	 */
	makeHash (...args: any[]): string {
		args = args || [];
		return sha1(JSON.stringify(args));
	};

	/**
	 * Applies subscription results to the store, updating or setting details as needed.
	 * @private
	 * @param {string} subId - The subscription ID.
	 * @param {string} idField - The field used as the object ID.
	 * @param {string[]} keys - The list of keys to update.
	 * @param {any} message - The subscription message.
	 * @param {boolean} [update] - Whether to update existing details.
	 */
	private onSubscribe (subId: string, idField: string, keys: string[], message: any, update?: boolean) {
		if (message.error.code) {
			return;
		};
		if (message.counters) {
			S.Record.metaSet(subId, '', { total: message.counters.total, keys });
		};

		const mapper = it => ({ id: it[idField], details: it });

		let details = [];
		if (message.dependencies && message.dependencies.length) {
			details = details.concat(message.dependencies.map(mapper));
		};
		if (message.records && message.records.length) {
			details = details.concat(message.records.map(mapper));
		};

		if (update) {
			for (const item of details) {
				S.Detail.update(subId, item, true);
			};
		} else {
			S.Detail.set(subId, details);
		};

		S.Record.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	/**
	 * Returns the default filters for a subscription/search, based on provided parameters.
	 * @param {any} param - Parameters for filter construction.
	 * @returns {any[]} The array of filter objects.
	 */
	defaultFilters (param: any) {
		const { config } = S.Common;
		const { ignoreHidden, ignoreDeleted, ignoreArchived } = param;
		const filters = U.Common.objectCopy(param.filters || []);
		
		let skipLayouts = [];

		if (!config.experimental) {
			skipLayouts = skipLayouts.concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld ]);
		};

		if (skipLayouts.length) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });
			filters.push({ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });
		};

		if (skipLayouts.length) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });
			filters.push({ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });
		};

		if (ignoreHidden && !config.debug.hiddenObject) {
			filters.push({ relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
			filters.push({ relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (ignoreDeleted) {
			filters.push({ relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true });
		} else {
			filters.push({ relationKey: 'isDeleted', condition: I.FilterCondition.None, value: null });
		};

		if (ignoreArchived) {
			filters.push({ relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true });
		} else {
			filters.push({ relationKey: 'isArchived', condition: I.FilterCondition.None, value: null });
		};

		return filters;
	};

	/**
	 * Maps and ensures required keys are present for a subscription/search.
	 * @param {Partial<I.SearchSubscribeParam>} param - The subscription/search parameters.
	 * @returns {string[]} The list of keys.
	 */
	mapKeys (param: Partial<I.SearchSubscribeParam>) {
		const keys: string[] = [ ...new Set(param.keys as string[]) ];

		if (!keys.includes(param.idField)) {
			keys.push(param.idField);
		};

		if (keys.includes('name')) {
			keys.push('pluralName');
		};

		if (keys.includes('layout')) {
			keys.push('resolvedLayout');
		};

		return keys;
	};

	/**
	 * Subscribes to a set of objects matching the given parameters, updating the store on changes.
	 * @param {Partial<I.SearchSubscribeParam>} param - Subscription parameters.
	 * @param {(message: any) => void} [callBack] - Optional callback for subscription results.
	 */
	subscribe (param: Partial<I.SearchSubscribeParam>, callBack?: (message: any) => void) {
		const { space } = S.Common;

		param = Object.assign({
			spaceId: space,
			subId: '',
			idField: 'id',
			filters: [],
			sorts: [],
			keys: J.Relation.default,
			sources: [],
			offset: 0,
			limit: 0,
			ignoreHidden: true,
			ignoreDeleted: true,
			ignoreArchived: true,
			noDeps: false,
			afterId: '',
			beforeId: '',
			collectionId: ''
		}, param);

		const { config } = S.Common;
		const { spaceId, subId, idField, sources, offset, limit, afterId, beforeId, noDeps, collectionId } = param;
		const keys = this.mapKeys(param);
		const debug = config.flagsMw.subscribe;
		const filters = this.defaultFilters(param);
		const sorts = (param.sorts || []).map(this.sortMapper);

		if (!subId) {
			if (debug) {
				console.error('[U.Subscription].subscribe: subId is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'subId is empty' } });
			};
			return;
		};

		if (!spaceId) {
			if (debug) {
				console.error('[U.Subscription].subscribe: spaceId is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'spaceId is empty' } });
			};
			return;
		};

		const hash = this.makeHash(spaceId, subId, filters, sorts, keys, sources, offset, limit, afterId, beforeId, noDeps, collectionId);

		if (hash) {
			if (this.map.has(subId) && (this.map.get(subId) == hash)) {
				if (debug) {
					console.error('[U.Subscription].subscribe: already subscribed', subId, hash);
				};

				if (callBack) {
					callBack({ error: { code: 1, description: 'Already subscribed' } });
				};
				return;
			};

			this.map.set(subId, hash);
		};

		C.ObjectSearchSubscribe(spaceId, subId, filters.map(this.filterMapper), sorts.map(this.sortMapper), keys, sources, offset, limit, afterId, beforeId, noDeps, collectionId, (message: any) => {
			this.onSubscribe(subId, idField, keys, message);

			if (callBack) {
				callBack(message);
			};
		});
	};

	/**
	 * Subscribes to a specific set of object IDs, updating the store on changes.
	 * @param {Partial<I.SearchIdsParam>} param - Subscription parameters for IDs.
	 * @param {(message: any) => void} [callBack] - Optional callback for subscription results.
	 */
	subscribeIds (param: Partial<I.SearchIdsParam>, callBack?: (message: any) => void) {
		const { space } = S.Common;

		param = Object.assign({
			spaceId: space,
			subId: '',
			ids: [],
			keys: J.Relation.default,
			noDeps: false,
			idField: 'id',
			updateDetails: false,
		}, param);

		const { config } = S.Common;
		const { spaceId, subId, noDeps, updateDetails } = param;
		const ids = U.Common.arrayUnique(param.ids.filter(it => it));
		const keys = this.mapKeys(param);
		const debug = config.flagsMw.subscribe;

		if (!subId) {
			if (debug) {
				console.error('[U.Subscription].subscribeIds: subId is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'subId is empty' } });
			};
			return;
		};

		if (!spaceId) {
			if (debug) {
				console.error('[U.Subscription].subscribeIds: spaceId is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'spaceId is empty' } });
			};
			return;
		};

		if (!ids.length) {
			if (debug) {
				console.error('[U.Subscription].subscribeIds: ids list is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'ids list is empty' } });
			};
			return;
		};

		const hash = this.makeHash(spaceId, subId, ids, keys, noDeps);

		if (hash) {
			if (this.map.has(subId) && (this.map.get(subId) == hash)) {
				if (debug) {
					console.error('[U.Subscription].searchSubscribe: already subscribed', subId, hash);
				};

				if (callBack) {
					callBack({ error: { code: 1, description: 'Already subscribed' } });
				};
				return;
			};

			this.map.set(subId, hash);
		};

		C.ObjectSubscribeIds(spaceId, subId, ids, keys, noDeps, (message: any) => {
			(message.records || []).sort((c1: any, c2: any) => {
				const i1 = ids.indexOf(c1.id);
				const i2 = ids.indexOf(c2.id);
				if (i1 > i2) return 1; 
				if (i1 < i2) return -1;
				return 0;
			});

			this.onSubscribe(subId, 'id', keys, message, updateDetails);

			if (callBack) {
				callBack(message);
			};
		});
	};

	/**
	 * Performs a search for objects matching the given parameters.
	 * @param {Partial<I.SearchSubscribeParam> & { fullText?: string }} param - Search parameters.
	 * @param {(message: any) => void} [callBack] - Optional callback for search results.
	 */
	search (param: Partial<I.SearchSubscribeParam> & { fullText?: string }, callBack?: (message: any) => void) {
		const { space } = S.Common;

		param = Object.assign({
			spaceId: space,
			idField: 'id',
			fullText: '',
			filters: [],
			sorts: [],
			keys: J.Relation.default,
			offset: 0,
			limit: 0,
			ignoreHidden: true,
			ignoreDeleted: true,
			ignoreArchived: true,
			skipLayoutFormat: null,
		}, param);

		const { config } = S.Common;
		const { spaceId, offset, limit, skipLayoutFormat, fullText } = param;
		const keys = this.mapKeys(param);
		const debug = config.flagsMw.subscribe;
		const filters = this.defaultFilters(param);
		const sorts = (param.sorts || []).map(this.sortMapper);

		if (!spaceId) {
			if (debug) {
				console.error('[U.Subscription].search: spaceId is empty');
			};

			if (callBack) {
				callBack({ error: { code: 1, description: 'spaceId is empty' } });
			};
			return;
		};

		C.ObjectSearch(spaceId, filters, sorts, keys, fullText, offset, limit, (message: any) => {
			if (message.records) {
				message.records = message.records.map(it => S.Detail.mapper(it, skipLayoutFormat));
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	/**
	 * Maps a filter object, adding format information if available.
	 * @param {I.Filter} it - The filter object.
	 * @returns {I.Filter} The mapped filter object.
	 */
	filterMapper (it: I.Filter) {
		const relation = S.Record.getRelationByKey(it.relationKey);
		if (relation) {
			it.format = relation.format;
		};
		return it;
	};

	/**
	 * Maps a sort object, setting includeTime for system date relations.
	 * @param {any} it - The sort object.
	 * @returns {any} The mapped sort object.
	 */
	sortMapper (it: any) {
		if (undefined === it.includeTime) {
			const relation = S.Record.getRelationByKey(it.relationKey);
			if (relation && Relation.isDate(relation.format)) {
				it.includeTime = relation.includeTime;
			};
		};
		return it;
	};

	/**
	 * Creates all global and space subscriptions.
	 * @param {() => void} [callBack] - Optional callback after creation.
	 */
	createAll (callBack?: () => void) {
		this.createGlobal(() => {
			this.createSpace(callBack);
		});
	};
	
	/**
	 * Creates global subscriptions for the current account.
	 * @param {() => void} [callBack] - Optional callback after creation.
	 */
	createGlobal (callBack?: () => void) {
		const { account } = S.Auth;
	
		if (!account) {
			if (callBack) {
				callBack();
			};
			return;
		};

		S.Record.spaceMap.clear();
	
		const { techSpaceId } = account.info;
		const list: any[] = [
			{
				spaceId: techSpaceId,
				subId: J.Constant.subId.profile,
				filters: [
					{ relationKey: 'id', condition: I.FilterCondition.Equal, value: account.info.profileObjectId },
				],
				keys: J.Relation.default.concat('sharedSpacesLimit'),
				noDeps: true,
				ignoreHidden: false,
			},
			{
				spaceId: techSpaceId,
				subId: J.Constant.subId.space,
				keys: this.spaceRelationKeys(false),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.SpaceView },
				],
				sorts: [
					{ relationKey: 'createdDate', type: I.SortType.Desc },
				],
				ignoreHidden: false,
				onSubscribe: () => {
					S.Record.getRecords(J.Constant.subId.space).forEach(it => S.Record.spaceMap.set(it.targetSpaceId, it.id));
				},
			},
		];

		this.createList(list, () => this.createSubSpace(null, callBack));
	};

	/**
	 * Creates subscriptions for all subspaces or a given list of space IDs.
	 * @param {string[]} ids - List of space IDs to subscribe to.
	 * @param {() => void} [callBack] - Optional callback after creation.
	 */
	createSubSpace (ids: string[], callBack?: () => void) {
		const { account } = S.Auth;
		const skipIds = U.Space.getSystemDashboardIds();

		if (!account) {
			if (callBack) {
				callBack();
			};
			return;
		};

		let spaces = U.Space.getList();
		if (ids && ids.length) {
			spaces = spaces.filter(it => ids.includes(it.targetSpaceId));
		};

		if (!spaces.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		const list = [];

		spaces.forEach(space => {
			const ids = [
				space.creator,
				U.Space.getParticipantId(space.targetSpaceId, account.id),
			];

			if (!skipIds.includes(space.spaceDashboardId)) {
				ids.push(space.spaceDashboardId);
			};

			list.push({
				spaceId: space.targetSpaceId,
				subId: U.Space.getSubSpaceSubId(space.targetSpaceId),
				keys: this.participantRelationKeys(),
				filters: [
					{ relationKey: 'id', condition: I.FilterCondition.In, value: ids },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: true,
				ignoreArchived: true,
			});
		});

		this.createList(list, callBack);
	};

	/**
	 * Creates space-level subscriptions for deleted, type, relation, option, and participant objects.
	 * @param {() => void} [callBack] - Optional callback after creation.
	 */
	createSpace (callBack?: () => void): void {
		const spaceview = U.Space.getSpaceview();

		S.Record.typeKeyMap.clear();
		S.Record.relationKeyMap.clear();

		const list: any[] = [
			{
				subId: J.Constant.subId.deleted,
				keys: [],
				filters: [
					{ relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true },
				],
				ignoreDeleted: false,
				noDeps: true,
			},
			{
				subId: J.Constant.subId.archived,
				keys: [],
				filters: [
					{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
				],
				ignoreArchived: false,
				noDeps: true,
			},
			{
				subId: J.Constant.subId.type,
				keys: this.typeRelationKeys(false),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
				],
				sorts: [
					{ relationKey: 'orderId', type: I.SortType.Asc, empty: I.EmptyType.Start },
					{ 
						relationKey: 'uniqueKey', 
						type: I.SortType.Custom, 
						customOrder: U.Data.typeSortKeys(spaceview.isChat),
					},
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				ignoreArchived: false,
				onSubscribe: () => {
					S.Record.getRecords(J.Constant.subId.type).forEach(it => S.Record.typeKeyMapSet(it.spaceId, it.uniqueKey, it.id));
				},
			},
			{
				subId: J.Constant.subId.relation,
				keys: J.Relation.relation,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				ignoreArchived: false,
				onSubscribe: () => {
					S.Record.getRecords(J.Constant.subId.relation).forEach(it => S.Record.relationKeyMapSet(it.spaceId, it.relationKey, it.id));
				},
			},
			{
				subId: J.Constant.subId.option,
				keys: this.optionRelationKeys(false),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Option },
				],
				sorts: [
					{ relationKey: 'orderId', type: I.SortType.Asc },
					{ relationKey: 'createdDate', type: I.SortType.Desc },
				],
				noDeps: true,
				ignoreDeleted: true,
			},
			{
				subId: J.Constant.subId.participant,
				keys: this.participantRelationKeys(),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				],
				sorts: [
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				ignoreDeleted: true,
				ignoreHidden: false,
				noDeps: true,
			},
		];

		this.createList(list, callBack);
	};

	fileTypeKeys () {
		return [
			J.Constant.typeKey.file,
			J.Constant.typeKey.image,
			J.Constant.typeKey.audio,
			J.Constant.typeKey.video
		];
	};

	/**
	 * Creates a list of subscriptions from the provided list of parameters.
	 * @param {I.SearchSubscribeParam[]} list - List of subscription parameters.
	 * @param {() => void} [callBack] - Optional callback after all are created.
	 */
	createList (list: I.SearchSubscribeParam[], callBack?: () => void) {
		let cnt = 0;
		const cb = (item: any, message: any) => {
			if (item.onSubscribe) {
				item.onSubscribe(message);
			};

			cnt++;
			if ((cnt == list.length) && callBack) {
				callBack();
			};
		};

		for (const item of list) {
			this.subscribe(item, message => cb(item, message));
		};
	};
	
	/**
	 * Destroys a list of subscriptions by their IDs, optionally clearing state.
	 * @param {string[]} ids - List of subscription IDs to destroy.
	 * @param {boolean} [clearState] - Whether to clear state for each subscription.
	 * @param {() => void} [callBack] - Optional callback after destruction.
	 */
	destroyList (ids: string[], clearState?: boolean, callBack?: () => void): void {
		ids = ids || [];

		if (!ids.length) {
			if (callBack) {
				callBack();
			};
			return;
		};

		C.ObjectSearchUnsubscribe(ids, () => {
			ids.forEach(id => {
				this.map.delete(id);

				if (clearState) {
					Action.dbClearRoot(id);
				};
			});

			if (callBack) {
				callBack();
			};
		});
	};

	typeCheckSubId (key: string) {
		return [ 'typeCheck', S.Common.space, key ].join('-');
	};

	createTypeCheck (callBack?: () => void) {
		const { space } = S.Common;
		const list = [];

		for (const key of this.fileTypeKeys()) {
			const type = S.Record.getTypeByKey(key);

			if (!type) {
				continue;
			};

			list.push({
				subId: this.typeCheckSubId(key),
				filters: [
					{ relationKey: 'type', condition: I.FilterCondition.Equal, value: type.id },
				],
				keys: [ 'id' ],
				limit: 1,
				noDeps: true,
			});
		};

		this.createList(list, callBack);
	};

	/**
	 * Destroys all active subscriptions and optionally clears state.
	 * @param {() => void} [callBack] - Optional callback after destruction.
	 */
	destroyAll (callBack?: () => void): void {
		this.destroyList([ ...this.map.keys() ], true, callBack);
	};

	/**
	 * Returns the relation keys for space subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	spaceRelationKeys (withTmpOrder: boolean) {
		const ret = [ ...J.Relation.default, ...J.Relation.space, ...J.Relation.participant ];

		if (withTmpOrder) {
			ret.push('tmpOrder');
		};

		return ret;
	};

	/**
	 * Returns the relation keys for option subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	optionRelationKeys (withTmpOrder: boolean) {
		const ret = [ ...J.Relation.option ];

		if (withTmpOrder) {
			ret.push('tmpOrder');
		};

		return ret;
	};

	/**
	 * Returns the relation keys for type subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	typeRelationKeys (withTmpOrder: boolean) {
		const ret = J.Relation.default.concat(J.Relation.type);

		if (withTmpOrder) {
			ret.push('tmpOrder');
		};

		return ret;
	};

	/**
	 * Returns the relation keys for participant subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	participantRelationKeys () {
		return J.Relation.default.concat(J.Relation.participant);
	};

	/**
	 * Returns the relation keys for sync status subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	syncStatusRelationKeys () {
		return J.Relation.default.concat(J.Relation.syncStatus);
	};

	/**
	 * Returns the relation keys for chat subscriptions.
	 * @returns {string[]} The list of relation keys.
	 */
	chatRelationKeys () {
		return J.Relation.default.concat([ 'source', 'picture', 'widthInPixels', 'heightInPixels', 'syncStatus', 'syncError' ]);
	};

};

export default new UtilSubscription();
