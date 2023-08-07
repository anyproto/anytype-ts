import { I, C, keyboard, translate, UtilCommon, Storage, analytics, dispatcher, Mark, UtilObject } from 'Lib';
import { commonStore, blockStore, detailStore, dbStore, authStore } from 'Store';
import Constant from 'json/constant.json';

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
	
	onAuth (account: I.Account, param?: any, callBack?: () => void) {
		if (!account) {
			console.error('[onAuth] No account defined');
			return;
		};

		commonStore.infoSet(account.info);
		commonStore.configSet(account.config, false);
		authStore.accountSet(account);

		const pin = Storage.get('pin');
		const { profile, widgets, root } = blockStore;
		const { redirect } = commonStore;
		const color = Storage.get('color');
		const bgColor = Storage.get('bgColor');
		const routeParam = Object.assign({ replace: true}, (param || {}).routeParam || {});

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

		C.FileSpaceUsage((message) => {
			if (!message.error.code) {
				commonStore.spaceStorageSet(message);
			};
		});

		C.ObjectOpen(root, '', (message: any) => {
			if (!UtilCommon.checkError(message.error.code)) {
				return;
			};

			const object = detailStore.get(root, root, Constant.coverRelationKeys, true);
			if (object._empty_) {
				console.error('Dashboard is empty');
				return;
			};

			C.ObjectOpen(widgets, '', () => {
				this.createsSubscriptions(() => {
					commonStore.defaultTypeSet(commonStore.type);

					if (pin && !keyboard.isPinChecked) {
						UtilCommon.route('/auth/pin-check', routeParam);
					} else {
						if (redirect) {
							UtilCommon.route(redirect, routeParam);
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

				if (profile) {
					this.subscribeIds({
						subId: Constant.subId.profile, 
						ids: [ profile ], 
						noDeps: true,
					});
				};
			});
		});
	};

	createsSubscriptions (callBack?: () => void): void {
		const list = [
			{
				subId: Constant.subId.deleted,
				keys: [],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true },
				],
				noDeps: true,
				ignoreWorkspace: true,
			},
			{
				subId: Constant.subId.type,
				keys: Constant.defaultRelationKeys.concat(Constant.typeRelationKeys),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.type, Constant.storeTypeId.type ] },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreDeleted: true,
			},
			{
				subId: Constant.subId.relation,
				keys: Constant.relationRelationKeys,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.relation, Constant.storeTypeId.relation ] },
				],
				noDeps: true,
				ignoreWorkspace: true,
				ignoreDeleted: true,
				onSubscribe: () => {
					dbStore.getRelations().forEach(it => dbStore.relationKeyMap[it.relationKey] = it.id);
				}
			},
			{
				subId: Constant.subId.option,
				keys: Constant.optionRelationKeys,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.option },
				],
				noDeps: true,
				ignoreDeleted: true,
			},
			{
				subId: Constant.subId.space,
				keys: Constant.defaultRelationKeys.concat([ 'spaceDashboardId', 'spaceAccessibility', 'createdDate' ]),
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.space },
				],
				ignoreWorkspace: true,
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

		C.BlockTextSetText(rootId, blockId, text, marks, (message: any) => {
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
		const { workspace, config } = commonStore;
		const pageLayouts = UtilObject.getPageLayouts();
		const page = dbStore.getType(Constant.typeId.page);
		const note = dbStore.getType(Constant.typeId.note);
		const set = dbStore.getType(Constant.typeId.set);
		const task = dbStore.getType(Constant.typeId.task);
		const bookmark = dbStore.getType(Constant.typeId.bookmark);
		const collection = dbStore.getType(Constant.typeId.collection);

		const skip = [ 
			Constant.typeId.note, 
			Constant.typeId.page, 
			Constant.typeId.set, 
			Constant.typeId.collection,
			Constant.typeId.task,
			Constant.typeId.bookmark,
		];
	
		let items: any[] = [];

		if (!withDefault) {
			items = items.concat(dbStore.getTypes().filter(it => {
				if (!pageLayouts.includes(it.recommendedLayout) || skip.includes(it.id) || (it.workspaceId != workspace)) {
					return false;
				};
				return config.debug.ho ? true : !it.isHidden;
			}));
		};

		if (withBookmark && bookmark) {
			items.unshift(bookmark);
		};

		items.sort(this.sortByName);

		if (withCollection && collection) {
			items.unshift(collection);
		};

		if (withSet && set) {
			items.unshift(set);
		};

		if (task) {
			items.unshift(task);
		};

		if (page && note) {
			if (commonStore.type == Constant.typeId.note) {
				items = [ page, note ].concat(items);
			} else {
				items = [ note, page ].concat(items);
			};
		};
		return items;
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

	// Check if there are at least 1 template for object types
	checkTemplateCnt (ids: string[], callBack?: (cnt: number) => void) {
		this.checkObjectWithRelationCnt('targetObjectType', Constant.typeId.template, ids, 1, (message: any) => {
			if (callBack) {
				callBack(message.records.length);
			};
		});
	};

	checkBlankTemplate (template: any) {
		return template && (template.id != Constant.templateId.blank) ? template : null;
	};

	// Check if there is at least 1 set for object types
	checkSetCnt (ids: string[], callBack?: (message: any) => void) {
		this.checkObjectWithRelationCnt('setOf', Constant.typeId.set, ids, 2, callBack);
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
		const { config, workspace } = commonStore;

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
			ignoreHidden: false,
			ignoreDeleted: false,
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

		if (!ignoreWorkspace && workspace) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace });
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

		keys.push(idField);

		C.ObjectSearchSubscribe(subId, filters, sorts, keys, sources, offset, limit, ignoreWorkspace, afterId, beforeId, noDeps, collectionId, (message: any) => {
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

		let { subId, ids, keys, noDeps } = param;

		ids = UtilCommon.arrayUnique(ids.filter(it => it));

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
		const { config, workspace } = commonStore;

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

		if (!ignoreWorkspace && workspace) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace });
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

		C.ObjectSearch(filters, sorts, keys.concat([ idField ]), UtilCommon.regexEscape(param.fullText), offset, limit, callBack);
	};

	setWindowTitle (rootId: string, objectId: string) {
		this.setWindowTitleText(UtilObject.name(detailStore.get(rootId, objectId, [])));
	};

	setWindowTitleText (name: string) {
		const space = UtilObject.getSpace();
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
		const { workspace } = commonStore;
		const skipTypes = UtilObject.getFileTypes().concat(UtilObject.getSystemTypes());
		const skipIds = [ '_anytype_profile' ];

		return [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.NotEqual, value: true },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds },
			{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace },
		];
	};

};

export default new UtilData();