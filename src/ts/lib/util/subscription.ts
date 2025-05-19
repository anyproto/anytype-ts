import { I, S, J, C, U, Action } from 'Lib';
import sha1 from 'sha1';

const SYSTEM_DATE_RELATION_KEYS = [
	'lastModifiedDate', 
	'lastOpenedDate', 
	'lastUsedDate',
	'lastMessageDate',
	'createdDate',
	'addedDate',
];

class UtilSubscription {

	private map = new Map<string, string>();

	makeHash (...args: any[]): string {
		args = args || [];
		return sha1(JSON.stringify(args));
	};

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

	defaultFilters (param: any) {
		const { config } = S.Common;
		const { ignoreHidden, ignoreDeleted, ignoreArchived, ignoreChat } = param;
		const filters = U.Common.objectCopy(param.filters || []);
		
		let skipLayouts = [];

		if (ignoreChat) {
			skipLayouts = skipLayouts.concat([ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld ]);
		};

		filters.push({ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });

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
			ignoreChat: true,
			noDeps: false,
			afterId: '',
			beforeId: '',
			collectionId: ''
		}, param);

		const { config } = S.Common;
		const { spaceId, subId, idField, sources, offset, limit, afterId, beforeId, noDeps, collectionId } = param;
		const keys = this.mapKeys(param);
		const debug = config.flagsMw.request;
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
		const debug = config.flagsMw.request;

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
			ignoreChat: true,
			skipLayoutFormat: null,
		}, param);

		const { config } = S.Common;
		const { spaceId, offset, limit, skipLayoutFormat, fullText } = param;
		const keys = this.mapKeys(param);
		const debug = config.flagsMw.request;
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

	filterMapper (it: I.Filter) {
		const relation = S.Record.getRelationByKey(it.relationKey);
		if (relation) {
			it.format = relation.format;
		};
		return it;
	};

	sortMapper (it: any) {
		if (undefined === it.includeTime) {
			it.includeTime = SYSTEM_DATE_RELATION_KEYS.includes(it.relationKey);
		};
		return it;
	};

	createAll (callBack?: () => void) {
		this.createGlobal(() => {
			this.createSpace(callBack);
		});
	};
	
	createGlobal (callBack?: () => void) {
		const { account } = S.Auth;
	
		if (!account) {
			if (callBack) {
				callBack();
			};
			return;
		};
	
		const { techSpaceId } = account.info;
		const list: any[] = [
			{
				spaceId: techSpaceId,
				subId: J.Constant.subId.profile,
				keys: this.profileRelationKeys(),
				filters: [
					{ relationKey: 'id', condition: I.FilterCondition.Equal, value: account.info.profileObjectId },
				],
				noDeps: true,
				ignoreHidden: false,
			},
			{
				spaceId: techSpaceId,
				subId: J.Constant.subId.space,
				keys: this.spaceRelationKeys(),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.SpaceView },
				],
				sorts: [
					{ relationKey: 'createdDate', type: I.SortType.Desc },
				],
				ignoreHidden: false,
			},
		];

		this.createList(list, () => this.createSubSpace(null, callBack));
	};

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

	createSpace (callBack?: () => void): void {
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
				subId: J.Constant.subId.type,
				keys: this.typeRelationKeys(),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
				],
				sorts: [
					{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				ignoreArchived: false,
				ignoreChat: false,
				onSubscribe: () => {
					S.Record.getRecords(J.Constant.subId.type).forEach(it => S.Record.typeKeyMapSet(it.spaceId, it.uniqueKey, it.id));
				}
			},
			{
				spaceId: J.Constant.storeSpaceId,
				subId: J.Constant.subId.typeStore,
				keys: this.typeRelationKeys(),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
				],
				sorts: [
					{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
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
				spaceId: J.Constant.storeSpaceId,
				subId: J.Constant.subId.relationStore,
				keys: J.Relation.relation,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
			},
			{
				subId: J.Constant.subId.option,
				keys: J.Relation.option,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Option },
				],
				sorts: [
					{ relationKey: 'name', type: I.SortType.Asc },
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

	destroyAll (callBack?: () => void): void {
		this.destroyList([ ...this.map.keys() ], true, callBack);
	};

	profileRelationKeys () {
		return J.Relation.default.concat('sharedSpacesLimit');
	};

	spaceRelationKeys () {
		return J.Relation.default.concat(J.Relation.space).concat(J.Relation.participant);
	};

	typeRelationKeys () {
		return J.Relation.default.concat(J.Relation.type).concat('lastUsedDate');
	};

	participantRelationKeys () {
		return J.Relation.default.concat(J.Relation.participant);
	};

	syncStatusRelationKeys () {
		return J.Relation.default.concat(J.Relation.syncStatus);
	};

	chatRelationKeys () {
		return J.Relation.default.concat([ 'source', 'picture', 'widthInPixels', 'heightInPixels' ]);
	};

};

export default new UtilSubscription();