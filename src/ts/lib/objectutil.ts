import { I, C, keyboard, Util, history as historyPopup, Renderer } from 'Lib';
import { commonStore, blockStore, popupStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class ObjectUtil {

	openHome (type: string, param?: any) {
		const fn = Util.toCamelCase(`open-${type}`);
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);
		const empty = { layout: I.ObjectLayout.Empty };

		if (!space.spaceDashboardId) {
			this.openRoute(empty);
			return;
		};

		const home = this.getSpaceDashboard();
		if (!home) {
			this.openRoute(empty, param);
			return;
		};

		if (this[fn]) {
			this[fn](home, param);
		};
	};

	getSpaceDashboard () {
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);
		if (!space.spaceDashboardId) {
			return null;
		};

		let home = null;
		if (space.spaceDashboardId == 'graph') {
			home = this.graph();
		} else {
			home = detailStore.get(Constant.subId.space, space.spaceDashboardId);
		};

		if (home._empty_ || home.isArchived || home.isDeleted) {
			return null;
		};
		return home;
	};

	graph () {
		return { 
			id: 'graph', 
			name: 'Graph', 
			iconEmoji: ':earth_americas:',
			layout: I.ObjectLayout.Graph,
		};
	};

	actionByLayout (v: I.ObjectLayout): string {
		v = v || I.ObjectLayout.Page;

		let r = '';
		switch (v) {
			default:						 r = 'edit'; break;
			case I.ObjectLayout.Set:
			case I.ObjectLayout.Collection:	 r = 'set'; break;
			case I.ObjectLayout.Space:		 r = 'space'; break;
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
		Util.route('/' + route, (param || {}).replace);
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

		const { root } = blockStore;
		const action = this.actionByLayout(object.layout);

		if ((action == 'edit') && (object.id == root)) {
			this.openRoute(object);
			return;
		};

		param = param || {};
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

};

export default new ObjectUtil();