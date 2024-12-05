import * as Sentry from '@sentry/browser';
import { I, C, M, S, J, U, keyboard, translate, Storage, analytics, dispatcher, Mark, focus, Renderer, Action, Survey, Onboarding, Preview } from 'Lib';

const SYSTEM_DATE_RELATION_KEYS = [
	'lastModifiedDate', 
	'lastOpenedDate', 
	'createdDate',
	'addedDate',
	'lastUsedDate',
];

class UtilData {

	blockTextClass (v: I.TextStyle): string {
		return `text${String(I.TextStyle[v] || 'Paragraph')}`;
	};
	
	blockDivClass (v: I.DivStyle): string {
		return `div${String(I.DivStyle[v])}`;
	};

	blockLayoutClass (v: I.LayoutStyle): string {
		return `layout${String(I.LayoutStyle[v])}`;
	};

	blockEmbedClass (v: I.EmbedProcessor): string {
		return `is${String(I.EmbedProcessor[v])}`;
	};

	styleIcon (type: I.BlockType, v: number): string {
		let icon = '';
		switch (type) {
			case I.BlockType.Text:
				switch (v) {
					default:					 icon = this.blockTextClass(v); break;
					case I.TextStyle.Code:		 icon = 'kbd'; break;
				};
				break;

			case I.BlockType.Div: 
				icon = this.blockDivClass(v);
				break;
		};
		return icon;
	};

	blockClass (block: any) {
		const { content } = block;
		const { style, type, processor } = content;
		const dc = U.Common.toCamelCase(`block-${block.type}`);
		const c = [];

		switch (block.type) {
			case I.BlockType.File: {
				if ((style == I.FileStyle.Link) || [ I.FileType.File, I.FileType.None ].includes(type)) {
					c.push(dc);
				} else {
					c.push(`blockMedia is${I.FileType[type]}`);
				};
				break;
			};

			case I.BlockType.Embed: {
				c.push(`blockEmbed ${this.blockEmbedClass(processor)}`);
				break;
			};

			default: {
				c.push(dc);
				switch (block.type) {
					case I.BlockType.Text:					 c.push(this.blockTextClass(style)); break;
					case I.BlockType.Layout:				 c.push(this.blockLayoutClass(style)); break;
					case I.BlockType.Div:					 c.push(this.blockDivClass(style)); break;
				};
				break;
			};
		};
		return c.join(' ');
	};

	layoutClass (id: string, layout: I.ObjectLayout) {
		let c = '';
		switch (layout) {
			default: c = U.Common.toCamelCase(`is-${I.ObjectLayout[layout]}`); break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
		};
		return c;
	};

	linkCardClass (v: I.LinkCardStyle): string {
		v = v || I.LinkCardStyle.Text;
		return String(I.LinkCardStyle[v]).toLowerCase();
	};

	cardSizeClass (v: I.CardSize) {
		v = v || I.CardSize.Small;
		return String(I.CardSize[v]).toLowerCase();
	};

	diffClass (v: I.DiffType): string {
		let c = '';
		switch (v) {
			case I.DiffType.None: c = 'diffNone'; break;
			case I.DiffType.Add: c = 'diffAdd'; break;
			case I.DiffType.Change: c = 'diffChange'; break;
			case I.DiffType.Remove: c = 'diffRemove'; break;
		};
		return c;
	};

	syncStatusClass (v: I.SyncStatusObject): string {
		const s = I.SyncStatusObject[v];
		if ('undefined' == typeof(s)) {
			return '';
		};
		return String(s || '').toLowerCase();
	};
	
	alignHIcon (v: I.BlockHAlign): string {
		v = v || I.BlockHAlign.Left;
		return `align ${String(I.BlockHAlign[v]).toLowerCase()}`;
	};

	alignVIcon (v: I.BlockVAlign): string {
		v = v || I.BlockVAlign.Top;
		return `valign ${String(I.BlockVAlign[v]).toLowerCase()}`;
	};

