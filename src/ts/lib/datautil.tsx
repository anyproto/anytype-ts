import { I, C, M, keyboard, crumbs, translate, Util } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';

const Constant = require('json/constant.json');
const Errors = require('json/error.json');

class DataUtil {

	history: any = null;

	init (history: any) {
		this.history = history;
	};
	
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
	
	styleIcon (type: I.BlockType, v: number): string {
		let icon = '';
		switch (type) {
			case I.BlockType.Text:
				switch (v) {
					default:
					case I.TextStyle.Paragraph:	 icon = 'text'; break;
					case I.TextStyle.Header1:	 icon = 'header1'; break;
					case I.TextStyle.Header2:	 icon = 'header2'; break;
					case I.TextStyle.Header3:	 icon = 'header3'; break;
					case I.TextStyle.Quote:		 icon = 'quote'; break;
					case I.TextStyle.Code:		 icon = 'kbd'; break;
					case I.TextStyle.Bulleted:	 icon = 'list'; break;
					case I.TextStyle.Numbered:	 icon = 'numbered'; break;
					case I.TextStyle.Toggle:	 icon = 'toggle'; break;
					case I.TextStyle.Checkbox:	 icon = 'checkbox'; break;
				};
				break;
				
			case I.BlockType.Div:
				switch (v) {
					default:
					case I.DivStyle.Line:		 icon = 'line'; break;
					case I.DivStyle.Dot:		 icon = 'dot'; break;
				};
				break;
		};
		return icon;
	};
	
	styleClassText (v: I.TextStyle): string {
		let c = '';
		switch (v) {
			default:
			case I.TextStyle.Title:		 c = 'title'; break;
			case I.TextStyle.Paragraph:	 c = 'paragraph'; break;
			case I.TextStyle.Header1:	 c = 'header1'; break;
			case I.TextStyle.Header2:	 c = 'header2'; break;
			case I.TextStyle.Header3:	 c = 'header3'; break;
			case I.TextStyle.Quote:		 c = 'quote'; break;
			case I.TextStyle.Code:		 c = 'code'; break;
			case I.TextStyle.Bulleted:	 c = 'bulleted'; break;
			case I.TextStyle.Numbered:	 c = 'numbered'; break;
			case I.TextStyle.Toggle:	 c = 'toggle'; break;
			case I.TextStyle.Checkbox:	 c = 'checkbox'; break;
		};
		return c;
	};

	relationClass (v: I.RelationType): string {
		let c = '';
		switch (v) {
			default:
			case I.RelationType.LongText:	 c = 'longText'; break;
			case I.RelationType.ShortText:	 c = 'shortText'; break;
			case I.RelationType.Number:		 c = 'number'; break;
			case I.RelationType.Date:		 c = 'date'; break;
			case I.RelationType.Status:		 c = 'select isStatus'; break;
			case I.RelationType.Tag:		 c = 'select isTag'; break;
			case I.RelationType.File:		 c = 'file'; break;
			case I.RelationType.Checkbox:	 c = 'checkbox'; break;
			case I.RelationType.Url:		 c = 'url'; break;
			case I.RelationType.Email:		 c = 'email'; break;
			case I.RelationType.Phone:		 c = 'phone'; break;
			case I.RelationType.Object:		 c = 'object'; break;
		};
		return 'c-' + c;
	};

	tagClass (v: I.RelationType): string {
		let c = '';
		switch (v) {
			default:
			case I.RelationType.Status:		 c = 'isStatus'; break;
			case I.RelationType.Tag:		 c = 'isTag'; break;
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
		];
	};

	threadColor (s: I.ThreadStatus) {
		let c = '';
		switch (s) {
			case I.ThreadStatus.Failed:
			case I.ThreadStatus.Offline: c = 'red'; break;
			case I.ThreadStatus.Syncing: c = 'orange'; break;
			case I.ThreadStatus.Synced: c = 'green'; break;
		};
		return c;
	};
	
	alignIcon (v: I.BlockAlign): string {
		let icon = '';
		switch (v) {
			default:
			case I.BlockAlign.Left:		 icon = 'left'; break;
			case I.BlockAlign.Center:	 icon = 'center'; break;
			case I.BlockAlign.Right:	 icon = 'right'; break;
		};
		return icon;
	};
	
	selectionGet (id: string, withChildren: boolean, props: any): string[] {
		const { dataset } = props;
		const { selection } = dataset || {};
		
		if (!selection) {
			return [];
		};
		
		let ids: string[] = selection.get(withChildren);
		if (id && ids.indexOf(id) < 0) {
			selection.clear(true);
			selection.set([ id ]);
			ids = selection.get(withChildren);
		};
		return ids;
	};
	
