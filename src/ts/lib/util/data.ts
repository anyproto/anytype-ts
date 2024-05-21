import { I, C, M, keyboard, translate, UtilCommon, UtilRouter, Storage, analytics, dispatcher, Mark, UtilObject, focus, UtilSpace, Renderer, Action, Survey, Onboarding } from 'Lib';
import { commonStore, blockStore, detailStore, dbStore, authStore, notificationStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import * as Sentry from '@sentry/browser';

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
		return `is${I.EmbedProcessor[v]}`;
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
		const dc = UtilCommon.toCamelCase(`block-${block.type}`);
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
			default: c = UtilCommon.toCamelCase(`is-${I.ObjectLayout[layout]}`); break;
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

	threadColor (s: I.ThreadStatus) {
		let c = '';
		switch (s) {
			default: c = ''; break;
			case I.ThreadStatus.Syncing: c = 'orange'; break;
			case I.ThreadStatus.Failed: 
			case I.ThreadStatus.Incompatible: c = 'red'; break;
			case I.ThreadStatus.Synced: c = 'green'; break;
		};
		return c;
	};
	
	alignHIcon (v: I.BlockHAlign): string {
		v = v || I.BlockHAlign.Left;
		return `align ${String(I.BlockHAlign[v]).toLowerCase()}`;
	};

	alignVIcon (v: I.BlockVAlign): string {
		v = v || I.BlockVAlign.Top;
		return `valign ${String(I.BlockVAlign[v]).toLowerCase()}`;
	};
	
	selectionGet (id: string, withChildren: boolean, save: boolean, props: any): string[] {
		const { dataset } = props;
		const { selection } = dataset || {};
		
		if (!selection) {
			return [];
		};
		
		let ids: string[] = selection.get(I.SelectType.Block, withChildren);
		if (id && !ids.includes(id)) {
			selection.clear();
			selection.set(I.SelectType.Block, [ id ]);
			ids = selection.get(I.SelectType.Block, withChildren);

			if (!save) {
				selection.clear();
			};
		};
		return ids;
	};

	onInfo (info: I.AccountInfo) {
		blockStore.rootSet(info.homeObjectId);
		blockStore.widgetsSet(info.widgetsId);
		blockStore.profileSet(info.profileObjectId);
		blockStore.spaceviewSet(info.spaceViewId);

		commonStore.gatewaySet(info.gatewayUrl);
		commonStore.spaceSet(info.accountSpaceId);

		analytics.profile(info.analyticsId, info.networkId);
		Sentry.setUser({ id: info.analyticsId });
	};
	
	onAuth (param?: any, callBack?: () => void) {
		const pin = Storage.get('pin');
		const { root, widgets } = blockStore;
		const { redirect, space } = commonStore;
		const color = Storage.get('color');
		const bgColor = Storage.get('bgColor');
		const routeParam = Object.assign({ replace: true }, (param || {}).routeParam || {});

		if (!widgets) {
			console.error('[UtilData].onAuth No widgets defined');
			return;
		};

		keyboard.initPinCheck();
		analytics.event('OpenAccount');

		C.ObjectOpen(root, '', space, (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(root, message.error.code, null)) {
				return;
			};

			C.ObjectOpen(widgets, '', space, (message: any) => {
				if (!UtilCommon.checkErrorOnOpen(widgets, message.error.code, null)) {
					return;
				};

				this.createSubscriptions(() => {
					// Redirect
					if (pin && !keyboard.isPinChecked) {
						UtilRouter.go('/auth/pin-check', routeParam);
					} else {
						if (redirect) {
							UtilRouter.go(redirect, routeParam);
						} else {
							UtilSpace.openDashboard('route', routeParam);
						};

						commonStore.redirectSet('');
					};

					if (!color) {
						Storage.set('color', 'orange');
					};
					if (!bgColor) {
						Storage.set('bgColor', 'orange');
					};

					Survey.check(I.SurveyType.Register);
					Survey.check(I.SurveyType.Object);

					const space = UtilSpace.getSpaceview();

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
		C.NotificationList(false, Constant.limit.notification, (message: any) => {
			if (!message.error.code) {
				notificationStore.set(message.list);
			};
		});

		C.FileNodeUsage((message: any) => {
			if (!message.error.code) {
				commonStore.spaceStorageSet(message);
			};
		});

		this.getMembershipTiers(noTierCache);
		this.getMembershipStatus();
	};

	createSubscriptions (callBack?: () => void): void {
		const { space } = commonStore;
		const { account } = authStore;
		const list: any[] = [
			{
				subId: Constant.subId.profile,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.Equal, value: blockStore.profile },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreHidden: false,
			},
			{
				subId: Constant.subId.deleted,
				keys: [],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true },
				],
				ignoreDeleted: false,
				noDeps: true,
			},
			{
				subId: Constant.subId.type,
				keys: this.typeRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, space ] },
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
					dbStore.getTypes().forEach(it => dbStore.typeKeyMapSet(it.spaceId, it.uniqueKey, it.id));
				}
			},
			{
				subId: Constant.subId.relation,
				keys: Constant.relationRelationKeys,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, space ] },
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Relation },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreDeleted: true,
				ignoreHidden: false,
				onSubscribe: () => {
					dbStore.getRelations().forEach(it => dbStore.relationKeyMapSet(it.spaceId, it.relationKey, it.id));
				},
			},
			{
				subId: Constant.subId.option,
				keys: Constant.optionRelationKeys,
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
				subId: Constant.subId.space,
				keys: this.spaceRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.SpaceView },
				],
				sorts: [
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				],
				ignoreWorkspace: true,
				ignoreHidden: false,
			},
			{
				subId: Constant.subId.participant,
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

		if (account) {
			list.push({
				subId: Constant.subId.myParticipant,
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
		C.ObjectSearchUnsubscribe(Object.values(Constant.subId), callBack);
	};

	spaceRelationKeys () {
		return Constant.defaultRelationKeys.concat(Constant.spaceRelationKeys).concat(Constant.participantRelationKeys);
	};

	typeRelationKeys () {
		return Constant.defaultRelationKeys.concat(Constant.typeRelationKeys);
	};

	participantRelationKeys () {
		return Constant.defaultRelationKeys.concat(Constant.participantRelationKeys);
	};

	createSession (phrase: string, key: string, callBack?: (message: any) => void) {
		C.WalletCreateSession(phrase, key, (message: any) => {

			if (!message.error.code) {
				authStore.tokenSet(message.token);
				authStore.appTokenSet(message.appToken);
				dispatcher.listenEvents();
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	blockSetText (rootId: string, blockId: string, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		text = String(text || '');
		marks = marks || [];

		if (update) {
			blockStore.updateContent(rootId, blockId, { text, marks });
		};

		C.BlockTextSetText(rootId, blockId, text, marks, focus.state.range, callBack);
	};

	blockInsertText (rootId: string, blockId: string, needle: string, from: number, to: number, callBack?: (message: any) => void) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const diff = needle.length - (to - from);
		const text = UtilCommon.stringInsert(block.content.text, needle, from, to);
		const marks = Mark.adjust(block.content.marks, from, diff);

		this.blockSetText(rootId, blockId, text, marks, true, callBack);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withCollection, limit } = param || {};
		const { space, config } = commonStore;
		const pageLayouts = UtilObject.getPageLayouts();
		const skipLayouts = UtilObject.getSetLayouts();

		let items: any[] = [];

		items = items.concat(dbStore.getTypes().filter(it => {
			return pageLayouts.includes(it.recommendedLayout) && !skipLayouts.includes(it.recommendedLayout) && (it.spaceId == space);
		}));

		if (limit) {
			items = items.slice(0, limit);
		};

		if (withSet) {
			items.push(dbStore.getSetType());
		};

		if (withCollection) {
			items.push(dbStore.getCollectionType());
		};

		items = items.filter(it => it);

		if (!config.debug.hiddenObject) {
			items = items.filter(it => !it.isHidden);
		};

		return items;
	};

	getTemplatesByTypeId (typeId: string, callBack: (message: any) => void) {
		const templateType = dbStore.getTemplateType();
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: templateType?.id },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];
		const keys = Constant.defaultRelationKeys.concat([ 'targetObjectType' ]);

		this.search({
			filters,
			sorts,
			keys,
			limit: Constant.limit.menuRecords,
		}, callBack);
	};

	checkDetails (rootId: string, blockId?: string) {
		blockId = blockId || rootId;

		const object = detailStore.get(rootId, blockId, [ 'layout', 'layoutAlign', 'iconImage', 'iconEmoji', 'templateIsBundled' ].concat(Constant.coverRelationKeys), true);
		const checkType = blockStore.checkBlockTypeExists(rootId);
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
			case I.ObjectLayout.Relation: {
				ret.withIcon = true;
				break;
			};
		};

		if (UtilObject.isFileLayout(object.layout)) {
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
		const setType = dbStore.getTypeByKey(Constant.typeKey.set);
		this.checkObjectWithRelationCnt('setOf', setType?.id, ids, 2, callBack);
	};

	defaultLinkSettings () {
		return {
			iconSize: I.LinkIconSize.Small,
			cardStyle: commonStore.linkStyle,
			description: I.LinkDescription.None,
			relations: [],
		};
	};

	checkLinkSettings (content: I.ContentLink, layout: I.ObjectLayout) {
		const relationKeys = [ 'type', 'cover', 'tag' ];

		content = UtilCommon.objectCopy(content);
		content.iconSize = Number(content.iconSize) || I.LinkIconSize.None;
		content.cardStyle = Number(content.cardStyle) || I.LinkCardStyle.Text;
		content.relations = (content.relations || []).filter(it => relationKeys.includes(it));

		if (layout == I.ObjectLayout.Task) {
			content.iconSize = I.LinkIconSize.Small;
		};

		if (layout == I.ObjectLayout.Note) {
			const filter = [ 'type' ];

			content.description = I.LinkDescription.None;
			content.iconSize = I.LinkIconSize.None;
			content.relations = content.relations.filter(it => filter.includes(it)); 
		};

		content.relations = UtilCommon.arrayUnique(content.relations);
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
			dbStore.metaSet(subId, '', { total: message.counters.total, keys });
		};

		const mapper = (it: any) => { 
			keys.forEach(k => it[k] = it[k] || '');
			return { id: it[idField], details: it }; 
		};

		let details = [];
		details = details.concat(message.dependencies.map(mapper));
		details = details.concat(message.records.map(mapper));

		detailStore.set(subId, details);
		dbStore.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	searchSubscribe (param: SearchSubscribeParams, callBack?: (message: any) => void) {
		const { config, space } = commonStore;

		param = Object.assign({
			subId: '',
			idField: 'id',
			filters: [],
			sorts: [],
			keys: Constant.defaultRelationKeys,
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
			console.error('[UtilData].searchSubscribe: subId is empty');
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
			keys: Constant.defaultRelationKeys,
			noDeps: false,
			idField: 'id',
		}, param);

		const { subId, keys, noDeps, idField } = param;
		const ids = UtilCommon.arrayUnique(param.ids.filter(it => it));

		if (!subId) {
			console.error('[UtilData].subscribeIds: subId is empty');
			return;
		};
		if (!ids.length) {
			console.error('[UtilData].subscribeIds: ids list is empty');
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
		const { config, space } = commonStore;

		param = Object.assign({
			idField: 'id',
			fullText: '',
			filters: [],
			sorts: [],
			keys: Constant.defaultRelationKeys,
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
				message.records = message.records.map(it => detailStore.mapper(it));
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
		this.setWindowTitleText(UtilObject.name(detailStore.get(rootId, objectId, [])));
	};

	setWindowTitleText (name: string) {
		const space = UtilSpace.getSpaceview();
		const title = [];

		if (name) {
			title.push(UtilCommon.shorten(name, 60));
		};

		if (!space._empty_) {
			title.push(space.name);
		};

		title.push(Constant.appName);
		document.title = title.join(' - ');
	};

	graphFilters () {
		const { space } = commonStore;
		const templateType = dbStore.getTemplateType();
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isHiddenDiscovery', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [ '_anytype_profile' ] },
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space ] },
		];

		if (templateType) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: [ templateType.id ] },);
		};
		return filters;
	};

	moveToPage (rootId: string, blockId: string, typeId: string, route: string, props: any) {
		const { dataset } = props;
		const { selection } = dataset || {};
		const type = dbStore.getTypeById(typeId);

		if (!type) {
			return;
		};
		
		const ids = selection ? selection.get(I.SelectType.Block) : [];
		if (!ids.length) {
			ids.push(blockId);
		};

		C.BlockListConvertToObjects(rootId, ids, type?.uniqueKey, (message: any) => {
			if (!message.error.code) {
				analytics.createObject(type.id, type.recommendedLayout, route, message.middleTime);
			};
		});
	};

	getThreadStatus (rootId: string, key: string) {
		const { account } = authStore;

		if (!account) {
			return I.ThreadStatus.Unknown;
		};

		const { info } = account || {};
		const thread = authStore.threadGet(rootId);
		const { summary } = thread;

		if (!info.networkId) {
			return I.ThreadStatus.Local;
		};

		if (!summary) {
			return I.ThreadStatus.Unknown;
		};

		return (thread[key] || {}).status || I.ThreadStatus.Unknown;
	};

	getNetworkName (): string {
		const { account } = authStore;
		const { info } = account;

		let ret = '';
		switch (info.networkId) {
			default:
				ret = translate('menuThreadListSelf');
				break;

			case Constant.networkId.production:
				ret = translate('menuThreadListProduction');
				break;

			case Constant.networkId.development:
				ret = translate('menuThreadListDevelopment');
				break;

			case '':
				ret = translate('menuThreadListLocal');
				break;
		};
		return ret;
	}

	getMembershipStatus (callBack?: (membership: I.Membership) => void) {
		if (!this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetStatus(true, (message: any) => {
			const { membership } = message;

			if (membership) {
				const { status, tier } = membership;

				authStore.membershipSet(membership);
				
				if (status && (status == I.MembershipStatus.Finalization)) {
					popupStore.open('membershipFinalization', { data: { tier } });
				};
			};

			if (callBack) {
				callBack(membership);
			};
		});
	};

	getMembershipTiers (noCache: boolean) {
		const { config, interfaceLang, isOnline } = commonStore;
		const { testPayment } = config;

		if (!isOnline || !this.isAnytypeNetwork()) {
			return;
		};

		C.MembershipGetTiers(noCache, interfaceLang, (message) => {
			if (message.error.code) {
				return;
			};

			const tiers = message.tiers.filter(it => (it.id == I.TierType.Explorer) || (it.isTest == !!testPayment));
			commonStore.membershipTiersListSet(tiers);
		});
	};

	getMembershipTier (id: I.TierType): I.MembershipTier {
		return commonStore.membershipTiers.find(it => it.id == id) || new M.MembershipTier({ id: I.TierType.None });
	};

	isAnytypeNetwork (): boolean {
		return Object.values(Constant.networkId).includes(authStore.account?.info?.networkId);
	};

	isLocalNetwork (): boolean {
		return !authStore.account?.info?.networkId;
	};

	isLocalOnly (): boolean {
		return authStore.account?.info?.networkId == '';
	};

	accountCreate (onError?: (text: string) => void, callBack?: () => void) {
		onError = onError || (() => {});

		const { networkConfig } = authStore;
		const { mode, path } = networkConfig;
		const { dataPath } = commonStore;

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

				C.AccountCreate('', '', dataPath, UtilCommon.rand(1, Constant.iconCnt), mode, path, (message) => {
					if (message.error.code) {
						onError(message.error.description);
						return;
					};

					authStore.accountSet(message.account);
					commonStore.configSet(message.account.config, false);
					commonStore.isSidebarFixedSet(true);

					this.onInfo(message.account.info);
					Renderer.send('keytarSet', message.account.id, phrase);
					Action.importUsecase(commonStore.space, I.Usecase.GetStarted, callBack);

					analytics.event('CreateAccount', { middleTime: message.middleTime });
					analytics.event('CreateSpace', { middleTime: message.middleTime, usecase: I.Usecase.GetStarted });
				});
			});
		});
	};

};

export default new UtilData();
