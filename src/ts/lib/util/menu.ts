import raf from 'raf';
import { observable } from 'mobx';
import { setRange } from 'selection-ranges';
import Locale from 'dist/lib/json/locale.json';
import React, { MouseEvent } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';
import { focus } from 'Lib/focus';

interface SpaceContextParam {
	isSharePage?: boolean;
	noManage?: boolean;
	noMembers?: boolean;
	withPin?: boolean;
	withDelete?: boolean;
	withOpenNewTab?: boolean;
	noShare?: boolean;
	route: string;
};

interface ActionMenuParam {
	rootId?: string; 
	blockId?: string; 
	hasText?: boolean; 
	hasFile?: boolean; 
	hasCommon?: boolean;
	hasCopyMedia?: boolean; 
	hasBookmark?: boolean; 
	hasDataview?: boolean; 
	hasTurnObject?: boolean; 
	hasClipboard?: boolean; 
	count?: number;
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
		const items = [
			{ id: I.TextStyle.Paragraph, lang: 'Paragraph' },
			{ id: I.TextStyle.Header1, lang: 'Header1', aliases: [ 'h1', 'head1', 'header1' ] },
			{ id: I.TextStyle.Header2, lang: 'Header2', aliases: [ 'h2', 'head2', 'header2' ] },
			{ id: I.TextStyle.Header3, lang: 'Header3', aliases: [ 'h3', 'head3', 'header3' ] },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.iconParam = { name: U.Data.blockTextIcon(it.id) };
			return this.mapperBlock(it);
		});

		items.push({ isDiv: true } as any);

		const extra = [
			{ id: I.TextStyle.Quote, lang: 'Quote', aliases: [ 'quote' ] },
			{ id: I.TextStyle.Callout, lang: 'Callout', aliases: [ 'callout' ] },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.iconParam = { name: U.Data.blockTextIcon(it.id) };
			return this.mapperBlock(it);
		});

		return items.concat(extra);
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
			{ id: I.TextStyle.ToggleHeader1, lang: 'ToggleHeader1', aliases: [ 'toggle title', 'toggled title', 'toggle h1', 'toggle heading 1' ] },
			{ id: I.TextStyle.ToggleHeader2, lang: 'ToggleHeader2', aliases: [ 'toggle heading', 'toggled heading', 'toggle h2', 'toggle heading 2' ] },
			{ id: I.TextStyle.ToggleHeader3, lang: 'ToggleHeader3', aliases: [ 'toggle subheading', 'toggled subheading', 'toggle h3', 'toggle heading 3' ] },
		].map((it: any) => {
			it.type = I.BlockType.Text;
			it.iconParam = { name: U.Data.blockTextIcon(it.id) };
			return this.mapperBlock(it);
		});
	};

	/**
	 * Returns the list of media block types.
	 * @returns {any[]} The list of media block types.
	 */
	getBlockMedia () {
		return [
			{ type: I.BlockType.File, id: I.FileType.File, iconParam: { name: 'menu/block/media/file', color: 'ice' }, lang: 'File', aliases: [ 'file' ] },
			{ type: I.BlockType.File, id: I.FileType.Image, iconParam: { name: 'menu/block/media/image', color: 'lime' }, lang: 'Image', aliases: [ 'image', 'picture' ] },
			{ type: I.BlockType.File, id: I.FileType.Video, iconParam: { name: 'menu/block/media/video', color: 'blue' }, lang: 'Video', aliases: [ 'video' ] },
			{ type: I.BlockType.File, id: I.FileType.Audio, iconParam: { name: 'menu/block/media/audio', color: 'pink' }, lang: 'Audio', aliases: [ 'audio' ] },
			{ type: I.BlockType.File, id: I.FileType.Pdf, iconParam: { name: 'menu/block/media/pdf', color: 'red' }, lang: 'Pdf', aliases: [ 'pdf' ] },
			{ type: I.BlockType.Bookmark, id: 'bookmark', iconParam: { name: 'menu/block/common/bookmark', color: 'red' }, lang: 'Bookmark', aliases: [ 'bookmark' ] },
			{ type: I.BlockType.Text, id: I.TextStyle.Code, iconParam: { name: 'menu/block/common/code', color: 'purple' }, lang: 'Code', aliases: [ 'code' ] },
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
			{ id: I.EmbedProcessor.Twitter, name: 'X (ex-Twitter)' },
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
			// disabled because of possible performance issues
			// { id: I.EmbedProcessor.Excalidraw, name: 'Excalidraw' },
			{ id: I.EmbedProcessor.Spotify, name: 'Spotify' },
			{ id: I.EmbedProcessor.AppleMusic, name: 'Apple Music' },
			{ id: I.EmbedProcessor.Bandcamp, name: 'Bandcamp' },
			{ id: I.EmbedProcessor.Reddit, name: 'Reddit' },
		];

		if (config.experimental) {
			ret = ret.concat([
				{ id: I.EmbedProcessor.Image, name: translate('blockEmbedExternalImage') },
				{ id: I.EmbedProcessor.AnytypeMiniApp, name: 'Anytype Mini App' },
			]);
		};

		return ret.map(this.mapperBlock).map(it => {
			const embedName = U.String.toCamelCase(`-${I.EmbedProcessor[it.id]}`);
			it.type = I.BlockType.Embed;
			it.iconParam = { name: `menu/block/embed/${embedName}` };
			return it;
		});
	};

	/**
	 * Returns the list of link block types.
	 * @returns {any[]} The list of object block types.
	 */
	getBlockLink () {
		return [
			{ type: I.BlockType.Page, id: 'existingPage', iconParam: { name: 'menu/block/common/linkto' }, lang: 'ExistingPage', arrow: true, aliases: [ 'link' ] },
			{ type: I.BlockType.File, id: 'existingFile', iconParam: { name: 'menu/block/common/linkto' }, lang: 'ExistingFile', arrow: true, aliases: [ 'file' ] },
			{ id: 'date', iconParam: { name: 'relation/date' }, lang: 'Date', arrow: true },
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
			{ type: I.BlockType.Div, id: I.DivStyle.Line, iconParam: { name: 'menu/block/div/line' }, lang: 'Line', aliases: [ 'hr', 'line divider' ] },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, iconParam: { name: 'menu/block/div/dot' }, lang: 'Dot', aliases: [ 'dot', 'dots divider' ] },
			{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents, iconParam: { name: 'menu/block/common/tableOfContents' }, lang: 'TableOfContents', aliases: [ 'tc', 'toc', 'table of contents'] },
			{ type: I.BlockType.Table, id: I.BlockType.Table, iconParam: { name: 'menu/block/common/table' }, lang: 'SimpleTable', aliases: [ 'table' ] },
			{ type: I.BlockType.Dataview, id: 'collection', iconParam: { name: 'menu/block/common/collection', color: 'blue' }, lang: 'Collection', aliases: aliasInline },
			{ type: I.BlockType.Dataview, id: 'set', iconParam: { name: 'menu/block/common/set', color: 'purple' }, lang: 'Set', aliases: aliasInline },
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
			{ type: I.BlockType.Div, id: I.DivStyle.Line, iconParam: { name: 'menu/block/div/line' }, lang: 'Line' },
			{ type: I.BlockType.Div, id: I.DivStyle.Dot, iconParam: { name: 'menu/block/div/dot' }, lang: 'Dot' },
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

	getActions (param: ActionMenuParam) {
		const { rootId, blockId, hasText, hasFile, hasCommon, hasCopyMedia, hasBookmark, hasDataview, hasTurnObject, hasClipboard, count } = param;
		const cmd = keyboard.cmdSymbol();
		const copyName = U.String.sprintf(translate('commonDuplicateBlocks'), U.Common.plural(count, translate('pluralBlock')));

		let items: any[] = [];

		if (hasTurnObject) {
			items.push({ id: 'turnObject', iconParam: { name: 'menu/action/object' }, name: translate('commonTurnIntoObject'), arrow: true });
		};

		if (hasCommon) {
			items.push({ id: 'move', iconParam: { name: 'menu/action/move' }, name: translate('commonMoveTo'), arrow: true });
		};

		if (hasClipboard) {
			items = items.concat([
				{ id: 'clipboardCopy', iconParam: { name: 'menu/action/copy' }, name: translate('commonCopy'), caption: `${cmd} + C` },
				{ id: 'clipboardCut', iconParam: { name: 'menu/action/cut' }, name: translate('commonCut'), caption: `${cmd} + X` },
				{ id: 'clipboardPaste', iconParam: { name: 'menu/action/paste' }, name: translate('commonPaste'), caption: `${cmd} + V` },
			]);
		};
		
		if (hasFile) {
			items.push({ id: 'download', iconParam: { name: 'menu/action/download' }, name: translate('commonDownload') });
		};

		if (hasCopyMedia) {
			items.push({ id: 'copyMedia', iconParam: { name: 'menu/action/clipboard' }, name: translate('commonCopyToClipboard') });
		};

		if (hasBookmark) {
			items.push({ id: 'copyUrl', iconParam: { name: 'menu/action/clipboard' }, name: translate('libMenuCopyUrl') });
		};

		if (hasDataview) {
			const isCollection = Dataview.isCollection(rootId, blockId);
			const sourceName = isCollection ? translate('commonCollection') : translate('commonSet');

			items.push({ id: 'dataviewSource', iconParam: { name: 'menu/action/source' }, name: U.String.sprintf(translate('libMenuChangeSource'), sourceName), arrow: true });
		};

		if (hasFile || hasBookmark || hasDataview) {
			items.push({ id: 'openAsObject', iconParam: { name: 'common/expand' }, name: translate('commonOpenObject') });
		};

		if (hasCommon) {
			items = items.concat([
				{ id: 'copy', iconParam: { name: 'menu/action/duplicate' }, name: copyName, caption: keyboard.getCaption('duplicate') },
				{ id: 'remove', iconParam: { name: 'menu/action/remove' }, name: `${translate('commonDelete')} ${U.Common.plural(count, translate('pluralLCBlock'))}`, caption: 'Del' },
			]);
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
			it.iconParam = { name: U.Data.alignHIcon(it.id) };
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
			it.iconParam = { name: U.Data.alignVIcon(it.id) };
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

	getLayoutIcon (layout: I.ObjectLayout): I.IconParam {
		return { name: `layout/${I.ObjectLayout[layout].toLowerCase()}` };
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
			{ id: 'edit', iconParam: { name: 'common/options' }, name: translate('menuDataviewViewEditView') },
			{ id: 'copy', iconParam: { name: 'menu/action/copy' }, name: translate('commonDuplicate') },
		];

		if (views.length > 1) {
			options.push({ id: 'remove', iconParam: { name: 'menu/action/remove' }, name: translate('commonDelete') });
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
								U.Dom.get(`button-${blockId}-settings`)?.click();
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
			it.iconParam = { name: Relation.registryName('', it.id) };
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
				concat([ I.ObjectLayout.Participant, I.ObjectLayout.Date, I.ObjectLayout.Chat, I.ObjectLayout.Discussion ]);

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
			iconParam: { name: `menu/widget/${String(I.WidgetLayout[id] || '').toLowerCase()}` },
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

			if (s.toLowerCase() === f.toLowerCase()) {
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

				if (c.isBlock && (c.type === I.BlockType.Table)) {
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

	dashboardSelect (element: string, openRoute?: boolean, menuParam?: Omit<Partial<I.MenuParam>, 'data'>) {
		const { space } = S.Common;
		const spaceview = U.Space.getSpaceview();

		const onSelect = (object: any, update: boolean) => {
			C.WorkspaceSetHomepage(space, object.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				S.Detail.update(J.Constant.subId.space, { id: spaceview.id, details: { homepage: object.id } }, false);

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

		analytics.event('ClickChangeSpaceDashboard');

		S.Menu.open('searchObject', {
			element,
			horizontal: I.MenuDirection.Right,
			...menuParam,
			data: {
				withPlural: true,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts().concat(I.ObjectLayout.Participant).filter(it => !U.Object.isTypeLayout(it)) },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				dataChange: (_ctx: any, items: any) => {
					const head: any[] = [
						{ id: I.HomePredefinedId.Widget, iconParam: { name: 'settings/home' }, name: translate('commonNoHome') },
					];

					if (items.length) {
						head.push({ isDiv: true });
					};

					return head.concat(items);
				},
				onSelect: el => {
					onSelect(el, true);

					const type = U.Space.isSystemDashboard(el.id) ? el.id : I.HomePredefinedId.Existing;
					analytics.event('ChangeSpaceDashboard', { type });
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
		] as { id: string; format: I.ImportType; isApp?: boolean; name?: string }[]).map(it => {
			it.name = names[it.format];
			return it;
		});
	};

	spaceSettingsIndex (menuParam: Partial<I.MenuParam>, param?: any) {
		param = param || {};

		const isOwner = U.Space.isMyOwner();
		const options: I.Option[] = [
			{ id: 'spaceInfo', name: translate('popupSettingsSpaceIndexSpaceInfoTitle') },
			{ id: 'delete', name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'), color: 'destructive' }
		];

		S.Menu.open('select', {
			...menuParam,
			data: {
				options,
				onSelect: (e: MouseEvent, option: any) => {
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

		const { targetSpaceId, spaceType } = space;
		const { isSharePage, noManage, noMembers, withPin, withDelete, withOpenNewTab, noShare, route } = param;
		const isLoading = space.isAccountLoading || space.isLocalLoading;
		const isOwner = U.Space.isMyOwner(targetSpaceId);
		const canModerate = U.Space.canMyParticipantModerate(targetSpaceId);
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const oneToOneParticipant = space.isOneToOne ? U.Space.getOneToOneParticipant(space) : null;
		const oneToOneGlobalName = oneToOneParticipant?.globalName || '';
		const oneToOneIdentity = space.oneToOneIdentity || '';
		const oneToOneAnyName = oneToOneGlobalName || (oneToOneIdentity ? U.String.shortMask(oneToOneIdentity, 6) : '');

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
					analytics.event('ChangeMessageNotificationState', { type: mode, spaceType: space.spaceType, route });
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
							onRouteChange: () => Action.openSettings(id, route),
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
							iconParam: { name: 'popup/header/redLock', color: 'red' },
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
						sidebar.leftPanelSubPageOpen('widgetManage', true, true);
					});
					break;
				};

				case 'openNewTab': {
					Action.openSpaceTab(targetSpaceId, spaceType, route);
					break;
				};

				case 'searchChat': {
					S.Menu.closeAll(null, () => {
						keyboard.onSearchText('', route);
					});
					break;
				};

				case 'copyAnyName': {
					if (oneToOneGlobalName) {
						U.Common.copyToast(translate('commonAnyName'), oneToOneGlobalName);
					} else
					if (oneToOneIdentity) {
						U.Common.copyToast(translate('blockFeaturedIdentity'), oneToOneIdentity);
					};
					break;
				};

			};
		};

		const getOptions = (inviteLink: string) => {
			const sections = {
				anyName: [],
				general: [],
				actions: [],
				delete: [],
			};

			if (isSharePage) {
				if (inviteLink) {
					sections.general = [
						{ id: 'link', iconParam: { name: 'menu/action/copy' }, name: translate('menuSpaceContextCopyInviteLink') },
						{ id: 'qr', iconParam: { name: 'common/qr' }, name: translate('menuSpaceContextShowQRCode') },
					];
				};

				if (canModerate && space.isShared) {
					const isDisabled = participants.length > 1;
					sections.actions.push({
						id: 'stopSharing',
						name: translate('popupSettingsSpaceShareMakePrivate'),
						disabled: isDisabled,
						tooltipParam: { text: isDisabled ? translate('popupSettingsSpaceShareMakePrivateTooltip') : '' }
					});
				};
			} else {
				if (space.isOneToOne && oneToOneAnyName) {
					sections.anyName.push({
						id: 'copyAnyName',
						iconParam: oneToOneGlobalName ? { name: 'membership/badge', className: 'badge', size: 18, color: 'accent100' } : undefined,
						name: oneToOneAnyName,
						withCopy: true,
					});
				};

				if (!isLoading) {
					sections.general.push({ id: 'settings', iconParam: { name: 'menu/action/settings' }, name: translate('menuSpaceContextSpaceSettings') });
				};

				if (!noShare && space.isPrivate) {
					sections.general.push({ id: 'members', iconParam: { name: 'menu/action/inviteMembers' }, name: translate('commonInviteMembers') });
				};

				if (!noShare && inviteLink) {
					sections.general = sections.general.concat([
						{ id: 'link', iconParam: { name: 'menu/action/copy' }, name: translate('menuSpaceContextCopyInviteLink') },
						{ id: 'qr', iconParam: { name: 'common/qr' }, name: translate('menuSpaceContextShowQRCode') },
					]);
				};

				if (withPin) {
					if (space.orderId) {
						sections.general.push({ id: 'unpin', iconParam: { name: 'menu/action/unpin' }, name: translate('commonUnpin') });
					} else {
						sections.general.push({ id: 'pin', iconParam: { name: 'menu/action/pin' }, name: translate('commonPin') });
					};
				};

				if (!space.isPrivate) {
					if ([ I.NotificationMode.Nothing, I.NotificationMode.Mentions ].includes(space.notificationMode)) {
						sections.general.push({ id: 'unmute', iconParam: { name: 'menu/action/unmute' }, name: translate('commonUnmute') });
					} else {
						sections.general.push({ id: 'mute', iconParam: { name: 'menu/action/mute' }, name: translate('commonMute') });
					};
				};

				if (withOpenNewTab) {
					sections.actions.push({ id: 'openNewTab', iconParam: { name: 'menu/action/newTab' }, name: translate('menuObjectOpenInNewTab') });
				};

				if (!noManage) {
					sections.actions.push({ id: 'manage', iconParam: { name: 'common/options' }, name: translate('widgetManageSections') });
				};

				if (withDelete) {
					const iconParam = { name: isOwner ? 'menu/action/remove' : 'menu/action/leave', color: 'destructive' };
					const name = isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace');

					sections.delete.push({ id: 'remove', iconParam, name, color: 'destructive' });
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

			const optionsWithoutDiv = options.filter(it => !it.isDiv);
			if (optionsWithoutDiv.length <= 2) {
				options = optionsWithoutDiv;
			};

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

		const items = U.Space.getList().map(it => {
				const counters = S.Chat.getSpaceCounters(it.targetSpaceId);
				return {
					...it,
					counters,
					hasCounter: counters.mentionCounter || counters.messageCounter || counters.reactionCounter,
					lastMessage: S.Chat.getSpaceLastMessage(it.targetSpaceId),
					isPinned: !!it.orderId,
				};
			});

		items.sort((c1, c2) => {
			if (c1.isPinned && !c2.isPinned) return -1;
			if (!c1.isPinned && c2.isPinned) return 1;

			const o = U.Data.sortByOrderId(c1, c2);
			if (o) {
				return o;
			};

			const d1 = Math.max(c1.lastMessage?.createdAt || 0, c1.spaceJoinDate || 0, c1.creationDate || 0);
			const d2 = Math.max(c2.lastMessage?.createdAt || 0, c2.spaceJoinDate || 0, c2.creationDate || 0);

			if (d1 > d2) return -1;
			if (d1 < d2) return 1;

			if (c1.hasCounter && !c2.hasCounter) return -1;
			if (!c1.hasCounter && c2.hasCounter) return 1;

			return 0;
		});
		
		return items;
	};

	getSystemWidgets () {
		return [
			{ id: J.Constant.widgetId.favorite, name: translate('widgetFavorite'), icon: 'widget-pin', iconName: 'widget/system/pin' },
			{ id: J.Constant.widgetId.recentEdit, name: translate('widgetRecent'), icon: 'widget-pencil', iconName: 'widget/system/pencil' },
			{ id: J.Constant.widgetId.recentOpen, name: translate('widgetRecentOpen'), icon: 'widget-eye', iconName: 'widget/system/eye', caption: translate('menuWidgetRecentOpenCaption') },
			{ id: J.Constant.widgetId.bin, name: translate('commonBin'), icon: 'widget-bin', iconName: 'common/bin', layout: I.ObjectLayout.Archive },
		].filter(it => it).map(it => ({ ...it, isSystem: true }));
	};

	sortOrFilterRelationSelect (menuParam: Partial<I.MenuParam>, param: any) {
		const { rootId, blockId, getView, onSelect, onAdvancedFilterAdd } = param;
		const view = getView();
		const options = Relation.getFilterOptions(rootId, blockId, view);

		const hasAdvancedFilter = view?.filters?.some(f => f.operator === I.FilterOperator.And);
		const buttons = (!onAdvancedFilterAdd || hasAdvancedFilter) ? [] : [
			{ id: 'advancedFilter', name: translate('menuDataviewFilterAdvancedAdd'), iconParam: { name: 'control/dataview/filter' } }
		];

		const callBack = (item: any) => {
			onSelect(item);
			this.menuContext?.close();
		};

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		};

		const onOpen = context => {
			this.setContext(context);
			menuParam.onOpen?.(context);
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
				buttons,
				withFilter: true,
				noClose: true,
				useMaxWindowHeight: true,
				onSelect: (e: any, item: any) => {
					if (item.id == 'add') {
						this.sortOrFilterRelationAdd(this.menuContext, param, menuParam, relation => callBack(relation));
					} else
					if (item.id == 'advancedFilter') {
						onAdvancedFilterAdd?.();
						this.menuContext?.close();
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
			onOpen: () => U.Dom.addClass(U.Dom.select(element), 'active'),
			onClose: () => U.Dom.removeClass(U.Dom.select(element), 'active'),
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
			{ id: 'all', iconParam: { name: 'sidebar-all' }, name: translate('sidebarMenuAll') },
			{ id: 'sidebar', iconParam: { name: 'menu/action/sidebar' }, name: translate('sidebarMenuSidebar') },
		];
	};

	codeLangOptions (): I.Option[] {
		return [ { id: 'plain', name: translate('blockTextPlain') } ].concat(U.Prism.getTitles());
	};

	getCommentAddSections (): any[] {
		return this.sectionsMap([
			{
				id: 'text', name: translate('commentSlashMenuTitle'),
				children: [
					{ id: 'paragraph', textStyle: I.TextStyle.Paragraph, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/text' }, name: translate('commentBlockText'), description: translate('commentBlockTextDescription') },
					{ id: 'title', textStyle: I.TextStyle.Header1, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/header1' }, name: translate('commentBlockTitle'), description: translate('commentBlockTitleDescription') },
					{ id: 'heading', textStyle: I.TextStyle.Header2, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/header2' }, name: translate('commentBlockHeading'), description: translate('commentBlockHeadingDescription') },
					{ id: 'subheading', textStyle: I.TextStyle.Header3, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/header3' }, name: translate('commentBlockSubheading'), description: translate('commentBlockSubheadingDescription') },
				],
			},
			{
				id: 'list', name: translate('commentSlashMenuLists'),
				children: [
					{ id: 'numbered', textStyle: I.TextStyle.Numbered, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/numbered' }, name: translate('commentBlockNumbered'), description: translate('commentBlockNumberedDescription') },
					{ id: 'bulleted', textStyle: I.TextStyle.Bulleted, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/bulleted' }, name: translate('commentBlockBulleted'), description: translate('commentBlockBulletedDescription') },
					{ id: 'checkbox', textStyle: I.TextStyle.Checkbox, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/checkbox' }, name: translate('commentBlockCheckbox'), description: translate('commentBlockCheckboxDescription') },
				],
			},
			{
				id: 'attachments', name: translate('commentSlashMenuAttachments'),
				children: [
					{ id: 'code', textStyle: I.TextStyle.Code, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/code' }, name: translate('commentBlockCode'), description: translate('commentBlockCodeDescription') },
					{ id: 'embed', action: 'embed', iconParam: { name: 'menu/action/embed' }, name: translate('commentSlashMenuEmbed'), arrow: true },
				],
			},
			{
				id: 'decorations', name: translate('commentSlashMenuDecorations'),
				children: [
					{ id: 'quote', textStyle: I.TextStyle.Quote, blockType: I.BlockType.Text, iconParam: { name: 'comment/menu/quote' }, name: translate('commentBlockQuote'), description: translate('commentBlockQuoteDescription') },
					{ id: 'divider', textStyle: I.TextStyle.Paragraph, blockType: I.BlockType.Div, iconParam: { name: 'menu/block/div/line' }, name: translate('commentBlockDivider'), description: translate('commentBlockDividerDescription') },
				],
			},
		]);
	};

	getCommentAddMenuParam (contextRef: { current: any }) {
		return {
			param: {
				classNameWrap: 'fromBlock',
				className: 'commentAdd',
				component: 'select',
				noAnimation: true,
				subIds: [ 'typeSuggest', 'select' ],
				onOpen: (context: any) => { contextRef.current = context; },
			},
			data: {
				sections: this.getCommentAddSections(),
				noFilter: true,
				noScroll: true,
				noVirtualisation: true,
			},
		};
	};

	openCommentEmbedMenu (context: any, onSelect: (e: any, item: any) => void) {
		const size = context.getSize();
		const options = this.prepareForSelect(this.getBlockEmbed().map(it => ({
			...it,
			action: 'embed',
			embedProcessor: it.id,
		})));

		S.Menu.open('select', {
			element: `#${context.getId()}`,
			className: 'fixed',
			classNameWrap: 'fromBlock',
			offsetX: size.width,
			offsetY: -size.height,
			vertical: I.MenuDirection.Bottom,
			isSub: true,
			data: {
				options,
				noVirtualisation: true,
				onSelect,
			},
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
		// Use a fixed, asymmetric sample date (Jul 30, 2020) so Short (30/07/2020)
		// and ShortUS (07/30/2020) stay visually distinct year-round. Using today's
		// date collapsed both labels to the same string on symmetric dates
		// (01/01, 02/02, ..., 12/12) — see issue #2208.
		const sample = U.Date.timestamp(2020, 7, 30);

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
		] as { id: I.DateFormat; name: string }[]).map(it => {
			it.name = U.Date.dateWithFormat(it.id, sample);
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

	typeSuggest (param: Partial<I.MenuParam>, details: any, flags: { selectTemplate?: boolean, deleteEmpty?: boolean, withUpload?: boolean, noButtons?: boolean, uploadRoute?: string }, route: string, callBack?: (item: any) => void) {
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

		const onUpload = (e: MouseEvent) => {
			U.Menu.onFileUploadPopup(I.ObjectLayout.File, '', {}, (objectIds) => {
				if (!objectIds?.length) {
					return;
				};

				U.Object.getByIds(objectIds, {}, (objects) => {
					const gallery = objects.map(object => {
						let type = null;
						let src = '';

						if (U.Object.isImageLayout(object.layout)) {
							type = I.FileType.Image;
							src = S.Common.imageUrl(object.id, I.ImageSize.Large);
						} else
						if (object.layout == I.ObjectLayout.Video) {
							type = I.FileType.Video;
							src = S.Common.fileUrl(object.id);
						};

						return src ? { object, type, src } : null;
					}).filter(it => it);

					window.setTimeout(() => {
						if (gallery.length) {
							S.Popup.open('preview', { data: { gallery } });
						} else
						if (objects.length) {
							callBack?.(objects[0]);
						};
					}, S.Popup.getTimeout());
				});
			}, flags.uploadRoute || route);
		};

		const getClipboardData = async () => {
			let ret = [];
			try { ret = await navigator.clipboard.read(); } catch (e) { console.warn('[Menu] clipboard read failed:', e); };
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
					{ id: 'remove', name: translate('commonDelete'), color: 'destructive' },
				]);
			};

			S.Menu.open('select', {
				element: `#${props.getId()} #item-${U.Common.esc(item.id)} .icon.more`,
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
				if (flags.withUpload) {
					buttons.push({ id: 'import', iconParam: { name: 'menu/action/uploadComputer' }, name: translate('commonUploadComputer'), onClick: onUpload, isButton: true });
				};

				buttons.push({ 
					id: 'add', iconParam: { name: 'plus/menu' }, onClick: () => {
						U.Object.createType({ name: this.menuContext?.getChildRef()?.getData().filter }, keyboard.isPopup());
						this.menuContext?.close();

						if (param.data.onAdd) {
							param.data.onAdd();
						};
					}, 
				});

				if (items.length) {
					buttons.unshift({ id: 'clipboard', iconParam: { name: 'menu/action/clipboard' }, name: translate('widgetItemClipboard'), onClick: onPaste, isButton: true });
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
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getLayoutsForTypeSelection().filter(it => !U.Object.isInFileLayouts(it)) },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] }
					],
					onClick: (item: any) => {
						const cb = (object: any, time: number) => {
							callBack?.(object);

							analytics.event('SelectObjectType', { objectType: object.type });
							analytics.createObject(object.type, object.layout, route, time);

							this.menuContext?.close();
						};

						if (U.Object.getFileLayouts().includes(item.recommendedLayout)) {
							this.menuContext?.close();

							window.setTimeout(() => {
								this.onFileUploadPopup(item.recommendedLayout, '', details, (objectIds) => {
									if (objectIds?.length) {
										const object = S.Detail.get(S.Common.space, objectIds[0]);
										if (object) {
											cb(object, 0);
										};
									};
								}, flags.uploadRoute || route);
							}, S.Menu.getTimeout());
						} else
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

	onFileUploadPopup (layout: I.ObjectLayout, collectionId?: string, details?: any, callBack?: (objectIds: string[]) => void, route?: string) {
		S.Popup.open('upload', {
			data: {
				layout,
				collectionId: collectionId || '',
				details: details || {},
				onUpload: callBack,
				route: route || '',
			},
		});
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

	spaceCreate (param: I.MenuParam, route: string) {
		const analyticsName = {
			[I.SpaceCreateType.Personal]: 'Space',
			[I.SpaceCreateType.Group]: 'Chat',
			[I.SpaceCreateType.Join]: 'Join',
		};

		const mySharedSpaces = U.Space.getMySharedSpacesList();
		const { sharedSpacesLimit } = U.Space.getProfile();
		const isLimitReached = sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit);

		const groupOption: any = { id: I.SpaceCreateType.Group, iconParam: { name: 'menu/spaceCreate/group' }, name: translate('sidebarMenuSpaceCreateTitleGroup') };

		if (isLimitReached) {
			groupOption.caption = React.createElement(Icon, { name: 'common/alert', className: 'spaceLimit', color: 'grey' });
		};

		const options = [
			{ id: I.SpaceCreateType.Personal, iconParam: { name: 'menu/spaceCreate/personal' }, name: translate('sidebarMenuSpaceCreateTitlePersonal') },
			groupOption,
			{ id: I.SpaceCreateType.Join, iconParam: { name: 'menu/spaceCreate/join', size: 20 }, name: translate('sidebarMenuSpaceCreateTitleJoin') },
		];

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
					Action.createSpace(item.id, route);

					analytics.event(`Click${prefix}CreateMenu${analyticsName[item.id]}`);
				},
			}
		});

		analytics.event(`Screen${prefix}CreateMenu`);
	};

	spaceTypeOptions (): I.Option[] {
		return [
			{ id: I.SpaceType.Data },
			{ id: I.SpaceType.Chat },
		].map(it => ({ ...it, name: translate(`spaceType${it.id}`) }));
	};

	notificationModeOptions (forSettings?: boolean): I.Option[] {
		const spaceview = U.Space.getSpaceview();

		let ret = [
			{ id: I.NotificationMode.All },
			{ id: I.NotificationMode.Mentions },
			{ id: I.NotificationMode.Nothing },
		].map(it => {
			let name = translate(`notificationMode${it.id}`);
			if (forSettings && (it.id == I.NotificationMode.Nothing)) {
				name = translate('notificationModeDisabled');
			};
			return { ...it, name };
		});

		if (spaceview.isOneToOne) {
			ret = ret.filter(it => it.id != I.NotificationMode.Mentions);
		};

		return ret;
	};

	discussionNotificationModeOptions (): I.Option[] {
		return [
			{ id: I.NotificationMode.All },
			{ id: I.NotificationMode.Mentions },
		].map(it => ({ ...it, name: translate(`notificationModeDiscussion${it.id}`) }));
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
			{ id: I.WidgetSection.Pin },
			{ id: I.WidgetSection.Unread },
			{ id: I.WidgetSection.MyFavorites },
			{ id: I.WidgetSection.RecentEdit },
			{ id: I.WidgetSection.Type },
			{ id: I.WidgetSection.Bin },
		].sort((c1, c2) => {
			const idx1 = widgetSections.findIndex(it => it.id == c1.id);
			const idx2 = widgetSections.findIndex(it => it.id == c2.id);

			return idx1 - idx2;
		}).map(it => ({ ...it, name: translate(`widgetSection${it.id}`) }));
	};

	widgetSectionContext (sectionId: I.WidgetSection, menuParam: Partial<I.MenuParam>) {
		const { recentEditMode } = S.Common;
		const spaceview = U.Space.getSpaceview();
		const toggle = { id: 'hide', iconParam: { name: 'common/eye0' }, name: translate('widgetHideSection') };
		const manage = { id: 'manage', iconParam: { name: 'common/edit' }, name: translate('widgetManageSections') };

		let options: any[] = [];
		let value = '';

		if ((sectionId == I.WidgetSection.MyFavorites) && (S.Common.sidebarView != I.SidebarView.Links)) {
			const section = S.Common.getWidgetSection(I.WidgetSection.MyFavorites);

			options.push({ name: translate('widgetFavoritesViewTitle'), isSection: true });
			options = options.concat([
				{ id: 'viewList', name: translate('widgetFavoritesViewList') },
				{ id: 'viewWidgets', name: translate('widgetFavoritesViewWidgets') },
			]);
			options.push({ isDiv: true });

			value = (section?.view == 'widgets') ? 'viewWidgets' : 'viewList';
		} else
		if (spaceview.isShared && (sectionId == I.WidgetSection.RecentEdit)) {
			options.push({ name: translate('widgetRecentModeTitle'), isSection: true });
			options = options.concat(this.recentModeOptions());
			options.push({ isDiv: true });

			value = String(recentEditMode);
		} else
		if (sectionId == I.WidgetSection.Bin) {
			options.push({ id: 'openBin', name: translate('commonOpen') });

			if (U.Space.canMyParticipantModerate()) {
				options.push({ id: 'emptyBin', name: translate('commonEmptyBin') });
			};

			options.push({ isDiv: true });
		};

		options.push(toggle);
		options.push(manage);

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

							analytics.event('HideSection');
							break;
						};

						case 'viewList':
						case 'viewWidgets': {
							S.Common.updateWidgetSection({ id: sectionId, view: element.id == 'viewWidgets' ? 'widgets' : 'list' });
							break;
						};

						case 'manage': {
							sidebar.leftPanelSubPageOpen('widgetManage', true, true);
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
			spaceShare: members.length > 1 ? translate('commonMembers') : translate('commonInviteMembers'),
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

	/**
	 * Handles spellcheck context menu for correcting misspelled words.
	 * @param {string} misspelledWord - The misspelled word.
	 * @param {string[]} dictionarySuggestions - Suggested corrections.
	 * @param {number} x - X coordinate of the click.
	 * @param {number} y - Y coordinate of the click.
	 * @param {any} rect - Selection rectangle.
	 */
	spellcheck (misspelledWord: string, dictionarySuggestions: string[], x: number, y: number, rect: any) {
		if (!misspelledWord) {
			return;
		};

		keyboard.disableContextOpen(true);

		const { focused } = focus.state;
		const options: any = dictionarySuggestions.map(it => ({ id: it, name: it }));
		const element = document.elementFromPoint(x, y) as HTMLElement;
		const isInput = element?.tagName === 'INPUT';
		const isTextarea = element?.tagName === 'TEXTAREA';
		const isEditable = U.Dom.hasClass(element, 'editable');

		options.push({ id: 'add-to-dictionary', name: translate('spellcheckAdd') });

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			recalcRect: () => rect ? { ...rect, y: rect.y + window.scrollY } : null,
			onOpen: () => S.Menu.closeAll([ 'blockContext', 'chatText' ]),
			onClose: () => keyboard.disableContextOpen(false),
			data: {
				options,
				onSelect: (e: any, item: any) => {
					raf(() => {
						switch (item.id) {
							default: {
								const rootId = keyboard.getRootId();
								const block = S.Block.getLeaf(rootId, focused);

								if (block && block.isText()) {
									const value = block.content.text;

									// Find the word at the click position using caret position
									let wordIndex = -1;
									const range = document.caretRangeFromPoint(x, y);

									if (range) {
										const container = range.startContainer;
										const offset = range.startOffset;

										// Get the text content and find word boundaries
										if (container.nodeType === Node.TEXT_NODE) {
											const editable = (container as HTMLElement).parentElement?.closest('.editable') as HTMLElement;
											if (editable) {
												// Calculate the absolute offset in the block text
												let absoluteOffset = 0;
												const walker = document.createTreeWalker(
													editable,
													NodeFilter.SHOW_TEXT,
													null
												);

												let node;
												while ((node = walker.nextNode())) {
													if (node === container) {
														absoluteOffset += offset;
														break;
													};
													absoluteOffset += node.textContent?.length || 0;
												};

												// Find the occurrence of misspelledWord that contains this offset
												let searchIndex = 0;
												while (searchIndex < value.length) {
													const idx = value.indexOf(misspelledWord, searchIndex);
													if (idx === -1) break;

													if (absoluteOffset >= idx && absoluteOffset <= idx + misspelledWord.length) {
														wordIndex = idx;
														break;
													};
													searchIndex = idx + 1;
												};
											};
										};
									};

									// Fallback to first occurrence if position detection failed
									if (wordIndex === -1) {
										wordIndex = value.indexOf(misspelledWord);
									};

									if (wordIndex >= 0) {
										U.Data.blockInsertText(
											rootId,
											focused,
											item.id,
											wordIndex,
											wordIndex + misspelledWord.length
										);

										focus.set(focused, { from: wordIndex, to: wordIndex + item.id.length });
										focus.apply();
									};
								} else
								if (isInput || isTextarea || isEditable) {
									const isMessageBox = element?.id === 'messageBox';

									if (isMessageBox) {
										// Handle chat form's messageBox with marks preservation
										const html = String(element.innerHTML || '');
										const parsed = Mark.fromHtml(html, []);
										const { text } = parsed;
										let { marks } = parsed;

										// Find word position using caret position
										let wordIndex = -1;
										const range = document.caretRangeFromPoint(x, y);

										if (range) {
											const container = range.startContainer;
											const offset = range.startOffset;

											if (container.nodeType === Node.TEXT_NODE) {
												let absoluteOffset = 0;
												const walker = document.createTreeWalker(
													element,
													NodeFilter.SHOW_TEXT,
													null
												);

												let node;
												while ((node = walker.nextNode())) {
													if (node === container) {
														absoluteOffset += offset;
														break;
													};
													absoluteOffset += node.textContent?.length || 0;
												};

												let searchIndex = 0;
												while (searchIndex < text.length) {
													const idx = text.indexOf(misspelledWord, searchIndex);
													if (idx === -1) break;

													if (absoluteOffset >= idx && absoluteOffset <= idx + misspelledWord.length) {
														wordIndex = idx;
														break;
													};
													searchIndex = idx + 1;
												};
											};
										};

										if (wordIndex === -1) {
											wordIndex = text.indexOf(misspelledWord);
										};

										if (wordIndex >= 0) {
											const lengthDiff = item.id.length - misspelledWord.length;
											const newText = text.substring(0, wordIndex) + item.id + text.substring(wordIndex + misspelledWord.length);

											marks = Mark.adjust(marks, wordIndex + misspelledWord.length, lengthDiff);

											const newHtml = Mark.toHtml(newText, marks);
											element.innerHTML = U.String.sanitize(newHtml, true);

											const cursorPos = wordIndex + item.id.length;
											element.focus();
											setRange(element, { start: cursorPos, end: cursorPos });
										};
									} else {
										let value = '';
										if (isInput || isTextarea) {
											value = String((element as HTMLInputElement).value);
										} else
										if (isEditable) {
											value = String(element.innerText || '');
										};

										value = value.replace(new RegExp(`${misspelledWord}`, 'g'), item.id);

										if (isInput || isTextarea) {
											(element as HTMLInputElement).value = value;
										} else
										if (isEditable) {
											element.textContent = value;
										};
									};
								};
								break;
							};

							case 'add-to-dictionary': {
								Renderer.send('spellcheckAdd', misspelledWord);
								break;
							};

							case 'disable-spellcheck': {
								Action.setSpellingLang([]);
								break;
							};
						};
					});
				},
			}
		});
	};

	archivedContext (e: any, objectId: string, onRestore?: () => void) {
		e.preventDefault();
		e.stopPropagation();

		const options = [
			{ id: 'restore', iconParam: { name: 'menu/action/restore' }, name: translate('commonRestore') },
			{ id: 'delete', iconParam: { name: 'menu/action/remove', color: 'destructive' }, name: translate('commonDeleteImmediately'), color: 'destructive' },
		];

		S.Menu.open('select', {
			recalcRect: () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 }),
			data: {
				options,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'restore': {
							Action.restore([ objectId ], analytics.route.block, onRestore);
							break;
						};

						case 'delete': {
							Action.delete([ objectId ], analytics.route.block);
							break;
						};
					};
				},
			},
		});
	};

};

export default new UtilMenu();