	pageInit (callBack?: () => void) {
		C.ConfigGet((message: any) => {
			const root = message.homeBlockId;
			const profile = message.profileBlockId;
			
			if (!root) {
				console.error('[pageInit] No root defined');
				return;
			};

			commonStore.gatewaySet(message.gatewayUrl);
			
			blockStore.rootSet(root);
			blockStore.archiveSet(message.archiveBlockId);
			blockStore.storeSetType(message.marketplaceTypeId);
			blockStore.storeSetRelation(message.marketplaceRelationId);

			C.ObjectTypeList((message: any) => {
				dbStore.objectTypesSet(message.objectTypes);
			});
			
			if (profile) {
				C.BlockOpen(profile, (message: any) => {
					if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
						Util.onErrorUpdate();
						return;
					};

					blockStore.profileSet(profile);
				});
			};

			crumbs.init();

			C.BlockOpen(root, (message: any) => {
				if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
					Util.onErrorUpdate();
					return;
				};
				if (callBack) {
					callBack();
				};
			});
		});
	};

	onAuth () {
		this.pageInit(() => {
			keyboard.initPinCheck();
			this.history.push('/main/index');
		});
	};

	objectOpenEvent (e: any, object: any) {
		if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
			this.objectOpenPopup(object);
		} else {
			this.objectOpen(object);
		};
	};
	
	objectOpen (object: any) {
		const { root } = blockStore;

		switch (object.layout) {
			default:
				this.history.push(object.id == root ? '/main/index' : '/main/edit/' + object.id);
				break;

			case I.ObjectLayout.ObjectType:
				this.history.push('/main/type/' + object.id);
				break;

			case I.ObjectLayout.Relation:
				this.history.push('/main/relation/' + object.id);
				break;
		};
	};

	objectOpenPopup (object: any) {
		let param: any = { data: { rootId: object.id } };
		let popupId = '';

		switch (object.layout) {
			default:
				popupId = 'editorPage';
				break;

			case I.ObjectLayout.ObjectType:
			case I.ObjectLayout.Relation:
				popupId = 'page';
				break;
		};

		if (commonStore.popupIsOpen(popupId)) {
			commonStore.popupUpdate(popupId, param);
		} else {
			window.setTimeout(() => { commonStore.popupOpen(popupId, param); }, Constant.delay.popup);
		};
	};
	
	pageCreate (e: any, rootId: string, targetId: string, details: any, position: I.BlockPosition, callBack?: (message: any) => void) {
		details = details || {};
		
		if (e && e.persist) {
			e.persist();
		};
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });
		
		C.BlockCreatePage(rootId, targetId, details, position, (message: any) => {
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			
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

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};
	
	pageSetName (rootId: string, name: string, callBack?: (message: any) => void) {
		const details = [ 
			{ key: 'name', value: name },
		];

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};
	
	pageSetCover (rootId: string, type: I.CoverType, coverId: string, x?: number, y?: number, scale?: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;
		scale = Number(scale) || 0;

		const details = [ 
			{ key: 'coverType', value: type },
			{ key: 'coverId', value: coverId },
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
			{ key: 'coverScale', value: scale },
		];

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};

	pageSetCoverXY (rootId: string, x: number, y: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;

		const details = [ 
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
		];
		
		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};

	pageSetCoverScale (rootId: string, scale: number, callBack?: (message: any) => void) {
		scale = Number(scale) || 0;

		const details = [ 
			{ key: 'coverScale', value: scale },
		];
		
		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};

	pageSetDone (rootId: string, done: boolean, callBack?: (message: any) => void) {
		done = Boolean(done);

		const details = [ 
			{ key: 'done', value: done },
		];
		
		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};
	
	pageSetLayout (rootId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) {
		blockStore.blockUpdate(rootId, { id: rootId, layout: layout });

		const details = [
			{ key: 'layout', value: layout },
		];

		blockStore.detailsUpdateArray(rootId, rootId, details);
		C.BlockSetDetails(rootId, details, callBack);
	};

	blockSetText (rootId: string, block: I.Block, text: string, marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		if (!block) {
			return;
		};
		
		if (update) {
			block.content.text = String(text || '');
			block.content.marks = marks || [];
			blockStore.blockUpdate(rootId, block);
		};

		C.BlockSetTextText(rootId, block.id, text, marks, (message: any) => {
			blockStore.setNumbers(rootId);
			
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
		return [
			{ id: I.TextStyle.Paragraph, icon: 'text', lang: 'Paragraph' },
			{ id: I.TextStyle.Header1, icon: 'header1', lang: 'Header1', aliases: [ 'h1', 'head1' ] },
			{ id: I.TextStyle.Header2, icon: 'header2', lang: 'Header2', aliases: [ 'h2', 'head2' ] },
			{ id: I.TextStyle.Header3, icon: 'header3', lang: 'Header3', aliases: [ 'h3', 'head3' ] },
			{ id: I.TextStyle.Quote, icon: 'quote', lang: 'Quote' },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			return this.menuMapperBlock(it);
		});
	};
	
	menuGetBlockList () {
		return [
			{ id: I.TextStyle.Checkbox, icon: 'checkbox', lang: 'Checkbox', aliases: [ 'todo' ] },
			{ id: I.TextStyle.Bulleted, icon: 'list', lang: 'Bulleted' },
			{ id: I.TextStyle.Numbered, icon: 'numbered', lang: 'Numbered' },
			{ id: I.TextStyle.Toggle, icon: 'toggle', lang: 'Toggle' },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			return this.menuMapperBlock(it);
		});
	};

	menuGetBlockObject () {
		const { config } = commonStore;
		const objectTypes = dbStore.objectTypes.filter((it: I.ObjectType) => { return !it.isHidden; });

		let ret: any[] = [
			{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', lang: 'File' },
			{ type: I.BlockType.File, id: I.FileType.Image, icon: 'image', lang: 'Image' },
			{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', lang: 'Video' },
			{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', lang: 'Bookmark' },
		];

		let i = 0;
		if (config.allowDataview) {
			for (let type of objectTypes) {
				ret.push({ 
					type: I.BlockType.Page, 
					id: 'object' + i++, 
					objectTypeId: type.id, 
					iconEmoji: type.iconEmoji, 
					name: type.name || Constant.default.name, 
					description: type.description,
					isObject: true,
				});
			};
		} else {
			ret.push({ type: I.BlockType.Page, id: 'page', icon: 'page', lang: 'Page' });
		};

		ret.push({ type: I.BlockType.Page, id: 'existing', icon: 'existing', lang: 'Existing' });
		return ret.map(this.menuMapperBlock);
	};

	menuGetBlockRelation () {
		return [
			{ type: I.BlockType.Relation, id: 'relation', icon: 'relation default', lang: 'Relation' },
		].map(this.menuMapperBlock);
	};
	
	menuGetBlockOther () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', lang: 'Code' },
		].map(this.menuMapperBlock);
	};

	menuGetTurnPage () {
		return [
			{ type: I.BlockType.Page, id: 'page', icon: 'page', lang: 'Page' }
		].map(this.menuMapperBlock);
	};
	
	menuGetTurnObject() {
		return [
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', lang: 'Code' },
		].map(this.menuMapperBlock);
	};

	menuGetTurnDiv () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
		].map(this.menuMapperBlock);
	};
	
	// Action menu
	menuGetActions (hasFile: boolean) {
		let items: any[] = [
			{ id: 'move', icon: 'move', name: 'Move to' },
			{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];
		
		if (hasFile) {
			items.push({ id: 'download', icon: 'download', name: 'Download' });
			//items.push({ id: 'rename', icon: 'rename', name: 'Rename' });
			//items.push({ id: 'replace', icon: 'replace', name: 'Replace' });
		};
		
		items = items.map((it: any) => {
			it.isAction = true;
			return it;
		});
		
		return items;
	};
	
	menuGetTextColors () {
		let items: any[] = [
			{ id: 'color-black', name: 'Black', value: 'black', className: '', isTextColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'color-' + color, name: translate('textColor-' + color), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	menuGetBgColors () {
		let items: any[] = [
			{ id: 'color-default', name: 'Default', value: '', className: 'default', isBgColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'bgColor-' + color, name: translate('textColor-' + color), value: color, className: color, isBgColor: true });
		};
		return items;
	};
	
	menuGetAlign (hasQuote: boolean) {
		let ret = [
			{ id: I.BlockAlign.Left, icon: 'align left', name: 'Align left', isAlign: true },
			{ id: I.BlockAlign.Center, icon: 'align center', name: 'Align center', isAlign: true },
			{ id: I.BlockAlign.Right, icon: 'align right', name: 'Align right', isAlign: true },
		];

		if (hasQuote) {
			ret = ret.filter((it: any) => { return it.id != I.BlockAlign.Center; });
		};

		return ret;
	};

	menuGetLayouts () {
		return [
			{ id: I.ObjectLayout.Page, icon: 'page', name: 'Page' },
			{ id: I.ObjectLayout.Human, icon: 'human', name: 'Human' },
			{ id: I.ObjectLayout.Task, icon: 'task', name: 'Task' },
			{ id: I.ObjectLayout.Set, icon: 'set', name: 'Set' },
			{ id: I.ObjectLayout.File, icon: 'file', name: 'File' },
			{ id: I.ObjectLayout.Image, icon: 'image', name: 'Image' },
			{ id: I.ObjectLayout.ObjectType, icon: 'type', name: 'Object type' },
			{ id: I.ObjectLayout.Relation, icon: 'relation', name: 'Relation' },
		].map((it: any) => {
			it.icon = 'layout-' + it.icon;
			return it;
		});
	};

	menuTurnLayouts () {
		return this.menuGetLayouts().filter((it: any) => {
			return [ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task ].indexOf(it.id) >= 0;
		});
	};
	
	menuSectionsFilter (sections: any[], filter: string) {
		const reg = new RegExp(Util.filterFix(filter), 'gi');
		
		sections = sections.filter((s: any) => {
			if (s.name.match(reg)) {
				return true;
			};
			s.children = (s.children || []).filter((c: any) => { 
				let ret = false;
				if (c.skipFilter) {
					ret = true;
				} else 
				if (c.name && c.name.match(reg)) {
					ret = true;
				} else 
				if (c.description && c.description.match(reg)) {
					ret = true;
				} else
				if (c.aliases && c.aliases.length) {
					for (let alias of c.aliases) {
						if (alias.match(reg)) {
							ret = true;
							break;
						};
					};
				};
				
				return ret; 
			});
			return s.children.length > 0;
		});
		
		return sections;
	};
	
	menuSectionsMap (sections: any[]) {
		sections = sections.filter((it: any) => { return it.children.length > 0; });
		sections = sections.map((s: any, i: number) => {
			s.id = s.id || i;
			s.children = s.children.map((it: any, i: number) => {
				it.key = it.id || i;
				it.id = s.id + '-' + it.id;
				return it;
			});
			s.children = Util.arrayUniqueObjects(s.children, 'key');
			return s;
		});
		sections = Util.arrayUniqueObjects(sections, 'id');
		return sections;
	};
	
	cellId (prefix: string, relationKey: string, id: any) {
		return [ prefix, relationKey, id.toString() ].join('-');
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
			relations = relations.filter((it: I.Relation) => { return !it.isHidden; });
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

		return relations.map((relation: any) => {
			const vr = view.relations.find((it: I.Relation) => { return it.relationKey == relation.relationKey; }) || {};
			return new M.ViewRelation({
				...vr,
				relationKey: relation.relationKey,
				width: this.relationWidth(vr.width, relation.format),
			});
		});
	};

	relationWidth (width: number, format: I.RelationType): number {
		return Number(width || Constant.size.dataview.cell[this.relationClass(format)]) || Constant.size.dataview.cell.default;
	};

	dataviewRelationAdd (rootId: string, blockId: string, relation: any, view?: I.View, callBack?: (message: any) => void) {
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
				relation.width = this.relationWidth(0, relation.format);

				view.relations.push(relation);
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

	checkDetails (rootId: string) {
		const details = blockStore.getDetails(rootId, rootId);
		const { iconEmoji, iconImage, coverType, coverId } = details;
		const layout = Number(details.layout) || I.ObjectLayout.Page;
		const ret: any = {
			object: details,
			withCover: (coverType != I.CoverType.None) && coverId,
			withIcon: false,
			className: [],
		};

		switch (layout) {
			default:
			case I.ObjectLayout.Page:
				ret.withIcon = iconEmoji || iconImage;
				ret.className.push('isPage');
				break;

			case I.ObjectLayout.Human:
				ret.withIcon = true;
				ret.className.push('isHuman');
				break;

			case I.ObjectLayout.Task:
				ret.className.push('isTask');
				break;

			case I.ObjectLayout.Set:
				ret.withIcon = iconEmoji || iconImage;
				ret.className.push('isSet');
				break;

			case I.ObjectLayout.Image:
				ret.withIcon = true;
				ret.className.push('isImage');
				break;

			case I.ObjectLayout.File:
				ret.withIcon = true;
				ret.className.push('isFile');
				break;
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
		const n1 = c1.name.toLowerCase();
		const n2 = c2.name.toLowerCase();
		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
		return 0;
	};

	formatRelationValue (relation: I.Relation, value: any) {
		switch (relation.format) {
			default:
				value = String(value || '');
				break;

			case I.RelationType.Number:
			case I.RelationType.Date:
				value = parseFloat(value);
				break;

			case I.RelationType.Checkbox:
				value = Boolean(value);
				break;

			case I.RelationType.Status:
			case I.RelationType.File:
			case I.RelationType.Tag:
			case I.RelationType.Object:
			case I.RelationType.Relations:
				value = Util.objectCopy(value || []);
				value = Util.arrayUnique(value);

				if (relation.maxCount) {
					value = value.slice(value.length - relation.maxCount, value.length);
				};
				break;
		};
		return value;
	};

};

export default new DataUtil();