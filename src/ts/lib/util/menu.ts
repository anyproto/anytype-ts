import $ from 'jquery';
import { arrayMove } from '@dnd-kit/sortable';
import { observable } from 'mobx';
import { I, C, S, U, J, M, keyboard, translate, Dataview, Action, analytics, Relation, sidebar } from 'Lib';

class UtilMenu {

	menuContext = null;

	/**
	 * Maps a block item, adding translation and aliases.
	 * @param {any} it - The block item.
	 * @returns {any} The mapped block item.
	 */
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
	
	/**
	 * Returns the list of text block types.
	 * @returns {any[]} The list of text block types.
	 */
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
	
	/**
	 * Returns the list of list block types.
	 * @returns {any[]} The list of list block types.
	 */
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

	/**
	 * Returns the list of media block types.
	 * @returns {any[]} The list of media block types.
	 */
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

	/**
	 * Returns the list of embed block types.
	 * @returns {any[]} The list of embed block types.
	 */
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
			{ id: I.EmbedProcessor.Drawio, name: 'Draw.io' },
			{ id: I.EmbedProcessor.Spotify, name: 'Spotify' },
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

	/**
	 * Returns the list of object block types.
	 * @returns {any[]} The list of object block types.
	 */
	getBlockObject () {
		const items = U.Data.getObjectTypesForNewObject({ withLists: true });
		const ret: any[] = [
			{ type: I.BlockType.Page, id: 'existingPage', icon: 'existing', lang: 'ExistingPage', arrow: true, aliases: [ 'link' ] },
			{ type: I.BlockType.File, id: 'existingFile', icon: 'existing', lang: 'ExistingFile', arrow: true, aliases: [ 'file' ] },
			{ id: 'date', icon: 'date', lang: 'Date', arrow: true },
		];

		let i = 0;
		for (const type of items) {
			ret.push({ 
				id: `object${i++}`, 
				type: I.BlockType.Page, 
				objectTypeId: type.id, 
				iconEmoji: type.iconEmoji, 
				iconName: type.iconName,
				iconOption: type.iconOption,
				name: U.Object.name(type), 
				description: type.description,
				isObject: true,
				isHidden: type.isHidden,
			});
		};

		return ret.map(this.mapperBlock);
	};

