import { UtilCommon, UtilData, Preview } from 'Lib';
import { commonStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

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

	go (route: string, param: Partial<{ replace: boolean, animate: boolean, onFadeOut: () => void, onFadeIn?: () => void }>) {
		if (!route) {
			return;
		};

		const { replace, animate, onFadeOut, onFadeIn } = param;
		const routeParam = this.getParam(route);
		const method = replace ? 'replace' : 'push';

		let timeout = menuStore.getTimeout(menuStore.getItems());
		if (!timeout) {
			timeout = popupStore.getTimeout(popupStore.getItems());
		};

		menuStore.closeAll();
		popupStore.closeAll();

		if (routeParam.spaceId && (routeParam.spaceId != commonStore.space)) {
			UtilData.switchSpace(routeParam.spaceId, route);
			return;
		};

		window.setTimeout(() => {
			Preview.hideAll();

			if (animate) {
				const fade = $('#globalFade');
				
				fade.show();
				window.setTimeout(() => fade.addClass('show'), 15);

				window.setTimeout(() => {
					if (onFadeOut) {
						onFadeOut();
					};

					UtilCommon.history[method](route); 
					fade.removeClass('show');
				}, Constant.delay.route);

				window.setTimeout(() => {
					if (onFadeIn) {
						onFadeIn();
					};

					fade.hide();
				}, Constant.delay.route * 2);
			} else {
				UtilCommon.history[method](route); 
			};
		}, timeout);
	};

};

export default new UtilRouter();