import $ from 'jquery';
import { C, UtilData, Preview, analytics, Storage, keyboard } from 'Lib';
import { commonStore, authStore, blockStore, menuStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

type RouteParam = { 
	replace: boolean;
	animate: boolean;
	onFadeOut: () => void;
	onFadeIn?: () => void;
	onRouteChange?: () => void;
};

class UtilRouter {

	history: any = null;

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

	build (param: Partial<{ page: string; action: string; id: string; spaceId: string; }>): string {
		let route = [ param.page, param.action, param.id ];

		if (param.spaceId) {
			route = route.concat([ 'spaceId', param.spaceId ]);
		};

		return route.join('/');
	};

	go (route: string, param: Partial<RouteParam>) {
		if (!route) {
			return;
		};

		const { replace, animate, onFadeOut, onFadeIn, onRouteChange } = param;
		const routeParam = this.getParam(route);
		const { space } = commonStore;

		let timeout = menuStore.getTimeout();
		if (!timeout) {
			timeout = popupStore.getTimeout();
		};

		menuStore.closeAll();
		popupStore.closeAll();

		if (routeParam.spaceId && ![ Constant.storeSpaceId, space ].includes(routeParam.spaceId)) {
			this.switchSpace(routeParam.spaceId, route);
			return;
		};

		const onTimeout = () => {
			Preview.hideAll();

			if (replace) {
				this.history.entries = [];
				this.history.index = -1;
			};

			if (!animate) {
				this.history.push(route); 

				if (onRouteChange) {
					onRouteChange();
				};
				return;
			};

			const fade = $('#globalFade');
				
			fade.show();
			window.setTimeout(() => fade.addClass('show'), 15);

			window.setTimeout(() => {
				if (onFadeOut) {
					onFadeOut();
				};

				this.history.push(route);

				if (onRouteChange) {
					onRouteChange();
				};

				fade.removeClass('show');
			}, Constant.delay.route);

			window.setTimeout(() => {
				if (onFadeIn) {
					onFadeIn();
				};

				fade.hide();
			}, Constant.delay.route * 2);
		};

		timeout ? window.setTimeout(() => onTimeout(), timeout) : onTimeout();
	};

	switchSpace (id: string, route?: string, callBack?: () => void) {
		const { space } = commonStore;
		const { accountSpaceId } = authStore;

		if (!id || (space == id)) {
			return;
		};

		C.WorkspaceOpen(id, (message: any) => {
			if (message.error.code) {
				if (id != accountSpaceId) {
					this.switchSpace(accountSpaceId, route, callBack);
				};
				return;
			};

			this.go('/main/blank', { 
				replace: true, 
				animate: true,
				onFadeOut: () => {
					if (route) {
						commonStore.redirectSet(route);
					};

					analytics.removeContext();
					blockStore.clear(blockStore.widgets);
					commonStore.defaultType = '';
					Storage.set('spaceId', id);

					UtilData.onInfo(message.info);
					UtilData.onAuth({ routeParam: { replace: true } }, callBack);
				}
			});
		});
	};

	getRoute () {
		return String(this.history.location.pathname || '');
	};

	getRouteSpaceId () {
		const param = this.getParam(this.getRoute());
		return param.spaceId || commonStore.space;
	};

};

export default new UtilRouter();