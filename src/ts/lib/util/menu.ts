import $ from 'jquery';
import { I, C, keyboard, translate, UtilCommon, UtilData, UtilObject, UtilSpace, Relation, Dataview, Action, analytics } from 'Lib';
import { blockStore, menuStore, detailStore, commonStore, dbStore, authStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

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

			if (commonStore.interfaceLang != Constant.default.interfaceLang) {
				it.aliases.push(translate(nameKey, Constant.default.interfaceLang));
				it.aliases.push(translate(descriptionKey, Constant.default.interfaceLang));
				it.aliases = UtilCommon.arrayUnique(it.aliases);
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
			it.icon = UtilData.blockTextClass(it.id);
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
			it.icon = UtilData.blockTextClass(it.id);
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
		const { config } = commonStore;

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
				{ id: I.EmbedProcessor.Excalidraw, name: 'Excalidraw' },
				{ id: I.EmbedProcessor.Reddit, name: 'Reddit' },
			]);
		};

		return ret.map(this.mapperBlock).map(it => {
			it.type = I.BlockType.Embed;
			it.icon = `embed-${UtilCommon.toCamelCase(`-${I.EmbedProcessor[it.id]}`)}`;
			return it;
		});
	};

	getBlockObject () {
		const { config } = commonStore;
		const items = UtilData.getObjectTypesForNewObject({ withSet: true, withCollection: true });
		const ret: any[] = [
			{ type: I.BlockType.Page, id: 'existingPage', icon: 'existing', lang: 'ExistingPage', arrow: true, aliases: [ 'link' ] },
		];

		if (config.experimental) {
			ret.push({ type: I.BlockType.File, id: 'existingFile', icon: 'existing', lang: 'ExistingFile', arrow: true, aliases: [ 'file' ] });
		};

		items.sort((c1, c2) => UtilData.sortByNumericKey('lastUsedDate', c1, c2, I.SortType.Desc));

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
		const types = UtilData.getObjectTypesForNewObject(); 

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
		const { rootId, blockId, hasText, hasFile, hasBookmark, hasDataview, hasTurnObject } = param;
		const cmd = keyboard.cmdSymbol();

		let items: any[] = [
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
			items = items.concat([
				{ id: 'download', icon: 'download', name: translate('commonDownload') },
				//{ id: 'rename', icon: 'rename', name: translate('libMenuRename') ),
				//{ id: 'replace', icon: 'replace', name: translate('libMenuReplace') },
			]);
		};

		if (hasDataview) {
			const isCollection = Dataview.isCollection(rootId, blockId);
			const sourceName = isCollection ? translate('commonCollection') : translate('commonSet');

			items.push({ id: 'dataviewSource', icon: 'source', name: UtilCommon.sprintf(translate('libMenuChangeSource'), sourceName), arrow: true });
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
		for (const color of Constant.textColor) {
			items.push({ id: `color-${color}`, name: translate(`textColor-${color}`), value: color, className: color, isTextColor: true });
		};
		return items;
	};
	
	getBgColors () {
		const items: any[] = [
			{ id: 'bgColor-default', name: translate('commonDefault'), value: '', className: 'default', isBgColor: true }
		];
		for (const color of Constant.textColor) {
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
			it.icon = UtilData.alignHIcon(it.id);
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
			it.icon = UtilData.alignVIcon(it.id);
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
		const allowed = [ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task, I.ObjectLayout.Note ];
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
		const views = dbStore.getViews(rootId, blockId);

		const options: any[] = [
			{ id: 'edit', icon: 'viewSettings', name: translate('menuDataviewViewEditView') },
			{ id: 'copy', icon: 'copy', name: translate('commonDuplicate') },
		];

		if (views.length > 1) {
			options.push({ id: 'remove', icon: 'remove', name: translate('commonDelete') });
		};

		menuStore.open('select', {
			...menuParam,
			data: {
				options,
				onSelect: (e, option) => {
					menuStore.closeAll([ 'select' ]);
					if (close) {
						close();
					};

					window.setTimeout(() => {
						switch (option.id) {
							case 'edit': $(`#button-${blockId}-settings`).trigger('click'); break;
							case 'copy': onCopy(view); break;
							case 'remove': onRemove(view); break;
						};
					}, menuStore.getTimeout());
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
		const f = UtilCommon.regexEscape(filter);
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
		const { space } = commonStore;
		const { spaceview } = blockStore;
		const templateType = dbStore.getTemplateType();
		const subIds = [ 'searchObject' ];

		const onSelect = (object: any, update: boolean) => {
			C.WorkspaceSetInfo(space, { spaceDashboardId: object.id }, (message: any) => {
				if (message.error.code) {
					return;
				};

				detailStore.update(Constant.subId.space, { id: spaceview, details: { spaceDashboardId: object.id } }, false);

				if (update) {
					detailStore.update(Constant.subId.space, { id: object.id, details: object }, false);
				};

				if (openRoute) {
					UtilSpace.openDashboard('route');
				};
			});
		};

		let menuContext = null;

		menuStore.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			subIds,
			onOpen: context => menuContext = context,
			onClose: () => menuStore.closeAll(subIds),
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
						menuStore.closeAll(subIds);
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
										{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
										{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
									],
									canAdd: true,
									onSelect: el => onSelect(el, true),
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

		for (const id of Constant.enabledInterfaceLang) {
			ret.push({ id, name: Locale[id] });
		};

		return ret;
	};

	getSpellingLanguages () {
		let ret: any[] = [];

		ret = ret.concat(commonStore.languages || []);
		ret = ret.map(id => ({ id, name: Constant.spellingLang[id] }));
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
		const { accountSpaceId } = authStore;
		const { targetSpaceId } = space;

		if ((targetSpaceId == accountSpaceId)) {
			return;
		};

		const isOwner = UtilSpace.isMyOwner(targetSpaceId);
		const isLocalNetwork = UtilData.isLocalNetwork();
		const { isOnline } = commonStore;

		let options: any[] = [];

		if (isOwner && space.isShared && !isLocalNetwork && isOnline) {
			options.push({ id: 'revoke', name: translate('popupSettingsSpaceShareRevokeInvite') });
		};

		if (space.isAccountRemoving) {
			options = options.concat([
				{ id: 'export', name: translate('popupSettingsSpaceIndexExport') },
				{ id: 'remove', color: 'red', name: translate('commonDelete') },
			]);
		} else 
		if (space.isAccountJoining) {
			options.push({ id: 'cancel', color: 'red', name: translate('popupSettingsSpacesCancelRequest') });
		} else {
			options.push({ id: 'remove', color: 'red', name: isOwner ? translate('commonDelete') : translate('commonLeaveSpace') });
		};

		menuStore.open('select', {
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
											popupStore.open('confirm', { 
												data: {
													title: translate('commonError'),
													text: message.error.description,
												}
											});
										}, popupStore.getTimeout());
									};
								});
								break;
							};

							case 'revoke': {
								Action.inviteRevoke(targetSpaceId);
								break;
							};
						};

					}, menuStore.getTimeout());
				},
			},
		});
	};

	inviteContext (param: any) {
		const { isOnline } = commonStore
		const { containerId, cid, key, onInviteRevoke } = param || {};
		const isOwner = UtilSpace.isMyOwner();
		const isLocalNetwork = UtilData.isLocalNetwork();

		const options: any[] = [
			{ id: 'qr', name: translate('popupSettingsSpaceShareShowQR') },
		];

		if (isOnline && isOwner && !isLocalNetwork) {
			options.push({ id: 'revoke', color: 'red', name: translate('popupSettingsSpaceShareRevokeInvite') });
		};

		menuStore.open('select', {
			element: `#${containerId} #button-more-link`,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'qr': {
							popupStore.open('inviteQr', { data: { link: UtilSpace.getInviteLink(cid, key) } });
							analytics.event('ClickSettingsSpaceShare', { type: 'Qr' });
							break;
						};

						case 'revoke': {
							Action.inviteRevoke(commonStore.space, onInviteRevoke);
							analytics.event('ClickSettingsSpaceShare', { type: 'Revoke' });
							break;
						};
					};
				},
			}
		});
	};

};

export default new UtilMenu();
