import route from 'json/route';
import { I, C, S, U, J, keyboard, history as historyPopup, Renderer, translate, analytics, Relation, sidebar } from 'Lib';

const typeIcons = require.context('img/icon/type/default', false, /\.svg$/);

/**
 * UtilObject provides utilities for working with Anytype objects.
 *
 * Key responsibilities:
 * - Object navigation and routing (opening objects in different contexts)
 * - Object property management (icons, covers, names, descriptions)
 * - Layout type checking and categorization
 * - Object type and relation management
 * - Link copying and sharing
 *
 * This is one of the most heavily used utility classes, as objects are
 * the fundamental data unit in Anytype.
 */
class UtilObject {

	/**
	 * Get the router action string for a given object layout.
	 * Maps layout types to their corresponding page action identifiers.
	 * @param v - The object layout type
	 * @returns Action string used in routing (e.g., 'edit', 'media', 'chat')
	 */
	actionByLayout (v: I.ObjectLayout): string {
		v = v || I.ObjectLayout.Page;

		if (this.isInFileLayouts(v)) {
			return 'media';
		};

		if (this.isInSetLayouts(v)) {
			return 'set';
		};

		let r = '';
		switch (v) {
			default:						 r = 'edit'; break;
			case I.ObjectLayout.Relation:	 r = 'relation'; break;
			case I.ObjectLayout.Navigation:	 r = 'navigation'; break;
			case I.ObjectLayout.Graph:		 r = 'graph'; break;
			case I.ObjectLayout.Settings:	 r = 'settings'; break;
			case I.ObjectLayout.History:	 r = 'history'; break;
			case I.ObjectLayout.Archive:	 r = 'archive'; break;
			case I.ObjectLayout.Block:		 r = 'block'; break;
			case I.ObjectLayout.Space:
			case I.ObjectLayout.ChatOld:
			case I.ObjectLayout.Chat:		 r = 'chat'; break;
			case I.ObjectLayout.Date:		 r = 'date'; break;
		};
		return r;
	};

	/**
	 * Build the route URL for an object.
	 * @param object - The object to generate a route for
	 * @returns Route string suitable for navigation
	 */
	route (object: any): string {
		if (!object) {
			return '';
		};

		const id = String(object.id || '');
		const spaceId = object.spaceId || S.Common.space || '';
		const action = this.actionByLayout(object.layout);

		if (!action) {
			return '';
		};

		let param = { page: 'main', action, id, spaceId };
		if (object._routeParam_) {
			param = Object.assign(param, object._routeParam_);
		};

		return U.Router.build(param);
	};

	/**
	 * Generate a universal deep link route for an object.
	 * @param object - The object to link to
	 * @returns Universal route string with objectId and spaceId params
	 */
	universalRoute (object: any): string {
		return object ? `object?objectId=${object.id}&spaceId=${object.spaceId}` : '';
	};

	checkParam (param: any) {
		param = param || {};
		param.routeParam = param.routeParam || {};
		param.menuParam = param.menuParam || {};
		return param;
	};

	getTabData (object: any) {
		if (!object) {
			return;
		};

		const spaceview = U.Space.getSpaceview();

		return { 
			title: U.Object.name(object, true),
			icon: U.Graph.imageSrc(object),
			layout: object.layout,
			isImage: object.iconImage,
			uxType: spaceview?.uxType,
			route: this.route(object),
		};
	};

	/**
	 * Open an object based on keyboard modifiers in the event.
	 * - Shift or popup context: Opens in popup
	 * - Cmd/Ctrl or middle mouse button: Opens in new tab
	 * - Default: Opens via route navigation
	 * @param e - The DOM event (for modifier key detection)
	 * @param object - The object to open
	 * @param param - Optional parameters for route/menu customization
	 */
	openEvent (e: any, object: any, param?: any) {
		if (!object) {
			return;
		};

		param = this.checkParam(param);

		if (!e) {
			this.openRoute(object, param);
		};

		e.preventDefault();
		e.stopPropagation();

		if (this.isParticipantLayout(object.layout)) {
			U.Menu.participant(object, param.menuParam);
			return;
		};

		if (e.shiftKey || keyboard.isPopup()) {
			this.openPopup(object, param);
		} else
		if ((e.metaKey || e.ctrlKey) || (e.button == 1)) {
			this.openTab(object);
		} else {
			this.openRoute(object, param);
		};
	};

