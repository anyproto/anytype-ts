import { I, C, Util } from 'ts/lib';
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
			map[item[field]] = item
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
	
	styleIcon (s: I.TextStyle): string {
		let icon = '';
		switch (s) {
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
		return icon;
	};
	
	styleClassText (s: I.TextStyle): string {
		let c = '';
		switch (s) {
			default:
			case I.TextStyle.Paragraph:	 c = 'paragraph'; break;
			case I.TextStyle.Title:		 c = 'title'; break;
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
	
	selectionGet (props: any): string[] {
		const { dataset, id } = props;
		const { selection } = dataset;
		
		let ids: string[] = [];
		if (selection) {
			ids = selection.get(true);
			if (ids.length <= 1) {
				selection.set([ id ]);
				ids = selection.get(true);
			};
		};
		return ids;
	};
	
	pageInit (props: any) {
		const { blockStore, commonStore } = props;
		const { breadcrumbs } = blockStore;
		
		C.ConfigGet((message: any) => {
			const root = message.homeBlockId;
			
			if (!root) {
				console.error('No root defined');
				return;
			};

			commonStore.gatewaySet(message.gatewayUrl);
			blockStore.rootSet(root);
			
			if (!breadcrumbs) {
				C.BlockOpenBreadcrumbs((message: any) => {
					blockStore.breadcrumbsSet(message.blockId);
					C.BlockCutBreadcrumbs(message.blockId, 0);
				});
			};
			
			C.BlockOpen(root, []);
		});
	};
	
	pageOpen (e: any, props: any, targetId: string) {
		const { history } = props;
		const param = {
			data: { id: targetId }
		};

		if (commonStore.popupIsOpen('editorPage')) {
			commonStore.popupUpdate('editorPage', param);
		} else 
		if (e && (e.shiftKey || (e.ctrlKey || e.metaKey))) { 
			commonStore.popupOpen('editorPage', param);
		} else {
			history.push('/main/edit/' + targetId);
		};
	};
	
	pageCreate (e: any, props: any, icon: string, name: string) {
		if (e && e.persist) {
			e.persist();
		};
		
		const { root, blocks } = blockStore;
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });

		const block = {
			type: I.BlockType.Page,
			fields: { 
				icon: icon, 
				name: name,
			},
			content: {
				style: I.PageStyle.Empty,
			},
		};

		C.BlockCreatePage(block, root, '', I.BlockPosition.Bottom, (message: any) => {
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			this.pageOpen(e, props, message.targetId);
			Util.scrollTopEnd();
		});	
	};
	
	blockSetText (rootId: string, block: I.Block, text: string, marks: I.Mark[]) {
		if (!block) {
			return;
		};
		
		text = String(text || '');
		marks = marks || [];
		
		let param = {
			id: block.id,
			content: Util.objectCopy(block.content),
		};
		param.content.text = text;
		param.content.marks = marks;
			
		blockStore.blockUpdate(rootId, param);
		C.BlockSetTextText(rootId, block.id, text, marks);
	};
	
	// Action menu
	menuGetActions (block: I.Block) {
		if (!block) {
			return;
		};
		
		const { content, type } = block;
		const { style } = content;
		
		let items: any[] = [
			//{ id: 'move', icon: 'move', name: 'Move to' },
			//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];
		
		// Restrictions
		if (type == I.BlockType.File) {
			let idx = items.findIndex((it: any) => { return it.id == 'remove'; });
			items.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//items.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//items.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
		};
		
		if (type != I.BlockType.Text) {
			items = items.filter((it: any) => { return [ 'turn', 'color' ].indexOf(it.id) < 0; });
		};
		
		if (style == I.TextStyle.Code) {
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
			{ id: 'color-black', name: 'Black', value: 'black', isTextColor: true }
		];
		for (let i in Constant.textColor) {
			items.push({ id: 'color-' + i, name: Constant.textColor[i], value: i, isTextColor: true });
		};
		return items;
	};
	
	menuGetBgColors () {
		let items: any[] = [];
		for (let i in Constant.textColor) {
			items.push({ id: 'bgColor-' + i, name: Constant.textColor[i] + ' highlight', value: i, isBgColor: true });
		};
		return items;
	};
	
	menuGetAlign () {
		return [
			{ id: I.BlockAlign.Left, icon: 'align left', name: 'Left' },
			{ id: I.BlockAlign.Center, icon: 'align center', name: 'Center' },
			{ id: I.BlockAlign.Right, icon: 'align right', name: 'Right' },
		];
	};
	
};

export default new DataUtil();