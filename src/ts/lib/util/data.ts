import { I, C, keyboard, translate, UtilCommon, UtilRouter, Storage, analytics, dispatcher, Mark, UtilObject, focus } from 'Lib';
import { commonStore, blockStore, detailStore, dbStore, authStore } from 'Store';
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

class UtilData {

	blockTextClass (v: I.TextStyle): string {
		return UtilCommon.toCamelCase('text-' + String(I.TextStyle[v] || 'paragraph'));
	};
	
	blockDivClass (v: I.DivStyle): string {
		return UtilCommon.toCamelCase('div-' + String(I.DivStyle[v]));
	};

	blockLayoutClass (v: I.LayoutStyle): string {
		return UtilCommon.toCamelCase('layout-' + String(I.LayoutStyle[v]));
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
				switch (v) {
					default:
					case I.DivStyle.Line:		 icon = 'div-line'; break;
					case I.DivStyle.Dot:		 icon = 'dot'; break;
				};
				break;
		};
		return icon;
	};

	blockClass (block: any) {
		const { content } = block;
		const { style, type, state } = content;
		const dc = UtilCommon.toCamelCase('block-' + block.type);

		const c = [];
		if (block.type == I.BlockType.File) {
			if ((style == I.FileStyle.Link) || (type == I.FileType.File)) {
				c.push(dc);
			} else {
				c.push('blockMedia');

				switch (type) {
					case I.FileType.Image:	 c.push('isImage'); break;
					case I.FileType.Video:	 c.push('isVideo'); break;
					case I.FileType.Audio:	 c.push('isAudio'); break;
					case I.FileType.Pdf:	 c.push('isPdf'); break;
				};
			};
		} else {
			c.push(dc);

			switch (block.type) {
				case I.BlockType.Text:					 c.push(this.blockTextClass(style)); break;
				case I.BlockType.Layout:				 c.push(this.blockLayoutClass(style)); break;
				case I.BlockType.Div:					 c.push(this.blockDivClass(style)); break;
			};
		};

		return c.join(' ');
	};

	layoutClass (id: string, layout: I.ObjectLayout) {
		let c = '';
		switch (layout) {
			default: c = UtilCommon.toCamelCase('is-' + I.ObjectLayout[layout]); break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
		};
		return c;
	};

	linkCardClass (v: I.LinkCardStyle): string {
		return String(I.LinkCardStyle[v] || 'text').toLowerCase();
	};

	cardSizeClass (v: I.CardSize) {
		return String(I.CardSize[v] || 'small').toLowerCase();
	};

	dateFormat (v: I.DateFormat): string {
		let f = '';
		switch (v) {
			default:
			case I.DateFormat.MonthAbbrBeforeDay:	 f = 'M d, Y'; break;
			case I.DateFormat.MonthAbbrAfterDay:	 f = 'd M, Y'; break;
			case I.DateFormat.Short:				 f = 'd.m.Y'; break;
			case I.DateFormat.ShortUS:				 f = 'm.d.Y'; break;
			case I.DateFormat.ISO:					 f = 'Y-m-d'; break;
		};
		return f;
	};

	timeFormat (v: I.TimeFormat): string {
		let f = '';
		switch (v) {
			default:
			case I.TimeFormat.H12:	 f = 'g:i A'; break;
			case I.TimeFormat.H24:	 f = 'H:i'; break;
		};
		return f;
	};

	coverColors () {
		return [ 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'green', 'lightgrey', 'darkgrey', 'black' ].map(id => ({
			id,
			type: I.CoverType.Color,
			name: translate(`textColor-${id}`),
		}));
	};

	coverGradients () {
		return [ 'pinkOrange', 'bluePink', 'greenOrange', 'sky', 'yellow', 'red', 'blue', 'teal' ].map(id => ({
			id,
			type: I.CoverType.Gradient,
			name: translate(`gradientColor-${id}`),
		}));
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
	
	alignIcon (v: I.BlockHAlign): string {
		return String(I.BlockHAlign[v] || 'left').toLowerCase();
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
		commonStore.techSpaceSet(info.techSpaceId);

		analytics.device(info.deviceId);
		analytics.profile(info.analyticsId);

		Sentry.setUser({ id: info.analyticsId });
	};
	
	onAuth (param?: any, callBack?: () => void) {
		const pin = Storage.get('pin');
		const { profile, widgets } = blockStore;
		const { redirect, space } = commonStore;
		const color = Storage.get('color');
		const bgColor = Storage.get('bgColor');
		const routeParam = Object.assign({ replace: true }, (param || {}).routeParam || {});

		if (!profile) {
			console.error('[onAuth] No profile defined');
			return;
		};

		if (!widgets) {
			console.error('[onAuth] No widgets defined');
			return;
		};

		keyboard.initPinCheck();
		analytics.event('OpenAccount');

		C.FileNodeUsage((message: any) => {
			if (!message.error.code) {
				commonStore.spaceStorageSet(message);
			};
		});

		C.ObjectOpen(blockStore.rootId, '', space, (message: any) => {
			if (!UtilCommon.checkError(message.error.code)) {
				return;
			};

			C.ObjectOpen(widgets, '', space, () => {
				this.createsSubscriptions(() => {
					if (pin && !keyboard.isPinChecked) {
						UtilRouter.go('/auth/pin-check', routeParam);
					} else {
						if (redirect) {
							UtilRouter.go(redirect, routeParam);
						} else {
							UtilObject.openHome('route', routeParam);
						};

						commonStore.redirectSet('');
					};

					if (!color) {
						Storage.set('color', 'orange');
					};
					if (!bgColor) {
						Storage.set('bgColor', 'orange');
					};

					if (callBack) {
						callBack();
					};
				});
			});
		});
	};

	createsSubscriptions (callBack?: () => void): void {
		const list = [
			{
				subId: Constant.subId.profile,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.Equal, value: UtilObject.getIdentityId() },
				],
				noDeps: true,
				ignoreWorkspace: true,
			},
			{
				subId: Constant.subId.deleted,
				keys: [],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true },
				],
				noDeps: true,
			},
			{
				subId: Constant.subId.type,
				keys: this.typeRelationKeys(),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, commonStore.space ] },
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: I.ObjectLayout.Type },
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
					{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ Constant.storeSpaceId, commonStore.space ] },
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
			}
		];

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

	spaceRelationKeys () {
		return Constant.defaultRelationKeys.concat(Constant.spaceRelationKeys);
	};

	typeRelationKeys () {
		return Constant.defaultRelationKeys.concat(Constant.typeRelationKeys);
	};

	createSession (callBack?: (message: any) => void) {
		C.WalletCreateSession(authStore.phrase, (message: any) => {
			authStore.tokenSet(message.token);
			dispatcher.listenEvents();

			if (callBack) {
				callBack(message);
			};
		});
	};

	blockSetText (rootId: string, blockId: string, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		text = String(text || '');
		marks = marks || [];

		if (update) {
			blockStore.updateContent(rootId, blockId, { text, marks });
		};

		C.BlockTextSetText(rootId, blockId, text, marks, focus.state.range, (message: any) => {
			if (callBack) {
				callBack(message);
			};
		});
	};

	blockInsertText (rootId: string, blockId: string, needle: string, from: number, to: number, callBack?: (message: any) => void) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const diff = needle.length - (to - from);
		const text = UtilCommon.stringInsert(block.content.text, needle, from, to);
		const marks = Mark.adjust(block.content.marks, 0, diff);

		this.blockSetText(rootId, blockId, text, marks, true, callBack);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withBookmark, withCollection, withDefault } = param || {};
		const { space, config } = commonStore;
		const pageLayouts = UtilObject.getPageLayouts();

		let items: any[] = [];

		if (!withDefault) {
			const skipLayouts = [ 
				I.ObjectLayout.Note,
				I.ObjectLayout.Page,
				I.ObjectLayout.Task,
				I.ObjectLayout.Bookmark,
			].concat(UtilObject.getSetLayouts());

			items = items.concat(dbStore.getTypes().filter(it => {
				return pageLayouts.includes(it.recommendedLayout) && !skipLayouts.includes(it.recommendedLayout) && (it.spaceId == space);
			}));
			items.sort(this.sortByName);
		};

		if (withBookmark) {
			items.unshift(dbStore.getTypeByKey(Constant.typeKey.bookmark));
		};

		if (withCollection) {
			items.unshift(dbStore.getTypeByKey(Constant.typeKey.collection));
		};

		if (withSet) {
			items.unshift(dbStore.getTypeByKey(Constant.typeKey.set));
		};

		items.unshift(dbStore.getTypeByKey(Constant.typeKey.task));
		items.unshift(dbStore.getTypeByKey(Constant.typeKey.page));
		items.unshift(dbStore.getTypeByKey(Constant.typeKey.note));
		
		items = items.filter(it => it);

		if (!config.debug.ho) {
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

		const object = detailStore.get(rootId, blockId, [ 'layoutAlign', 'templateIsBundled' ].concat(Constant.coverRelationKeys));
		const childrenIds = blockStore.getChildrenIds(rootId, blockId);
		const checkType = blockStore.checkBlockTypeExists(rootId);
		const { iconEmoji, iconImage, coverType, coverId } = object;
		const ret: any = {
			withCover: Boolean((coverType != I.CoverType.None) && coverId),
			withIcon: false,
			className: [ this.layoutClass(object.id, object.layout), 'align' + object.layoutAlign ],
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
			case I.ObjectLayout.Relation:
			case I.ObjectLayout.File:
			case I.ObjectLayout.Image: {
				ret.withIcon = true;
				break;
			};
		};

		if (checkType) {
			ret.className.push('noSystemBlocks');
		};

		if ((object.featuredRelations || []).includes('description')) {
			ret.className.push('withDescription');
		};

		if (object.templateIsBundled) {
			ret.className.push('isBundled');
		};

		if (ret.withIcon && ret.withCover) {
			ret.className.push('withIconAndCover');
		} else
		if (ret.withIcon) {
			ret.className.push('withIcon');
		} else
		if (ret.withCover) {
			ret.className.push('withCover');
		};

		ret.className = ret.className.join(' ');
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
			cardStyle: I.LinkCardStyle.Text,
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

		let details = [];
		const mapper = (it: any) => { 
			keys.forEach((k: string) => { it[k] = it[k] || ''; });
			return { id: it[idField], details: it }; 
		};

		details = details.concat(message.dependencies.map(mapper));
		details = details.concat(message.records.map(mapper));

		detailStore.set(subId, details);
		dbStore.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	searchSubscribe (param: SearchSubscribeParams, callBack?: (message: any) => void) {
		const { config, space, techSpace } = commonStore;

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
			filters.push({ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space, techSpace ] });
		};

		if (ignoreHidden && !config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
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
		}, param);

		const { subId, keys, noDeps } = param;
		const ids = UtilCommon.arrayUnique(param.ids.filter(it => it));

		if (!subId) {
			console.error('[UtilData].subscribeIds: subId is empty');
			return;
		};
		if (!ids.length) {
			console.error('[UtilData].subscribeIds: ids list is empty');
			return;
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
		const { config, space, techSpace } = commonStore;

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
			filters.push({ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.In, value: [ space, techSpace ] });
		};

		if (ignoreHidden && !config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
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
		if ([ 'lastModifiedDate', 'lastOpenedDate', 'createdDate' ].includes(it.relationKey)) {
			it.includeTime = true;
		};
		return it;
	};

	setWindowTitle (rootId: string, objectId: string) {
		this.setWindowTitleText(UtilObject.name(detailStore.get(rootId, objectId, [])));
	};

	setWindowTitleText (name: string) {
		const space = UtilObject.getSpaceview();
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
		const templateType = dbStore.getTemplateType();
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [ '_anytype_profile' ] },
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: commonStore.space },
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
		
		let ids = [];
		if (selection) {
			ids = selection.get(I.SelectType.Block);
		};
		if (!ids.length) {
			ids = [ blockId ];
		};

		C.BlockListConvertToObjects(rootId, ids, type?.uniqueKey, () => {
			analytics.event('CreateObject', { route, objectType: typeId });
		});
	};

};

export default new UtilData();
