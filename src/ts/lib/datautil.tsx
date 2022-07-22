import { I, C, M, keyboard, crumbs, translate, Util, history as historyPopup, Storage, analytics, Relation, dispatcher, Renderer } from 'ts/lib';
import { commonStore, blockStore, detailStore, dbStore, popupStore, authStore } from 'ts/store';

const Constant = require('json/constant.json');
const Errors = require('json/error.json');

class DataUtil {

	map (list: any[], field: string): any {
		list = list|| [] as any[];
		
		let map = {} as any;
		for (let item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};
	
	unique (list: any[], field: string) {
		list = list|| [] as any[];
		
		let map = {} as any;
		for (let item of list) {
			map[item[field]] = item;
		};
		return map;
	};
	
	unmap (map: any) {
		let ret: any[] = [] as any[];
		for (let field in map) {
			ret = ret.concat(map[field]);
		};
		return ret;
	};

	textClass (v: I.TextStyle): string {
		return String(I.TextStyle[v] || 'paragraph').toLowerCase();
	};
	
	styleIcon (type: I.BlockType, v: number): string {
		let icon = '';
		switch (type) {
			case I.BlockType.Text:
				switch (v) {
					default:					 icon = this.textClass(v); break;
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

		let c = [];
		switch (block.type) {
			case I.BlockType.Text:					 c.push('blockText ' + this.textClass(style)); break;
			case I.BlockType.Layout:				 c.push('blockLayout c' + style); break;
			case I.BlockType.IconPage:				 c.push('blockIconPage'); break;
			case I.BlockType.IconUser:				 c.push('blockIconUser'); break;
			case I.BlockType.Bookmark:				 c.push('blockBookmark'); break;
			case I.BlockType.Dataview:				 c.push('blockDataview'); break;
			case I.BlockType.Div:					 c.push('blockDiv c' + style); break;
			case I.BlockType.Link:					 c.push('blockLink'); break;
			case I.BlockType.Cover:					 c.push('blockCover'); break;
			case I.BlockType.Relation:				 c.push('blockRelation'); break;
			case I.BlockType.Featured:				 c.push('blockFeatured'); break;
			case I.BlockType.Type:					 c.push('blockType'); break;
			case I.BlockType.Latex:					 c.push('blockLatex'); break;
			case I.BlockType.Table:					 c.push('blockTable'); break;
			case I.BlockType.TableOfContents:		 c.push('blockTableOfContents'); break;

			case I.BlockType.File:
				if (state == I.FileState.Done) {
					c.push('withFile');
				};

				if (isDragging || (style == I.FileStyle.Link)) {
					c.push('blockFile');
					break;
				};

				switch (type) {
					default: 
					case I.FileType.File: 
						c.push('blockFile');
						break;
					case I.FileType.Image: 
						c.push('blockMedia isImage');
						break;
					case I.FileType.Video: 
						c.push('blockMedia isVideo');
						break;
					case I.FileType.Audio: 
						c.push('blockMedia isAudio');
						break;
					case I.FileType.Pdf: 
						c.push('blockMedia isPdf');
						break;
				};
				break;
		};

		return c.join(' ');
	};

	layoutClass (id: string, layout: I.ObjectLayout) {
		let c = '';
		switch (layout) {
			default:
			case I.ObjectLayout.Page:		 c = 'isPage'; break;
			case I.ObjectLayout.Human:		 c = 'isHuman'; break;
			case I.ObjectLayout.Task:		 c = 'isTask'; break;
			case I.ObjectLayout.Type:		 c = 'isObjectType'; break;
			case I.ObjectLayout.Relation:	 c = 'isRelation'; break;
			case I.ObjectLayout.Set:		 c = 'isSet'; break;
			case I.ObjectLayout.Image:		 c = (id ? 'isImage' : 'isFile'); break;
			case I.ObjectLayout.File:		 c = 'isFile'; break;
			case I.ObjectLayout.Note:		 c = 'isNote'; break;
			case I.ObjectLayout.Bookmark:	 c = 'isBookmark'; break;
		};
		return c;
	};

	relationTypeName (v: I.RelationType): string {
		return Util.toCamelCase(I.RelationType[v]);
	};

	relationClass (v: I.RelationType): string {
		let c = this.relationTypeName(v);
		if ([ I.RelationType.Status, I.RelationType.Tag ].indexOf(v) >= 0) {
			c = 'select ' + this.tagClass(v);
		};
		return 'c-' + c;
	};

	tagClass (v: I.RelationType): string {
		let c = '';
		switch (v) {
			case I.RelationType.Status:		 c = 'isStatus'; break;
			case I.RelationType.Tag:		 c = 'isTag'; break;
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
			selection.clear(true);
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
		
		C.ObjectTypeList((message: any) => {
			dbStore.objectTypesSet(message.objectTypes);
		});

		C.ObjectSearchSubscribe(Constant.subIds.deleted, [
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: true }
		], [], [ 'id', 'isDeleted' ], [], 0, 0, true, '', '', true);
		
		if (profile) {
			C.ObjectSubscribeIds(Constant.subIds.profile, [ profile ], Constant.defaultRelationKeys, true);
		};

		C.ObjectOpen(root, '', (message: any) => {
			if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
				Util.onErrorUpdate();
				return;
			};

			const object = detailStore.get(root, root, Constant.coverRelationKeys);

			if (!object._empty_ && object.coverId && (object.coverType != I.CoverType.None)) {
				commonStore.coverSet(object.coverId, object.coverId, object.coverType);
			};

			if (pin) {
				Util.route('/auth/pin-check');
			} else {
				Util.route(commonStore.redirect ? commonStore.redirect : '/main/index', true);
				commonStore.redirectSet('');
			};
			
			if (callBack) {
				callBack();
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

	objectOpenEvent (e: any, object: any, popupParam?: any) {
		e.preventDefault();
		e.stopPropagation();

		if (e.shiftKey || popupStore.isOpen('page')) {
			this.objectOpenPopup(object, popupParam);
		} else
		if ((e.metaKey || e.ctrlKey)) {
			this.objectOpenWindow(object);
		} else {
			this.objectOpenRoute(object);
		};
	};
	
	objectRoute (object: any): string {
		let action = this.actionByLayout(object.layout);
		let id = object.id;

		if ((action == 'edit') && (object.id == blockStore.root)) {
			action = 'index';
			id = '';
		};

		if (!action) {
			return '';
		};

		const route = [ 'main', action ];
		if (id) {
			route.push(id);
		};

		return route.join('/');
	};

	objectOpenRoute (object: any) {
		keyboard.setSource(null);

		const route = this.objectRoute(object);
		if (route) {
			Util.route('/' + route);
		};
	};

	objectOpenPopup (object: any, popupParam?: any) {
		const { root } = blockStore;
		const action = this.actionByLayout(object.layout);

		if ((action == 'edit') && (object.id == root)) {
			this.objectOpenRoute(object);
			return;
		};

		let param: any = Object.assign(popupParam || {}, {});
		param.data = Object.assign(param.data || {}, { 
			matchPopup: { 
				params: {
					page: 'main',
					action: action,
					id: object.id,
				},
			},
		});

		keyboard.setSource(null);
		historyPopup.pushMatch(param.data.matchPopup);
		window.setTimeout(() => { popupStore.open('page', param); }, Constant.delay.popup);
	};

	objectOpenWindow (object: any) {
		const route = this.objectRoute(object);
		if (route) {
			Renderer.send('windowOpen', '/' + route);
		};
	};

	actionByLayout (v: I.ObjectLayout): string {
		v = v || I.ObjectLayout.Page;

		let r = '';
		switch (v) {
			default:						 r = 'edit'; break;
			case I.ObjectLayout.Set:		 r = 'set'; break;
			case I.ObjectLayout.Space:		 r = 'space'; break;
			case I.ObjectLayout.Type:		 r = 'type'; break;
			case I.ObjectLayout.Relation:	 r = 'relation'; break;
			case I.ObjectLayout.File:
			case I.ObjectLayout.Image:		 r = 'media'; break;
			case I.ObjectLayout.Navigation:	 r = 'navigation'; break;
			case I.ObjectLayout.Graph:		 r = 'graph'; break;
			case I.ObjectLayout.Store:		 r = 'store'; break;
			case I.ObjectLayout.History:	 r = 'history'; break;
			case I.ObjectLayout.Bookmark:	 r = 'bookmark'; break;
		};
		return r;
	};
	
	pageCreate (rootId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) {
		details = details || {};

		if (!templateId) {
			details.type = details.type || commonStore.type;
		};
		
		C.BlockLinkCreateWithObject(rootId, targetId, details, position, templateId, fields, flags, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (callBack) {
				callBack(message);
			};
		});
	};
	
	pageSetIcon (rootId: string, emoji: string, image: string, callBack?: (message: any) => void) {
		const details = [ 
			{ key: 'iconEmoji', value: emoji },
			{ key: 'iconImage', value: image },
		];
		C.ObjectSetDetails(rootId, details, callBack);
	};
	
	pageSetName (rootId: string, name: string, callBack?: (message: any) => void) {
		const details = [ 
			{ key: 'name', value: name },
		];
		C.ObjectSetDetails(rootId, details, callBack);
	};
	
	pageSetCover (rootId: string, type: I.CoverType, id: string, x?: number, y?: number, scale?: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;
		scale = Number(scale) || 0;

		const details = [ 
			{ key: 'coverType', value: type },
			{ key: 'coverId', value: id },
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
			{ key: 'coverScale', value: scale },
		];
		C.ObjectSetDetails(rootId, details, callBack);
	};

	pageSetDone (rootId: string, done: boolean, callBack?: (message: any) => void) {
		done = Boolean(done);

		const details = [ 
			{ key: Constant.relationKey.done, value: done },
		];
		C.ObjectSetDetails(rootId, details, callBack);
	};

	pageSetLayout (rootId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) {
		blockStore.update(rootId, { id: rootId, layout: layout });
		C.ObjectSetLayout(rootId, layout, callBack);
	};

	pageSetAlign (rootId: string, align: I.BlockHAlign, callBack?: (message: any) => void) {
		C.BlockListSetAlign(rootId, [], align, callBack);
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

	menuMapperBlock (it: any) {
		it.isBlock = true;
		it.name = it.lang ? translate('blockName' + it.lang) : it.name;
		it.description = it.lang ? translate('blockText' + it.lang) : it.description;
		return it;
	};
	
	menuGetBlockText () {
		const { config } = commonStore;
		const ret: any[] = [
			{ id: I.TextStyle.Paragraph, lang: 'Paragraph' },
			{ id: I.TextStyle.Header1, lang: 'Header1', aliases: [ 'h1', 'head1' ] },
			{ id: I.TextStyle.Header2, lang: 'Header2', aliases: [ 'h2', 'head2' ] },
			{ id: I.TextStyle.Header3, lang: 'Header3', aliases: [ 'h3', 'head3' ] },
			{ id: I.TextStyle.Quote, lang: 'Quote' },
			{ id: I.TextStyle.Callout, lang: 'Callout' },
		];
		
		return ret.map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = this.textClass(it.id);
			return this.menuMapperBlock(it);
		});
	};
	
	menuGetBlockList () {
		return [
			{ id: I.TextStyle.Checkbox, lang: 'Checkbox', aliases: [ 'todo' ] },
			{ id: I.TextStyle.Bulleted, lang: 'Bulleted' },
			{ id: I.TextStyle.Numbered, lang: 'Numbered' },
			{ id: I.TextStyle.Toggle, lang: 'Toggle' },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = this.textClass(it.id);
			return this.menuMapperBlock(it);
		});
	};

	menuGetBlockMedia () {
		const ret: any[] = [
			{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', lang: 'File' },
			{ type: I.BlockType.File, id: I.FileType.Image, icon: 'image', lang: 'Image' },
			{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', lang: 'Video' },
			{ type: I.BlockType.File, id: I.FileType.Audio, icon: 'audio', lang: 'Audio' },
			{ type: I.BlockType.File, id: I.FileType.Pdf, icon: 'pdf', lang: 'Pdf' },
			{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', lang: 'Bookmark' },
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', lang: 'Code' },
			{ type: I.BlockType.Latex, id: I.BlockType.Latex, icon: 'latex', lang: 'Latex' },
		];
		return ret.map(this.menuMapperBlock);
	};

	getObjectTypesForNewObject (param?: any) {
		const { withSet, withBookmark } = param || {};
		const { config } = commonStore;
		const skip = [ 
			Constant.typeId.note, 
			Constant.typeId.page, 
			Constant.typeId.set, 
			Constant.typeId.task,
			Constant.typeId.bookmark,
		];

		let items = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).filter((it: any) => {
			return skip.indexOf(it.id) < 0;
		});
		if (!config.debug.ho) {
			items = items.filter((it: I.ObjectType) => { return !it.isHidden; })
		};
		let page = dbStore.getObjectType(Constant.typeId.page);
		let note = dbStore.getObjectType(Constant.typeId.note);
		let set = dbStore.getObjectType(Constant.typeId.set);
		let task = dbStore.getObjectType(Constant.typeId.task);
		let bookmark = dbStore.getObjectType(Constant.typeId.bookmark);

		if (withBookmark && bookmark) {
			items.unshift(bookmark);
		};

		items.sort(this.sortByName);

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

	menuGetBlockObject () {
		let ret: any[] = [
			{ type: I.BlockType.Page, id: 'existing', icon: 'existing', lang: 'Existing', arrow: true },
		];
		let i = 0;
		let items = this.getObjectTypesForNewObject({ withSet: true });

		for (let type of items) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: 'object' + i++, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || this.defaultName('page'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.menuMapperBlock);
	};

	menuGetBlockOther () {
		const ret: any[] = [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
			{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents, icon: 'tableOfContents', lang: 'TableOfContents', aliases: [ 'tc', 'toc' ] },
			{ type: I.BlockType.Table, id: I.BlockType.Table, icon: 'table', lang: 'SimpleTable' }
		];
		return ret.map(this.menuMapperBlock);
	};

	menuGetBlockDataview () {
		return [
			{ id: I.ViewType.Grid, icon: '', lang: 'Table' },
			{ id: I.ViewType.Gallery, icon: '', lang: 'Gallery' },
			{ id: I.ViewType.List, icon: '', lang: 'List' },
		].map((it: any) => {
			it.type = I.BlockType.Dataview;
			return this.menuMapperBlock(it);
		});
	};

	menuGetTurnPage () {
		const { config } = commonStore;
		const ret = [];

		let objectTypes = dbStore.objectTypes;
		if (!config.debug.ho) {
			objectTypes = objectTypes.filter((it: I.ObjectType) => { return !it.isHidden; });
		};
		objectTypes.sort(this.sortByName);

		let i = 0;
		for (let type of objectTypes) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: 'object' + i++, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || this.defaultName('page'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.menuMapperBlock);
	};
	
	menuGetTurnDiv () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
		].map(this.menuMapperBlock);
	};

	menuGetTurnFile () {
		return [
			{ type: I.BlockType.File, id: I.FileStyle.Link, lang: 'Link' },
			{ type: I.BlockType.File, id: I.FileStyle.Embed, lang: 'Embed' },
		].map(this.menuMapperBlock);
	};

	// Action menu
	menuGetActions (param: any) {
		let { hasText, hasFile, hasLink } = param;
		let cmd = keyboard.ctrlSymbol();
		let items: any[] = [
			{ id: 'move', icon: 'move', name: 'Move to', arrow: true },
			{ id: 'copy', icon: 'copy', name: 'Duplicate', caption: `${cmd} + D` },
			{ id: 'remove', icon: 'remove', name: 'Delete', caption: 'Del' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];

		if (hasText) {
			items.push({ id: 'clear', icon: 'clear', name: 'Clear style' });
		};
		
		if (hasFile) {
			items.push({ id: 'download', icon: 'download', name: 'Download' });
			items.push({ id: 'openFileAsObject', icon: 'expand', name: 'Open as object' });
			//items.push({ id: 'rename', icon: 'rename', name: 'Rename' });
			//items.push({ id: 'replace', icon: 'replace', name: 'Replace' });
		};

		if (hasLink) {
			items.push({ id: 'linkSettings', icon: 'customize', name: 'Appearance', arrow: true });
		};

		items = items.map((it: any) => {
			it.isAction = true;
			return it;
		});
		
		return items;
	};
	
	menuGetTextColors () {
		let items: any[] = [
			{ id: 'color-default', name: 'Default', value: '', className: 'default', isTextColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'color-' + color, name: translate('textColor-' + color), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	menuGetBgColors () {
		let items: any[] = [
			{ id: 'bgColor-default', name: 'Default', value: '', className: 'default', isBgColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'bgColor-' + color, name: translate('textColor-' + color), value: color, className: color, isBgColor: true });
		};
		return items;
	};
	
	menuGetAlign (hasQuote: boolean) {
		let ret = [
			{ id: I.BlockHAlign.Left, icon: 'align left', name: 'Align left', isAlign: true },
			{ id: I.BlockHAlign.Center, icon: 'align center', name: 'Align center', isAlign: true },
			{ id: I.BlockHAlign.Right, icon: 'align right', name: 'Align right', isAlign: true },
		];

		if (hasQuote) {
			ret = ret.filter((it: any) => { return it.id != I.BlockHAlign.Center; });
		};

		return ret;
	};

	menuGetLayouts () {
		return [
			{ id: I.ObjectLayout.Page, icon: 'page' },
			{ id: I.ObjectLayout.Human, icon: 'human' },
			{ id: I.ObjectLayout.Task, icon: 'task' },
			{ id: I.ObjectLayout.Set, icon: 'set' },
			{ id: I.ObjectLayout.File, icon: 'file' },
			{ id: I.ObjectLayout.Image, icon: 'image' },
			{ id: I.ObjectLayout.Type, icon: 'type' },
			{ id: I.ObjectLayout.Relation, icon: 'relation' },
			{ id: I.ObjectLayout.Note, icon: 'note' },
		].map((it: any) => {
			it.icon = 'layout c-' + it.icon;
			it.name = translate('layout' + it.id);
			return it;
		});
	};

	menuTurnLayouts () {
		return this.menuGetLayouts().filter((it: any) => {
			return [ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task, I.ObjectLayout.Note ].indexOf(it.id) >= 0;
		});
	};

	menuGetViews () {
		const { config } = commonStore;
		
		let ret = [
			{ id: I.ViewType.Grid },
			{ id: I.ViewType.Gallery },
			{ id: I.ViewType.List },
		];
		if (config.experimental) {
			ret = ret.concat([
				{ id: I.ViewType.Board },
			]);
		};

		ret = ret.map((it: any) => {
			it.name = translate('viewName' + it.id);
			return it;
		});
		return ret;
	};

	menuGetRelationTypes () {
		return [
			{ id: I.RelationType.Object },
			{ id: I.RelationType.LongText },
			{ id: I.RelationType.Number },
			{ id: I.RelationType.Status },
			{ id: I.RelationType.Tag },
			{ id: I.RelationType.Date },
			{ id: I.RelationType.File },
			{ id: I.RelationType.Checkbox },
			{ id: I.RelationType.Url },
			{ id: I.RelationType.Email },
			{ id: I.RelationType.Phone },
		].map((it: any) => {
			it.name = translate('relationName' + it.id);
			it.icon = 'relation ' + this.relationClass(it.id);
			return it;
		});
	};
	
	menuSectionsFilter (sections: any[], filter: string) {
		const f = Util.filterFix(filter);
		const regS = new RegExp('^' + f, 'gi');
		const regC = new RegExp(f, 'gi');
		const getWeight = (s: string) => {
			let w = 0;
			if (s.toLowerCase() == f.toLowerCase()) {
				w = 10000;
			} else
			if (s.match(regS)) {
				w = 1000;
			} else 
			if (s.match(regC)) {
				w = 100;
			};
			return w;
		};
		
		sections = sections.filter((s: any) => {
			if (s.name.match(regC)) {
				return true;
			};
			s._sortWeight_ = 0;
			s.children = (s.children || []).filter((c: any) => { 

				let ret = false;

				if (c.isBlock && (c.type == I.BlockType.Table)) {
					const match = filter.match(/table([\d]+)(?:[^\d]{1}([\d]+))?/i);
					if (match) {
						c.rowCnt = Math.max(1, Math.min(25, Number(match[1]) || 3));
						c.columnCnt = Math.max(1, Math.min(25, Number(match[2]) || 3));

						c.name += ` ${c.rowCnt}x${c.columnCnt}`;
						ret = true;
					};
				};

				c._sortWeight_ = 0;
				if (c.skipFilter) {
					ret = true;
				} else 
				if (c.name && c.name.match(regC)) {
					ret = true;
					c._sortWeight_ = getWeight(c.name);
				} else 
				if (c.description && c.description.match(regC)) {
					ret = true;
					c._sortWeight_ = getWeight(c.description);
				} else
				if (c.aliases && c.aliases.length) {
					for (let alias of c.aliases) {
						if (alias.match(regC)) {
							ret = true;
							break;
						};
					};
				};
				s._sortWeight_ += c._sortWeight_;
				return ret; 
			});
			s.children = s.children.sort((c1: any, c2: any) => this.sortByWeight(c1, c2));
			return s.children.length > 0;
		});

		sections = sections.sort((c1: any, c2: any) => this.sortByWeight(c1, c2));
		return sections;
	};
	
	menuSectionsMap (sections: any[]) {
		sections = Util.objectCopy(sections);
		sections = sections.filter((it: any) => { return it.children.length > 0; });
		sections = sections.map((s: any, i: number) => {
			s.id = (undefined !== s.id) ? s.id : i;

			s.children = s.children.map((c: any, i: number) => {
				c.id = (undefined !== c.id) ? c.id : i;
				c.itemId = c.id;
				c.id = [ s.id, c.id ].join('-');
				c.color = c.color || s.color || '';
				return c;
			});

			s.children = Util.arrayUniqueObjects(s.children, 'itemId');
			return s;
		});
		sections = Util.arrayUniqueObjects(sections, 'id');
		return sections;
	};
	
	viewGetRelations (rootId: string, blockId: string, view: I.View): I.ViewRelation[] {
		const { config } = commonStore;

		if (!view) {
			return [];
		};

		let relations = Util.objectCopy(dbStore.getRelations(rootId, blockId));
		let order: any = {};
		let o = 0;

		if (!config.debug.ho) {
			relations = relations.filter((it: I.Relation) => { 
				if ([ Constant.relationKey.name ].indexOf(it.relationKey) >= 0) {
					return true;
				};
				return !it.isHidden; 
			});
		};

		for (let i = 0; i < view.relations.length; ++i) {
			order[view.relations[i].relationKey] = o++;
		};

		for (let i = 0; i < relations.length; ++i) {
			if (undefined === order[relations[i].relationKey]) {
				order[relations[i].relationKey] = o++;
			};
		};

		relations.sort((c1: any, c2: any) => {
			let o1 = order[c1.relationKey];
			let o2 = order[c2.relationKey];
			if (o1 > o2) return 1;
			if (o1 < o2) return -1;
			return 0;
		});

		let ret = relations.map((relation: any) => {
			const vr = view.relations.find((it: I.Relation) => { return it.relationKey == relation.relationKey; }) || {};
			
			if ([ Constant.relationKey.name ].indexOf(relation.relationKey) >= 0) {
				vr.isVisible = true;
			};

			return new M.ViewRelation({
				...vr,
				relationKey: relation.relationKey,
				width: Relation.width(vr.width, relation.format),
			});
		});

		return Util.arrayUniqueObjects(ret, 'relationKey');
	};

	dataviewRelationAdd (rootId: string, blockId: string, relation: any, index: number, view?: I.View, callBack?: (message: any) => void) {
		relation = new M.Relation(relation);

		C.BlockDataviewRelationAdd(rootId, blockId, relation, (message: any) => {
			if (message.error.code || !view) {
				return;
			};

			let rel = view.getRelation(message.relationKey);
			if (rel) {
				rel.isVisible = true;
			} else {
				relation.relationKey = message.relationKey;
				relation.isVisible = true;
				relation.width = Relation.width(0, relation.format);

				if (index >= 0) {
					view.relations.splice(index, 0, relation);
				} else {
					view.relations.push(relation);
				};
			};

			if (callBack) {
				callBack(message);
			};

			C.BlockDataviewViewUpdate(rootId, blockId, view.id, view);
		});
	};

	dataviewRelationUpdate (rootId: string, blockId: string, relation: any, view?: I.View, callBack?: (message: any) => void) {
		C.BlockDataviewRelationUpdate(rootId, blockId, relation.relationKey, new M.Relation(relation), (message: any) => {
			if (message.error.code || !view) {
				return;
			};
			
			if (callBack) {
				callBack(message);
			};
		});
	};

	dataviewRelationDelete (rootId: string, blockId: string, relationKey: string, view?: I.View, callBack?: (message: any) => void) {
		C.BlockDataviewRelationDelete(rootId, blockId, relationKey, (message: any) => {
			if (message.error.code || !view) {
				return;
			};
			
			if (callBack) {
				callBack(message);
			};

			view.relations = view.relations.filter((it: I.ViewRelation) => { return it.relationKey != relationKey; });
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, view);
		});
	};

	checkDetails (rootId: string, blockId?: string) {
		blockId = blockId || rootId;

		const object = detailStore.get(rootId, blockId, [ 'creator', 'layoutAlign', 'templateIsBundled' ].concat(Constant.coverRelationKeys));
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

		if ((object[Constant.relationKey.featured] || []).indexOf(Constant.relationKey.description) >= 0) {
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
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];

		C.ObjectSearch(filters, [], [], '', 0, limit, (message: any) => {
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
			cardStyle: I.LinkCardStyle.Card,
			description: I.LinkDescription.Content,
			relations: [ 'cover' ],
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
			content.description = I.LinkDescription.None;
			content.relations = [];
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

	getDataviewData (rootId: string, blockId: string, id: string, keys: string[], offset: number, limit: number, clear: boolean, callBack?: (message: any) => void) {
		const view = dbStore.getView(rootId, blockId, id);
		if (!view) {
			return;
		};

		const subId = dbStore.getSubId(rootId, blockId);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = id != viewId;
		const meta: any = { offset: offset };
		const block = blockStore.getLeaf(rootId, blockId);
		const filters = view.filters.concat([
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
		]);

		if (viewChange) {
			meta.viewId = id;
		};
		if (viewChange || clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', meta);
		C.ObjectSearchSubscribe(subId, filters, view.sorts, keys, block.content.sources, offset, limit, true, '', '', false);
	};

	coverIsImage (type: I.CoverType) {
		return [ I.CoverType.Upload, I.CoverType.Image, I.CoverType.Source ].includes(type);
	};

	isFileType (type: string) {
		return [ 
			Constant.typeId.file, 
			Constant.typeId.image, 
			Constant.typeId.audio, 
			Constant.typeId.video,
		].includes(type);
	};

};

export default new DataUtil();