	emojiParam (t: I.TextStyle) {
		let s = 20;
		switch (t) {
			case I.TextStyle.Header1:	 s = 30; break;
			case I.TextStyle.Header2:	 s = 26; break;
			case I.TextStyle.Header3: 	 s = 22; break;
		};
		return s;
	};
	
	onInfo (info: I.AccountInfo) {
		S.Block.rootSet(info.homeObjectId);
		S.Block.widgetsSet(info.widgetsId);
		S.Block.profileSet(info.profileObjectId);
		S.Block.spaceviewSet(info.spaceViewId);
		S.Block.workspaceSet(info.workspaceObjectId);

		S.Common.gatewaySet(info.gatewayUrl);
		S.Common.spaceSet(info.accountSpaceId);
		S.Common.getRef('vault')?.setActive(info.spaceViewId);

		analytics.profile(info.analyticsId, info.networkId);
		Sentry.setUser({ id: info.analyticsId });
	};
	
	onAuth (param?: any, callBack?: () => void) {
		param = param || {};
		param.routeParam = param.routeParam || {};

		const pin = Storage.getPin();
		const { root, widgets } = S.Block;
		const { redirect, space } = S.Common;
		const color = Storage.get('color');
		const bgColor = Storage.get('bgColor');
		const routeParam = Object.assign({ replace: true }, param.routeParam);
		const route = param.route || redirect;

		if (!widgets) {
			console.error('[U.Data].onAuth No widgets defined');
			return;
		};

		keyboard.initPinCheck();

		C.ObjectOpen(root, '', space, (message: any) => {
			if (!U.Common.checkErrorOnOpen(root, message.error.code, null)) {
				return;
			};

			C.ObjectOpen(widgets, '', space, (message: any) => {
				if (!U.Common.checkErrorOnOpen(widgets, message.error.code, null)) {
					return;
				};

				this.createSpaceSubscriptions(() => {
					// Redirect
					if (pin && !keyboard.isPinChecked) {
						U.Router.go('/auth/pin-check', routeParam);
					} else {
						if (route) {
							U.Router.go(route, routeParam);
						} else {
							U.Space.openDashboard('route', routeParam);
						};

						S.Common.redirectSet('');
					};

					if (!color) {
						Storage.set('color', 'orange');
					};
					if (!bgColor) {
						Storage.set('bgColor', 'orange');
					};

					[ 
						I.SurveyType.Register, 
						I.SurveyType.Object, 
					].forEach(it => Survey.check(it));

					Storage.clearDeletedSpaces();

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	onAuthOnce (noTierCache: boolean) {
		C.NotificationList(false, J.Constant.limit.notification, (message: any) => {
			if (!message.error.code) {
				S.Notification.set(message.list);
			};
		});

		C.FileNodeUsage((message: any) => {
			if (!message.error.code) {
				S.Common.spaceStorageSet(message);
			};
		});

		this.getMembershipTiers(noTierCache);
		this.getMembershipStatus();
		this.createGlobalSubscriptions();

		analytics.event('OpenAccount');
	};

	onAuthWithoutSpace (param?: Partial<I.RouteParam>) {
		this.createGlobalSubscriptions(() => U.Space.openFirstSpaceOrVoid(null, param));
	};

	createAllSubscriptions (callBack?: () => void) {
		this.createGlobalSubscriptions(() => {
			this.createSpaceSubscriptions(callBack);
		});
	};

	createGlobalSubscriptions (callBack?: () => void) {
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
					{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.SpaceView },
				],
				sorts: [
					{ relationKey: 'createdDate', type: I.SortType.Desc },
				],
				ignoreHidden: false,
			},
		];

		this.createSubscriptions(list, () => {
			this.createSubSpaceSubscriptions(null, callBack);
		});
	};

	createSubSpaceSubscriptions (ids: string[], callBack?: () => void) {
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

		this.createSubscriptions(list, callBack);
	};

	createSpaceSubscriptions (callBack?: () => void): void {
		const { space } = S.Common;
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
					{ relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
				],
				sorts: [
					{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				onSubscribe: () => {
					S.Record.getTypes().forEach(it => S.Record.typeKeyMapSet(it.spaceId, it.uniqueKey, it.id));
				}
			},
			{
				spaceId: J.Constant.storeSpaceId,
				subId: J.Constant.subId.typeStore,
				keys: this.typeRelationKeys(),
				filters: [
					{ relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
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
					{ relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				onSubscribe: () => {
					S.Record.getRelations().forEach(it => S.Record.relationKeyMapSet(it.spaceId, it.relationKey, it.id));
				},
			},
			{
				spaceId: J.Constant.storeSpaceId,
				subId: J.Constant.subId.relationStore,
				keys: J.Relation.relation,
				filters: [
					{ relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreDeleted: true,
				ignoreHidden: false,
			},
			{
				subId: J.Constant.subId.option,
				keys: J.Relation.option,
				filters: [
					{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Option },
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
					{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				],
				sorts: [
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				ignoreDeleted: true,
				ignoreHidden: false,
				noDeps: true,
			},
		];

		this.createSubscriptions(list, callBack);
	};

	createSubscriptions (list: any[], callBack?: () => void) {
		let cnt = 0;
		const cb = (item: any) => {
			if (item.onSubscribe) {
				item.onSubscribe();
			};

			cnt++;

			if ((cnt == list.length) && callBack) {
				callBack();
			};
		};

		for (const item of list) {
			this.searchSubscribe(item, () => cb(item));
		};
	};

	destroySubscriptions (callBack?: () => void): void {
		const ids = Object.values(J.Constant.subId);

		C.ObjectSearchUnsubscribe(ids, callBack);
		ids.forEach(id => Action.dbClearRoot(id));
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

	createSession (phrase: string, key: string, callBack?: (message: any) => void) {
		C.WalletCreateSession(phrase, key, (message: any) => {

			if (!message.error.code) {
				S.Auth.tokenSet(message.token);
				S.Auth.appTokenSet(message.appToken);
				dispatcher.listenEvents();
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	blockSetText (rootId: string, blockId: string, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		text = String(text || '');
		marks = marks || [];

		if (update) {
			S.Block.updateContent(rootId, blockId, { text, marks });
		};

		C.BlockTextSetText(rootId, blockId, text, marks, focus.state.range, callBack);
	};

	blockInsertText (rootId: string, blockId: string, needle: string, from: number, to: number, callBack?: (message: any) => void) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const diff = needle.length - (to - from);
		const text = U.Common.stringInsert(block.content.text, needle, from, to);
		const marks = Mark.adjust(block.content.marks, from, diff);

		this.blockSetText(rootId, blockId, text, marks, true, callBack);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withCollection, limit } = param || {};
		const { space, config } = S.Common;
		const pageLayouts = U.Object.getPageLayouts();
		const skipLayouts = U.Object.getSetLayouts();

		let items: any[] = [];

		items = items.concat(S.Record.getTypes().filter(it => {
			return pageLayouts.includes(it.recommendedLayout) && 
				!skipLayouts.includes(it.recommendedLayout) && 
				(it.spaceId == space) &&
				(it.uniqueKey != J.Constant.typeKey.template);
		}));

		if (limit) {
			items = items.slice(0, limit);
		};

		if (withSet) {
			items.push(S.Record.getSetType());
		};

		if (withCollection) {
			items.push(S.Record.getCollectionType());
		};

		items = items.filter(it => it);
		if (!config.debug.hiddenObject) {
			items = items.filter(it => !it.isHidden);
		};

		items.sort((c1, c2) => this.sortByLastUsedDate(c1, c2));
		return items;
	};

	getTemplatesByTypeId (typeId: string, callBack: (message: any) => void) {
		const templateType = S.Record.getTemplateType();
		const filters: I.Filter[] = [
			{ relationKey: 'type', condition: I.FilterCondition.Equal, value: templateType?.id },
			{ relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];
		const keys = J.Relation.default.concat([ 'targetObjectType' ]);

		this.search({
			filters,
			sorts,
			keys,
			limit: J.Constant.limit.menuRecords,
		}, callBack);
	};

	checkDetails (rootId: string, blockId?: string) {
		blockId = blockId || rootId;

		const object = S.Detail.get(rootId, blockId, [ 'layout', 'layoutAlign', 'iconImage', 'iconEmoji', 'templateIsBundled' ].concat(J.Relation.cover), true);
		const checkType = S.Block.checkBlockTypeExists(rootId);
		const { iconEmoji, iconImage, coverType, coverId } = object;
		const ret = {
			withCover: false,
			withIcon: false,
			className: '',
		};

		let className = [];
		if (!object._empty_) {
			ret.withCover = Boolean((coverType != I.CoverType.None) && coverId);
			className = [ this.layoutClass(object.id, object.layout), 'align' + object.layoutAlign ];
		};

		switch (object.layout) {
			default:
				ret.withIcon = iconEmoji || iconImage;
				break;

			case I.ObjectLayout.Bookmark:
			case I.ObjectLayout.Task: {
				break;
			};

			case I.ObjectLayout.Human:
			case I.ObjectLayout.Participant:
			case I.ObjectLayout.Relation: {
				ret.withIcon = true;
				break;
			};
		};

		if (U.Object.isInFileLayouts(object.layout)) {
			ret.withIcon = true;
		};

		if (checkType) {
			className.push('noSystemBlocks');
		};

		if ((object.featuredRelations || []).includes('description')) {
			className.push('withDescription');
		};

		if (object.templateIsBundled) {
			className.push('isBundled');
		};

		if (ret.withIcon && ret.withCover) {
			className.push('withIconAndCover');
		} else
		if (ret.withIcon) {
			className.push('withIcon');
		} else
		if (ret.withCover) {
			className.push('withCover');
		};

		ret.className = className.join(' ');
		return ret;
	};

	sortByName (c1: any, c2: any) {
		const n1 = String(c1.name || '').toLowerCase();
		const n2 = String(c2.name || '').toLowerCase();
		const dn = translate('defaultNamePage').toLowerCase();

		if (!n1 && n2) return 1;
		if (n1 && !n2) return -1;
		if ((n1 == dn) && (n2 != dn)) return 1;
		if ((n1 != dn) && (n2 == dn)) return -1;
		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
		return 0;
	};

	sortByHidden (c1: any, c2: any) {
		if (c1.isHidden && !c2.isHidden) return 1;
		if (!c1.isHidden && c2.isHidden) return -1;
		return 0;
	};

	sortByPinnedTypes (c1: any, c2: any, ids: string[]) {
		const idx1 = ids.indexOf(c1.id);
		const idx2 = ids.indexOf(c2.id);

		if (idx1 > idx2) return 1;
		if (idx1 < idx2) return -1;
		return 0;
	};

	sortByNumericKey (key: string, c1: any, c2: any, dir: I.SortType) {
		const k1 = Number(c1[key]) || 0;
		const k2 = Number(c2[key]) || 0;

		if (k1 > k2) return dir == I.SortType.Asc ? 1 : -1;
		if (k1 < k2) return dir == I.SortType.Asc ? -1 : 1;
		return this.sortByName(c1, c2);
	};

	sortByWeight (c1: any, c2: any) {
		return this.sortByNumericKey('_sortWeight_', c1, c2, I.SortType.Desc);
	};

	sortByFormat (c1: any, c2: any) {
		return this.sortByNumericKey('format', c1, c2, I.SortType.Asc);
	};

	sortByLastUsedDate (c1: any, c2: any) {
		return this.sortByNumericKey('lastUsedDate', c1, c2, I.SortType.Desc);
	};

	checkObjectWithRelationCnt (relationKey: string, type: string, ids: string[], limit: number, callBack?: (message: any) => void) {
		const filters: I.Filter[] = [
			{ relationKey: 'type', condition: I.FilterCondition.Equal, value: type },
			{ relationKey: relationKey, condition: I.FilterCondition.In, value: ids },
		];

		this.search({
			filters,
			limit,
		}, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	// Check if there is at least 1 set for object types
	checkSetCnt (ids: string[], callBack?: (message: any) => void) {
		const setType = S.Record.getTypeByKey(J.Constant.typeKey.set);
		this.checkObjectWithRelationCnt('setOf', setType?.id, ids, 2, callBack);
	};

	defaultLinkSettings () {
		return {
			iconSize: I.LinkIconSize.Small,
			cardStyle: S.Common.linkStyle,
			description: I.LinkDescription.None,
			relations: [],
		};
	};

	checkLinkSettings (content: I.ContentLink, layout: I.ObjectLayout) {
		const relationKeys = [ 'type', 'cover', 'tag' ];

		content = U.Common.objectCopy(content);
		content.iconSize = Number(content.iconSize) || I.LinkIconSize.None;
		content.cardStyle = Number(content.cardStyle) || I.LinkCardStyle.Text;
		content.relations = (content.relations || []).filter(it => relationKeys.includes(it));

		if (U.Object.isTaskLayout(layout)) {
			content.iconSize = I.LinkIconSize.Small;
		} else
		if (U.Object.isNoteLayout(layout)) {
			const filter = [ 'type' ];

			content.description = I.LinkDescription.None;
			content.iconSize = I.LinkIconSize.None;
			content.relations = content.relations.filter(it => filter.includes(it)); 
		};

		content.relations = U.Common.arrayUnique(content.relations);
		return content;
	};

	coverIsImage (type: I.CoverType) {
		return [ I.CoverType.Upload, I.CoverType.Source ].includes(type);
	};

	searchDefaultFilters (param: any) {
		const { config } = S.Common;
		const { ignoreHidden, ignoreDeleted, ignoreArchived } = param;
		const filters = param.filters || [];
		const skipLayouts = [ I.ObjectLayout.Chat, I.ObjectLayout.ChatOld ];

		filters.push({ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: skipLayouts });
		filters.push({ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: skipLayouts });

		if (ignoreHidden && !config.debug.hiddenObject) {
			filters.push({ relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
			filters.push({ relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (ignoreDeleted) {
			filters.push({ relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (ignoreArchived) {
			filters.push({ relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true });
		};

		return filters;
	};

	onSubscribe (subId: string, idField: string, keys: string[], message: any) {
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

		S.Detail.set(subId, details);
		S.Record.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	searchSubscribe (param: Partial<I.SearchSubscribeParam>, callBack?: (message: any) => void) {
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

		const { spaceId, subId, idField, sorts, sources, offset, limit, afterId, beforeId, noDeps, collectionId } = param;
		const keys: string[] = [ ...new Set(param.keys as string[]) ];
		const filters = this.searchDefaultFilters(param);

		if (!subId) {
			console.error('[U.Data].searchSubscribe: subId is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!spaceId) {
			console.error('[U.Data].searchSubscribe: spaceId is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSearchSubscribe(spaceId, subId, filters, sorts.map(this.sortMapper), keys, sources, offset, limit, afterId, beforeId, noDeps, collectionId, (message: any) => {
			this.onSubscribe(subId, idField, keys, message);

			if (callBack) {
				callBack(message);
			};
		});
	};

	subscribeIds (param: any, callBack?: (message: any) => void) {
		const { space } = S.Common;

		param = Object.assign({
			spaceId: space,
			subId: '',
			ids: [],
			keys: J.Relation.default,
			noDeps: false,
			idField: 'id',
		}, param);

		const { spaceId, subId, keys, noDeps, idField } = param;
		const ids = U.Common.arrayUnique(param.ids.filter(it => it));

		if (!subId) {
			console.error('[U.Data].subscribeIds: subId is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!spaceId) {
			console.error('[U.Data].subscribeIds: spaceId is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!ids.length) {
			console.error('[U.Data].subscribeIds: ids list is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSubscribeIds(spaceId, subId, ids, keys, noDeps, (message: any) => {
			(message.records || []).sort((c1: any, c2: any) => {
				const i1 = ids.indexOf(c1.id);
				const i2 = ids.indexOf(c2.id);
				if (i1 > i2) return 1; 
				if (i1 < i2) return -1;
				return 0;
			});

			this.onSubscribe(subId, 'id', keys, message);

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
			skipLayoutFormat: null,
		}, param);

		const { spaceId, idField, sorts, offset, limit, skipLayoutFormat } = param;
		const keys: string[] = [ ...new Set(param.keys as string[]) ];
		const filters = this.searchDefaultFilters(param);

		if (!spaceId) {
			console.error('[U.Data].search: spaceId is empty');

			if (callBack) {
				callBack({});
			};
			return;
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSearch(spaceId, filters, sorts.map(this.sortMapper), keys, param.fullText, offset, limit, (message: any) => {
			if (message.records) {
				message.records = message.records.map(it => S.Detail.mapper(it, skipLayoutFormat));
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	sortMapper (it: any) {
		if (undefined === it.includeTime) {
			it.includeTime = SYSTEM_DATE_RELATION_KEYS.includes(it.relationKey);
		};
		return it;
	};

	setWindowTitle (rootId: string, objectId: string) {
		this.setWindowTitleText(U.Object.name(S.Detail.get(rootId, objectId, [])));
	};

	setWindowTitleText (name: string) {
		const space = U.Space.getSpaceview();
		const title = [];

		if (name) {
			title.push(U.Common.shorten(name, 60));
		};

		if (!space._empty_) {
			title.push(space.name);
		};

		title.push(J.Constant.appName);
		document.title = title.join(' - ');
	};

	graphFilters () {
		const templateType = S.Record.getTemplateType();
		const filters: any[] = [
			{ relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts() },
			{ relationKey: 'id', condition: I.FilterCondition.NotEqual, value: J.Constant.anytypeProfileId },
		];

		if (templateType) {
			filters.push({ relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType.id });
		};
		return filters;
	};

	moveToPage (rootId: string, ids: string[], typeId: string, route: string) {
		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return;
		};
		
		C.BlockListConvertToObjects(rootId, ids, type.uniqueKey, type.defaultTemplateId, this.getLinkBlockParam('', type.recommendedLayout, false), (message: any) => {
			if (!message.error.code) {
				analytics.createObject(type.id, type.recommendedLayout, route, message.middleTime);
			};
		});
	};

	getMembershipStatus (callBack?: (membership: I.Membership) => void) {
		if (!this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetStatus(true, (message: any) => {
			if (!message.membership) {
				return;
			};

			const membership = new M.Membership(message.membership);
			const { status, tier } = membership;

			S.Auth.membershipSet(membership);
			analytics.setTier(tier);

			if (status && (status == I.MembershipStatus.Finalization)) {
				S.Popup.open('membershipFinalization', { data: { tier } });
			};

			if (callBack) {
				callBack(membership);
			};
		});
	};

	getMembershipTiers (noCache: boolean) {
		const { config, interfaceLang, isOnline } = S.Common;
		const { testPayment } = config;

		if (!isOnline || !this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetTiers(noCache, interfaceLang, (message) => {
			if (message.error.code) {
				return;
			};

			const tiers = message.tiers.filter(it => (it.id == I.TierType.Explorer) || (it.isTest == !!testPayment));
			S.Common.membershipTiersListSet(tiers);
		});
	};

	getMembershipTier (id: I.TierType): I.MembershipTier {
		return S.Common.membershipTiers.find(it => it.id == id) || new M.MembershipTier({ id: I.TierType.None });
	};

	isAnytypeNetwork (): boolean {
		return Object.values(J.Constant.networkId).includes(S.Auth.account?.info?.networkId);
	};

	isDevelopmentNetwork (): boolean {
		return S.Auth.account?.info?.networkId == J.Constant.networkId.development;
	};

	isLocalNetwork (): boolean {
		return !S.Auth.account?.info?.networkId;
	};

	accountCreate (onError?: (text: string) => void, callBack?: () => void) {
		onError = onError || (() => {});

		const { networkConfig } = S.Auth;
		const { mode, path } = networkConfig;
		const { dataPath } = S.Common;

		let phrase = '';

		analytics.event('StartCreateAccount');

		C.WalletCreate(dataPath, (message) => {
			if (message.error.code) {
				onError(message.error.description);
				return;
			};

			phrase = message.mnemonic;

			this.createSession(phrase, '', (message) => {
				if (message.error.code) {
					onError(message.error.description);
					return;
				};

				C.AccountCreate('', '', dataPath, U.Common.rand(1, J.Constant.count.icon), mode, path, (message) => {
					if (message.error.code) {
						onError(message.error.description);
						return;
					};

					S.Auth.accountSet(message.account);
					S.Common.configSet(message.account.config, false);

					this.onInfo(message.account.info);
					Renderer.send('keytarSet', message.account.id, phrase);
					Action.importUsecase(S.Common.space, I.Usecase.GetStarted, callBack);

					analytics.event('CreateAccount', { middleTime: message.middleTime });
					analytics.event('CreateSpace', { middleTime: message.middleTime, usecase: I.Usecase.GetStarted });
				});
			});
		});
	};

	groupDateSections (records: any[], key: string, sectionTemplate?: any, dir?: I.SortType) {
		const now = U.Date.now();
		const { d, m, y } = U.Date.getCalendarDateParam(now);
		const today = now - U.Date.timestamp(y, m, d);
		const yesterday = now - U.Date.timestamp(y, m, d - 1);
		const lastWeek = now - U.Date.timestamp(y, m, d - 7);
		const lastMonth = now - U.Date.timestamp(y, m - 1, d);
		const groups = {
			today: [],
			yesterday: [],
			lastWeek: [],
			lastMonth: [],
			older: []
		};

		const groupNames = [ 'today', 'yesterday', 'lastWeek', 'lastMonth', 'older' ];
		if (dir == I.SortType.Asc) {
			groupNames.reverse();
		};

		let groupedRecords = [];

		if (!sectionTemplate) {
			sectionTemplate = {};
		};

		records.forEach((record) => {
			const diff = now - record[key];
			if (diff < today) {
				groups.today.push(record);
			} else
			if (diff < yesterday) {
				groups.yesterday.push(record);
			} else
			if (diff < lastWeek) {
				groups.lastWeek.push(record);
			} else
			if (diff < lastMonth) {
				groups.lastMonth.push(record);
			} else {
				groups.older.push(record);
			};
		});

		groupNames.forEach((name) => {
			if (groups[name].length) {
				groupedRecords.push(Object.assign({ id: name, isSection: true }, sectionTemplate));
				if (dir) {
					groups[name] = groups[name].sort((c1, c2) => U.Data.sortByNumericKey(key, c1, c2, dir));
				};
				groupedRecords = groupedRecords.concat(groups[name]);
			};
		});

		return groupedRecords;
	};

	getLinkBlockParam (id: string, layout: I.ObjectLayout, allowBookmark?: boolean) {
		if (U.Object.isInFileLayouts(layout)) {
			return {
				type: I.BlockType.File,
				content: {
					targetObjectId: id,
					style: I.FileStyle.Embed,
					state: I.FileState.Done,
					type: U.Object.getFileTypeByLayout(layout),
				},
			};
		};

		if (U.Object.isBookmarkLayout(layout) && allowBookmark) {
			return {
				type: I.BlockType.Bookmark,
				content: {
					state: I.BookmarkState.Done,
					targetObjectId: id,
				},
			};
		};

		return {
			type: I.BlockType.Link,
			content: { ...this.defaultLinkSettings(), targetBlockId: id },
		};
	};

};

export default new UtilData();