	/**
	 * Open an object automatically choosing popup or route based on context.
	 * Uses popup if already in popup context, otherwise navigates via route.
	 * @param object - The object to open
	 * @param param - Optional parameters for route/menu customization
	 */
	openAuto (object: any, param?: any) {
		if (!object) {
			return;
		};

		param = this.checkParam(param);

		if (this.isParticipantLayout(object.layout)) {
			U.Menu.participant(object, param.menuParam);
			return;
		};

		// Prevent opening object in popup from different space
		if (object.spaceId && (object.spaceId != S.Common.space)) {
			this.openRoute(object, param);
			return;
		};

		keyboard.isPopup() ? this.openPopup(object, param) : this.openRoute(object, param);
	};
	
	openRoute (object: any, param?: Partial<I.RouteParam>) {
		if (!object) {
			return;
		};

		param = this.checkParam(param);

		keyboard.setSource(null);
		U.Router.go(this.route(object), param);
	};

	openWindow (object: any) {
		Renderer.send('openWindow', this.route(object), S.Auth.token);
	};

	openTab (object: any) {
		if (!object) {
			return;
		};

		Renderer.send('openTab', this.getTabData(object), { setActive: false });
		analytics.event('AddTab', { objectType: object.type });
	};

	openTabs (objects: any[]) {
		if (!objects || !objects.length) {
			return;
		};

		const filtered = objects.filter(it => it);
		if (!filtered.length) {
			return;
		};

		const tabs = filtered.map(object => ({
			route: this.route(object),
			data: this.getTabData(object),
		}));

		if (tabs.length) {
			Renderer.send('openTabs', tabs);

			for (const object of filtered) {
				analytics.event('AddTab', { objectType: object.type });
			};
		};
	};

	openWindows (objects: any[], token: string) {
		if (!objects || !objects.length) {
			return;
		};

		const routes = objects.filter(it => it).map(object => this.route(object));

		if (routes.length) {
			Renderer.send('openWindows', routes, token);
		};
	};

	openPopup (object: any, param?: any) {
		if (!object) {
			return;
		};

		param = this.checkParam(param);

		if (this.isParticipantLayout(object.layout)) {
			U.Menu.participant(object, param.menuParam);
			return;
		};

		// Prevent opening object in popup from different space
		if (object.spaceId && (object.spaceId != S.Common.space)) {
			this.openRoute(object, param);
			return;
		};

		const action = this.actionByLayout(object.layout);
		const params = {
			page: 'main',
			action,
			id: object.id,
		};

		param = param || {};
		param.data = Object.assign(param.data || {}, { matchPopup: { params } });

		if (object._routeParam_) {
			param.data.matchPopup.params = { ...param.data.matchPopup.params, ...object._routeParam_ };
		};

		sidebar.rightPanelClose(true, false);
		keyboard.setSource(null);
		historyPopup.pushMatch(param.data.matchPopup);
		window.setTimeout(() => S.Popup.open('page', param), S.Popup.getTimeout());
	};

	/**
	Opens object based on user setting 'Open objects in fullscreen mode'
	*/
	openConfig (e: any, object: any, param?: any) {
		if (e && (e.button == 1)) {
			this.openTab(object);
			return;
		};

		S.Common.fullscreenObject ? this.openAuto(object, param) : this.openPopup(object, param);
	};

