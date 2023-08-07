import { I, C, keyboard, UtilCommon, history as historyPopup, Renderer, UtilFile, translate, Storage } from 'Lib';
import { commonStore, blockStore, popupStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class UtilObject {

	openHome (type: string, param?: any) {
		const fn = UtilCommon.toCamelCase(`open-${type}`);
		
		let home = this.getSpaceDashboard();
		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = Storage.get('lastOpened');
		};

		if (!home) {
			this.openRoute({ layout: I.ObjectLayout.Empty }, param);
			return;
		};

		if (this[fn]) {
			this[fn](home, param);
		};
	};

	getSpace () {
		return detailStore.get(Constant.subId.space, commonStore.workspace);
	};

	getSpaceDashboard () {
		const space = this.getSpace();
		if (!space.spaceDashboardId) {
			return null;
		};

		let home = null;
		if (space.spaceDashboardId == I.HomePredefinedId.Graph) {
			home = this.graph();
		} else
		if (space.spaceDashboardId == I.HomePredefinedId.Last) {
			home = this.lastOpened();
		} else {
			home = detailStore.get(Constant.subId.space, space.spaceDashboardId);
		};

		if (!home || home._empty_ || home.isArchived || home.isDeleted) {
			return null;
		};
		return home;
	};

	graph () {
		return { 
			id: I.HomePredefinedId.Graph, 
			name: translate('commonGraph'), 
			iconEmoji: ':earth_americas:',
			layout: I.ObjectLayout.Graph,
		};
	};

	lastOpened () {
		return { 
			id: I.HomePredefinedId.Last,
			name: translate('spaceLast'), 
		};
	};

	actionByLayout (v: I.ObjectLayout): string {
		v = v || I.ObjectLayout.Page;

		let r = '';
		switch (v) {
			default:						 r = 'edit'; break;
			case I.ObjectLayout.Set:
			case I.ObjectLayout.Collection:	 r = 'set'; break;
			case I.ObjectLayout.Type:		 r = 'type'; break;
			case I.ObjectLayout.Relation:	 r = 'relation'; break;
			case I.ObjectLayout.File:
			case I.ObjectLayout.Image:		 r = 'media'; break;
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

		const action = this.actionByLayout(object.layout);
		if (!action) {
			return '';
		};

		return [ 'main', action, object.id ].join('/');
	};

	openEvent (e: any, object: any, param?: any) {
		if (!object) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		if (e.shiftKey || popupStore.isOpen('page')) {
			this.openPopup(object, param);
		} else
		if ((e.metaKey || e.ctrlKey)) {
			this.openWindow(object);
		} else {
			this.openRoute(object);
		};
	};

	openAuto (object: any, param?: any) {
		popupStore.isOpen('page') ? this.openPopup(object, param) : this.openRoute(object, param);
	};
	
	openRoute (object: any, param?: any) {
		const route = this.route(object);
		if (!route) {
			return;
		};

		keyboard.setSource(null);
		UtilCommon.route('/' + route, param || {});
	};

	openWindow (object: any) {
		const route = this.route(object);
		if (route) {
			Renderer.send('windowOpen', '/' + route);
		};
	};

	openPopup (object: any, param?: any) {
		if (!object) {
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
		window.setTimeout(() => { popupStore.open('page', param); }, Constant.delay.popup);
	};

	create (rootId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) {
		details = details || {};

		if (!templateId) {
			details.type = details.type || commonStore.type;
		};
		
		C.BlockLinkCreateWithObject(rootId, targetId, details, position, templateId, fields, flags, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (callBack) {
				callBack(message);
			};
		});
	};
	
	setIcon (rootId: string, emoji: string, image: string, callBack?: (message: any) => void) {
		C.ObjectSetDetails(rootId, [ 
			{ key: 'iconEmoji', value: String(emoji || '') },
			{ key: 'iconImage', value: String(image || '') },
		], callBack);
	};
	
	setName (rootId: string, name: string, callBack?: (message: any) => void) {
		C.ObjectSetDetails(rootId, [ { key: 'name', value: String(name || '') } ], callBack);
	};

	setDescription (rootId: string, description: string, callBack?: (message: any) => void) {
		C.ObjectSetDetails(rootId, [ { key: 'description', value: String(description || '') } ], callBack);
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
		C.ObjectSetDetails(rootId, details, callBack);
	};

	setDone (rootId: string, done: boolean, callBack?: (message: any) => void) {
		C.ObjectSetDetails(rootId, [ { key: 'done', value: Boolean(done) } ], callBack);
	};

	setLayout (rootId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) {
		blockStore.update(rootId, rootId, { layout });
		C.ObjectSetLayout(rootId, layout, callBack);
	};

	setAlign (rootId: string, align: I.BlockHAlign, callBack?: (message: any) => void) {
		C.BlockListSetAlign(rootId, [], align, callBack);
	};

	setDefaultTemplateId (rootId: string, templateId: string, callBack?: (message: any) => void) {
		if (templateId == Constant.templateId.blank) {
			templateId = '';
		};

		C.ObjectSetDetails(rootId, [ { key: 'defaultTemplateId', value: templateId } ], callBack);
	};

	defaultName (key: string) {
		return translate(`defaultName${key}`);
	};

	name (object: any) {
		const { isDeleted, type, layout, snippet } = object;

		let name = '';
		if (!isDeleted && this.isFileType(type)) {
			name = UtilFile.name(object);
		} else
		if (layout == I.ObjectLayout.Note) {
			name = snippet || translate('commonEmpty');
		} else {
			name = object.name || this.defaultName('Page');
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
				const records = message.records.map(it => detailStore.mapper(it)).filter(it => !it._empty_);
				callBack(records);
			};
		});
	};

	isFileType (type: string) {
		return this.getFileTypes().includes(type);
	};

	isSystemType (type: string) {
		return this.getSystemTypes().includes(type);
	};

	isSetType (type: string) {
		return this.getSetTypes().includes(type);
	};

	isStoreType (type: string) {
		return this.getStoreTypes().includes(type);
	};

	isTemplate (type: string) {
		return type == Constant.typeId.template;
	};

	getFileTypes () {
		return [
			Constant.typeId.file, 
			Constant.typeId.image, 
			Constant.typeId.audio, 
			Constant.typeId.video,
		];
	};

	getSystemTypes () {
		return [
			Constant.typeId.type,
			Constant.typeId.template,
			Constant.typeId.relation,
			Constant.typeId.option,
			Constant.typeId.dashboard,
			Constant.typeId.date,
			Constant.typeId.space,
		].concat(this.getStoreTypes());
	};

	getStoreTypes () {
		return [
			Constant.storeTypeId.type,
			Constant.storeTypeId.relation,
		];
	};

	getSetTypes () {
		return [ 
			Constant.typeId.set, 
			Constant.typeId.collection,
		];
	};

	getPageLayouts () {
		return [ 
			I.ObjectLayout.Page, 
			I.ObjectLayout.Human, 
			I.ObjectLayout.Task, 
			I.ObjectLayout.Note, 
			I.ObjectLayout.Bookmark, 
		];
	};

	getLayoutsWithoutTemplates () {
		return [
			I.ObjectLayout.Note,
			I.ObjectLayout.Set,
			I.ObjectLayout.Collection,
			I.ObjectLayout.Bookmark,
		].concat(this.getFileAndSystemLayouts());
	}

	getFileAndSystemLayouts () {
		return this.getFileLayouts().concat(this.getSystemLayouts());
	};

	getSystemLayouts () {
		return [
			I.ObjectLayout.Type,
			I.ObjectLayout.Relation,
			I.ObjectLayout.Option,
			I.ObjectLayout.Dashboard,
			I.ObjectLayout.Date,
		];
	};

	getFileLayouts () {
		return [
			I.ObjectLayout.File,
			I.ObjectLayout.Image,
			I.ObjectLayout.Audio,
			I.ObjectLayout.Video,
		];
	};

};

export default new UtilObject();
