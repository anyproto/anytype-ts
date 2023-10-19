import { C, UtilCommon, UtilData, Preview, analytics } from 'Lib';
import { commonStore, blockStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

type RouteParam = { 
	replace: boolean;
	animate: boolean;
	onFadeOut: () => void;
	onFadeIn?: () => void;
	onRouteChange?: () => void;
};

class UtilRouter {

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
		const method = replace ? 'replace' : 'push';
		const { space, techSpace } = commonStore;

		let timeout = menuStore.getTimeout(menuStore.getItems());
		if (!timeout) {
			timeout = popupStore.getTimeout(popupStore.getItems());
		};

		menuStore.closeAll();
		popupStore.closeAll();

		if (routeParam.spaceId && ![ Constant.storeSpaceId, space, techSpace ].includes(routeParam.spaceId)) {
			this.switchSpace(routeParam.spaceId, route);
			return;
		};

		const onTimeout = () => {
			Preview.hideAll();

			if (!animate) {
				UtilCommon.history[method](route); 
				return;
			};

			const fade = $('#globalFade');
				
			fade.show();
			window.setTimeout(() => fade.addClass('show'), 15);

			window.setTimeout(() => {
				if (onFadeOut) {
					onFadeOut();
				};

				UtilCommon.history[method](route);

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

		if (!id || (space == id)) {
			return;
		};

		C.WorkspaceOpen(id, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.go('/main/blank', { 
				replace: true, 
				animate: true,
				onRouteChange: () => {
					if (route) {
						commonStore.redirectSet(route);
					};

					analytics.removeContext();
					blockStore.clear(blockStore.widgets);

					UtilData.onInfo(message.info);
					UtilData.onAuth({ routeParam: { replace: true } }, callBack);

					analytics.event('SwitchSpace');
				}
			});
		});
	};

};

export default new UtilRouter();