	/**
	 * Create a new object as a linked block within another object.
	 * @param rootId - Parent object ID where the link block will be created
	 * @param targetId - Block ID for positioning the new link
	 * @param details - Object details/properties to set on creation
	 * @param position - Block position relative to target
	 * @param templateId - Template to use for the new object
	 * @param flags - Creation flags (e.g., SelectTemplate, DeleteEmpty)
	 * @param route - Analytics route for tracking
	 * @param callBack - Optional callback with creation result
	 */
	create (rootId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, flags: I.ObjectFlag[], route: string, callBack?: (message: any) => void) {
		let typeKey = '';

		details = details || {};

		if (!templateId) {
			details.type = details.type || S.Common.type;
		};

		if (details.type) {
			const type = S.Record.getTypeById(details.type);

			if (type) {
				typeKey = type.uniqueKey;

				if (!templateId) {
					templateId = type.defaultTemplateId || '';
				};
			};
		};

		const block = {
			type: I.BlockType.Link,
			content: U.Data.defaultLinkSettings(),
		};
		
		C.BlockLinkCreateWithObject(rootId, targetId, details, position, templateId, block, flags, typeKey, S.Common.space, (message: any) => {
			if (!message.error.code) {
				callBack?.(message);

				const object = message.details;
				analytics.createObject(object.type, object.layout, route, message.middleTime);
			};
		});
	};
	
