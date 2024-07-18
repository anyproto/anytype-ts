import * as Sentry from '@sentry/browser';
import { I, C, M, S, J, U, keyboard, translate, Storage, analytics, dispatcher, Mark, focus, Renderer, Action, Survey, Onboarding } from 'Lib';

type SearchSubscribeParams = Partial<{
	subId: string;
	idField: string;
	filters: I.Filter[];
	sorts: I.Sort[];
	keys: string[];
	sources: string[];
	collectionId: string;
	afterId: string;
	beforeId: string;
	offset: number;
	limit: number;
	ignoreWorkspace: boolean;
	ignoreHidden: boolean;
	ignoreDeleted: boolean;
	withArchived: boolean;
	noDeps: boolean;
}>;

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
				if ((style == I.FileStyle.Link) || (type == I.FileType.File)) {
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
	
	onInfo (info: I.AccountInfo) {
		S.Block.rootSet(info.homeObjectId);
		S.Block.widgetsSet(info.widgetsId);
		S.Block.profileSet(info.profileObjectId);
		S.Block.spaceviewSet(info.spaceViewId);

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

					const space = U.Space.getSpaceview();

					if (!space.isPersonal) {
						Onboarding.start('space', keyboard.isPopup(), false);
					};

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

	createAllSubscriptions (callBack?: () => void) {
		this.createGlobalSubscriptions(() => {
			this.createSpaceSubscriptions(callBack);
		});
	};

	createGlobalSubscriptions (callBack?: () => void) {
		const { account } = S.Auth;
		const list: any[] = [
			{
				subId: J.Constant.subId.profile,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.Equal, value: S.Block.profile },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreHidden: false,
			},
			{
				subId: J.Constant.subId.space,
				keys: this.spaceRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.SpaceView },
				],
				sorts: [
					{ relationKey: 'createdDate', type: I.SortType.Desc },
				],
				ignoreWorkspace: true,
				ignoreHidden: false,
			},
		];

		if (account) {
			list.push({
				subId: J.Constant.subId.myParticipant,
				keys: this.participantRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
					{ operator: I.FilterOperator.And, relationKey: 'identity', condition: I.FilterCondition.Equal, value: account.id },
				],
				ignoreWorkspace: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				noDeps: true,
			});
		};

		this.createSubscriptions(list, callBack);
	};

	createSpaceSubscriptions (callBack?: () => void): void {
		const { space } = S.Common;
		const list: any[] = [
			{
				subId: J.Constant.subId.profile,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.Equal, value: S.Block.profile },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreHidden: false,
			},
			{
				subId: J.Constant.subId.deleted,
				keys: [],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true },
				],
				ignoreDeleted: false,
				noDeps: true,
			},
			{
				subId: J.Constant.subId.type,
				keys: this.typeRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ J.Constant.storeSpaceId, space ] },
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
				],
				sorts: [
					{ relationKey: 'spaceId', type: I.SortType.Desc },
					{ relationKey: 'lastUsedDate', type: I.SortType.Desc },
					{ relationKey: 'name', type: I.SortType.Asc },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				onSubscribe: () => {
					S.Record.getTypes().forEach(it => S.Record.typeKeyMapSet(it.spaceId, it.uniqueKey, it.id));
				}
			},
			{
				subId: J.Constant.subId.relation,
				keys: J.Relation.relation,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ J.Constant.storeSpaceId, space ] },
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				onSubscribe: () => {
					S.Record.getRelations().forEach(it => S.Record.relationKeyMapSet(it.spaceId, it.relationKey, it.id));
				},
			},
			{
				subId: J.Constant.subId.option,
				keys: J.Relation.option,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Option },
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
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
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

	spaceRelationKeys () {
		return J.Relation.default.concat(J.Relation.space).concat(J.Relation.participant);
	};

	typeRelationKeys () {
		return J.Relation.default.concat(J.Relation.type);
	};

	participantRelationKeys () {
		return J.Relation.default.concat(J.Relation.participant);
	};

	syncStatusRelationKeys () {
		return J.Relation.default.concat(J.Relation.syncStatus);
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
			return pageLayouts.includes(it.recommendedLayout) && !skipLayouts.includes(it.recommendedLayout) && (it.spaceId == space);
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

		return items;
	};

	getTemplatesByTypeId (typeId: string, callBack: (message: any) => void) {
		const templateType = S.Record.getTemplateType();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: templateType?.id },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
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

	sortByWeight (c1: any, c2: any) {
		if (c1._sortWeight_ > c2._sortWeight_) return -1;
		if (c1._sortWeight_ < c2._sortWeight_) return 1;
		return this.sortByName(c1, c2);
	};

	sortByFormat (c1: any, c2: any) {
		if (c1.format > c2.format) return 1;
		if (c1.format < c2.format) return -1;
		return this.sortByName(c1, c2);
	};

	sortByPinnedTypes (c1: any, c2: any, ids: string[]) {
		const idx1 = ids.indexOf(c1.id);
		const idx2 = ids.indexOf(c2.id);

		if (idx1 > idx2) return 1;
		if (idx1 < idx2) return -1;
		return 0;
	};

	sortByNumericKey (key: string, c1: any, c2: any, dir: I.SortType) {
		if (c1[key] > c2[key]) return dir == I.SortType.Asc ? 1 : -1;
		if (c1[key] < c2[key]) return dir == I.SortType.Asc ? -1 : 1;
		return this.sortByName(c1, c2);
	};

	checkObjectWithRelationCnt (relationKey: string, type: string, ids: string[], limit: number, callBack?: (message: any) => void) {
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: type },
			{ operator: I.FilterOperator.And, relationKey: relationKey, condition: I.FilterCondition.In, value: ids },
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

	onSubscribe (subId: string, idField: string, keys: string[], message: any) {
		if (message.error.code) {
			return;
		};
		if (message.counters) {
			S.Record.metaSet(subId, '', { total: message.counters.total, keys });
		};

		const mapper = it => ({ id: it[idField], details: it });

		let details = [];
		details = details.concat(message.dependencies.map(mapper));
		details = details.concat(message.records.map(mapper));

		S.Detail.set(subId, details);
		S.Record.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	searchSubscribe (param: SearchSubscribeParams, callBack?: (message: any) => void) {
		const { config, space } = S.Common;

		param = Object.assign({
			subId: '',
			idField: 'id',
			filters: [],
			sorts: [],
			keys: J.Relation.default,
			sources: [],
			offset: 0,
			limit: 0,
			ignoreWorkspace: false,
			ignoreHidden: true,
			ignoreDeleted: true,
			withArchived: false,
			noDeps: false,
			afterId: '',
			beforeId: '',
			collectionId: ''
		}, param);


		const { subId, idField, filters, sorts, sources, offset, limit, ignoreWorkspace, ignoreHidden, ignoreDeleted, afterId, beforeId, noDeps, withArchived, collectionId } = param;
		const keys: string[] = [ ...new Set(param.keys as string[]) ];

		if (!subId) {
			console.error('[U.Data].searchSubscribe: subId is empty');
			return;
		};

		if (!ignoreWorkspace) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space ] });
		};

		if (ignoreHidden && !config.debug.hiddenObject) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (ignoreDeleted) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (!withArchived) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSearchSubscribe(subId, filters, sorts.map(this.sortMapper), keys, sources, offset, limit, ignoreWorkspace, afterId, beforeId, noDeps, collectionId, (message: any) => {
			this.onSubscribe(subId, idField, keys, message);

			if (callBack) {
				callBack(message);
			};
		});
	};

	subscribeIds (param: any, callBack?: (message: any) => void) {
		param = Object.assign({
			subId: '',
			ids: [],
			keys: J.Relation.default,
			noDeps: false,
			idField: 'id',
		}, param);

		const { subId, keys, noDeps, idField } = param;
		const ids = U.Common.arrayUnique(param.ids.filter(it => it));

		if (!subId) {
			console.error('[U.Data].subscribeIds: subId is empty');
			return;
		};
		if (!ids.length) {
			console.error('[U.Data].subscribeIds: ids list is empty');
			return;
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSubscribeIds(subId, ids, keys, true, noDeps, (message: any) => {
			message.records.sort((c1: any, c2: any) => {
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

	search (param: SearchSubscribeParams & { fullText?: string }, callBack?: (message: any) => void) {
		const { config, space } = S.Common;

		param = Object.assign({
			idField: 'id',
			fullText: '',
			filters: [],
			sorts: [],
			keys: J.Relation.default,
			offset: 0,
			limit: 0,
			ignoreWorkspace: false,
			ignoreHidden: true,
			ignoreDeleted: true,
			withArchived: false,
		}, param);

		const { idField, filters, sorts, offset, limit, ignoreWorkspace, ignoreDeleted, ignoreHidden, withArchived } = param;
		const keys: string[] = [ ...new Set(param.keys as string[]) ];

		if (!ignoreWorkspace) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space ] });
		};

		if (ignoreHidden && !config.debug.hiddenObject) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (ignoreDeleted) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (!withArchived) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (!keys.includes(idField)) {
			keys.push(idField);
		};

		C.ObjectSearch(filters, sorts.map(this.sortMapper), keys, param.fullText, offset, limit, (message: any) => {
			if (message.records) {
				message.records = message.records.map(it => S.Detail.mapper(it));
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
		const { space } = S.Common;
		const templateType = S.Record.getTemplateType();
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotEqual, value: J.Constant.anytypeProfileId },
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space ] },
		];

		if (templateType) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: [ templateType.id ] },);
		};
		return filters;
	};

	moveToPage (rootId: string, ids: string[], typeId: string, route: string) {
		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return;
		};
		
		C.BlockListConvertToObjects(rootId, ids, type.uniqueKey, type.defaultTemplateId, this.getLinkBlockParam('', type.recommendedLayout), (message: any) => {
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
			const { membership } = message;

			if (membership) {
				const { status, tier } = membership;

				S.Auth.membershipSet(membership);
				analytics.setTier(tier);
				
				if (status && (status == I.MembershipStatus.Finalization)) {
					S.Popup.open('membershipFinalization', { data: { tier } });
				};
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

	isLocalNetwork (): boolean {
		return !S.Auth.account?.info?.networkId;
	};

	isLocalOnly (): boolean {
		return S.Auth.account?.info?.networkId == '';
	};

	accountCreate (onError?: (text: string) => void, callBack?: () => void) {
		onError = onError || (() => {});

		const { networkConfig } = S.Auth;
		const { mode, path } = networkConfig;
		const { dataPath } = S.Common;

		let phrase = '';

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

	groupDateSections (records: any[], key: string, sectionTemplate?: any) {
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

		Object.keys(groups).forEach((key) => {
			if (groups[key].length) {
				groupedRecords.push(Object.assign({ id: key, isSection: true }, sectionTemplate));
				groupedRecords = groupedRecords.concat(groups[key]);
			};
		});

		return groupedRecords;
	};

	getLinkBlockParam (id: string, layout: I.ObjectLayout) {
		const param: Partial<I.Block> = {};

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

		switch (layout) {
			case I.ObjectLayout.Bookmark: {
				param.type = I.BlockType.Bookmark;
				param.content = {
					state: I.BookmarkState.Done,
					targetObjectId: id,
				};
				break;
			};

			default: {
				param.type = I.BlockType.Link;
				param.content = {
					...this.defaultLinkSettings(),
					targetBlockId: id,
				};
				break;
			};
		};

		return param;
	};

};

export default new UtilData();
