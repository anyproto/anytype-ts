import { I, C, keyboard, history as historyPopup, Renderer, UtilData, translate, UtilRouter, analytics } from 'Lib';
import { commonStore, authStore, blockStore, popupStore, detailStore, dbStore } from 'Store';
const Constant = require('json/constant.json');

class UtilObject {

	actionByLayout (v: I.ObjectLayout): string {
		v = v || I.ObjectLayout.Page;

		if (this.isFileLayout(v)) {
			return 'media';
		};

		if (this.isSetLayout(v)) {
			return 'set';
		};

		let r = '';
		switch (v) {
			default:						 r = 'edit'; break;
			case I.ObjectLayout.Date:
			case I.ObjectLayout.Type:		 r = 'type'; break;
			case I.ObjectLayout.Relation:	 r = 'relation'; break;
			case I.ObjectLayout.Navigation:	 r = 'navigation'; break;
			case I.ObjectLayout.Graph:		 r = 'graph'; break;
			case I.ObjectLayout.Store:		 r = 'store'; break;
			case I.ObjectLayout.History:	 r = 'history'; break;
			case I.ObjectLayout.Archive:	 r = 'archive'; break;
			case I.ObjectLayout.Block:		 r = 'block'; break;
			case I.ObjectLayout.Empty:		 r = 'empty'; break;
		};
		return r;
	};

	route (object: any): string {
		if (!object) {
			return '';
		};

		const { layout, identityProfileLink } = object;
		const { accountSpaceId } = authStore;
		const action = this.actionByLayout(layout);

		if (!action) {
			return '';
		};

		let { id, spaceId } = object;

		/*
		if (identityProfileLink) {
			id = identityProfileLink;
			spaceId = accountSpaceId;
		};
		*/

		return UtilRouter.build({ page: 'main', action, id, spaceId });
	};

	universalRoute (object: any): string {
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
			this.openRoute(object);
		};
	};

	openAuto (object: any, param?: any) {

		// Prevent opening object in popup from different space
		if (object.spaceId && (object.spaceId != commonStore.space)) {
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
		UtilRouter.go(`/${route}`, param || {});
	};

	openWindow (object: any) {
		const route = this.route(object);
		if (route) {
			Renderer.send('windowOpen', `/${route}`);
		};
	};

	openPopup (object: any, param?: any) {
		if (!object) {
			return;
		};

		// Prevent opening object in popup from different space
		if (object.spaceId && (object.spaceId != commonStore.space)) {
			this.openRoute(object, param);
			return;
		};

		const action = this.actionByLayout(object.layout);

		param = param || {};
		param.preventResize = true;
		param.data = Object.assign(param.data || {}, { 
			matchPopup: { 
				params: {
					page: 'main',
					action: action,
					id: object.id,
				},
			},
		});

		if (object._routeParam_) {
			param.data.matchPopup.params = Object.assign(param.data.matchPopup.params, object._routeParam_);
		};

		keyboard.setSource(null);
		historyPopup.pushMatch(param.data.matchPopup);
		window.setTimeout(() => popupStore.open('page', param), popupStore.getTimeout());
	};

	openConfig (object: any) {
		commonStore.fullscreenObject ? this.openAuto(object) : this.openPopup(object);
	};

	create (rootId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, flags: I.ObjectFlag[], route: string, callBack?: (message: any) => void) {
		let typeKey = '';

		details = details || {};

		if (!templateId) {
			details.type = details.type || commonStore.type;
		};

		if (details.type) {
			const type = dbStore.getTypeById(details.type);
			if (type) {
				typeKey = type.uniqueKey;

				if (!templateId) {
					templateId = type.defaultTemplateId || Constant.templateId.blank;
				};
			};
		};

		const block = {
			type: I.BlockType.Link,
			content: UtilData.defaultLinkSettings(),
		};
		
		C.BlockLinkCreateWithObject(rootId, targetId, details, position, templateId, block, flags, typeKey, commonStore.space, (message: any) => {
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
		blockStore.update(rootId, rootId, { layout });
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
		if (layout == I.ObjectLayout.Note) {
			name = snippet || translate('commonEmpty');
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
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: ids }
		];

		C.ObjectSearch(filters, [], [], '', 0, 0, (message: any) => {
			if (message.error.code || !message.records.length) {
				return;
			};

			if (callBack) {
				callBack(message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_));
			};
		});
	};

	isFileLayout (layout: I.ObjectLayout): boolean {
		return this.getFileLayouts().includes(layout);
	};

	isFileOrSystemLayout (layout: I.ObjectLayout): boolean {
		return this.getFileAndSystemLayouts().includes(layout);
	};

	isSystemLayout (layout: I.ObjectLayout): boolean {
		return this.getSystemLayouts().includes(layout);
	};

	isSetLayout (layout: I.ObjectLayout): boolean {
		return this.getSetLayouts().includes(layout);
	};

	isTemplate (type: string): boolean {
		const templateType = dbStore.getTemplateType();
		return templateType ? type == templateType.id : false;
	};

	isTypeOrRelationLayout (layout: I.ObjectLayout): boolean {
		return this.isTypeLayout(layout) || this.isRelationLayout(layout);
	};

	isTypeLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Type;
	};

	isRelationLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Relation;
	};

	isPageLayout (layout: I.ObjectLayout): boolean {
		return this.getPageLayouts().includes(layout);
	};

	isParticipantLayout (layout: I.ObjectLayout): boolean {
		return layout == I.ObjectLayout.Participant;
	};

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
		];
	};

	getLayoutsWithoutTemplates (): I.ObjectLayout[] {
		return [].concat(this.getFileAndSystemLayouts()).concat(this.getSetLayouts());
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

	isAllowedTemplate (typeId): boolean {
		const type = dbStore.getTypeById(typeId);
		return type ? !this.getLayoutsWithoutTemplates().includes(type.recommendedLayout) : false;
	};

};

export default new UtilObject();