	setIcon (rootId: string, emoji: string, image: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ 
			{ key: 'iconEmoji', value: String(emoji || '') },
			{ key: 'iconImage', value: String(image || '') },
		], callBack);
	};

	setTypeIcon (rootId: string, iconName: string, iconOption: number, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [
			{ key: 'iconName', value: String(iconName || '') },
			{ key: 'iconOption', value: Number(iconOption) || 1 },
			{ key: 'iconImage', value: '' },
		], callBack);
	};
	
	setName (rootId: string, name: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'name', value: String(name || '') } ], callBack);
	};

	setDescription (rootId: string, description: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'description', value: String(description || '') } ], callBack);
	};
	
	setCover (rootId: string, type: I.CoverType, id: string, x?: number, y?: number, scale?: number, callBack?: (message: any) => void) {
		x = Number(x) || 0;
		y = Number(y) || 0;
		scale = Number(scale) || 0;

		const details = [ 
			{ key: 'coverType', value: type },
			{ key: 'coverId', value: id },
			{ key: 'coverX', value: x },
			{ key: 'coverY', value: y },
			{ key: 'coverScale', value: scale },
		];
		C.ObjectListSetDetails([ rootId ], details, callBack);
	};

	setDone (rootId: string, done: boolean, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'done', value: Boolean(done) } ], callBack);
	};

	setAlign (rootId: string, align: I.BlockHAlign, callBack?: (message: any) => void) {
		C.BlockListSetAlign(rootId, [], align, callBack);
	};

	setDefaultTemplateId (rootId: string, id: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'defaultTemplateId', value: id } ], callBack);
	};

	setLastUsedDate (rootId: string, timestamp: number, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'lastUsedDate', value: timestamp } ], callBack);
	};

	setObjectTypes (rootId: string, ids: string[], callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'relationFormatObjectTypes', value: Relation.getArrayValue(ids) } ], callBack);
	};

	setOptionColor (rootId: string, color: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'relationOptionColor', value: color } ], callBack);
	};

	name (object: any, withPlural?: boolean): string {
		if (!object) {
			return '';
		};

		const { layout, snippet } = object;

		let name = '';
		if (this.isNoteLayout(layout)) {
			name = snippet || translate('commonEmpty');
		} else 
		if (this.isInFileLayouts(layout)) {
			name = U.File.name(object);
		} else
		if (this.isTypeLayout(layout)) {
			name = withPlural ? object.pluralName || object.name : object.name || object.pluralName;
		} else {
			name = object.name;
		};

		return name || translate('defaultNamePage');
	};

	getById (id: string, param: Partial<I.SearchSubscribeParam>, callBack: (object: any) => void) {
		param = param || {};
		param.limit = 1;

		this.getByIds([ id ], param, objects => {
			callBack?.(objects[0]);
		});
	};

	getByIds (ids: string[], param: Partial<I.SearchSubscribeParam>, callBack: (objects: any[]) => void) {
		const filters = [
			{ relationKey: 'id', condition: I.FilterCondition.In, value: ids }
		];

		param = param || {};
		param.filters = (param.filters || []).concat(filters);
		param.keys = (param.keys || []).concat(J.Relation.default).concat([ 'links', 'backlinks' ]);

		if (undefined === param.ignoreArchived) {
			param.ignoreArchived = false;
		};

		if (undefined === param.ignoreHidden) {
			param.ignoreHidden = false;
		};

		U.Subscription.search(param, (message: any) => {
			callBack?.((message.records || []).filter(it => !it._empty_));
		});
	};

	// --------------------------------------------------------- //
	// Layout Type Checking Methods
	// These methods check if a layout belongs to specific categories
	// --------------------------------------------------------- //

	/** Check if layout is a Set-like layout (Set, Collection, Type) */
	isInSetLayouts (layout: I.ObjectLayout): boolean {
		return this.getSetLayouts().includes(layout);
	};

	/** Check if layout is a file-based layout (File, Image, Audio, Video, PDF) */
	isInFileLayouts (layout: I.ObjectLayout): boolean {
		return this.getFileLayouts().includes(layout);
	};

	/** Check if layout is a system layout (Type, Relation, Option, etc.) */
	isInSystemLayouts (layout: I.ObjectLayout): boolean {
		return this.getSystemLayouts().includes(layout);
	};

	/** Check if layout is either file or system layout */
	isInFileOrSystemLayouts (layout: I.ObjectLayout): boolean {
		return this.getFileAndSystemLayouts().includes(layout);
	};

	/** Check if layout is a page-like layout (Page, Human, Task, Note, Bookmark) */
	isInPageLayouts (layout: I.ObjectLayout): boolean {
		return this.getPageLayouts().includes(layout);
	};

	/** Check if layout is a human-like layout (Human, Participant) */
	isInHumanLayouts (layout: I.ObjectLayout): boolean {
		return this.getHumanLayouts().includes(layout);
	};

	// --------------------------------------------------------- //

	isSpaceViewLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.SpaceView;
	};

	isSpaceLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Space;
	};

	isSetLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Set;
	};

	isCollectionLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Collection;
	};

	isTemplateType (id: string): boolean {
		const type = S.Record.getTemplateType();
		return type ? id == type.id : false;
	};

	isTypeLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Type;
	};

	isRelationLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Relation;
	};

	isTypeOrRelationLayout (layout: I.ObjectLayout): boolean {
		return this.isTypeLayout(layout) || this.isRelationLayout(layout);
	};

	isHumanLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Human;
	};

	isParticipantLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Participant;
	};

	isTaskLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Task;
	};

	isNoteLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Note;
	};

	isBookmarkLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Bookmark;
	};

	isChatLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Chat;
	};

	isImageLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Image;
	};

	isDateLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Date;
	};

	isFileLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.File;
	};

	// --------------------------------------------------------- //

	getPageLayouts (): I.ObjectLayout[] {
		return [ 
			I.ObjectLayout.Page, 
			I.ObjectLayout.Human, 
			I.ObjectLayout.Task, 
			I.ObjectLayout.Note, 
			I.ObjectLayout.Bookmark, 
		];
	};

	getSetLayouts (): I.ObjectLayout[] {
		return [ 
			I.ObjectLayout.Set,
			I.ObjectLayout.Collection,
			I.ObjectLayout.Type,
		];
	};

	getLayoutsForTypeSelection () {
		return this.getPageLayouts().concat(this.getSetLayouts()).concat(I.ObjectLayout.Chat).filter(it => !this.isTypeLayout(it));
	};

	getLayoutsWithoutTemplates (): I.ObjectLayout[] {
		return [].concat(this.getFileAndSystemLayouts()).concat([ I.ObjectLayout.Chat, I.ObjectLayout.Participant, I.ObjectLayout.Date ]);
	};

	getFileAndSystemLayouts (): I.ObjectLayout[] {
		return this.getFileLayouts().concat(this.getSystemLayouts());
	};

	getSystemLayouts (): I.ObjectLayout[] {
		return [
			I.ObjectLayout.Type,
			I.ObjectLayout.Relation,
			I.ObjectLayout.Option,
			I.ObjectLayout.Dashboard,
			I.ObjectLayout.Space,
			I.ObjectLayout.SpaceView,
		];
	};

	getFileLayouts (): I.ObjectLayout[] {
		return [
			I.ObjectLayout.File,
			I.ObjectLayout.Image,
			I.ObjectLayout.Audio,
			I.ObjectLayout.Video,
			I.ObjectLayout.Pdf,
		];
	};

	getHumanLayouts (): I.ObjectLayout[] {
		return [ 
			I.ObjectLayout.Human, 
			I.ObjectLayout.Participant,
		];
	};

	getGraphSkipLayouts () {
		return this.getSystemLayouts().filter(it => !this.isTypeLayout(it));
	};

	// --------------------------------------------------------- //

	getFileTypeByLayout (layout: I.ObjectLayout): I.FileType {
		switch (layout) {
			default: return I.FileType.File;
			case I.ObjectLayout.Image: return I.FileType.Image;
			case I.ObjectLayout.Audio: return I.FileType.Audio;
			case I.ObjectLayout.Video: return I.FileType.Video;
			case I.ObjectLayout.Pdf: return I.FileType.Pdf;
		};
	};

	excludeFromSet (): I.ObjectLayout[] {
		return [ 
			I.ObjectLayout.Option, 
			I.ObjectLayout.SpaceView, 
			I.ObjectLayout.Space,
		];
	};

	isAllowedTemplate (typeId: string): boolean {
		const type = S.Record.getTypeById(typeId);
		if (!type
			|| [ J.Constant.typeKey.template ].includes(type.uniqueKey)
			|| type.isArchived
			|| U.Object.isTypeLayout(type.recommendedLayout)
			|| !U.Space.canMyParticipantWrite()) {
			return false;
		};

		return !this.getLayoutsWithoutTemplates().includes(type.recommendedLayout);
	};

	isAllowedObject (layout: I.ObjectLayout): boolean {
		return this.getPageLayouts().includes(layout);
	};

	openDateByTimestamp (relationKey: string, t: number, method?: string) {
		method = method || 'auto';

		let fn = U.String.toCamelCase(`open-${method}`);
		if (!this[fn]) {
			fn = 'openAuto';
		};

		C.ObjectDateByTimestamp(S.Common.space, t, (message: any) => {
			if (!message.error.code) {
				this[fn]({ ...message.details, _routeParam_: { relationKey } });
			};
		});
	};

	hasEqualLayoutAlign (object: any, type: any): boolean {
		if (!object || object._empty || !type) {
			return true;
		};
		return (undefined === object.layoutAlign) || (object.layoutAlign === type.layoutAlign);
	};

	hasEqualLayoutWidth (object: any, type: any): boolean {
		const root = S.Block.getLeaf(object.id, object.id);

		if (!object || object._empty || !type || !root) {
			return true;
		};

		const width = (root?.fields || {}).width;
		return !width || (width == type.layoutWidth);
	};

	hasEqualFeaturedRelations (object: any, type: any): boolean {
		if (!object || object._empty) {
			return true;
		};

		const listObject = Relation.getArrayValue(object.featuredRelations).
			filter(it => ![ 'description' ].includes(it)).
			map(it => S.Record.getRelationByKey(it)?.relationKey).
			filter(it => it);
		const listType = Relation.getArrayValue(type.recommendedFeaturedRelations).
			map(it => S.Record.getRelationById(it)?.relationKey).
			filter(it => it);

		return !listObject.length || U.Common.compareJSON(listObject, listType);
	};

	hasLayoutConflict (object: any): boolean {
		const type = S.Record.getTypeById(object.targetObjectType || object.type);
		if (!type) {
			return false;
		};

		if (object.layout != type.recommendedLayout) {
			return true;
		};

		if (!this.hasEqualLayoutAlign(object, type)) {
			return true;
		};

		if (!this.hasEqualLayoutWidth(object, type)) {
			return true;
		};

		if (!this.hasEqualFeaturedRelations(object, type)) {
			return true;
		};

		return false;
	};

	resetLayout (id: string) {
		const object = S.Detail.get(id, id);

		if (object._empty_) {
			return;
		};

		const type = S.Record.getTypeById(object.targetObjectType || object.type);
		const root = S.Block.getLeaf(id, id);
		const fields = root.fields || {};
		const featured = Relation.getArrayValue(object.featuredRelations).filter(it => [ 'description' ].includes(it));

		delete(fields.width);

		C.ObjectRelationDelete(id, [ 'layout', 'layoutAlign' ]);
		C.ObjectListSetDetails([ id ], [ { key: 'featuredRelations', value: featured } ]);
		C.BlockListSetFields(id, [ { blockId: id, fields } ]);

		if (type) {
			S.Block.update(id, id, { layout: type.recommendedLayout });
		};
	};

	getTypeRelationListsKeys () {
		return [ 'recommendedRelations', 'recommendedFeaturedRelations', 'recommendedHiddenRelations', 'recommendedFileRelations' ];
	};

	getTypeRelationIds (id: string) {
		const type = S.Record.getTypeById(id);
		if (!type) {
			return [];
		};

		return Relation.getArrayValue(type.recommendedRelations).
			concat(Relation.getArrayValue(type.recommendedFeaturedRelations)).
			concat(Relation.getArrayValue(type.recommendedHiddenRelations)).
			concat(Relation.getArrayValue(type.recommendedFileRelations));
	};

	findInTypeRelations (typeId: string, relationId: string): string {
		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return '';
		};

		const keys = this.getTypeRelationListsKeys();

		let ret = '';
		for (const key of keys) {
			const list = Relation.getArrayValue(type[key]);
			if (list.includes(relationId)) {
				ret = key;
				break;
			};
		};
		return ret;
	};

	getTypeRelationKeys (id: string) {
		return this.getTypeRelationIds(id).
			map(it => S.Record.getRelationById(it)?.relationKey).
			filter(it => it);
	};

	typeRelationUnlink (typeId: string, relationId: string, onChange?: (message: any) => void) {
		const key = this.findInTypeRelations(typeId, relationId);
		if (!key) {
			return;
		};

		const type = S.Record.getTypeById(typeId);
		if (!type) {
			return;
		};

		const value = U.Common.arrayUnique(Relation.getArrayValue(type[key]).filter(it => it != relationId));

		C.ObjectListSetDetails([ typeId ], [ { key: key, value } ], (message: any) => {
			if (message.error.code) {
				return;
			};

			S.Detail.update(J.Constant.subId.type, { id: typeId, details: { [key]: value } }, false);
			C.BlockDataviewRelationSet(typeId, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(typeId)), onChange);
		});
	};

	copyLink (object: any, space: any, type: string, route: string, add?: string) {
		if (!object || !space) {
			return;
		};

		add = add || '';

		const cb = (link: string) => {
			U.Common.copyToast(translate('commonLink'), link);
			analytics.event('CopyLink', { route });
		};

		let link = '';

		switch (type) {
			case 'deeplink': {
				link = `${J.Constant.protocol}://${U.Object.universalRoute(object)}`;
				break;
			};

			case 'web': {
				link = `https://object.any.coop/${object.id}?spaceId=${space.targetSpaceId}`;
				break;
			};
		};

		if (add) {
			link += add;
		};
		
		if (space.isShared) {
			U.Space.getInvite(space.targetSpaceId, (cid: string, key: string) => {
				if (cid && key) {
					switch (type) {
						case 'deeplink': {
							cb(link + `&cid=${cid}&key=${key}`);
							break;
						};

						case 'web': {
							cb(link + `&inviteId=${cid}#${key}`);
							break;
						};
					};
				} else {
					cb(link);
				};
			});
		} else {
			cb(link);
		};
	};

	editType (id: string, isPopup: boolean) {
		const data = sidebar.getData(I.SidebarPanel.Right, isPopup);
		const state = { 
			page: 'type', 
			rootId: id,
			noPreview: false,
			details: {},
		};

		if (data.isClosed) {
			sidebar.rightPanelToggle(isPopup, state);
		} else {
			S.Common.setRightSidebarState(isPopup, state);
		};
	};

	createType (details: any, isPopup: boolean) {
		const data = sidebar.getData(I.SidebarPanel.Right, isPopup);
		const state = {
			page: 'type', 
			rootId: '',
			noPreview: false,
			details: {
				...this.getNewTypeDetails(),
				...(details || {}),
			},
		};

		if (data.isClosed) {
			sidebar.rightPanelToggle(isPopup, state);
		} else {
			S.Common.setRightSidebarState(isPopup, state);
		};
	};

	getNewTypeDetails (): any {
		const type = S.Record.getTypeType();
		const featured = [ 'type', 'tag', 'backlinks' ];
		const recommended = [ 'createdDate', 'creator', 'links' ];
		const hidden = [ 'lastModifiedDate', 'lastModifiedBy', 'lastOpenedDate' ];
		const mapper = it => S.Record.getRelationByKey(it)?.id;

		return {
			isNew: true,
			type: type?.id,
			layout: I.ObjectLayout.Type,
			defaultTypeId: String(S.Record.getPageType()?.id) || '',
			recommendedRelations: recommended.map(mapper).filter(it => it),
			recommendedFeaturedRelations: featured.map(mapper).filter(it => it),
			recommendedHiddenRelations: hidden.map(mapper).filter(it => it),
			data: {
				route: analytics.route.settingsSpace,
			},
		};
	};

	typeIcon (id: string, option: number, size: number, color?: string): string {
		const newColor = color || U.Common.iconBgByOption(option);

		let svg: any = '';
		try {
			svg = typeIcons(`./${id}.svg`);
			svg = U.Common.updateSvg(svg, { id, size, fill: newColor });
		} catch (e) {
			svg = U.Common.updateSvg(require('img/icon/error.svg'), { id, size, fill: newColor });
		};

		return svg;
	};

	defaultIcon (layout: I.ObjectLayout, typeId: string, size: number): string {
		const theme = S.Common.getThemeClass();
		const type = S.Detail.get(J.Constant.subId.type, typeId, [ 'name', 'iconName' ], true);

		let src = '';
		if (type.iconName) {
			src = this.typeIcon(type.iconName, 1, size, J.Theme[theme].iconDefault);
		} else {
			let id = '';
			switch (layout) {
				default: id = 'page'; break;
				case I.ObjectLayout.ChatOld:
				case I.ObjectLayout.Chat: id = 'chat'; break;
				case I.ObjectLayout.Collection: id = 'collection'; break;
				case I.ObjectLayout.Set: id = 'set'; break;
				case I.ObjectLayout.Date: id = 'date'; break;
				case I.ObjectLayout.Type: id = 'type'; break;
				case I.ObjectLayout.Bookmark: id = 'page'; break;
			};
			src = U.Common.updateSvg(require(`img/icon/default/${id}.svg`), { id, size, fill: J.Theme[theme].iconDefault });
		};

		return src;
	};

	getChatNotificationMode (spaceview: any, chatId: string): I.NotificationMode {
		if (!spaceview) {
			return I.NotificationMode.All;
		};

		const allIds = Relation.getArrayValue(spaceview.allIds);
		const mentionIds = Relation.getArrayValue(spaceview.mentionIds);
		const muteIds = Relation.getArrayValue(spaceview.muteIds);

		if (allIds.includes(chatId)) {
			return I.NotificationMode.All;
		} else
		if (mentionIds.includes(chatId)) {
			return I.NotificationMode.Mentions;
		} else
		if (muteIds.includes(chatId)) {
			return I.NotificationMode.Nothing;
		};

		return spaceview.notificationMode as I.NotificationMode;
	};

};

export default new UtilObject();
