import $ from 'jquery';
import raf from 'raf';
import { I, C, S, U, J, keyboard, translate, Dataview, Action, analytics, Relation, Storage, sidebar } from 'Lib';

class UtilMenu {

	mapperBlock (it: any) {
		it.isBlock = true;
		it.name = it.lang ? translate(`blockName${it.lang}`) : it.name;
		it.description = it.lang ? translate(`blockText${it.lang}`) : it.description;
		it.aliases = it.aliases || [];

		if (it.lang) {
			const nameKey = `blockName${it.lang}`;
			const descriptionKey = `blockText${it.lang}`;

			it.name = translate(nameKey);
			it.description = translate(descriptionKey);

			if (S.Common.interfaceLang != J.Constant.default.interfaceLang) {
				it.aliases.push(translate(nameKey, J.Constant.default.interfaceLang));
				it.aliases.push(translate(descriptionKey, J.Constant.default.interfaceLang));
				it.aliases = U.Common.arrayUnique(it.aliases);
			};
		};
		return it;
	};
	
	getBlockText () {
		return [
			{ id: I.TextStyle.Paragraph, lang: 'Paragraph' },
			{ id: I.TextStyle.Header1, lang: 'Header1', aliases: [ 'h1', 'head1', 'header1' ] },
			{ id: I.TextStyle.Header2, lang: 'Header2', aliases: [ 'h2', 'head2', 'header2' ] },
			{ id: I.TextStyle.Header3, lang: 'Header3', aliases: [ 'h3', 'head3', 'header3' ] },
			{ id: I.TextStyle.Quote, lang: 'Quote', aliases: [ 'quote' ] },
			{ id: I.TextStyle.Callout, lang: 'Callout', aliases: [ 'callout' ] },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = U.Data.blockTextClass(it.id);
			return this.mapperBlock(it);
		});
	};
	
	getBlockList () {
		return [
			{ id: I.TextStyle.Checkbox, lang: 'Checkbox', aliases: [ 'todo', 'checkbox' ] },
			{ id: I.TextStyle.Bulleted, lang: 'Bulleted', aliases: [ 'bulleted list' ] },
			{ id: I.TextStyle.Numbered, lang: 'Numbered', aliases: [ 'numbered list' ] },
			{ id: I.TextStyle.Toggle, lang: 'Toggle', aliases: [ 'toggle' ] },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.icon = U.Data.blockTextClass(it.id);
			return this.mapperBlock(it);
		});
	};

	getBlockMedia () {
		return [
			{ type: I.BlockType.File, id: I.FileType.File, icon: 'mediaFile', lang: 'File', aliases: [ 'file' ] },
			{ type: I.BlockType.File, id: I.FileType.Image, icon: 'mediaImage', lang: 'Image', aliases: [ 'image', 'picture' ] },
			{ type: I.BlockType.File, id: I.FileType.Video, icon: 'mediaVideo', lang: 'Video', aliases: [ 'video' ] },
			{ type: I.BlockType.File, id: I.FileType.Audio, icon: 'mediaAudio', lang: 'Audio', aliases: [ 'audio' ] },
			{ type: I.BlockType.File, id: I.FileType.Pdf, icon: 'mediaPdf', lang: 'Pdf', aliases: [ 'pdf' ] },
			{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', lang: 'Bookmark', aliases: [ 'bookmark' ] },
			{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', lang: 'Code', aliases: [ 'code' ] },
		].map(this.mapperBlock);
	};

	getBlockEmbed () {
		const { config } = S.Common;

		let ret = [
			{ id: I.EmbedProcessor.Latex, name: 'LaTeX' },
			{ id: I.EmbedProcessor.Mermaid, name: 'Mermaid' },
			{ id: I.EmbedProcessor.Chart, name: 'Chart' },
			{ id: I.EmbedProcessor.Youtube, name: 'Youtube' },
			{ id: I.EmbedProcessor.Vimeo, name: 'Vimeo' },
			{ id: I.EmbedProcessor.Soundcloud, name: 'Soundcloud' },
			{ id: I.EmbedProcessor.GoogleMaps, name: 'Google maps' },
			{ id: I.EmbedProcessor.Miro, name: 'Miro' },
			{ id: I.EmbedProcessor.Figma, name: 'Figma' },
			{ id: I.EmbedProcessor.Twitter, name: 'X (Twitter)' },
			{ id: I.EmbedProcessor.OpenStreetMap, name: 'OpenStreetMap' },
			{ id: I.EmbedProcessor.Facebook, name: 'Facebook' },
			{ id: I.EmbedProcessor.Instagram, name: 'Instagram' },
			{ id: I.EmbedProcessor.Telegram, name: 'Telegram' },
			{ id: I.EmbedProcessor.GithubGist, name: 'Github Gist' },
			{ id: I.EmbedProcessor.Codepen, name: 'Codepen' },
			{ id: I.EmbedProcessor.Bilibili, name: 'Bilibili' },
			{ id: I.EmbedProcessor.Kroki, name: 'Kroki' },
			{ id: I.EmbedProcessor.Graphviz, name: 'Graphviz' },
			{ id: I.EmbedProcessor.Sketchfab, name: 'Sketchfab' },
		];

		if (config.experimental) {
			ret = ret.concat([
				{ id: I.EmbedProcessor.Image, name: translate('blockEmbedExternalImage') },
				{ id: I.EmbedProcessor.Excalidraw, name: 'Excalidraw' },
				{ id: I.EmbedProcessor.Reddit, name: 'Reddit' },
			]);
		};

		return ret.map(this.mapperBlock).map(it => {
			it.type = I.BlockType.Embed;
			it.icon = `embed-${U.Common.toCamelCase(`-${I.EmbedProcessor[it.id]}`)}`;
			return it;
		});
	};

	getBlockObject () {
		const items = U.Data.getObjectTypesForNewObject({ withSet: true, withCollection: true, withChat: true });
		const ret: any[] = [
			{ type: I.BlockType.Page, id: 'existingPage', icon: 'existing', lang: 'ExistingPage', arrow: true, aliases: [ 'link' ] },
			{ type: I.BlockType.File, id: 'existingFile', icon: 'existing', lang: 'ExistingFile', arrow: true, aliases: [ 'file' ] }
		];

		items.sort((c1, c2) => U.Data.sortByNumericKey('lastUsedDate', c1, c2, I.SortType.Desc));

		let i = 0;
		for (const type of items) {
			ret.push({ 
				id: `object${i++}`, 
				type: I.BlockType.Page, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || translate('defaultNamePage'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.mapperBlock);
	};

	getBlockOther () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'divLine', lang: 'Line', aliases: [ 'hr', 'line divider' ] },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'divDot', lang: 'Dot', aliases: [ 'dot', 'dots divider' ] },
			{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents, icon: 'tableOfContents', lang: 'TableOfContents', aliases: [ 'tc', 'toc', 'table of contents'] },
			{ type: I.BlockType.Table, id: I.BlockType.Table, icon: 'table', lang: 'SimpleTable', aliases: [ 'table' ] },
			{ type: I.BlockType.Dataview, id: 'collection', icon: 'collection', lang: 'Collection', aliases: [ 'grid', 'table', 'gallery', 'list', 'board', 'kanban', 'inline collection' ] },
			{ type: I.BlockType.Dataview, id: 'set', icon: 'set', lang: 'Set', aliases: [ 'grid', 'table', 'gallery', 'list', 'board', 'kanban', 'inline set' ] },
		].map(this.mapperBlock);
	};

	getTurnPage () {
		const ret = [];
		const types = U.Data.getObjectTypesForNewObject(); 

		let i = 0;
		for (const type of types) {
			ret.push({ 
				type: I.BlockType.Page, 
				id: `object${i++}`, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				name: type.name || translate('defaultNamePage'), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret;
	};
	
	getTurnDiv () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'divLine', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'divDot', lang: 'Dot' },
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
		const { rootId, blockId, hasText, hasFile, hasBookmark, hasDataview, hasTurnObject, count } = param;
		const cmd = keyboard.cmdSymbol();
		const copyName = `${translate('commonDuplicate')} ${U.Common.plural(count, translate('pluralBlock'))}`;
		const items: any[] = [
			{ id: 'remove', icon: 'remove', name: translate('commonDelete'), caption: 'Del' },
			{ id: 'copy', icon: 'copy', name: copyName, caption: `${cmd} + D` },
			{ id: 'move', icon: 'move', name: translate('commonMoveTo'), arrow: true },
		];

		if (hasTurnObject) {
			items.push({ id: 'turnObject', icon: 'object', name: translate('commonTurnIntoObject'), arrow: true });
		};
		
		if (hasText) {
			items.push({ id: 'clear', icon: 'clear', name: translate('libMenuClearStyle') });
		};
		
		if (hasFile) {
			items.push({ id: 'download', icon: 'download', name: translate('commonDownload') });
		};

		if (hasBookmark) {
			items.push({ id: 'copyUrl', icon: 'copy', name: translate('libMenuCopyUrl') });
		};

		if (hasDataview) {
			const isCollection = Dataview.isCollection(rootId, blockId);
			const sourceName = isCollection ? translate('commonCollection') : translate('commonSet');

			items.push({ id: 'dataviewSource', icon: 'source', name: U.Common.sprintf(translate('libMenuChangeSource'), sourceName), arrow: true });
		};

		if (hasFile || hasBookmark || hasDataview) {
			items.push({ id: 'openAsObject', icon: 'expand', name: translate('commonOpenObject') });
		};

		return items.map(it => ({ ...it, isAction: true }));
	};

	getTextColors () {
		const items: any[] = [
			{ id: 'color-default', name: translate('commonDefault'), value: '', className: 'default', isTextColor: true }
		];
		for (const color of J.Constant.textColor) {
			items.push({ id: `color-${color}`, name: translate(`textColor-${color}`), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	getBgColors () {
		const items: any[] = [
			{ id: 'bgColor-default', name: translate('commonDefault'), value: '', className: 'default', isBgColor: true }
		];
		for (const color of J.Constant.textColor) {
			items.push({ id: `bgColor-${color}`, name: translate(`textColor-${color}`), value: color, className: color, isBgColor: true });
		};
		return items;
	};
	
	getHAlign (restricted: I.BlockHAlign[]) {
		let ret: any[] = [
			{ id: I.BlockHAlign.Left },
			{ id: I.BlockHAlign.Center },
			{ id: I.BlockHAlign.Right },
			{ id: I.BlockHAlign.Justify },
		];

		if (restricted.length) {
			ret = ret.filter(it => !restricted.includes(it.id));
		};

		return ret.map((it: any) => {
			it.icon = U.Data.alignHIcon(it.id);
			it.name = translate(`commonHAlign${I.BlockHAlign[it.id]}`);
			it.isAlign = true;
			return it;
		});
	};

	getVAlign () {
		return [
			{ id: I.BlockVAlign.Top },
			{ id: I.BlockVAlign.Middle },
			{ id: I.BlockVAlign.Bottom },
		].map((it: any) => {
			it.icon = U.Data.alignVIcon(it.id);
			it.name = translate(`commonVAlign${I.BlockVAlign[it.id]}`);
			return it;
		});
	};

	getLayouts () {
		return [
			{ id: I.ObjectLayout.Page },
			{ id: I.ObjectLayout.Human },
			{ id: I.ObjectLayout.Task },
			{ id: I.ObjectLayout.Set },
			{ id: I.ObjectLayout.File },
			{ id: I.ObjectLayout.Audio },
			{ id: I.ObjectLayout.Video },
			{ id: I.ObjectLayout.Image },
			{ id: I.ObjectLayout.Pdf },
			{ id: I.ObjectLayout.Type },
			{ id: I.ObjectLayout.Relation },
			{ id: I.ObjectLayout.Note },
		].map(it => ({ 
			...it,
			icon: `layout c-${I.ObjectLayout[it.id].toLowerCase()}`,
			name: translate(`layout${it.id}`),
		}));
	};

	turnLayouts () {
		const allowed = U.Object.getPageLayouts();
		return this.getLayouts().filter(it => allowed.includes(it.id));
	};

	getViews () {
		return [
			{ id: I.ViewType.Grid },
			{ id: I.ViewType.Gallery },
			{ id: I.ViewType.List },
			{ id: I.ViewType.Board },
			{ id: I.ViewType.Calendar },
			{ id: I.ViewType.Graph },
		].map(it => ({ ...it, name: translate(`viewName${it.id}`) }));
	};

	viewContextMenu (param: any) {
		const { rootId, blockId, view, onCopy, onRemove, menuParam, close } = param;
		const views = S.Record.getViews(rootId, blockId);

		const options: any[] = [
			{ id: 'edit', icon: 'viewSettings', name: translate('menuDataviewViewEditView') },
			{ id: 'copy', icon: 'copy', name: translate('commonDuplicate') },
		];

		if (views.length > 1) {
			options.push({ id: 'remove', icon: 'remove', name: translate('commonDelete') });
		};

		S.Menu.open('select', {
			...menuParam,
			data: {
				options,
				onSelect: (e, option) => {
					S.Menu.closeAll([ 'select' ]);
					if (close) {
						close();
					};

					window.setTimeout(() => {
						switch (option.id) {
							case 'edit': $(`#button-${blockId}-settings`).trigger('click'); break;
							case 'copy': onCopy(view); break;
							case 'remove': onRemove(view); break;
						};
					}, S.Menu.getTimeout());
				}
			}
		});
	};

	getRelationTypes () {
		return [
			{ id: I.RelationType.Object },
			{ id: I.RelationType.LongText },
			{ id: I.RelationType.Number },
			{ id: I.RelationType.Select },
			{ id: I.RelationType.MultiSelect },
			{ id: I.RelationType.Date },
			{ id: I.RelationType.File },
			{ id: I.RelationType.Checkbox },
			{ id: I.RelationType.Url },
			{ id: I.RelationType.Email },
			{ id: I.RelationType.Phone },
		].map((it: any) => {
			it.name = translate(`relationName${it.id}`);
			it.icon = `relation ${Relation.className(it.id)}`;
			return it;
		});
	};

	getWidgetLimitOptions (layout: I.WidgetLayout) {
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

	getWidgetLayoutOptions (id: string, layout: I.ObjectLayout) {
		const isSystem = this.isSystemWidget(id);
		
		let options = [
			I.WidgetLayout.Compact,
			I.WidgetLayout.List,
			I.WidgetLayout.Tree,
		];
		if (!isSystem) {
			options.push(I.WidgetLayout.Link);
		};

		if (id) {
			if (!isSystem) {
				const isSet = U.Object.isInSetLayouts(layout);
				const setLayouts = U.Object.getSetLayouts();
				const treeSkipLayouts = setLayouts.concat(U.Object.getFileAndSystemLayouts()).concat([ I.ObjectLayout.Participant ]);

				// Sets can only become Link and List layouts, non-sets can't become List
				if (treeSkipLayouts.includes(layout)) {
					options = options.filter(it => it != I.WidgetLayout.Tree);
				};
				if (!isSet) {
					options = options.filter(it => ![ I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(it));
				} else {
					options = options.filter(it => it != I.WidgetLayout.Tree);
					options.unshift(I.WidgetLayout.View);
				};
			};

			if ([ 
				J.Constant.widgetId.set, 
				J.Constant.widgetId.collection,
				J.Constant.widgetId.chat,
			].includes(id)) {
				options = options.filter(it => it != I.WidgetLayout.Tree);
			};
		};

		return options.map(id => ({
			id,
			name: translate(`widget${id}Name`),
			description: translate(`widget${id}Description`),
			icon: `widget-${id}`,
			withDescription: true,
		}));
	};

	isSystemWidget (id: string) {
		return id && Object.values(J.Constant.widgetId).includes(id);
	};

	getCoverColors () {
		return [ 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'green', 'lightgrey', 'darkgrey', 'black' ].map(id => ({
			id,
			type: I.CoverType.Color,
			name: translate(`textColor-${id}`),
		}));
	};

	getCoverGradients () {
		return [ 'pinkOrange', 'bluePink', 'greenOrange', 'sky', 'yellow', 'red', 'blue', 'teal' ].map(id => ({
			id,
			type: I.CoverType.Gradient,
			name: translate(`gradientColor-${id}`),
		}));
	};
	
	sectionsFilter (sections: any[], filter: string) {
		const f = U.Common.regexEscape(filter);
		const regS = new RegExp('^' + f, 'gi');
		const regC = new RegExp(f, 'gi');
		const getWeight = (s: string) => {
			let w = 0;
			if (s.toLowerCase() == f.toLowerCase()) {
				w += 10000;
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
				};

				if (!ret && c.aliases && c.aliases.length) {
					for (const alias of c.aliases) {
						if (alias.match(regC)) {
							c._sortWeight_ = getWeight(alias);
							ret = true;
							break;
						};
					};
				};

				if (!ret && c.name && c.name.match(regC)) {
					ret = true;
					c._sortWeight_ = getWeight(c.name);
				};

				if (!ret && c.description && c.description.match(regC)) {
					ret = true;
					c._sortWeight_ = getWeight(c.description);
				};
				
				s._sortWeight_ += c._sortWeight_;
				return ret; 
			});
			s.children = s.children.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
			return s.children.length > 0;
		});

		sections = sections.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
		return sections;
	};
	
	sectionsMap (sections: any[]) {
		sections = U.Common.objectCopy(sections);
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
			s.children = U.Common.arrayUniqueObjects(s.children, 'id');
			return s;
		});

		return U.Common.arrayUniqueObjects(sections, 'id');
	};

	dashboardSelect (element: string, openRoute?: boolean) {
		const { space } = S.Common;
		const { spaceview } = S.Block;
		const templateType = S.Record.getTemplateType();
		const subIds = [ 'searchObject' ];

		const onSelect = (object: any, update: boolean) => {
			C.WorkspaceSetInfo(space, { spaceDashboardId: object.id }, (message: any) => {
				if (message.error.code) {
					return;
				};

				S.Detail.update(J.Constant.subId.space, { id: spaceview, details: { spaceDashboardId: object.id } }, false);

				if (update) {
					S.Detail.update(U.Space.getSubSpaceSubId(space), { id: object.id, details: object }, false);
				};

				U.Data.createSubSpaceSubscriptions([ space ], () => {
					if (openRoute) {
						U.Space.openDashboard('route');
					};
				});
			});
		};

		let menuContext = null;

		analytics.event('ClickChangeSpaceDashboard');

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			subIds,
			onOpen: context => menuContext = context,
			onClose: () => S.Menu.closeAll(subIds),
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
						S.Menu.closeAll(subIds);
						return;
					};

					switch (item.id) {
						case I.HomePredefinedId.Existing: {
							S.Menu.open('searchObject', {
								element: `#${menuContext.getId()} #item-${item.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									filters: [
										{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts() },
										{ relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
									],
									canAdd: true,
									onSelect: el => {
										onSelect(el, true);
										menuContext.close();

										analytics.event('ChangeSpaceDashboard', { type: I.HomePredefinedId.Existing });
									},
								}
							});
							break;
						};
					};
				},
				onSelect: (e: any, item: any) => {
					if (item.arrow) {
						return;
					};

					switch (item.id) {
						case I.HomePredefinedId.Graph:
						case I.HomePredefinedId.Last: {
							onSelect({ id: item.id }, false);

							analytics.event('ChangeSpaceDashboard', { type: item.id });
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

	getInterfaceLanguages () {
		const ret: any[] = [];
		const Locale = require('lib/json/locale.json');

		for (const id of J.Lang.enabled) {
			ret.push({ id, name: Locale[id] });
		};

		return ret;
	};

	getSpellingLanguages () {
		let ret: any[] = [];

		ret = ret.concat(S.Common.languages || []);
		ret = ret.map(id => ({ id, name: J.Lang.spelling[id] }));
		ret.unshift({ id: '', name: translate('commonDisabled') });

		return ret;
	};

	getImportNames () {
		const r = {};
		r[I.ImportType.Notion] = 'Notion';
		r[I.ImportType.Markdown] = 'Markdown';
		r[I.ImportType.Html] = 'HTML';
		r[I.ImportType.Text] = 'TXT';
		r[I.ImportType.Protobuf] = 'Any-Block';
		r[I.ImportType.Csv] = 'CSV';
		return r;
	};

	getImportFormats () {
		const names = this.getImportNames();

		return ([
			{ id: 'notion', format: I.ImportType.Notion },
			{ id: 'markdown', format: I.ImportType.Markdown },
			{ id: 'html', format: I.ImportType.Html },
			{ id: 'text', format: I.ImportType.Text },
			{ id: 'protobuf', format: I.ImportType.Protobuf },
			{ id: 'csv', format: I.ImportType.Csv },
		] as any).map(it => {
			it.name = names[it.format];
			return it;
		});
	};

	spaceContext (space: any, param: any) {
		if (space.isPersonal) {
			return;
		};

		const { targetSpaceId } = space;
		const isOwner = U.Space.isMyOwner(targetSpaceId);
		const isLocalNetwork = U.Data.isLocalNetwork();
		const { isOnline } = S.Common;

		let options: any[] = [];

		if (isOwner && space.isShared && !isLocalNetwork && isOnline) {
			options.push({ id: 'revoke', name: translate('popupSettingsSpaceShareRevokeInvite') });
		};

		if (space.isAccountRemoving) {
			options = options.concat([
				{ id: 'remove', color: 'red', name: translate('commonDelete') },
			]);
		} else 
		if (space.isAccountJoining) {
			options.push({ id: 'cancel', color: 'red', name: translate('popupSettingsSpacesCancelRequest') });
		} else {
			options.push({ id: 'remove', color: 'red', name: isOwner ? translate('commonDelete') : translate('commonLeaveSpace') });
		};

		S.Menu.open('select', {
			...param,
			data: {
				options,
				onSelect: (e: any, element: any) => {
					window.setTimeout(() => {
						switch (element.id) {
							case 'export': {
								Action.export(targetSpaceId, [], I.ExportType.Protobuf, { 
									zip: true, 
									nested: true, 
									files: true, 
									archived: true, 
									json: false, 
									route: param.route,
								});
								break;
							};

							case 'remove': {
								Action.removeSpace(targetSpaceId, param.route);
								break;
							};

							case 'cancel': {
								C.SpaceJoinCancel(targetSpaceId, (message: any) => {
									if (message.error.code) {
										window.setTimeout(() => {
											S.Popup.open('confirm', { 
												data: {
													title: translate('commonError'),
													text: message.error.description,
												}
											});
										}, S.Popup.getTimeout());
									};
								});
								break;
							};

							case 'revoke': {
								Action.inviteRevoke(targetSpaceId);
								break;
							};
						};

					}, S.Menu.getTimeout());
				},
			},
		});
	};

	inviteContext (param: any) {
		const { isOnline } = S.Common;
		const { containerId, cid, key, onInviteRevoke } = param || {};
		const isOwner = U.Space.isMyOwner();
		const isLocalNetwork = U.Data.isLocalNetwork();

		const options: any[] = [
			{ id: 'qr', name: translate('popupSettingsSpaceShareShowQR') },
		];

		if (isOnline && isOwner && !isLocalNetwork) {
			options.push({ id: 'revoke', color: 'red', name: translate('popupSettingsSpaceShareRevokeInvite') });
		};

		S.Menu.open('select', {
			element: `#${containerId} #button-more-link`,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'qr': {
							S.Popup.open('inviteQr', { data: { link: U.Space.getInviteLink(cid, key) } });
							analytics.event('ClickSettingsSpaceShare', { type: 'Qr' });
							break;
						};

						case 'revoke': {
							Action.inviteRevoke(S.Common.space, onInviteRevoke);
							analytics.event('ClickSettingsSpaceShare', { type: 'Revoke' });
							break;
						};
					};
				},
			}
		});
	};

	getVaultItems () {
		const ids = Storage.get('spaceOrder') || [];
		const items = U.Common.objectCopy(U.Space.getList());

		items.push({ id: 'gallery', name: translate('commonGallery'), isButton: true });

		if (U.Space.canCreateSpace()) {
			items.push({ id: 'add', name: translate('commonCreateNew'), isButton: true });
		};

		if (ids && (ids.length > 0)) {
			items.sort((c1, c2) => {
				const i1 = ids.indexOf(c1.id);
				const i2 = ids.indexOf(c2.id);

				if (i1 > i2) return 1;
				if (i1 < i2) return -1;
				return 0;
			});
		};

		return items;
	};

	getFixedWidgets () {
		const { config } = S.Common;
		return [
			{ id: J.Constant.widgetId.favorite, name: translate('widgetFavorite'), iconEmoji: '⭐' },
			config.experimental ? { id: J.Constant.widgetId.chat, name: translate('widgetChat'), iconEmoji: '💬' } : null,
			{ id: J.Constant.widgetId.set, name: translate('widgetSet'), iconEmoji: '🔍' },
			{ id: J.Constant.widgetId.collection, name: translate('widgetCollection'), iconEmoji: '🗂️' },
			{ id: J.Constant.widgetId.recentEdit, name: translate('widgetRecent'), iconEmoji: '📝' },
			{ id: J.Constant.widgetId.recentOpen, name: translate('widgetRecentOpen'), iconEmoji: '📅', caption: translate('menuWidgetRecentOpenCaption') },
		].filter(it => it);
	};

	sortOrFilterRelationSelect (menuParam: any, param: any) {
		const { rootId, blockId, getView, onSelect } = param;
		const options = Relation.getFilterOptions(rootId, blockId, getView());

		let menuContext = null;

		const callBack = (item: any) => {
			onSelect(item);
			menuContext?.close();
		};

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		};

		const onOpen = context => {
			menuContext = context;

			if (menuParam.onOpen) {
				menuParam.onOpen(context);
			};
		};

		delete(menuParam.onOpen);

		S.Menu.open('select', {
			width: 256,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			noFlipY: true,
			onOpen,
			...menuParam,
			data: {
				options,
				withFilter: true,
				maxHeight: 378,
				noClose: true,
				withAdd: true,
				onSelect: (e: any, item: any) => {
					if (item.id == 'add') {
						this.sortOrFilterRelationAdd(menuContext, param, relation => callBack(relation));
					} else {
						callBack(item);
					};
				},
			}
		});
	};

	sortOrFilterRelationAdd (context: any, param: any, callBack: (relation: any) => void) {
		if (!context) {
			return;
		};

		const { rootId, blockId, getView } = param;
		const relations = Relation.getFilterOptions(rootId, blockId, getView());
		const element = `#${context.getId()} #item-add`;

		S.Menu.open('relationSuggest', {
			element,
			offsetX: context.getSize().width,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
			onOpen: () => $(element).addClass('active'),
			onClose: () => $(element).removeClass('active'),
			data: {
				rootId,
				blockId,
				skipKeys: relations.map(it => it.id),
				ref: 'dataview',
				menuIdEdit: 'blockRelationEdit',
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					Dataview.relationAdd(rootId, blockId, relation.relationKey, relations.length, getView(), (message: any) => {
						callBack(relation);
						S.Menu.close('relationSuggest');
					});
				}
			}
		});
	};

	sidebarModeOptions () {
		return [
			{ id: 'all', icon: 'all', name: translate('sidebarMenuAll') },
			{ id: 'sidebar', icon: 'sidebar', name: translate('sidebarMenuSidebar') },
		].map(it => ({ ...it, icon: `sidebar-${it.icon}` }));
	};

	sidebarContext (element: string) {
		const { showVault } = S.Common;
		const { isClosed, width } = sidebar.data;
		const options = this.sidebarModeOptions();
		const value = showVault ? 'all' : 'sidebar';

		S.Menu.open('selectSidebarToggle', {
			component: 'select',
			element,
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Right,
			noFlipX: true,
			data: {
				options,
				value,
				onSelect: (e: any, item: any) => {
					raf(() => {
						switch (item.id) {
							case 'all':
							case 'sidebar': {
								S.Common.showVaultSet(item.id == 'all');
								if (isClosed) {
									sidebar.open(width);
								} else {
									sidebar.resizePage(width, false);
								};
								break;
							};
						};
					});

					analytics.event('ChangeSidebarMode', { type: item.id });
				},
			},
		});
	};

	codeLangOptions (): I.Option[] {
		return [ { id: 'plain', name: translate('blockTextPlain') } ].concat(U.Prism.getTitles());
	};

	getObjectContainerSortOptions (type: I.ObjectContainerType, sortId: I.SortId, sortType: I.SortType, withOrphans: boolean, isCompact: boolean): any[] {
		const appearance = [
			{ name: translate('commonAppearance'), isSection: true },
			{ id: I.SortId.List, checkbox: !isCompact, name: translate('widget2Name') },
			{ id: I.SortId.Compact, checkbox: isCompact, name: translate('widget3Name') },
			{ isDiv: true },
		];

		let ret: any[] = [];
		let sort = [];
		let show = [];

		if ([ I.ObjectContainerType.Type, I.ObjectContainerType.Relation ].includes(type)) {
			sort = [
				{ name: translate('sidebarObjectSort'), isSection: true },
				{ id: I.SortId.Name, name: translate('commonName'), relationKey: 'name', isSort: true, defaultType: I.SortType.Asc },
				{ id: I.SortId.LastUsed, name: translate('sidebarObjectSortLastUsed'), relationKey: 'lastUsedDate', isSort: true, defaultType: I.SortType.Desc },
			];
		} else {
			show = [
				{ name: translate('sidebarObjectShow'), isSection: true },
				{ id: I.SortId.All, checkbox: !withOrphans, name: translate('commonAllContent') },
				{ id: I.SortId.Orphan, checkbox: withOrphans, name: translate('sidebarObjectOrphan') },
				{ isDiv: true },
			];

			sort = [
				{ name: translate('sidebarObjectSort'), isSection: true },
				{ id: I.SortId.Updated, name: translate('sidebarObjectSortUpdated'), relationKey: 'lastModifiedDate', isSort: true, defaultType: I.SortType.Desc },
				{ id: I.SortId.Created, name: translate('sidebarObjectSortCreated'), relationKey: 'createdDate', isSort: true, defaultType: I.SortType.Desc },
				{ id: I.SortId.Name, name: translate('commonName'), relationKey: 'name', isSort: true, defaultType: I.SortType.Asc },
			];
		};

		ret = ret.concat(show).concat(appearance).concat(sort);

		return ret.map(it => {
			it.type = I.SortType.Asc;
			if (it.id == sortId) {
				it.type = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
				it.sortArrow = sortType;
			};
			return it;
		});
	};

	dateFormatOptions () {
		return ([
			{ id: I.DateFormat.MonthAbbrBeforeDay },
			{ id: I.DateFormat.MonthAbbrAfterDay },
			{ id: I.DateFormat.Short },
			{ id: I.DateFormat.ShortUS },
			{ id: I.DateFormat.ISO },
		] as any[]).map(it => {
			it.name = U.Date.dateWithFormat(it.id, U.Date.now());
			return it;
		});
	};

	timeFormatOptions () {
		return [
			{ id: I.TimeFormat.H12, name: translate('menuDataviewDate12Hour') },
			{ id: I.TimeFormat.H24, name: translate('menuDataviewDate24Hour') },
		];
	};

};

export default new UtilMenu();
