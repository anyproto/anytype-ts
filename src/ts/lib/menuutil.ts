import { I, keyboard, translate, Util, DataUtil, Relation } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

class MenuUtil {

	mapperBlock (it: any) {
		it.isBlock = true;
		it.name = it.lang ? translate('blockName' + it.lang) : it.name;
		it.description = it.lang ? translate('blockText' + it.lang) : it.description;
		return it;
	};
	
	getBlockText () {
		return [
			{ id: I.TextStyle.Paragraph, lang: 'Paragraph' },
			{ id: I.TextStyle.Header1, lang: 'Header1', aliases: [ 'h1', 'head1' ] },
			{ id: I.TextStyle.Header2, lang: 'Header2', aliases: [ 'h2', 'head2' ] },
			{ id: I.TextStyle.Header3, lang: 'Header3', aliases: [ 'h3', 'head3' ] },
			{ id: I.TextStyle.Quote, lang: 'Quote' },
			{ id: I.TextStyle.Callout, lang: 'Callout' },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = DataUtil.blockTextClass(it.id);
			return this.mapperBlock(it);
		});
	};
	
	getBlockList () {
		return [
			{ id: I.TextStyle.Checkbox, lang: 'Checkbox', aliases: [ 'todo' ] },
			{ id: I.TextStyle.Bulleted, lang: 'Bulleted' },
			{ id: I.TextStyle.Numbered, lang: 'Numbered' },
			{ id: I.TextStyle.Toggle, lang: 'Toggle' },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = DataUtil.blockTextClass(it.id);
			return this.mapperBlock(it);
		});
	};

	getBlockMedia () {
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
		return ret.map(this.mapperBlock);
	};

	getBlockObject () {
		let ret: any[] = [
			{ type: I.BlockType.Page, id: 'existing', icon: 'existing', lang: 'Existing', arrow: true },
		];
		let i = 0;
		let items = DataUtil.getObjectTypesForNewObject({ withSet: true });

		for (let type of items) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: 'object' + i++, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || DataUtil.defaultName('page'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.mapperBlock);
	};

	getBlockOther () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
			{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents, icon: 'tableOfContents', lang: 'TableOfContents', aliases: [ 'tc', 'toc' ] },
			{ type: I.BlockType.Table, id: I.BlockType.Table, icon: 'table', lang: 'SimpleTable' }
		].map(this.mapperBlock);
	};

	getBlockDataview () {
		return [
			{ id: I.ViewType.Grid, icon: 'dataview-grid', lang: 'Table' },
			{ id: I.ViewType.Gallery, icon: 'dataview-gallery', lang: 'Gallery' },
			{ id: I.ViewType.List, icon: 'dataview-list', lang: 'List' },
			{ id: I.ViewType.Board, icon: 'dataview-board', lang: 'Board' },
		].map((it: any) => {
			it.type = I.BlockType.Dataview;
			return this.mapperBlock(it);
		});
	};

	getTurnPage () {
		const { config } = commonStore;
		const ret = [];
	
		let types = DataUtil.getObjectTypesForNewObject(); 
		if (!config.debug.ho) {
			types = types.filter(it => !it.isHidden);
		};
		types.sort(DataUtil.sortByName);

		let i = 0;
		for (let type of types) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: 'object' + i++, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || DataUtil.defaultName('page'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.mapperBlock);
	};
	
	getTurnDiv () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'div-line', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', lang: 'Dot' },
		].map(this.mapperBlock);
	};

	getTurnFile () {
		return [
			{ type: I.BlockType.File, id: I.FileStyle.Link, lang: 'Link' },
			{ type: I.BlockType.File, id: I.FileStyle.Embed, lang: 'Embed' },
		].map(this.mapperBlock);
	};

	// Action menu
	getActions (param: any) {
		let { hasText, hasFile, hasDataview, hasBookmark, hasTurnObject } = param;
		let cmd = keyboard.ctrlSymbol();
		let items: any[] = [
			{ id: 'move', icon: 'move', name: 'Move to', arrow: true },
			{ id: 'copy', icon: 'copy', name: 'Duplicate', caption: `${cmd} + D` },
			{ id: 'remove', icon: 'remove', name: 'Delete', caption: 'Del' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];

		if (hasTurnObject) {
			items.push({ id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true });
		};
		
		if (hasText) {
			items.push({ id: 'clear', icon: 'clear', name: 'Clear style' });
		};
		
		if (hasFile) {
			items.push({ id: 'download', icon: 'download', name: 'Download' });
			items.push({ id: 'openFileAsObject', icon: 'expand', name: 'Open as object' });
			//items.push({ id: 'rename', icon: 'rename', name: 'Rename' });
			//items.push({ id: 'replace', icon: 'replace', name: 'Replace' });
		};

		if (hasBookmark) {
			items.push({ id: 'openBookmarkAsObject', icon: 'expand', name: 'Open as object' });
		};

		items = items.map((it: any) => {
			it.isAction = true;
			return it;
		});
		
		return items;
	};

	getDataviewActions () {
		return [
			{ id: 'dataviewSource', icon: 'source', name: 'Change source set', arrow: true },
			{ id: 'openDataviewObject', icon: 'expand', name: 'Open source set' },
			//{ id: 'openDataviewFullscreen', icon: 'expand', name: 'Open fullscreen' }
		];
	};
	
	getTextColors () {
		let items: any[] = [
			{ id: 'color-default', name: 'Default', value: '', className: 'default', isTextColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'color-' + color, name: translate('textColor-' + color), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	getBgColors () {
		let items: any[] = [
			{ id: 'bgColor-default', name: 'Default', value: '', className: 'default', isBgColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'bgColor-' + color, name: translate('textColor-' + color), value: color, className: color, isBgColor: true });
		};
		return items;
	};
	
	getAlign (hasQuote: boolean) {
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

	getLayouts () {
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

	turnLayouts () {
		return this.getLayouts().filter((it: any) => {
			return [ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task, I.ObjectLayout.Note ].indexOf(it.id) >= 0;
		});
	};

	getViews () {
		return [
			{ id: I.ViewType.Grid },
			{ id: I.ViewType.Gallery },
			{ id: I.ViewType.List },
			{ id: I.ViewType.Board },
		].map((it: any) => {
			it.name = translate('viewName' + it.id);
			return it;
		});
	};

	getRelationTypes () {
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
			it.icon = 'relation ' + Relation.className(it.id);
			return it;
		});
	};
	
	sectionsFilter (sections: any[], filter: string) {
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
						c.name = `Table ${c.rowCnt}x${c.columnCnt}`;

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
			s.children = s.children.sort((c1: any, c2: any) => DataUtil.sortByWeight(c1, c2));
			return s.children.length > 0;
		});

		sections = sections.sort((c1: any, c2: any) => DataUtil.sortByWeight(c1, c2));
		return sections;
	};
	
	sectionsMap (sections: any[]) {
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

};

export default new MenuUtil();