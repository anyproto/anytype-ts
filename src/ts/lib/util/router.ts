import $ from 'jquery';
import { I, C, S, U, J, Preview, analytics, Storage, sidebar, keyboard, translate } from 'Lib';

interface RouteParam {
	page: string; 
	action: string; 
	id: string; 
	spaceId: string; 
	viewId: string; 
	relationKey: string;
	additional: { key: string, value: string }[];
};

class UtilRouter {

	history: any = null;
	isOpening = false;

	init (history: any) {
		this.history = history;
	};

	getParam (path: string): any {
		const route = path.split('/');
		if (!route.length) {
			return {};
		};

		if (route[0] == '') {
			route.shift();
		};

		const param: any = {
			page: String(route[0] || 'index'),
			action: String(route[1] || 'index'),
			id: String(route[2] || ''),
		};

		if (route.length > 3) {
			for (let i = 3; i < route.length; i++) {
				param[route[i]] = route[(i + 1)];
				i++;
			};
		};
		return param;
	};

	build (param: Partial<RouteParam>): string {
		const { page, action } = param;
		const id = String(param.id || '');
		const spaceId = String(param.spaceId || '');
		const viewId = String(param.viewId || '');
		const relationKey = String(param.relationKey || '');
		const additional = param.additional || [];

		let route = [ page, action, id ];
		if (spaceId) {
			route = route.concat([ 'spaceId', spaceId ]);
		};
		if (viewId) {
			route = route.concat([ 'viewId', viewId ]);
		};
		if (relationKey) {
			route = route.concat([ 'relationKey', relationKey ]);
		};
		if (additional.length) {
			additional.forEach((it: any) => {
				route = route.concat([ it.key, it.value ]);
			});
		};
		return route.join('/');
	};

	go (route: string, param: Partial<I.RouteParam>) {
		if (!route) {
			return;
		};

		param = param || {};

		const { replace, animate, onFadeOut, onFadeIn, onRouteChange, delay } = param;
		const routeParam = this.getParam(route);
		const { space } = S.Common;

		let timeout = S.Menu.getTimeout();
		if (!timeout) {
			timeout = S.Popup.getTimeout();
		};

		S.Menu.closeAll();
		S.Popup.closeAll();
		sidebar.rightPanelToggle(false, false, keyboard.isPopup());

		if (routeParam.spaceId && ![ J.Constant.storeSpaceId, space ].includes(routeParam.spaceId)) {
			this.switchSpace(routeParam.spaceId, route, false, param, false);
			return;
		};

		const change = () => {
			this.history.push(route); 
			if (onRouteChange) {
				onRouteChange();
			};
		};

		const fadeOut = () => {
			if (onFadeOut) {
				onFadeOut();
			};
		};

		const fadeIn = () => {
			if (onFadeIn) {
				onFadeIn();
			};
		};

		const onTimeout = () => {
			Preview.hideAll();

			if (replace) {
				this.history.entries = [];
				this.history.index = -1;
			};

			if (!animate) {
				fadeOut();
				change();
				fadeIn();
				return;
			};

			const fade = $('#globalFade');
			const t = delay || J.Constant.delay.route;
			const wait = t;

			fade.css({ transitionDuration: `${t / 1000}s` }).show();
				
			window.setTimeout(() => fade.addClass('show'), 15);

			window.setTimeout(() => {
				fadeOut();
				change();
			}, t);

			window.setTimeout(() => {
				fadeIn();
				fade.removeClass('show');
				window.setTimeout(() => fade.hide(), t);
			}, wait + t);
		};

		timeout ? window.setTimeout(() => onTimeout(), timeout) : onTimeout();
	};

	switchSpace (id: string, route: string, sendEvent: boolean, routeParam: any, useFallback: boolean) {
		if (this.isOpening) {
			return;
		};

		if (!id) {
			console.log('[UtilRouter].swithSpace: id is empty');
			return;
		};

		const withChat = U.Object.isAllowedChat();

		S.Menu.closeAllForced();
		S.Progress.showSet(false);
		sidebar.rightPanelToggle(false, false, false);

		if (sendEvent) {
			analytics.event('SwitchSpace');
		};

		this.isOpening = true;

		C.WorkspaceOpen(id, withChat, (message: any) => {
			this.isOpening = false;

			if (message.error.code) {
				if (!useFallback) {
					S.Popup.open('confirm', {
						data: {
							icon: 'error',
							title: translate('commonError'),
							text: message.error.description,
							canCancel: true,
						},
					});
				} else {
					const spaces = U.Space.getList().filter(it => (it.targetSpaceId != id) && it.isLocalOk);

					if (spaces.length) {
						this.switchSpace(spaces[0].targetSpaceId, route, false, routeParam, useFallback);
					} else {
						U.Router.go('/main/void', routeParam);
					};
				};
				return;
			};

			this.go('/main/blank', { 
				replace: true, 
				animate: true,
				delay: 300,
				onFadeOut: () => {
					S.Record.metaClear(J.Constant.subId.participant, '');
					S.Record.recordsClear(J.Constant.subId.participant, '');

					analytics.removeContext();
					S.Block.clear(S.Block.widgets);
					S.Common.defaultType = null;
					Storage.set('spaceId', id);

					U.Data.onInfo(message.info);
					U.Data.onAuth({ route, routeParam });
				}
			});
		});
	};

	getRoute () {
		return String(this.history?.location?.pathname || '');
	};

	getRouteSpaceId () {
		const param = this.getParam(this.getRoute());
		return param.spaceId || S.Common.space;
	};

};

export default new UtilRouter();