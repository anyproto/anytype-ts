import { I, C, keyboard, Storage, crumbs, translate, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

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
			
			if (!root) {
				console.error('[pageInit] No root defined');
				return;
			};

			commonStore.gatewaySet(message.gatewayUrl);
			
			blockStore.rootSet(root);
			blockStore.archiveSet(message.archiveBlockId);
			
			if (message.profileBlockId) {
				blockStore.profileSet(message.profileBlockId);
				C.BlockOpen(message.profileBlockId, (message: any) => {
					if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
						Util.onErrorUpdate();
					};
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

	pageOpenEvent (e: any, targetId: string) {
		if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
			this.pageOpenPopup(targetId);
		} else {
			this.pageOpen(targetId);
		};
	};
	
	pageOpen (targetId: string) {
		if (!targetId) {
			return;
		};

		const { root } = blockStore;
		const route = targetId == root ? '/main/index' : '/main/edit/' + targetId;
		this.history.push(route);
	};

	pageOpenPopup (targetId: string) {
		if (!targetId) {
			return;
		};

		const param = { data: { id: targetId } };

		if (commonStore.popupIsOpen('editorPage')) {
			commonStore.popupUpdate('editorPage', param);
		} else {
			commonStore.popupOpen('editorPage', param);
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
		C.BlockSetDetails(rootId, [ 
			{ key: 'iconEmoji', value: emoji },
			{ key: 'iconImage', value: image },
		], callBack);
	};
	
	pageSetName (rootId: string, name: string, callBack?: (message: any) => void) {
		C.BlockSetDetails(rootId, [ 
			{ key: 'name', value: name },
		], callBack);
	};
	
	pageSetCover (rootId: string, type: I.CoverType, coverId: string, x?: number, y?: number, scale?: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;
		scale = Number(scale) || 0;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverType', value: type },
			{ key: 'coverId', value: coverId },
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
			{ key: 'coverScale', value: scale },
		], callBack);
	};

	pageSetCoverXY (rootId: string, x: number, y: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
		], callBack);
	};

	pageSetCoverScale (rootId: string, scale: number, callBack?: (message: any) => void) {
		scale = Number(scale) || 0;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverScale', value: scale },
		], callBack);
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
		it.name = translate('blockName' + it.lang);
		it.description = translate('blockDescription' + it.lang);
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
		return [
			{ type: I.BlockType.Page, id: 'page', icon: 'page', lang: 'Page' },
			{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', lang: 'File' },
			{ type: I.BlockType.File, id: I.FileType.Image, icon: 'picture', lang: 'Image' },
			{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', lang: 'Video' },
			{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', lang: 'Bookmark' },
			{ type: I.BlockType.Page, id: 'existing', icon: 'existing', lang: 'Existing' },
			/*
			{ type: I.BlockType.Dataview, id: 'task', icon: 'task', name: 'Task', color: 'blue', isBlock: true },
			{ id: 'task', icon: 'task', name: 'Task', color: 'blue', isBlock: true },
			{ id: 'dataview', icon: 'page', name: 'Database', color: 'blue', isBlock: true },
			{ id: 'set', icon: 'set', name: 'Set', color: 'blue', isBlock: true },
			{ id: 'contact', icon: 'contact', name: 'Contact', color: 'blue', isBlock: true },
			*/
		].map(this.menuMapperBlock);
	};
	
	menuGetBlockOther () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'line', lang: 'Line' },
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
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
		].map(this.menuMapperBlock);
	};
	
	// Action menu
	menuGetActions (block: I.Block) {
		if (!block) {
			return;
		};
		
		let items: any[] = [
			{ id: 'move', icon: 'move', name: 'Move to' },
			{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];
		
		if (block.isFile()) {
			let idx = items.findIndex((it: any) => { return it.id == 'remove'; });
			items.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//items.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//items.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
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
		for (let i in Constant.textColor) {
			items.push({ id: 'color-' + i, name: Constant.textColor[i], value: i, className: i, isTextColor: true });
		};
		return items;
	};
	
	menuGetBgColors () {
		let items: any[] = [
			{ id: 'color-default', name: 'Default', value: '', className: 'default', isBgColor: true }
		];
		for (let i in Constant.textColor) {
			items.push({ id: 'bgColor-' + i, name: Constant.textColor[i], value: i, className: i, isBgColor: true });
		};
		return items;
	};
	
	menuGetAlign (block: I.Block) {
		let ret = [
			{ id: I.BlockAlign.Left, icon: 'align left', name: 'Align left', isAlign: true },
			{ id: I.BlockAlign.Center, icon: 'align center', name: 'Align center', isAlign: true },
			{ id: I.BlockAlign.Right, icon: 'align right', name: 'Align right', isAlign: true },
		];

		if (block.isTextQuote()) {
			ret = ret.filter((it: any) => { return it.id != I.BlockAlign.Center; });
		};

		return ret;
	};
	
	menuSectionsFilter (sections: any[], filter: string) {
		const reg = new RegExp(filter, 'gi');
		
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
		sections = sections.map((s: any, i: number) => {
			s.id = s.id || i;
			s.children = s.children.map((it: any) => {
				it.key = it.id;
				it.id = s.id + '-' + it.id;
				return it;
			});
			return s;
		});
		
		return sections;
	};
	
	schemaField (v: string) {
		const a = String(v || '').split('/');
		return a.length > 1 ? a[a.length - 1] : '';
	};


	cellId (prefix: string, relationId: string, id: any) {
		return [ prefix, relationId, String(id || '') ].join('-');
	};

};

export default new DataUtil();