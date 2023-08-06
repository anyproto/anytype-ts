import { I, C, keyboard, translate, UtilCommon, UtilData, UtilObject, Relation, Dataview } from 'Lib';
import { commonStore, menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class UtilMenu {

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
			it.icon = UtilData.blockTextClass(it.id);
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
			it.icon = UtilData.blockTextClass(it.id);
			return this.mapperBlock(it);
		});
	};

	getBlockMedia () {
		return [
			{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', lang: 'File' },
			{ type: I.BlockType.File, id: I.FileType.Image, icon: 'image', lang: 'Image' },
			{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', lang: 'Video' },
			{ type: I.BlockType.File, id: I.FileType.Audio, icon: 'audio', lang: 'Audio' },
			{ type: I.BlockType.File, id: I.FileType.Pdf, icon: 'pdf', lang: 'Pdf' },
			{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', lang: 'Bookmark' },
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', lang: 'Code' },
			{ type: I.BlockType.Latex, id: I.BlockType.Latex, icon: 'latex', lang: 'Latex' },
		].map(this.mapperBlock);
	};

	getBlockObject () {
		let ret: any[] = [
			{ type: I.BlockType.Page, id: 'existing', icon: 'existing', lang: 'Existing', arrow: true },
		];
		let i = 0;
		let items = UtilData.getObjectTypesForNewObject({ withSet: true, withCollection: true });

		for (let type of items) {
			ret.push({ 
				id: 'object' + i++, 
				type: I.BlockType.Page, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || UtilObject.defaultName('Page'), 
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
			{ type: I.BlockType.Table, id: I.BlockType.Table, icon: 'table', lang: 'SimpleTable' },
			{ type: I.BlockType.Dataview, id: 'collection', icon: 'collection', lang: 'Collection', aliases: [ 'grid', 'table', 'gallery', 'list', 'board', 'kanban' ] },
			{ type: I.BlockType.Dataview, id: 'set', icon: 'set', lang: 'Set', aliases: [ 'grid', 'table', 'gallery', 'list', 'board', 'kanban' ] },
		].map(this.mapperBlock);
	};

	getTurnPage () {
		const { config } = commonStore;
		const ret = [];
	
		let types = UtilData.getObjectTypesForNewObject(); 
		if (!config.debug.ho) {
			types = types.filter(it => !it.isHidden);
		};
		types.sort(UtilData.sortByName);

		let i = 0;
		for (let type of types) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: 'object' + i++, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || UtilObject.defaultName('Page'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret;
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
		const { hasText, hasFile, hasBookmark, hasTurnObject } = param;
		const cmd = keyboard.cmdSymbol();
		const items: any[] = [
			{ id: 'remove', icon: 'remove', name: translate('commonDelete'), caption: 'Del' },
			{ id: 'copy', icon: 'copy', name: translate('commonDuplicate'), caption: `${cmd} + D` },
			{ id: 'move', icon: 'move', name: translate('commonMoveTo'), arrow: true },
			//{ id: 'comment', icon: 'comment', name: translate('commonComment')' }
		];

		if (hasTurnObject) {
			items.push({ id: 'turnObject', icon: 'object', name: translate('commonTurnIntoObject'), arrow: true });
		};
		
		if (hasText) {
			items.push({ id: 'clear', icon: 'clear', name: translate('libMenuClearStyle') });
		};
		
		if (hasFile) {
			items.push({ id: 'download', icon: 'download', name: translate('commonDownload') });
			items.push({ id: 'openFileAsObject', icon: 'expand', name: translate('commonOpenObject') });
			//items.push({ id: 'rename', icon: 'rename', name: translate('libMenuRename') });
			//items.push({ id: 'replace', icon: 'replace', name: translate('libMenuReplace') });
		};

		if (hasBookmark) {
			items.push({ id: 'openBookmarkAsObject', icon: 'expand', name: translate('commonOpenObject') });
		};

		return items.map(it => ({ ...it, isAction: true }));
	};

	getDataviewActions (rootId: string, blockId: string) {
		const isCollection = Dataview.isCollection(rootId, blockId);
		const sourceName = isCollection ? 'collection' : 'set';

		return [
			{ id: 'dataviewSource', icon: 'source', name: UtilCommon.sprintf(translate('libMenuChangeSource'), sourceName), arrow: true },
			{ id: 'openDataviewObject', icon: 'expand', name: UtilCommon.sprintf(translate('libMenuOpenSource'), sourceName) },
			//{ id: 'openDataviewFullscreen', icon: 'expand', name: translate('libMenuOpenFullscreen') }
		].map(it => ({ ...it, isAction: true }));
	};
	
	getTextColors () {
		const items: any[] = [
			{ id: 'color-default', name: translate('commonDefault'), value: '', className: 'default', isTextColor: true }
		];
		for (const color of Constant.textColor) {
			items.push({ id: 'color-' + color, name: translate('textColor-' + color), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	getBgColors () {
		let items: any[] = [
			{ id: 'bgColor-default', name: translate('commonDefault'), value: '', className: 'default', isBgColor: true }
		];
		for (let color of Constant.textColor) {
			items.push({ id: 'bgColor-' + color, name: translate('textColor-' + color), value: color, className: color, isBgColor: true });
		};
		return items;
	};
	
	getAlign (hasQuote: boolean) {
		let ret = [
			{ id: I.BlockHAlign.Left, icon: 'align left', name: translate('commonAlignLeft'), isAlign: true },
			{ id: I.BlockHAlign.Center, icon: 'align center', name: translate('commonAlignCenter'), isAlign: true },
			{ id: I.BlockHAlign.Right, icon: 'align right', name: translate('commonAlignRight'), isAlign: true },
		];

		if (hasQuote) {
			ret = ret.filter(it => it.id != I.BlockHAlign.Center);
		};

		return ret;
	};

	getLayouts () {
		return [
			{ id: I.ObjectLayout.Page },
			{ id: I.ObjectLayout.Human },
			{ id: I.ObjectLayout.Task },
			{ id: I.ObjectLayout.Set },
			{ id: I.ObjectLayout.File },
			{ id: I.ObjectLayout.Image },
			{ id: I.ObjectLayout.Type },
			{ id: I.ObjectLayout.Relation },
			{ id: I.ObjectLayout.Note },
		].map(it => ({ 
			...it, 
			icon: 'layout c-' + I.ObjectLayout[it.id].toLowerCase(),
			name: translate('layout' + it.id),
		}));
	};

	turnLayouts () {
		const allowed = [ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task, I.ObjectLayout.Note ];
		return this.getLayouts().filter(it => allowed.includes(it.id));
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

	getWidgetLimits (layout: I.WidgetLayout) {
		let options = [];
		switch (layout) {
			default: {
				options = [ 6, 10, 14 ];
				break;
			};

			case I.WidgetLayout.List: {
				options = [ 4, 6, 8 ];
				break;
			};
		};
		return options.map(id => ({ id: String(id), name: id }));
	};
	
	sectionsFilter (sections: any[], filter: string) {
		const f = UtilCommon.regexEscape(filter);
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
			s.children = s.children.sort((c1: any, c2: any) => UtilData.sortByWeight(c1, c2));
			return s.children.length > 0;
		});

		sections = sections.sort((c1: any, c2: any) => UtilData.sortByWeight(c1, c2));
		return sections;
	};
	
	sectionsMap (sections: any[]) {
		sections = UtilCommon.objectCopy(sections);
		sections = sections.filter(it => it.children.length > 0);
		sections = sections.map((s: any, i: number) => {
			s.id = (undefined !== s.id) ? s.id : i;

			s.children = s.children.filter(it => it);
			s.children = s.children.map((c: any, i: number) => {
				c.id = (undefined !== c.id) ? c.id : i;
				c.itemId = c.id;
				c.id = [ s.id, c.id ].join('-');
				c.color = c.color || s.color || '';
				return c;
			});
			s.children = UtilCommon.arrayUniqueObjects(s.children, 'id');
			return s;
		});

		return UtilCommon.arrayUniqueObjects(sections, 'id');
	};

	dashboardSelect (element: string, openRoute?: boolean) {
		const { workspace } = commonStore;
		const skipTypes = UtilObject.getFileTypes().concat(UtilObject.getSystemTypes());
		const onSelect = (object: any, update: boolean) => {
			C.ObjectWorkspaceSetDashboard(workspace, object.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				detailStore.update(Constant.subId.space, { id: workspace, details: { spaceDashboardId: object.id } }, false);

				if (update) {
					detailStore.update(Constant.subId.space, { id: object.id, details: object }, false);
				};

				menuStore.closeAll();

				if (openRoute) {
					UtilObject.openHome('route');
				};
			});
		};

		let menuContext = null;

		menuStore.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			subIds: [ 'searchObject' ],
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: [
					{ id: I.HomePredefinedId.Graph, name: translate('commonGraph') },
					{ id: I.HomePredefinedId.Last, name: translate('spaceLast') },
					{ id: I.HomePredefinedId.Existing, name: translate('spaceExisting'), arrow: true },
				],
				onOver: (e: any, item: any) => {
					if (!menuContext) {
						return;
					};

					if (!item.arrow) {
						menuStore.closeAll([ 'searchObject' ]);
						return;
					};

					switch (item.id) {
						case I.HomePredefinedId.Existing: {
							menuStore.open('searchObject', {
								element: `#${menuContext.getId()} #item-${item.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									filters: [
										{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
									],
									canAdd: true,
									onSelect: (el: any) => onSelect(el, true),
								}
							});
							break;
						};
					};
				},
				onSelect: (e, item: any) => {
					if (item.arrow) {
						return;
					};

					switch (item.id) {
						case I.HomePredefinedId.Graph:
						case I.HomePredefinedId.Last: {
							onSelect({ id: item.id }, false);
							break;
						};
					};
				},
			}
		});
	};

	getGraphTabs () {
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();

		return [
			{ id: 'graph', name: translate('commonGraph'), layout: I.ObjectLayout.Graph, tooltipCaption: `${cmd} + ${alt} + O` },
			{ id: 'navigation', name: translate('commonFlow'), layout: I.ObjectLayout.Navigation, tooltipCaption: `${cmd} + O` },
		];
	};

};

export default new UtilMenu();
