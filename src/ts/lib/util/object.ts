import { I, C, S, U, J, keyboard, history as historyPopup, Renderer, translate, analytics, Relation, sidebar } from 'Lib';

class UtilObject {

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

	universalRoute (object: any): string {
		return object ? `object?objectId=${object.id}&spaceId=${object.spaceId}` : '';
	};

	checkParam (param: any) {
		param = param || {};
		param.routeParam = param.routeParam || {};
		param.menuParam = param.menuParam || {};
		return param;
	};

	openEvent (e: any, object: any, param?: any) {
		if (!object) {
			return;
		};

		param = this.checkParam(param);

		e.preventDefault();
		e.stopPropagation();

		if (this.isParticipantLayout(object.layout)) {
			U.Menu.participant(object, param.menuParam);
			return;
		};

		if (e.shiftKey || keyboard.isPopup()) {
			this.openPopup(object, param);
		} else
		if ((e.metaKey || e.ctrlKey)) {
			this.openWindow(object);
		} else {
			this.openRoute(object, param);
		};
	};

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
	
	openRoute (object: any, param?: any) {
		param = this.checkParam(param);

		const route = this.route(object);
		if (!route) {
			return;
		};

		keyboard.setSource(null);
		U.Router.go(`/${route}`, param);
	};

	openWindow (object: any) {
		const route = this.route(object);
		if (route) {
			Renderer.send('openWindow', `/${route}`);
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
			action: action,
			id: object.id,
		};

		param = param || {};
		param.data = Object.assign(param.data || {}, { matchPopup: { params } });

		if (object._routeParam_) {
			param.data.matchPopup.params = Object.assign(param.data.matchPopup.params, object._routeParam_);
		};

		keyboard.setSource(null);
		historyPopup.pushMatch(param.data.matchPopup);
		window.setTimeout(() => S.Popup.open('page', param), S.Popup.getTimeout());
	};

	/**
	Opens object based on user setting 'Open objects in fullscreen mode'
	*/
	openConfig (object: any, param?: any) {
		S.Common.fullscreenObject ? this.openAuto(object, param) : this.openPopup(object, param);
	};

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
				if (callBack) {
					callBack(message);
				};

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
		this.getByIds([ id ], param, objects => {
			if (callBack) {
				callBack(objects[0]);
			};
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

		U.Data.search(param, (message: any) => {
			if (callBack) {
				callBack((message.records || []).filter(it => !it._empty_));
			};
		});
	};

	// --------------------------------------------------------- //

	isInSetLayouts (layout: I.ObjectLayout): boolean {
		return this.getSetLayouts().includes(layout);
	};

	isInFileLayouts (layout: I.ObjectLayout): boolean {
		return this.getFileLayouts().includes(layout);
	};

	isInSystemLayouts (layout: I.ObjectLayout): boolean {
		return this.getSystemLayouts().includes(layout);
	};

	isInFileOrSystemLayouts (layout: I.ObjectLayout): boolean {
		return this.getFileAndSystemLayouts().includes(layout);
	};

	isInPageLayouts (layout: I.ObjectLayout): boolean {
		return this.getPageLayouts().includes(layout);
	};

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

	isTemplate (type: string): boolean {
		const templateType = S.Record.getTemplateType();
		return templateType ? type == templateType.id : false;
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
		return this.getPageLayouts().concat(this.getSetLayouts()).filter(it => !this.isTypeLayout(it));
	};

	getLayoutsWithoutTemplates (): I.ObjectLayout[] {
		return [].concat(this.getFileAndSystemLayouts()).concat([ I.ObjectLayout.Chat, I.ObjectLayout.Participant ]);
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
		return this.getFileAndSystemLayouts().filter(it => !this.isTypeLayout(it));
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

	isAllowedChat () {
		const { config, space } = S.Common;
		return config.experimental || J.Constant.chatSpaceId.includes(space);
	};

	openDateByTimestamp (relationKey: string, t: number, method?: string) {
		method = method || 'auto';

		let fn = U.Common.toCamelCase(`open-${method}`);
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
			console.log('[hasLayoutConflict] layout', object.layout, type.recommendedLayout);
			return true;
		};

		if (!this.hasEqualLayoutAlign(object, type)) {
			console.log('[hasLayoutConflict] layoutAlign', object.layoutAlign, type.layoutAlign);
			return true;
		};

		if (!this.hasEqualLayoutWidth(object, type)) {
			console.log('[hasLayoutConflict] layoutWidth', type.layoutWidth);
			return true;
		};

		if (!this.hasEqualFeaturedRelations(object, type)) {
			console.log('[hasLayoutConflict] featuredRelations');
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
			C.BlockDataviewRelationSet(typeId, J.Constant.blockId.dataview, [ 'name', 'description' ].concat(U.Object.getTypeRelationKeys(typeId)), (message: any) => {
				if (onChange) {
					onChange(message);
				};
			});
		});
	};

	copyLink (object: any, space: any, type: string, route: string) {
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

	createType (details: any, isPopup: boolean) {
		details = details || {};

		const type = S.Record.getTypeType();
		const featured = [ 'type', 'tag', 'backlinks' ];
		const recommended = [ 'createdDate', 'creator', 'links' ];
		const hidden = [ 'lastModifiedDate', 'lastModifiedBy', 'lastOpenedDate' ];
		const mapper = it => S.Record.getRelationByKey(it)?.id;
		const newDetails: any = {
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
			...details,
		};

		sidebar.rightPanelToggle(true, true, isPopup, 'type', { details: newDetails });
	};

	typeIcon (id: string, option: number, size: number, color?: string): string {
		const newColor = color || U.Common.iconBgByOption(option);
		return U.Common.updateSvg(require(`img/icon/type/default/${id}.svg`), { id, size, fill: newColor });
	};

};

export default new UtilObject();
