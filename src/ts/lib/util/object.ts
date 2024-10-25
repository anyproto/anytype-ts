import { I, C, S, U, J, keyboard, history as historyPopup, Renderer, translate, analytics } from 'Lib';

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
			case I.ObjectLayout.Type:		 r = 'type'; break;
			case I.ObjectLayout.Relation:	 r = 'relation'; break;
			case I.ObjectLayout.Navigation:	 r = 'navigation'; break;
			case I.ObjectLayout.Graph:		 r = 'graph'; break;
			case I.ObjectLayout.History:	 r = 'history'; break;
			case I.ObjectLayout.Archive:	 r = 'archive'; break;
			case I.ObjectLayout.Block:		 r = 'block'; break;
			case I.ObjectLayout.Empty:		 r = 'empty'; break;
			case I.ObjectLayout.Chat:		 r = 'chat'; break;
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
		if (!object) {
			return;
		};

		return object ? `object?objectId=${object.id}&spaceId=${object.spaceId}` : '';
	};

	openEvent (e: any, object: any, param?: any) {
		if (!object) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

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

		// Prevent opening object in popup from different space
		if (object.spaceId && (object.spaceId != S.Common.space)) {
			this.openRoute(object, param);
			return;
		};

		keyboard.isPopup() ? this.openPopup(object, param) : this.openRoute(object, param);
	};
	
	openRoute (object: any, param?: any) {
		const route = this.route(object);
		if (!route) {
			return;
		};

		keyboard.setSource(null);
		U.Router.go(`/${route}`, param || {});
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
		param.preventResize = true;
		param.data = Object.assign(param.data || {}, { matchPopup: { params } });

		if (object._routeParam_) {
			param.data.matchPopup.params = Object.assign(param.data.matchPopup.params, object._routeParam_);
		};

		keyboard.setSource(null);
		historyPopup.pushMatch(param.data.matchPopup);
		window.setTimeout(() => S.Popup.open('page', param), S.Popup.getTimeout());
	};

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
					templateId = type.defaultTemplateId || J.Constant.templateId.blank;
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

	setLayout (rootId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) {
		S.Block.update(rootId, rootId, { layout });
		C.ObjectSetLayout(rootId, layout, callBack);
	};

	setAlign (rootId: string, align: I.BlockHAlign, callBack?: (message: any) => void) {
		C.BlockListSetAlign(rootId, [], align, callBack);
	};

	setDefaultTemplateId (rootId: string, id: string, callBack?: (message: any) => void) {
		C.ObjectListSetDetails([ rootId ], [ { key: 'defaultTemplateId', value: id } ], callBack);
	};

	name (object: any) {
		const { layout, snippet } = object;

		let name = '';
		if (this.isNoteLayout(layout)) {
			name = snippet || translate('commonEmpty');
		} else 
		if (this.isInFileLayouts(layout)) {
			name = U.File.name(object);
		} else {
			name = object.name || translate('defaultNamePage');
		};

		return name;
	};

	getById (id: string, callBack: (object: any) => void) {
		this.getByIds([ id ], objects => {
			if (callBack) {
				callBack(objects[0]);
			};
		});
	};

	getByIds (ids: string[], callBack: (objects: any[]) => void) {
		const filters = [
			{ relationKey: 'id', condition: I.FilterCondition.In, value: ids }
		];

		U.Data.search({ filters, keys: J.Relation.default.concat([ 'links', 'backlinks' ]) }, (message: any) => {
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
			I.ObjectLayout.Date,
		];
	};

	getLayoutsWithoutTemplates (): I.ObjectLayout[] {
		return [].concat(this.getFileAndSystemLayouts()).concat(this.getSetLayouts()).concat([ I.ObjectLayout.Chat, I.ObjectLayout.Participant ]);
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
			I.ObjectLayout.ChatDerived,
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
			I.ObjectLayout.ChatDerived,
		];
	};

	isAllowedTemplate (typeId: string): boolean {
		const type = S.Record.getTypeById(typeId);

		if (type && (type.uniqueKey == J.Constant.typeKey.template)) {
			return false;
		};

		return type ? !this.getLayoutsWithoutTemplates().includes(type.recommendedLayout) : false;
	};

	isAllowedObject (layout: I.ObjectLayout): boolean {
		return this.getPageLayouts().concat(I.ObjectLayout.Chat).includes(layout);
	};

};

export default new UtilObject();