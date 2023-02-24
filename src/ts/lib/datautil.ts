import { I, C, keyboard, crumbs, translate, Util, Storage, analytics, dispatcher, Mark } from 'Lib';
import { commonStore, blockStore, detailStore, dbStore, authStore } from 'Store';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

class DataUtil {

	blockTextClass (v: I.TextStyle): string {
		return Util.toCamelCase('text-' + String(I.TextStyle[v] || 'paragraph'));
	};
	
	blockDivClass (v: I.DivStyle): string {
		return Util.toCamelCase('div-' + String(I.DivStyle[v]));
	};

	blockLayoutClass (v: I.LayoutStyle): string {
		return Util.toCamelCase('layout-' + String(I.LayoutStyle[v]));
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

	blockClass (block: any, isDragging?: boolean) {
		const { content } = block;
		const { style, type, state } = content;
		const dc = Util.toCamelCase('block-' + block.type);

		let c = [];
		if (block.type == I.BlockType.File) {
			if (state == I.FileState.Done) {
				c.push('withFile');
			};

			if (isDragging || (style == I.FileStyle.Link) || (type == I.FileType.File)) {
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
			default: c = Util.toCamelCase('is-' + I.ObjectLayout[layout]); break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
		};
		return c;
	};

	linkCardClass (v: I.LinkCardStyle): string {
		let c = '';
		switch (v) {
			default:
			case I.LinkCardStyle.Text:		 c = 'text'; break;
			case I.LinkCardStyle.Card:		 c = 'card'; break;
		};
		return c;
	};

	cardSizeClass (v: I.CardSize) {
		let c = '';
		switch (v) {
			default:
			case I.CardSize.Small:		 c = 'small'; break;
			case I.CardSize.Medium:		 c = 'medium'; break;
			case I.CardSize.Large:		 c = 'large'; break;
		};
		return c;
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
		return [
			{ type: I.CoverType.Color, id: 'yellow' },
			{ type: I.CoverType.Color, id: 'orange' },
			{ type: I.CoverType.Color, id: 'red' },
			{ type: I.CoverType.Color, id: 'pink' },
			{ type: I.CoverType.Color, id: 'purple' },
			{ type: I.CoverType.Color, id: 'blue' },
			{ type: I.CoverType.Color, id: 'ice' },
			{ type: I.CoverType.Color, id: 'teal' },
			{ type: I.CoverType.Color, id: 'green' },
			{ type: I.CoverType.Color, id: 'lightgrey' },
			{ type: I.CoverType.Color, id: 'darkgrey' },
			{ type: I.CoverType.Color, id: 'black' },
		].map((it: any) => {
			it.name = translate('textColor-' + it.id);
			return it;
		});
	};

	coverGradients () {
		return [
			{ type: I.CoverType.Gradient, id: 'pinkOrange' },
			{ type: I.CoverType.Gradient, id: 'bluePink' },
			{ type: I.CoverType.Gradient, id: 'greenOrange' },
			{ type: I.CoverType.Gradient, id: 'sky' },
			{ type: I.CoverType.Gradient, id: 'yellow' },
			{ type: I.CoverType.Gradient, id: 'red' },
			{ type: I.CoverType.Gradient, id: 'blue' },
			{ type: I.CoverType.Gradient, id: 'teal' },
		].map((it: any) => {
			it.name = translate('gradientColor-' + it.id);
			return it;
		});
	};

	threadColor (s: I.ThreadStatus) {
		let c = '';
		switch (s) {
			case I.ThreadStatus.Failed:
			case I.ThreadStatus.Disabled:
			case I.ThreadStatus.Offline: c = 'red'; break;
			case I.ThreadStatus.Syncing: c = 'orange'; break;
			case I.ThreadStatus.Synced: c = 'green'; break;
		};
		return c;
	};
	
	alignIcon (v: I.BlockHAlign): string {
		let icon = '';
		switch (v) {
			default:
			case I.BlockHAlign.Left:		 icon = 'left'; break;
			case I.BlockHAlign.Center:	 icon = 'center'; break;
			case I.BlockHAlign.Right:	 icon = 'right'; break;
		};
		return icon;
	};
	
	selectionGet (id: string, withChildren: boolean, props: any): string[] {
		const { dataset } = props;
		const { selection } = dataset || {};
		
		if (!selection) {
			return [];
		};
		
		let ids: string[] = selection.get(I.SelectType.Block, withChildren);
		if (id && ids.indexOf(id) < 0) {
			selection.clear();
			selection.set(I.SelectType.Block, [ id ]);
			ids = selection.get(I.SelectType.Block, withChildren);
		};
		return ids;
	};
	
	onAuth (account: I.Account, callBack?: () => void) {
		if (!account) {
			console.error('[onAuth] No account defined');
			return;
		};

		commonStore.infoSet(account.info);
		commonStore.configSet(account.config, false);
		authStore.accountSet(account);

		const pin = Storage.get('pin');
		const { root, profile } = blockStore;

		if (!root) {
			console.error('[onAuth] No root defined');
			return;
		};

		if (!profile) {
			console.error('[onAuth] No profile defined');
			return;
		};

		crumbs.init();
		keyboard.initPinCheck();

		analytics.profile(account);
		analytics.event('OpenAccount');

		const subscriptions = [
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
			}
		];

		let cnt = 0;
		let cb = (item: any) => {
			if (item.onSubscribe) {
				item.onSubscribe();
			};

			cnt++;

			if (cnt == subscriptions.length) {
				commonStore.defaultTypeSet(commonStore.type);

				if (pin && !keyboard.isPinChecked) {
					Util.route('/auth/pin-check');
				} else {
					Util.route(commonStore.redirect ? commonStore.redirect : '/main/index', true);
					commonStore.redirectSet('');
				};

				if (callBack) {
					callBack();
				};
			};
		};

		C.ObjectOpen(root, '', (message: any) => {
			if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
				Util.onErrorUpdate();
				return;
			};

			const object = detailStore.get(root, root);
			if (object._empty_) {
				console.error('Dashboard is empty');
				return;
			};

			if (object.coverId && (object.coverType != I.CoverType.None)) {
				commonStore.coverSet(object.coverId, object.coverId, object.coverType);
			};

			for (let item of subscriptions) {
				this.searchSubscribe(item, () => { cb(item); });
			};

			if (profile) {
				this.subscribeIds({
					subId: Constant.subId.profile, 
					ids: [ profile ], 
				});
			};
		});
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
		const text = Util.stringInsert(block.content.text, needle, from, to);
		const marks = Mark.adjust(block.content.marks, 0, diff);

		this.blockSetText(rootId, blockId, text, marks, true, callBack);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withBookmark, withCollection, withDefault } = param || {};
		const { workspace, config } = commonStore;
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
			Constant.typeId.task,
			Constant.typeId.bookmark,
		];
	
		let items: any[] = [];

		if (!withDefault) {
			items = items.concat(dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).filter((it: any) => {
				if (skip.includes(it.id) || it.workspaceId != workspace) {
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

		const object = detailStore.get(rootId, blockId, [ 'creator', 'layoutAlign', 'templateIsBundled', 'recommendedRelations' ].concat(Constant.coverRelationKeys));
		const childrenIds = blockStore.getChildrenIds(rootId, blockId);
		const checkType = blockStore.checkBlockTypeExists(rootId);
		const { iconEmoji, iconImage, coverType, coverId, type } = object;
		const ret: any = {
			object: object,
			withCover: Boolean((coverType != I.CoverType.None) && coverId),
			withIcon: false,
			className: [ this.layoutClass(object.id, object.layout), 'align' + object.layoutAlign ],
		};

		switch (object.layout) {
			default:
			case I.ObjectLayout.Page:
				ret.withIcon = iconEmoji || iconImage;
				break;

			case I.ObjectLayout.Human:
				ret.withIcon = true;
				break;

			case I.ObjectLayout.Bookmark:
			case I.ObjectLayout.Task:
				break;

			case I.ObjectLayout.Set:
				ret.withIcon = iconEmoji || iconImage;
				break;

			case I.ObjectLayout.Image:
				ret.withIcon = true;
				break;

			case I.ObjectLayout.File:
				ret.withIcon = true;
				break;

			case I.ObjectLayout.Type:
				ret.withIcon = true;
				break;

			case I.ObjectLayout.Relation:
				ret.withIcon = true;
				break;
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

	// Check if there are at least 2 templates for object types
	checkTemplateCnt (ids: string[], callBack?: (message: any) => void) {
		this.checkObjectWithRelationCnt('targetObjectType', Constant.typeId.template, ids, 2, callBack);
	};

	// Check if there is at least 1 set for object types
	checkSetCnt (ids: string[], callBack?: (message: any) => void) {
		this.checkObjectWithRelationCnt('setOf', Constant.typeId.set, ids, 2, callBack);
	};

	defaultName (key: string) {
		return translate(Util.toCamelCase('defaultName-' + key));
	};

	fileName (object: any) {
		return object.name + (object.fileExt ? `.${object.fileExt}` : '');
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

		content = Util.objectCopy(content);
		content.iconSize = Number(content.iconSize) || I.LinkIconSize.None;
		content.cardStyle = Number(content.cardStyle) || I.LinkCardStyle.Text;
		content.relations = (content.relations || []).filter(it => relationKeys.includes(it));

		if (content.cardStyle == I.LinkCardStyle.Text) {
			content.iconSize = I.LinkIconSize.Small;
		};

		if (layout == I.ObjectLayout.Task) {
			content.iconSize = I.LinkIconSize.Small;
		};

		if (layout == I.ObjectLayout.Note) {
			const filter = [ 'type' ];

			content.description = I.LinkDescription.None;
			content.iconSize = I.LinkIconSize.None;
			content.relations = content.relations.filter(it => filter.includes(it)); 
		};

		content.relations = Util.arrayUnique(content.relations);
		return content;
	};

	coverIsImage (type: I.CoverType) {
		return [ I.CoverType.Upload, I.CoverType.Image, I.CoverType.Source ].includes(type);
	};

	isFileType (type: string) {
		return this.getFileTypes().includes(type);
	};

	getFileTypes () {
		return [
			Constant.typeId.file, 
			Constant.typeId.image, 
			Constant.typeId.audio, 
			Constant.typeId.video,
		];
	};

	getSystemTypes () {
		return [
			Constant.typeId.type,
			Constant.typeId.template,
			Constant.typeId.relation,
			Constant.typeId.option,
			Constant.typeId.dashboard,
		];
	};

	onSubscribe (subId: string, idField: string, keys: string[], message: any) {
		if (message.error.code) {
			return;
		};
		if (message.counters) {
			dbStore.metaSet(subId, '', { total: message.counters.total, keys });
		};

		let details = [];
		let mapper = (it: any) => { 
			keys.forEach((k: string) => { it[k] = it[k] || ''; });
			return { id: it[idField], details: it }; 
		};

		details = details.concat(message.dependencies.map(mapper));
		details = details.concat(message.records.map(mapper));

		detailStore.set(subId, details);
		dbStore.recordsSet(subId, '', message.records.map(it => it[idField]).filter(it => it));
	};

	searchSubscribe (param: any, callBack?: (message: any) => void) {
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
			console.error('[DataUtil].searchSubscribe: subId is empty');
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
		}, param);

		let { subId, ids, keys } = param;

		ids = Util.arrayUnique(ids.filter(it => it));

		if (!subId) {
			console.error('[DataUtil].subscribeIds: subId is empty');
			return;
		};
		if (!ids.length) {
			console.error('[DataUtil].subscribeIds: ids list is empty');
			return;
		};

		C.ObjectSubscribeIds(subId, ids, keys, true, (message: any) => {
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

	search (param: any, callBack?: (message: any) => void) {
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

		C.ObjectSearch(filters, sorts, keys.concat([ idField ]), Util.filterFix(param.fullText).replace(/\\/g, ''), offset, limit, callBack);
	};

	dataviewGroupUpdate (rootId: string, blockId: string, viewId: string, groups: any[]) {
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const el = block.content.groupOrder.find(it => it.viewId == viewId);
		if (el) {
			el.groups = groups;
		};

		blockStore.updateContent(rootId, blockId, block.content);
	};

	getObjectName (object: any) {
		const { isDeleted, type, layout, snippet } = object;

		let name = '';
		if (!isDeleted && this.isFileType(type)) {
			name = this.fileName(object);
		} else
		if (layout == I.ObjectLayout.Note) {
			name = snippet || translate('commonEmpty');
		} else {
			name = object.name || this.defaultName('page');
		};

		return name;
	}

	getObjectById (id: string, callBack: (object: any) => void) {
		this.getObjectsByIds([ id ], (objects) => {
			if (callBack) {
				callBack(objects[0]);
			};
		});
	};

	getObjectsByIds (ids: string[], callBack: (objects: any[]) => void) {
		const filters = [
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: ids }
		];

		C.ObjectSearch(filters, [], [], '', 0, 0, (message: any) => {
			if (message.error.code || !message.records.length) {
				return;
			};

			if (callBack) {
				const records = message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_);
				callBack(records);
			};
		});
	};

	setWindowTitle (rootId: string) {
		const object = detailStore.get(rootId, rootId, []);
		const name = this.getObjectName(object);

		this.setWindowTitleText(name);
	};

	setWindowTitleText (name: string) {
		document.title = [ Util.shorten(name, 60), Constant.appName ].join(' - ');
	};

	graphFilters () {
		const { workspace } = commonStore;
		const skipTypes = [ Constant.typeId.space ].concat(this.getFileTypes()).concat(this.getSystemTypes());
		const skipIds = [ '_anytype_profile', blockStore.profile ];

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

export default new DataUtil();