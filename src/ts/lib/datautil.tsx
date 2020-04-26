import { I, C, Util, focus, Storage, crumbs, translate } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const Constant = require('json/constant.json');

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
	
	selectionGet (props: any): string[] {
		const { dataset, block } = props;
		const { id } = block;
		const { selection } = dataset || {};
		
		if (!selection) {
			return [];
		};
		
		let ids: string[] = selection.get(true);
		
		if (ids.indexOf(id) < 0) {
			selection.clear(true);
			selection.set([ id ]);
			ids = selection.get(true);
		};
		
		return ids;
	};
	
	pageInit (callBack?: () => void) {
		C.ConfigGet((message: any) => {
			const root = message.homeBlockId;
			
			if (!root) {
				console.error('No root defined');
				return;
			};

			commonStore.gatewaySet(message.gatewayUrl);
			
			blockStore.rootSet(root);
			blockStore.archiveSet(message.archiveBlockId);
			blockStore.profileSet(message.profileBlockId);
			
			crumbs.init();
			
			C.BlockOpen(root, [], (message: any) => {
				if (callBack) {
					callBack();
				};
			});
		});
	};
	
	pageOpen (e: any, props: any, linkId: string, targetId: string) {
		const { history } = props;
		const param = {
			data: { 
				id: targetId,
				link: linkId, 
			}
		};

		/*
		if (commonStore.popupIsOpen('editorPage')) {
			commonStore.popupUpdate('editorPage', param);
		} else 
		if (e && (e.shiftKey || (e.ctrlKey || e.metaKey))) { 
			commonStore.popupOpen('editorPage', param);
		} else {
			history.push('/main/edit/' + targetId + '/link/' + linkId);
		};
		*/
		
		history.push('/main/edit/' + targetId + '/link/' + linkId);
	};
	
	pageCreate (e: any, props: any, rootId: string, targetId: string, details: any, position: I.BlockPosition, callBack?: (message: any) => void) {
		if (e && e.persist) {
			e.persist();
		};
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });
		
		C.BlockCreatePage(rootId, targetId, details, position, (message: any) => {
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			
			if (message.error.code) {
				return;
			};
			
			this.pageOpen(e, props, message.blockId, message.targetId);
				
			if (callBack) {
				callBack(message);
			};
		});	
	};
	
	blockSetText (rootId: string, block: I.Block, text: string, marks: I.Mark[]) {
		if (!block) {
			return;
		};
		
		block.content.text = String(text || '');
		block.content.marks = marks || [];
			
		blockStore.blockUpdate(rootId, block);
		C.BlockSetTextText(rootId, block.id, text, marks, () => {
			blockStore.setNumbers(rootId);
		});
	};
	
	menuGetBlockText () {
		return [
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Paragraph, icon: 'text', name: 'Text', isBlock: true,
				description: translate('blockDescriptionParagraph'),
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Header1, icon: 'header1', name: 'Header 1', isBlock: true, 
				description: translate('blockDescriptionHeader1'), aliases: [ 'h1' ],
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Header2, icon: 'header2', name: 'Header 2', isBlock: true, 
				description: translate('blockDescriptionHeader2'), aliases: [ 'h2' ] 
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Header3, icon: 'header3', name: 'Header 3', isBlock: true, 
				description: translate('blockDescriptionHeader3'), aliases: [ 'h3' ] 
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted',isBlock: true,
				description: translate('blockDescriptionQuote'), 
			},
		];
	};
	
	menuGetBlockList () {
		return [
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox', isBlock: true,
				description: translate('blockDescriptionCheckbox'),  
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted list', isBlock: true,
				description: translate('blockDescriptionBulleted'), 
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered list', isBlock: true,
				description: translate('blockDescriptionNumbered'), 
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle', isBlock: true,
				description: translate('blockDescriptionToggle'), 
			},
		];
	};
	
	menuGetBlockPage () {
		let id = 0;
		return [
			{ 
				type: I.BlockType.Page, id: ++id, icon: 'page', name: 'Page', isBlock: true,
				description: translate('blockDescriptionPage'), 
			},
			/*
			{ type: I.BlockType.Dataview, id: ++id, icon: 'task', name: 'Task', color: 'blue', isBlock: true },
			{ id: 'existing', icon: 'existing', name: 'Existing Page', color: 'blue', isBlock: true },
			{ id: 'task', icon: 'task', name: 'Task', color: 'blue', isBlock: true },
			{ id: 'dataview', icon: 'page', name: 'Database', color: 'blue', isBlock: true },
			{ id: 'set', icon: 'set', name: 'Set', color: 'blue', isBlock: true },
			{ id: 'contact', icon: 'contact', name: 'Contact', color: 'blue', isBlock: true },
			*/
		];
	};
	
	menuGetTurnObject() {
		return [
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code snippet', isBlock: true },
		];
	};
	
	menuGetBlockObject () {
		return [
			{ 
				type: I.BlockType.File, id: I.FileType.File, icon: 'file', name: 'File', isBlock: true,
				description: translate('blockDescriptionFile'), 
			},
			{ 
				type: I.BlockType.File, id: I.FileType.Image, icon: 'picture', name: 'Picture', isBlock: true,
				description: translate('blockDescriptionImage'), 
			},
			{ 
				type: I.BlockType.File, id: I.FileType.Video, icon: 'video', name: 'Video', isBlock: true,
				description: translate('blockDescriptionVideo'), 
			},
			{ 
				type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', name: 'Bookmark', isBlock: true,
				description: translate('blockDescriptionBookmark'), 
			},
			{ 
				type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code', isBlock: true,
				description: translate('blockDescriptionCode'), 
			},
		];
	};
	
	menuGetBlockOther () {
		return [
			{ 
				type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'line', name: 'Line divider', isBlock: true,
				description: translate('blockDescriptionLine'),  
			},
			{ 
				type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', name: 'Dots divider', isBlock: true,
				description: translate('blockDescriptionDot'),  
			},
		];
	};
	
	// Action menu
	menuGetActions (block: I.Block) {
		if (!block) {
			return;
		};
		
		let items: any[] = [
			//{ id: 'move', icon: 'move', name: 'Move to' },
			//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];
		
		// Restrictions
		if (block.isFile()) {
			let idx = items.findIndex((it: any) => { return it.id == 'remove'; });
			items.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//items.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//items.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
		};
		
		if (!block.isText() && !block.isDiv()) {
			items = items.filter((it: any) => { return [ 'turn' ].indexOf(it.id) < 0; });
		};
		
		if (!block.isText() || block.isCode()) {
			items = items.filter((it: any) => { return [ 'color' ].indexOf(it.id) < 0; });
		};
		
		items = items.map((it: any) => {
			it.isAction = true;
			return it;
		});
		
		return items;
	};
	
	menuGetTextColors () {
		let items: any[] = [
			{ id: 'color-black', name: 'Black', value: '', isTextColor: true }
		];
		for (let i in Constant.textColor) {
			items.push({ id: 'color-' + i, name: Constant.textColor[i], value: i, isTextColor: true });
		};
		return items;
	};
	
	menuGetBgColors () {
		let items: any[] = [
			{ id: 'color-default', name: 'Default', value: 'default', isBgColor: true }
		];
		for (let i in Constant.textColor) {
			items.push({ id: 'bgColor-' + i, name: Constant.textColor[i], value: i, isBgColor: true });
		};
		return items;
	};
	
	menuGetAlign () {
		return [
			{ id: I.BlockAlign.Left, icon: 'align left', name: 'Align left', isAlign: true },
			{ id: I.BlockAlign.Center, icon: 'align center', name: 'Align center', isAlign: true },
			{ id: I.BlockAlign.Right, icon: 'align right', name: 'Align right', isAlign: true },
		];
	};
	
	menuSectionsFilter (sections: any[], filter: string) {
		const reg = new RegExp(filter, 'gi');
		
		sections = sections.filter((s: any) => {
			if (s.name.match(reg)) {
				return true;
			};
			s.children = (s.children || []).filter((c: any) => { 
				let ret = false;
				if (c.name.match(reg)) {
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
		sections = sections.map((s: any) => {
			s.children = s.children.map((it: any) => {
				it.key = it.id;
				it.id = s.id + '-' + it.id;
				return it;
			});
			return s;
		});
		
		return sections;
	};
	
	linkId (match: any) {
		if (match.params.link) {
			return match.params.link;
		};
		if (match.params.linkId) {
			return match.params.linkId;
		};
		return '';
	};
	
};

export default new DataUtil();