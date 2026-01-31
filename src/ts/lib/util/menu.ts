import $ from 'jquery';
import { observable } from 'mobx';
import { Action, analytics, C, Dataview, I, J, keyboard, M, Preview, Relation, S, sidebar, translate, U, Renderer } from 'Lib';
import React from 'react';

interface SpaceContextParam {
	isSharePage?: boolean;
	noManage?: boolean;
	noMembers?: boolean;
	withPin?: boolean;
	withDelete?: boolean;
	withOpenNewTab?: boolean;
	withSearch?: boolean;
	noShare?: boolean;
	route: string;
};

/**
 * UtilMenu provides utilities for generating menu items and handling menu operations.
 *
 * Key responsibilities:
 * - Block menu items (text, list, media, embed, link, object blocks)
 * - Turn/transform menu items (converting blocks between types)
 * - Action menu items (copy, paste, delete, move)
 * - Color and alignment options
 * - Widget and dataview configuration menus
 * - Space context menus and settings
 * - Import/export format options
 *
 * Most methods return arrays of menu items with standardized structure
 * including id, name, icon, and optional descriptions/callbacks.
 */
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
			{ id: I.EmbedProcessor.Excalidraw, name: 'Excalidraw' },
			{ id: I.EmbedProcessor.Spotify, name: 'Spotify' },
			{ id: I.EmbedProcessor.AppleMusic, name: 'Apple Music' },
			{ id: I.EmbedProcessor.Bandcamp, name: 'Bandcamp' },
			{ id: I.EmbedProcessor.Reddit, name: 'Reddit' },
		];

		if (config.experimental) {
			ret = ret.concat([
				{ id: I.EmbedProcessor.Image, name: translate('blockEmbedExternalImage') },
			]);
		};

		return ret.map(this.mapperBlock).map(it => {
			it.type = I.BlockType.Embed;
			it.icon = `embed-${U.String.toCamelCase(`-${I.EmbedProcessor[it.id]}`)}`;
			return it;
		});
	};

	/**
	 * Returns the list of link block types.
	 * @returns {any[]} The list of object block types.
	 */
	getBlockLink () {
		return [
			{ type: I.BlockType.Page, id: 'existingPage', icon: 'existing', lang: 'ExistingPage', arrow: true, aliases: [ 'link' ] },
			{ type: I.BlockType.File, id: 'existingFile', icon: 'existing', lang: 'ExistingFile', arrow: true, aliases: [ 'file' ] },
			{ id: 'date', icon: 'date', lang: 'Date', arrow: true },
		].map((it: any) => {
			it = this.mapperBlock(it);

			it.isAction = true;
			it.skipOver = true;
			return it;
		});
	};

	/**
	 * Returns the list of object block types.
	 * @returns {any[]} The list of object block types.
	 */
	getBlockObject () {
		const items = U.Data.getObjectTypesForNewObject({ withLists: true, withChat: true });
		const ret: any[] = [];

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
		const aliasInline = [ 'grid', 'table', 'gallery', 'board', 'kanban', 'calendar', 'graph', 'inline', 'collection', 'set' ];

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
		const { rootId, blockId, hasText, hasFile, hasCopyMedia, hasBookmark, hasDataview, hasTurnObject, count } = param;
		const cmd = keyboard.cmdSymbol();
		const copyName = `${translate('commonDuplicate')} ${U.Common.plural(count, translate('pluralBlock'))}`;
		const items: any[] = [
			{ id: 'remove', icon: 'remove', name: `${translate('commonDelete')} ${U.Common.plural(count, translate('pluralLCBlock'))}`, caption: 'Del' },
			{ id: 'clipboardCopy', icon: 'clipboard-copy', name: translate('commonCopy'), caption: `${cmd} + C` },
			{ id: 'clipboardCut', icon: 'clipboard-cut', name: translate('commonCut'), caption: `${cmd} + X` },
			{ id: 'clipboardPaste', icon: 'clipboard-paste', name: translate('commonPaste'), caption: `${cmd} + V` },
			{ id: 'copy', icon: 'copy', name: copyName, caption: keyboard.getCaption('duplicate') },
			{ isDiv: true },
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

		if (hasCopyMedia) {
			items.push({ id: 'copyMedia', icon: 'copy', name: translate('commonCopyMedia') });
		};

		if (hasBookmark) {
			items.push({ id: 'copyUrl', icon: 'copy', name: translate('libMenuCopyUrl') });
		};

		if (hasDataview) {
			const isCollection = Dataview.isCollection(rootId, blockId);
			const sourceName = isCollection ? translate('commonCollection') : translate('commonSet');

			items.push({ id: 'dataviewSource', icon: 'source', name: U.String.sprintf(translate('libMenuChangeSource'), sourceName), arrow: true });
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
				options = [ 6, 10, 14, 30, 50 ];
				break;
			};

			case I.WidgetLayout.List: {
				options = [ 4, 6, 8, 30, 50 ];
				break;
			};
		};
		return options.map(id => ({ id, name: id }));
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
		} else
		if (id == J.Constant.widgetId.bin) {
			options.unshift(I.WidgetLayout.Link);
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
			itemId: id,
			type: I.CoverType.Color,
			name: translate(`textColor-${id}`),
		}));
	};

	getCoverGradients () {
		return [ 'pinkOrange', 'bluePink', 'greenOrange', 'sky', 'yellow', 'red', 'blue', 'teal' ].map(id => ({
			id,
			itemId: id,
			type: I.CoverType.Gradient,
			name: translate(`gradientColor-${id}`),
		}));
	};
	
	sectionsFilter (sections: any[], filter: string) {
		const f = U.String.regexEscape(filter);
		const regS = new RegExp(`^${f}`, 'i');
		const regC = new RegExp(f, 'gi');

		const getWeight = (s: string) => {
			let w = 0;
			if (!s) {
				return w;
			};

			if (s.toLowerCase() == f.toLowerCase()) {
				w += 10000;
			} else
			if (s.match(regS)) {
				w += 1000;
			} else 
			if (s.match(regC)) {
				w += 100;
			};
			return w;
		};
		
		sections = sections.filter((s: any) => {
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

				c._sortWeight_ = Number(c._sortWeight_) || 0;
				if (c.skipFilter) {
					ret = true;
				};

				if (!ret && c.aliases && c.aliases.length) {
					for (const alias of c.aliases) {
						if (alias.match(regC) || alias.match(regS)) {
							c._sortWeight_ += getWeight(alias);
							ret = true;
							break;
						};
					};
				};

				if (!ret && c.name && (c.name.match(regC) || c.name.match(regS))) {
					ret = true;
					c._sortWeight_ += getWeight(c.name);
				};

				/*
				if (!ret && c.description && (c.description.match(regC) || c.description.match(regS))) {
					ret = true;
					c._sortWeight_ += getWeight(c.description);
				};
				*/

				return ret; 
			});

			s.children = s.children.sort((c1: any, c2: any) => U.Data.sortByWeight(c1, c2));
			return s.children.length > 0;
		});

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
						U.Space.openDashboard();
					};
				});
			});
		};

		let options = [];
		if (spaceview.isChat || spaceview.isOneToOne) {
			options.push({ id: I.HomePredefinedId.Chat, name: translate(`spaceUxType${I.SpaceUxType.Chat}`) });
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

	spaceSettingsIndex (menuParam: Partial<I.MenuParam>, param?: any) {
		param = param || {};

		const isOwner = U.Space.isMyOwner();
		const options: I.Option[] = [
			{ id: 'spaceInfo', name: translate('popupSettingsSpaceIndexSpaceInfoTitle') },
			{ id: 'delete', name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'), color: 'red' }
		];

		S.Menu.open('select', {
			...menuParam,
			data: {
				options,
				onSelect: (e: React.MouseEvent, option: any) => {
					switch (option.id) {
						case 'spaceInfo': {
							Action.spaceInfo();
							break;
						};
						
						case 'delete': {
							Action.removeSpace(S.Common.space, param.route);
							break;
						};
					};
				},
			}
		});
	};

	spaceContext (space: any, menuParam: Partial<I.MenuParam>, param?: Partial<SpaceContextParam>) {
		param = param || {};

		const { targetSpaceId, uxType } = space;
		const { isSharePage, noManage, noMembers, withPin, withDelete, withOpenNewTab, withSearch, noShare, route } = param;
		const isLoading = space.isAccountLoading || space.isLocalLoading;
		const isOwner = U.Space.isMyOwner(targetSpaceId);
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);

		const onClick = (itemId: string, inviteLink: string) => {
			switch (itemId) {
				case 'mute':
				case 'unmute': {
					let mode = I.NotificationMode.Nothing;
					if (itemId == 'unmute') {
						mode = I.NotificationMode.All;
					} else {
						mode = space.isOneToOne ? I.NotificationMode.Nothing : I.NotificationMode.Mentions;
					};

					C.PushNotificationSetSpaceMode(targetSpaceId, mode);
					analytics.event('ChangeMessageNotificationState', { type: mode, uxType: space.uxType, route });
					break;
				};

				case 'pin': {
					const items: any[] = this.getVaultItems().filter(it => it.isPinned);
					const newItems = [ space ].concat(items);

					U.Data.sortByOrderIdRequest(J.Constant.subId.space, newItems, callBack => {
						C.SpaceSetOrder(space.id, newItems.map(it => it.id), callBack);
					});

					analytics.event('PinSpace', { route });
					break;
				};

				case 'unpin': {
					C.SpaceUnsetOrder(space.id);
					analytics.event('UnpinSpace', { route });
					break;
				};

				case 'settings':
				case 'members': {
					let id = '';

					switch (itemId) {
						case 'settings': {
							id = 'spaceIndex'; 
							break;
						};

						case 'members': {
							id = 'spaceShare'; 
							break;
						};
					};

					if (targetSpaceId == S.Common.space) {
						Action.openSettings(id, route);
					} else {
						U.Router.switchSpace(targetSpaceId, '', false, { 
							onFadeIn: () => Action.openSettings(id, route),
						}, true);
					};
					break;
				};

				case 'remove': {
					Action.removeSpace(space.targetSpaceId, param.route);
					break;
				};

				case 'qr': {
					S.Popup.open('inviteQr', { data: { link: inviteLink } });
					analytics.event('ClickSettingsSpaceShare', { type: 'Qr' });
					analytics.event('ScreenQr', { route });
					break;
				};

				case 'link': {
					U.Common.copyToast('', inviteLink, translate('toastInviteCopy'));
					analytics.event('ClickShareSpaceCopyLink', { route });
					break;
				};

				case 'stopSharing': {
					S.Popup.open('confirm', {
						data: {
							icon: 'noAccessRed',
							title: translate(`popupConfirmStopSharingSpaceWarningTitle`),
							text: translate(`popupConfirmStopSharingSpaceWarningText`),
							textConfirm: translate('commonConfirm'),
							colorConfirm: 'red',
							onConfirm: () => {
								C.SpaceStopSharing(S.Common.space, (message) => {
									if (!message.error.code) {
										Preview.toastShow({ text: translate('toastSpaceIsPrivate') });
									};
								});
							},
						},
					});
					break;
				};

				case 'manage': {
					this.menuContext?.close(() => {
						S.Menu.open('widgetSection', {
							recalcRect: () => {
								const { ww, wh } = U.Common.getWindowDimensions();
								return { x: 0, y: 0, width: ww, height: wh };
							},
							classNameWrap: 'fixed',
							visibleDimmer: true,
							vertical: I.MenuDirection.Center,
							horizontal: I.MenuDirection.Center,
						});
					});
					break;
				};

				case 'openNewTab': {
					const route = U.Router.build({ 
						page: 'main', 
						action: 'void', 
						id: 'dashboard', 
						spaceId: targetSpaceId,
					});

					Renderer.send('openTab', { route }, { setActive: false });
					analytics.event('AddTab', { route, uxType });
					break;
				};

				case 'searchChat': {
					S.Menu.closeAll(null, () => {
						keyboard.onSearchText('', route);
					});
					break;
				};

			};
		};

		const getOptions = (inviteLink: string) => {
			const sections = {
				search: [],
				general: [],
				share: [],
				archive: [],
				manage: [],
				delete: [],
			};

			if (withSearch) {
				sections.search.push({ id: 'searchChat', icon: 'search', name: translate('menuObjectSearchInChat'), caption: keyboard.getCaption('searchText') });
			};

			if (!noShare && inviteLink) {
				sections.share = [
					{ id: 'link', icon: 'copyLink', name: translate('menuSpaceContextCopyInviteLink') },
					{ id: 'qr', icon: 'qr', name: translate('menuSpaceContextShowQRCode') },
				];
			}

			if (isSharePage) {
				if (isOwner && space.isShared) {
					const isDisabled = participants.length > 1;
					sections.archive.push({
						id: 'stopSharing',
						name: translate('popupSettingsSpaceShareMakePrivate'),
						disabled: isDisabled,
						tooltipParam: { text: isDisabled ? translate('popupSettingsSpaceShareMakePrivateTooltip') : '' }
					});
				};
			} else {
				if (!isLoading) {
					sections.general.push({ id: 'settings', icon: 'settings', name: translate('menuSpaceContextSpaceSettings') });
				};

				if (withOpenNewTab) {
					sections.general.push({ id: 'openNewTab', icon: 'newTab', name: translate('menuObjectOpenInNewTab') });
				};

				if (!space.isPersonal && !space.isOneToOne && !noMembers) {
					sections.general.push({ id: 'members', icon: 'members', name: translate('commonMembers') });
				};

				if (withPin) {
					if (space.orderId) {
						sections.manage.push({ id: 'unpin', icon: 'unpin', name: translate('commonUnpin') });
					} else {
						sections.manage.push({ id: 'pin', icon: 'pin', name: translate('commonPin') });
					};
				};

				if (!space.isPersonal) {
					if ([ I.NotificationMode.Nothing, I.NotificationMode.Mentions ].includes(space.notificationMode)) {
						sections.manage.push({ id: 'unmute', icon: 'unmute', name: translate('commonUnmute') });
					} else {
						sections.manage.push({ id: 'mute', icon: 'mute', name: translate('commonMute') });
					};
				};

				if (!noManage) {
					sections.manage.push({ id: 'manage', icon: 'manage', name: translate('widgetManageSections') });
				};

				if (withDelete) {
					const name = isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace');

					sections.delete.push({ id: 'remove', icon: 'remove-red', name, color: 'red' });
				};
			};

			let options: any[] = [];
			Object.values(sections).forEach((section, idx) => {
				if (!section.length) {
					return;
				};

				if (options.length) {
					options.push({ isDiv: true, id: `menu-divider-${idx}` });
				};
				options = options.concat(section);
			});

			return options;
		};

		const callBack = (cid?: string, key?: string) => {
			const inviteLink: string = cid && key ? U.Space.getInviteLink(cid, key) : '';

			S.Menu.open('select', {
				...menuParam,
				onOpen: context => this.setContext(context),
				data: {
					options: getOptions(inviteLink),
					onSelect: (e: any, element: any) => {
						window.setTimeout(() => onClick(element.id, inviteLink), S.Menu.getTimeout());
					},
				},
			});
		};

		if (space.isShared) {
			U.Space.getInvite(targetSpaceId, callBack);
		} else {
			callBack();
		};
	};

	getVaultItems () {
		const { account } = S.Auth;
		if (!account) {
			return [];
		};

		const items = U.Common.objectCopy(U.Space.getList()).
			map(it => {
				it.counters = S.Chat.getSpaceCounters(it.targetSpaceId);
				it.hasCounter = it.counters.mentionCounter || it.counters.messageCounter;
				it.lastMessage = S.Chat.getSpaceLastMessage(it.targetSpaceId);
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

			const d1 = c1.lastMessage?.createdAt || c1.spaceJoinDate;
			const d2 = c2.lastMessage?.createdAt || c2.spaceJoinDate;

			if (d1 > d2) return -1;
			if (d1 < d2) return 1;

			if (c1.hasCounter && !c2.hasCounter) return -1;
			if (!c1.hasCounter && c2.hasCounter) return 1;

			if (c1.creationDate > c2.creationDate) return -1;
			if (c1.creationDate < c2.creationDate) return 1;
			return 0;
		});

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
		return a.filter(it => it).map(it => {
			const id = undefined !== it.id ? String(it.id) : '';
			return { ...it, id };
		});
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
			Action.openSettings('importIndex', route);
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

				const url = U.String.matchUrl(text);
				const cb = (object: any, time: number) => {
					callBack?.(object);
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
						U.Object.createType({ name: this.menuContext?.getChildRef()?.getData().filter }, keyboard.isPopup());
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
							callBack?.(object);

							analytics.event('SelectObjectType', { objectType: object.type });
							analytics.createObject(object.type, object.layout, route, time);

							this.menuContext?.close();
						};

						if (U.Object.isBookmarkLayout(item.recommendedLayout) || U.Object.isChatLayout(item.recommendedLayout)) {
							this.menuContext?.close();

							const menuParam = {
								horizontal: I.MenuDirection.Center,
								...param,
								data: { details },
							};

							window.setTimeout(() => {
								if (U.Object.isBookmarkLayout(item.recommendedLayout)) {
									this.onBookmarkMenu(menuParam, object => cb(object, 0));
								} else
								if (U.Object.isChatLayout(item.recommendedLayout)) {
									this.onChatMenu(menuParam, route, object => cb(object, 0));
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
			data: {
				onSubmit: callBack,
				...data,
			},
			...param,
		});
	};

	onChatMenu (param?: Partial<I.MenuParam>, route?: string, callBack?: (bookmark: any) => void) {
		param = param || {};

		const data = param.data || {};

		delete(param.data);

		S.Menu.open('chatCreate', {
			data: {
				onSubmit: callBack,
				...data,
			},
			...param,
		});

		analytics.event('ScreenChatInfo', { route });
	};

	setContext (context: any) {
		this.menuContext = context;
	};

	spaceCreate (param: I.MenuParam, route) {
		const ids = [ 'chat', 'space', 'join' ];
		const options = ids.map(id => {
			const suffix = U.String.toUpperCamelCase(id);

			let icon = '';
			let description = '';
			let withDescription = false;

			if (id != 'join') {
				icon = id;
				description = translate(`sidebarMenuSpaceCreateDescription${suffix}`);
				withDescription = true;
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

					analytics.event(`Click${prefix}CreateMenu${U.String.toUpperCamelCase(item.id)}`);
				},
			}
		});

		analytics.event(`Screen${prefix}CreateMenu`);
	};

	vaultStyle (param: I.MenuParam) {
		const { isClosed } = sidebar.getData(I.SidebarPanel.Left);
		const { vaultMessages } = S.Common;
		const options =[
			{ id: 0, name: translate('popupSettingsVaultCompact'), checkbox: !vaultMessages, },
			{ id: 1, name: translate('popupSettingsVaultWithMessages'), checkbox: vaultMessages, },
		];

		S.Menu.open('select', {
			...param,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					S.Common.vaultMessagesSet(Boolean(Number(item.id)));
					if (isClosed) {
						sidebar.open(I.SidebarPanel.Left, '', );
					};
				},
			},
		});
	};

	uxTypeOptions (): I.Option[] {
		return [
			{ id: I.SpaceUxType.Data },
			{ id: I.SpaceUxType.Chat },
		].map(it => ({ ...it, name: translate(`spaceUxType${it.id}`) }));
	};

	notificationModeOptions (): I.Option[] {
		const spaceview = U.Space.getSpaceview();

		let ret = [
			{ id: I.NotificationMode.All },
			{ id: I.NotificationMode.Mentions },
			{ id: I.NotificationMode.Nothing },
		].map(it => ({ ...it, name: translate(`notificationMode${it.id}`) }));

		if (spaceview.isOneToOne) {
			ret = ret.filter(it => it.id != I.NotificationMode.Mentions);
		};

		return ret;
	};

	recentModeOptions (): I.Option[] {
		return [
			{ id: I.RecentEditMode.All },
			{ id: I.RecentEditMode.Me },
		].map(it => ({ ...it, name: translate(`widgetRecentEditMode${it.id}`) }));
	};

	widgetSections (): I.Option[] {
		const { widgetSections } = S.Common;

		return [
			{ id: I.WidgetSection.Unread },
			{ id: I.WidgetSection.Pin },
			{ id: I.WidgetSection.RecentEdit },
			{ id: I.WidgetSection.Type },
			{ id: I.WidgetSection.Bin },
		].sort((c1, c2) => {
			const isUnread1 = c1.id == I.WidgetSection.Unread;
			const isUnread2 = c2.id == I.WidgetSection.Unread;
			
			if (isUnread1 && !isUnread2) return -1;
			if (!isUnread1 && isUnread2) return 1;
			
			const idx1 = widgetSections.findIndex(it => it.id == c1.id);
			const idx2 = widgetSections.findIndex(it => it.id == c2.id);

			return idx1 - idx2;
		}).map(it => ({ ...it, name: translate(`widgetSection${it.id}`) }));
	};

	widgetSectionContext (sectionId: I.WidgetSection, menuParam: Partial<I.MenuParam>) {
		const { recentEditMode } = S.Common;
		const spaceview = U.Space.getSpaceview();
		const toggle = { id: 'hide', icon: 'eye on', name: translate('widgetHideSection') };

		let options: any[] = [];
		let value = '';

		if (spaceview.isShared && (sectionId == I.WidgetSection.RecentEdit)) {
			options.push({ name: translate('widgetRecentModeTitle'), isSection: true });
			options = options.concat(this.recentModeOptions());
			options.push({ isDiv: true });

			value = String(recentEditMode);
		} else 
		if (sectionId == I.WidgetSection.Bin) {
			options = options.concat([
				{ id: 'openBin', name: translate('commonOpen') },
				{ id: 'emptyBin', name: translate('commonEmptyBin') },
				{ isDiv: true },
			]);
		};

		console.trace();

		options.push(toggle);

		S.Menu.open('select', {
			...menuParam,
			onOpen: context => {
				this.setContext(context);
				menuParam.onOpen?.(context);
			},
			data: {
				options,
				value,
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'hide': {
							const { widgetSections } = S.Common;
							const id = Number(sectionId);
							const idx = widgetSections.findIndex(it => it.id == id);

							if (idx < 0) {
								return;
							};

							widgetSections[idx].isHidden = true;
							S.Common.widgetSectionsSet([ ...widgetSections ]);
							break;
						};

						case 'openBin': {
							U.Object.openRoute({ layout: I.ObjectLayout.Archive });
							break;
						};

						case 'emptyBin': {
							Action.emptyBin(analytics.route.widget);
							break;
						};

						default: {
							S.Common.recentEditModeSet(Number(element.id));
							break;
						};
					};
				},
			},
		});
	};

	settingsSectionsMap () {
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Active ]);
		const types = U.Common.plural(10, translate('pluralObjectType'));
		const relations = U.Common.plural(10, translate('pluralProperty'));

		return {
			exportIndex: translate('commonExport'),
			importIndex: translate('commonImport'),
			spaceIndex: translate('pageSettingsSpaceGeneral'),
			spaceShare: members.length > 1 ? translate('commonMembers') : translate('pageSettingsSpaceIndexInviteMembers'),
			spaceNotifications: translate('commonNotifications'),
			spaceStorage: translate('pageSettingsSpaceRemoteStorage'),
			archive: translate('commonBin'),
			types,
			relations,
			integrations: translate('pageSettingsSpaceIntegrations'),
			index: translate('popupSettingsProfileTitle'),
			account: translate('popupSettingsProfileTitle'),
			personal: translate('popupSettingsPersonalTitle'),
			language: translate('pageSettingsLanguageTitle'),
			pinIndex: translate('popupSettingsPinTitle'),
			phrase: translate('popupSettingsPhraseTitle'),
			membership: translate('popupSettingsMembershipTitle'),
			dataIndex: translate('popupSettingsLocalStorageTitle'),
			spaceList: translate('popupSettingsSpacesListTitle'),
			dataPublish: translate('popupSettingsDataManagementDataPublishTitle'),
			api: translate('popupSettingsApiTitle'),
			set: types,
			relation: relations,
		};
	};

};

export default new UtilMenu();