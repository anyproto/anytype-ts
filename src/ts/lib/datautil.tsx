import { I, C, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

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
		if (e.shiftKey || (e.ctrlKey || e.metaKey)) { 
			commonStore.popupOpen('editorPage', param);
		} else {
			history.push('/main/edit/' + targetId);
		};
	};
	
	pageCreate (e: any, props: any, icon: string, name: string) {
		if (e.persist) {
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
};

export default new DataUtil();