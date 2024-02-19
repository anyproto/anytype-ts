import { I, C, keyboard, UtilCommon, history as historyPopup, Renderer, UtilFile, translate, Storage, UtilRouter } from 'Lib';
import { commonStore, authStore, blockStore, popupStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

class UtilObject {

	openHome (type: string, param?: any) {
		const fn = UtilCommon.toCamelCase(`open-${type}`);
		
		let home = this.getSpaceDashboard();
		if (home && (home.id == I.HomePredefinedId.Last)) {
			home = Storage.get('lastOpened');
			if (home && !home.spaceId) {
				home.spaceId = commonStore.space;
			};
		};

		if (!home) {
			this.openRoute({ layout: I.ObjectLayout.Empty }, param);
			return;
		};

		if (this[fn]) {
			this[fn](home, param);
		};
	};

	getSpaceview (id?: string) {
		return detailStore.get(Constant.subId.space, id || blockStore.spaceview);
	};

	getSpaceviewBySpaceId (id: string) {
		const subId = Constant.subId.space;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id)).find(it => it.targetSpaceId == id);
	};

	getSpaceDashboard () {
		const space = this.getSpaceview();
		const id = space.spaceDashboardId;

		if (!id) {
			return null;
		};

		let home = null;
		if (id == I.HomePredefinedId.Graph) {
			home = this.getGraph();
		} else
		if (id == I.HomePredefinedId.Last) {
			home = this.getLastOpened();
		} else {
			home = detailStore.get(Constant.subId.space, id);
		};

		if (!home || home._empty_ || home.isDeleted) {
			return null;
		};
		return home;
	};

	getParticipantId (spaceId: string, accountId: string) {
		spaceId = String(spaceId || '').replace('.', '_');
		return `_participant_${spaceId}_${accountId}`;
	};

	getAccountFromParticipantId (id: string) {
		const a = String(id || '').split('_');
		return a.length ? a[a.length - 1] : '';
	};

	getProfile () {
		return detailStore.get(Constant.subId.profile, blockStore.profile);
	};

	getParticipant (id?: string) {
		const { space } = commonStore;
		const { account } = authStore;

		if (!account) {
			return null;
		};

		const object = detailStore.get(Constant.subId.participant, id || this.getParticipantId(space, account.id));
		return object._empty_ ? null : object;
	};

	canParticipantWrite (): boolean {
		const participant = this.getParticipant();
		return participant ? [ I.ParticipantPermissions.Writer, I.ParticipantPermissions.Owner ].includes(participant.permissions) : true;
	};

	isSpaceOwner (participantId: string): boolean {
		const { account } = authStore;
		return account ? this.getAccountFromParticipantId(participantId) == account.id : false;
	};

	getGraph () {
		return { 
			id: I.HomePredefinedId.Graph, 
			name: translate('commonGraph'), 
			iconEmoji: ':earth_americas:',
			layout: I.ObjectLayout.Graph,
		};
	};

	getLastOpened () {
		return { 
			id: I.HomePredefinedId.Last,
			name: translate('spaceLast'),
		};
	};

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
		window.setTimeout(() => popupStore.open('page', param), Constant.delay.popup);
	};

	create (rootId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) {
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
		
		C.BlockLinkCreateWithObject(rootId, targetId, details, position, templateId, fields, flags, typeKey, commonStore.space, (message: any) => {
			if (!message.error.code && callBack) {
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

	setDefaultTemplateId (rootId: string, id: string, callBack?: (message: any) => void) {
		C.ObjectSetDetails(rootId, [ { key: 'defaultTemplateId', value: id } ], callBack);
	};

	name (object: any) {
		const { isDeleted, layout, snippet } = object;

		let name = '';
		if (!isDeleted && this.isFileLayout(layout)) {
			name = UtilFile.name(object);
		} else
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