	/**
	 * Returns the list of other block types.
	 * @returns {any[]} The list of other block types.
	 */
	getBlockOther () {
		const aliasInline = [ 'grid', 'table', 'gallery', 'list', 'board', 'kanban', 'calendar', 'graph', 'inline', 'collection', 'set' ];

		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'divLine', lang: 'Line', aliases: [ 'hr', 'line divider' ] },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'divDot', lang: 'Dot', aliases: [ 'dot', 'dots divider' ] },
			{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents, icon: 'tableOfContents', lang: 'TableOfContents', aliases: [ 'tc', 'toc', 'table of contents'] },
			{ type: I.BlockType.Table, id: I.BlockType.Table, icon: 'table', lang: 'SimpleTable', aliases: [ 'table' ] },
			{ type: I.BlockType.Dataview, id: 'collection', icon: 'collection', lang: 'Collection', aliases: aliasInline },
			{ type: I.BlockType.Dataview, id: 'set', icon: 'set', lang: 'Set', aliases: aliasInline },
		].map(this.mapperBlock);
	};

	/**
	 * Returns the list of page types for the turn menu.
	 * @returns {any[]} The list of page types.
	 */
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
	
	/**
	 * Returns the list of div types for the turn menu.
	 * @returns {any[]} The list of div types.
	 */
	getTurnDiv () {
		return [
			{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'divLine', lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'divDot', lang: 'Dot' },
		].map(this.mapperBlock);
	};

	/**
	 * Returns the list of file types for the turn menu.
	 * @returns {any[]} The list of file types.
	 */
	getTurnFile () {
		return [
			{ type: I.BlockType.File, id: I.FileStyle.Link, lang: 'Link' },
			{ type: I.BlockType.File, id: I.FileStyle.Embed, lang: 'Embed' },
		].map(this.mapperBlock);
	};

	/**
	 * Returns the list of actions for the action menu.
	 * @param {any} param - The action menu parameters.
	 * @returns {any[]} The list of actions.
	 */
	getActions (param: any) {
		const { rootId, blockId, hasText, hasFile, hasLink, hasBookmark, hasDataview, hasTurnObject, count } = param;
		const cmd = keyboard.cmdSymbol();
		const copyName = `${translate('commonDuplicate')} ${U.Common.plural(count, translate('pluralBlock'))}`;
		const items: any[] = [
			{ id: 'remove', icon: 'remove', name: `${translate('commonDelete')} ${U.Common.plural(count, translate('pluralLCBlock'))}`, caption: 'Del' },
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

	getFeaturedRelationLayout () {
		return [
			{ id: I.FeaturedRelationLayout.Inline },
			{ id: I.FeaturedRelationLayout.Column },
		].map((it: any) => {
			it.name = translate(`commonFeaturedRelationLayout${I.FeaturedRelationLayout[it.id]}`);
			return it;
		});
	};

	getLayoutIcon (layout: I.ObjectLayout) {
		return `layout c-${I.ObjectLayout[layout].toLowerCase()}`;
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
			icon: this.getLayoutIcon(it.id),
			name: translate(`layout${it.id}`),
		}));
	};

	turnLayouts () {
		const allowed = U.Object.getPageLayouts();
		return this.getLayouts().filter(it => allowed.includes(it.id));
	};

	getViews () {
		const { config } = S.Common;

		return [
			{ id: I.ViewType.Grid },
			{ id: I.ViewType.Gallery },
			{ id: I.ViewType.List },
			{ id: I.ViewType.Board },
			{ id: I.ViewType.Calendar },
			{ id: I.ViewType.Graph },
			config.experimental ? { id: I.ViewType.Timeline } : null,
		].filter(it => it).map(it => ({ ...it, name: translate(`viewName${it.id}`) }));
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
							case 'edit': {
								$(`#button-${blockId}-settings`).trigger('click');
								S.Menu.updateData('dataviewViewSettings', { view: observable.box(new M.View(view)) });
								break;
							};

							case 'copy': {
								onCopy(view); 
								break;
							};

							case 'remove': {
								onRemove(view); 
								break;
							};
						};
					}, S.Menu.getTimeout());
				}
			}
		});
	};

	getRelationTypes () {
		return this.prepareForSelect([
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
		}));
	};

	getWidgetLimitOptions (layout: I.WidgetLayout) {
		let options = [];
		switch (layout) {
			default: {
				options = [ 6, 10, 14, 30, 50 ];
				break;
			};

			case I.WidgetLayout.List: {
				options = [ 4, 6, 8, 30, 50 ];
				break;
			};
		};
		return this.prepareForSelect(options.map(id => ({ id, name: id })));
	};

	getWidgetLayoutOptions (id: string, layout: I.ObjectLayout, isPreview?: boolean) {
		const isSystem = this.isSystemWidget(id);
		
		let options = [
			I.WidgetLayout.Compact,
			I.WidgetLayout.List,
			I.WidgetLayout.Tree,
		];
		if (!isSystem && !isPreview) {
			options.push(I.WidgetLayout.Link);
		};

		if (id && !isSystem) {
			const isSet = U.Object.isInSetLayouts(layout);
			const setLayouts = U.Object.getSetLayouts();
			const treeSkipLayouts = setLayouts.
				concat(U.Object.getFileAndSystemLayouts()).
				concat([ I.ObjectLayout.Participant, I.ObjectLayout.Date, I.ObjectLayout.Chat ]);

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
		const spaceview = U.Space.getSpaceview();
		const subIds = [ 'searchObject' ];

		const onSelect = (object: any, update: boolean) => {
			C.WorkspaceSetInfo(space, { spaceDashboardId: object.id }, (message: any) => {
				if (message.error.code) {
					return;
				};

				S.Detail.update(J.Constant.subId.space, { id: spaceview.id, details: { spaceDashboardId: object.id } }, false);

				if (update) {
					S.Detail.update(U.Space.getSubSpaceSubId(space), { id: object.id, details: object }, false);
				};

				U.Subscription.createSubSpace([ space ], () => {
					if (openRoute) {
						U.Space.openDashboard({ replace: false });
					};
				});
			});
		};

		let options = [];
		if (spaceview.isChat) {
			options.push({ id: I.HomePredefinedId.Chat, name: translate('commonChat') });
		} else {
			options = [
				{ id: I.HomePredefinedId.Graph, name: translate('commonGraph') },
				{ id: I.HomePredefinedId.Last, name: translate('spaceLast') },
				{ id: I.HomePredefinedId.Existing, name: translate('spaceExisting'), arrow: true },
			];
		};

		analytics.event('ClickChangeSpaceDashboard');

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Right,
			subIds,
			onOpen: context => this.setContext(context),
			onClose: () => S.Menu.closeAll(subIds),
			data: {
				options,
				onOver: (e: any, item: any) => {
					if (!this.menuContext) {
						return;
					};

					if (!item.arrow) {
						S.Menu.closeAll(subIds);
						return;
					};

					switch (item.id) {
						case I.HomePredefinedId.Existing: {
							S.Menu.open('searchObject', {
								element: `#${this.menuContext.getId()} #item-${item.id}`,
								offsetX: this.menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									withPlural: true,
									filters: [
										{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts().concat(I.ObjectLayout.Participant).filter(it => !U.Object.isTypeLayout(it)) },
										{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
									],
									canAdd: true,
									onSelect: el => {
										onSelect(el, true);
										this.menuContext?.close();

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
						case I.HomePredefinedId.Chat:
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
		r[I.ImportType.Protobuf] = 'Anytype';
		r[I.ImportType.Csv] = 'CSV';
		r[I.ImportType.Obsidian] = 'Obsidian';
		return r;
	};

	getImportFormats () {
		const names = this.getImportNames();

		return ([
			{ id: 'obsidian', format: I.ImportType.Obsidian, isApp: true },
			{ id: 'notion', format: I.ImportType.Notion, isApp: true },
			{ id: 'protobuf', format: I.ImportType.Protobuf, isApp: true },

			{ id: 'markdown', format: I.ImportType.Markdown },
			{ id: 'html', format: I.ImportType.Html },
			{ id: 'text', format: I.ImportType.Text },
			{ id: 'csv', format: I.ImportType.Csv },
		] as any).map(it => {
			it.name = names[it.format];
			return it;
		});
	};

	spaceContext (space: any, menuParam: Partial<I.MenuParam>, param?: any) {
		param = param || {};

		const { targetSpaceId } = space;
		const options: any[] = [];
		const isLoading = space.isAccountLoading || space.isLocalLoading;

		if (!param.noPin) {
			if (space.orderId) {
				options.push({ id: 'unpin', icon: 'unpin', name: translate('commonUnpin') });
			} else { 
				options.push({ id: 'pin', icon: 'pin', name: translate('commonPin') });
			};
		};

		if (space.chatId) {
			if ([ I.NotificationMode.Nothing, I.NotificationMode.Mentions ].includes(space.notificationMode)) {
				options.push({ id: 'unmute', icon: 'unmute', name: translate('commonUnmute') });
			} else {
				options.push({ id: 'mute', icon: 'mute', name: translate('commonMute') });
			};
		};

		if (options.length && !param.noDivider) {
			options.push({ isDiv: true });
		};

		if (isLoading) {
			options.push({ id: 'remove', icon: 'remove-red', name: translate('pageSettingsSpaceDeleteSpace'), color: 'red' });
		} else {
			options.push({ id: 'settings', icon: 'settings', name: translate('popupSettingsSpaceIndexTitle') });
		};

		S.Menu.open('select', {
			...menuParam,
			data: {
				options,
				onSelect: (e: any, element: any) => {
					window.setTimeout(() => {
						switch (element.id) {
							case 'mute':
							case 'unmute': {
								const mode = element.id == 'mute' ? I.NotificationMode.Mentions : I.NotificationMode.All;

								C.PushNotificationSetSpaceMode(targetSpaceId, mode);
								analytics.event('ChangeMessageNotificationState', { type: mode, route: param.route });
								break;
							};

							case 'pin': {
								const items: any[] = this.getVaultItems().filter(it => it.isPinned);
								const newItems = [ space ].concat(items);

								U.Data.sortByOrderIdRequest(J.Constant.subId.space, newItems, callBack => {
									C.SpaceSetOrder(space.id, newItems.map(it => it.id), callBack);
								});

								analytics.event('PinSpace', { route: param.route });
								break;
							};

							case 'unpin': {
								C.SpaceUnsetOrder(space.id);
								analytics.event('UnpinSpace', { route: param.route });
								break;
							};

							case 'settings': {
								const routeParam = { 
									replace: true, 
									onFadeIn: () => U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings }),
								};
		
								U.Router.switchSpace(targetSpaceId, '', false, routeParam, true);
								break;
							};

							case 'remove': {
								Action.removeSpace(space.targetSpaceId, param.route, true);
								break;
							};

						};

					}, S.Menu.getTimeout());
				},
			},
		});
	};

	inviteContext (param: any) {
		const { containerId, cid, key } = param || {};
		const options: any[] = [
			{ id: 'qr', name: translate('popupSettingsSpaceShareQRCode') },
		];

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
							analytics.event('ScreenQr', { route: analytics.route.inviteLink });
							break;
						};
					};
				},
			}
		});
	};

	getVaultItems () {
		const { account } = S.Auth;
		if (!account) {
			return [];
		};

		const items = U.Common.objectCopy(U.Space.getList()).
			map(it => {
				const counters = S.Chat.getSpaceCounters(it.targetSpaceId);

				it.counter = counters.mentionCounter || counters.messageCounter;
				it.lastMessageDate = S.Chat.getSpaceLastMessageDate(it.targetSpaceId);
				it.isPinned = !!it.orderId;
				return it;
			});

		items.sort((c1, c2) => {
			if (c1.isPinned && !c2.isPinned) return -1;
			if (!c1.isPinned && c2.isPinned) return 1;

			const o = U.Data.sortByOrderId(c1, c2);
			if (o) {
				return o;
			};

			const d1 = c1.lastMessageDate || c1.spaceJoinDate;
			const d2 = c2.lastMessageDate || c2.spaceJoinDate;

			if (d1 > d2) return -1;
			if (d1 < d2) return 1;

			if (c1.counter && !c2.counter) return -1;
			if (!c1.counter && c2.counter) return 1;

			if (c1.creationDate > c2.creationDate) return -1;
			if (c1.creationDate < c2.creationDate) return 1;
			return 0;
		});

		/*
		console.log(JSON.stringify(items.map(it => 
			`${it.name} 
			p: ${it.isPinned}
			o: ${it.orderId}
			lm: ${U.Date.dateWithFormat(I.DateFormat.European, it.lastMessageDate)} 
			jd: ${U.Date.dateWithFormat(I.DateFormat.European, it.spaceJoinDate)} 
			c: ${it.counter} 
			cd: ${U.Date.dateWithFormat(I.DateFormat.European, it.spaceJoinDate)}
		`), null, 2).replace(/\\n/g, ' ').replace(/\\t/g, ''));
		*/

		return items;
	};

	getSystemWidgets () {
		return [
			{ id: J.Constant.widgetId.favorite, name: translate('widgetFavorite'), icon: 'widget-pin' },
			{ id: J.Constant.widgetId.recentEdit, name: translate('widgetRecent'), icon: 'widget-pencil' },
			{ id: J.Constant.widgetId.recentOpen, name: translate('widgetRecentOpen'), icon: 'widget-eye', caption: translate('menuWidgetRecentOpenCaption') },
			{ id: J.Constant.widgetId.bin, name: translate('commonBin'), icon: 'widget-bin', layout: I.ObjectLayout.Archive },
		].filter(it => it).map(it => ({ ...it, isSystem: true }));
	};

	sortOrFilterRelationSelect (menuParam: Partial<I.MenuParam>, param: any) {
		const { rootId, blockId, getView, onSelect } = param;
		const options = Relation.getFilterOptions(rootId, blockId, getView());

		const callBack = (item: any) => {
			onSelect(item);
			this.menuContext?.close();
		};

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		};

		const onOpen = context => {
			this.setContext(context);

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
						this.sortOrFilterRelationAdd(this.menuContext, param, menuParam, relation => callBack(relation));
					} else {
						callBack(item);
					};
				},
			}
		});
	};

	sortOrFilterRelationAdd (context: any, param: any, menuParam: Partial<I.MenuParam>, callBack: (relation: any) => void) {
		if (!context) {
			return;
		};

		const { rootId, blockId, getView } = param;
		const relations = Relation.getFilterOptions(rootId, blockId, getView());
		const element = `#${context.getId()} #item-add`;

		S.Menu.open('relationSuggest', {
			...menuParam,
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

	getLibrarySortOptions (sortId: I.SortId, sortType: I.SortType): any[] {
		const sort: any[] = [
			{ name: translate('sidebarObjectSort'), isSection: true },
			{ id: I.SortId.Name, name: translate('commonName'), relationKey: 'name', isSort: true, defaultType: I.SortType.Asc },
			{ id: I.SortId.LastUsed, name: translate('sidebarObjectSortLastUsed'), relationKey: 'lastUsedDate', isSort: true, defaultType: I.SortType.Desc },
		];

		return sort.map(it => {
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
			{ id: I.DateFormat.Default },
			{ id: I.DateFormat.MonthAbbrBeforeDay },
			{ id: I.DateFormat.MonthAbbrAfterDay },
			{ id: I.DateFormat.Short },
			{ id: I.DateFormat.ShortUS },
			{ id: I.DateFormat.ISO },
			{ id: I.DateFormat.Long },
			{ id: I.DateFormat.Nordic },
			{ id: I.DateFormat.European },
		] as any[]).map(it => {
			it.name = U.Date.dateWithFormat(it.id, U.Date.now());
			return it;
		});
	};

	timeFormatOptions () {
		return [
			{ id: I.TimeFormat.H12, name: translate('timeFormat12') },
			{ id: I.TimeFormat.H24, name: translate('timeFormat24') },
		];
	};

	participant (object: any, param: Partial<I.MenuParam>) {
		S.Menu.open('participant', {
			className: 'fixed',
			classNameWrap: 'fromPopup',
			horizontal: I.MenuDirection.Center,
			rect: { 
				x: keyboard.mouse.page.x, 
				y: keyboard.mouse.page.y + 10, 
				width: 0, 
				height: 0,
			},
			...param,
			data: {
				object,
			}
		});
	};

	getFormulaSections (relationKey: string) {
		const relation = S.Record.getRelationByKey(relationKey);
		const options = Relation.formulaByType(relationKey, relation.format);

		return [
			{ id: I.FormulaSection.None, name: translate('commonNone') },
		].concat([
			{ id: I.FormulaSection.Count, name: translate('formulaCount'), arrow: true },
			{ id: I.FormulaSection.Percent, name: translate('formulaPercentage'), arrow: true },
			{ id: I.FormulaSection.Math, name: translate('formulaMath'), arrow: true },
			{ id: I.FormulaSection.Date, name: translate('formulaDate'), arrow: true },
		].filter(s => {
			return options.filter(it => it.section == s.id).length;
		})).map(it => ({ ...it, checkbox: false }));
	};

	prepareForSelect (a: any[]) {
		return a.map(it => ({ ...it, id: String(it.id) }));
	};

	typeSuggest (param: Partial<I.MenuParam>, details: any, flags: { selectTemplate?: boolean, deleteEmpty?: boolean, withImport?: boolean, noButtons?: boolean }, route: string, callBack?: (item: any) => void) {
		param = param || {};
		param.data = param.data || {};
		details = details || {};
		flags = flags || {};

		const objectFlags: I.ObjectFlag[] = [];

		if (flags.selectTemplate) {
			objectFlags.push(I.ObjectFlag.SelectTemplate);
		};

		if (flags.deleteEmpty) {
			objectFlags.push(I.ObjectFlag.DeleteEmpty);
		};

		const onImport = (e: MouseEvent) => {
			e.stopPropagation();
			U.Object.openRoute({ id: 'importIndex', layout: I.ObjectLayout.Settings });
		};

		const getClipboardData = async () => {
			let ret = [];
			try { ret = await navigator.clipboard.read(); } catch (e) { /**/ };
			return ret;
		};

		const onPaste = async () => {
			const type = S.Record.getTypeById(S.Common.type);
			const data = await getClipboardData();

			data.forEach(async item => {
				let text = '';
				let html = '';

				if (item.types.includes('text/plain')) {
					const textBlob = await item.getType('text/plain');

					if (textBlob) {
						text = await textBlob.text();
					};
				};

				if (item.types.includes('text/html')) {
					const htmlBlob = await item.getType('text/html');

					if (htmlBlob) {
						html = await htmlBlob.text();
					};
				};

				if (!text && !html) {
					return;
				};

				const url = U.Common.matchUrl(text);
				const cb = (object: any, time: number) => {
					if (callBack) {
						callBack(object);
					};

					analytics.createObject(object.type, object.layout, route, time);
				};

				if (url) {
					const bookmark = S.Record.getBookmarkType();

					C.ObjectCreateFromUrl(details, S.Common.space, bookmark?.uniqueKey, url, true, bookmark?.defaultTemplateId, (message: any) => {
						cb(message.details, message.middleTime);
					});
				} else {
					C.ObjectCreate(details, objectFlags, type?.defaultTemplateId, type?.uniqueKey, S.Common.space, (message: any) => {
						if (message.error.code) {
							return;
						};

						const object = message.details;
						C.BlockPaste (object.id, '', { from: 0, to: 0 }, [], false, { html, text }, '', () => cb(object, message.middleTime));
					});
				};
			});
		};

		const onMore = (e: MouseEvent, context: any, item: any) => {
			e.stopPropagation();

			const { props } = context;
			const { className, classNameWrap } = props.param;
			const type = S.Record.getTypeById(item.id);
			const canDefault = !U.Object.isInSetLayouts(item.recommendedLayout) && !U.Object.isChatLayout(item.recommendedLayout) && (type.id != S.Common.type);
			const canDelete = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
			const route = '';

			let options: any[] = [
				canDefault ? { id: 'default', name: translate('commonSetDefault') } : null,
				{ id: 'open', name: translate('commonOpenType') },
			];

			if (canDelete) {
				options = options.concat([
					{ isDiv: true },
					{ id: 'remove', name: translate('commonDelete'), color: 'red' },
				]);
			};

			S.Menu.open('select', {
				element: `#${props.getId()} #item-${item.id} .icon.more`,
				horizontal: I.MenuDirection.Center,
				offsetY: 4,
				className,
				classNameWrap,
				data: {
					options,
					onSelect: (event: any, element: any) => {
						switch (element.id) {

							case 'open': {
								U.Object.openAuto(item);
								break;
							};

							case 'default': {
								S.Common.typeSet(item.uniqueKey);
								analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route });
								context.forceUpdate();
								break;
							};

							case 'remove': {
								if (S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ])) {
									Action.archive([ item.id ], route);
								};
								break;
							};
						};
					}
				}
			});
		};

		const check = async () => {
			const items = await getClipboardData();
			const buttons: any[] = [];

			if (!flags.noButtons) {
				buttons.push({ 
					id: 'add', icon: 'plus', onClick: () => {
						U.Object.createType({ name: this.menuContext?.ref?.getData().filter }, keyboard.isPopup());
						this.menuContext?.close();

						if (param.data.onAdd) {
							param.data.onAdd();
						};
					}, 
				});

				if (flags.withImport) {
					buttons.push({ id: 'import', icon: 'import', name: translate('commonImport'), onClick: onImport, isButton: true });
				};

				if (items.length) {
					buttons.unshift({ id: 'clipboard', icon: 'clipboard', name: translate('widgetItemClipboard'), onClick: onPaste, isButton: true });
				};
			};

			S.Menu.open('typeSuggest', {
				...param,
				onOpen: context => {
					this.setContext(context);

					if (param.onOpen) {
						param.onOpen(context);
					};
				},
				data: {
					noStore: true,
					canAdd: true,
					noClose: true,
					onMore,
					buttons,
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getLayoutsForTypeSelection() },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] }
					],
					onClick: (item: any) => {
						const cb = (object: any, time: number) => {
							if (callBack) {
								callBack(object);
							};

							analytics.event('SelectObjectType', { objectType: object.type });
							analytics.createObject(object.type, object.layout, route, time);

							this.menuContext?.close();
						};

						if (U.Object.isBookmarkLayout(item.recommendedLayout) || U.Object.isChatLayout(item.recommendedLayout)) {
							this.menuContext?.close();

							window.setTimeout(() => {
								if (U.Object.isBookmarkLayout(item.recommendedLayout)) {
									this.onBookmarkMenu({ ...param, data: { details }}, object => cb(object, 0));
								} else
								if (U.Object.isChatLayout(item.recommendedLayout)) {
									this.onChatMenu({ ...param, data: { details }}, object => cb(object, 0));
								};
							}, S.Menu.getTimeout());
						} else {
							C.ObjectCreate(details, objectFlags, item.defaultTemplateId, item.uniqueKey, S.Common.space, (message: any) => {
								if (!message.error.code) {
									cb(message.details, message.middleTime);
								};
							});
						};
					},
				},
			});
		};

		check();
	};

	onBookmarkMenu (param?: Partial<I.MenuParam>, callBack?: (bookmark: any) => void) {
		param = param || {};

		const data = param.data || {};

		delete(param.data);

		S.Menu.open('dataviewCreateBookmark', {
			horizontal: I.MenuDirection.Center,
			data: {
				onSubmit: callBack,
				...data,
			},
			...param,
		});
	};

	onChatMenu (param?: Partial<I.MenuParam>, callBack?: (bookmark: any) => void) {
		param = param || {};

		const data = param.data || {};

		delete(param.data);

		S.Menu.open('chatCreate', {
			horizontal: I.MenuDirection.Center,
			data: {
				onSubmit: callBack,
				...data,
			},
			...param,
		});
	};

	setContext (context: any) {
		this.menuContext = context;
	};

	spaceCreate (param: I.MenuParam, route) {
		const ids = [ 'chat', 'space', 'join' ];
		const options = ids.map(id => {
			const suffix = U.Common.toUpperCamelCase(id);

			let name = '';
			let icon = '';
			let description = '';
			let withDescription = false;

			if (id != 'join') {
				name = translate(`sidebarMenuSpaceCreateTitle${suffix}`);
				description = translate(`sidebarMenuSpaceCreateDescription${suffix}`);
				withDescription = true;
				icon = id;
			};

			return {
				id,
				icon,
				name: translate(`sidebarMenuSpaceCreateTitle${suffix}`),
				description,
				withDescription,
			};
		});

		let prefix = '';
		switch (route) {
			case analytics.route.void: {
				prefix = 'Void';
				break;
			};

			case analytics.route.vault: {
				prefix = 'Vault';
				break;
			};
		};

		S.Menu.open('select', {
			...param,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'chat': {
							Action.createSpace(I.SpaceUxType.Chat, route);
							break;
						};

						case 'space': {
							Action.createSpace(I.SpaceUxType.Data, route);
							break;
						};

						case 'join': {
							S.Popup.closeAll(null, () => S.Popup.open('spaceJoinByLink', {}));
							break;
						};
					};

					analytics.event(`Click${prefix}CreateMenu${U.Common.toUpperCamelCase(item.id)}`);
				},
			}
		});

		analytics.event(`Screen${prefix}CreateMenu`);
	};

};

export default new UtilMenu();