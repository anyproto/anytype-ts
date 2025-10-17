import $ from 'jquery';
import { I, C, S, U, J, Preview, analytics, Storage, sidebar, translate, focus } from 'Lib';

interface RouteParam {
	page: string; 
	action: string; 
	id: string; 
	spaceId?: string; 
	viewId?: string; 
	relationKey?: string;
	additional?: { key: string, value: string }[];
};

class UtilRouter {

	history: any = null;
	isOpening = false;

	/**
	 * Initializes the router with a history object.
	 * @param {any} history - The history object to use for navigation.
	 */
	init (history: any) {
		this.history = history;
	};

	/**
	 * Parses a route path into its parameter object.
	 * @param {string} path - The route path string.
	 * @returns {RouteParam} The parsed route parameters.
	 */
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

	/**
	 * Builds a route string from route parameters.
	 * @param {Partial<RouteParam>} param - The route parameters.
	 * @returns {string} The route string.
	 */
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

	/**
	 * Navigates to a route with optional parameters and animation.
	 * @param {string} route - The route string.
	 * @param {Partial<I.RouteParam>} param - Additional navigation parameters.
	 */
	go (route: string, param: Partial<I.RouteParam>) {
		if (!route) {
			return;
		};

		param = param || {};

		const { replace, animate, delay, onFadeOut, onFadeIn, onRouteChange } = param;
		const routeParam = this.getParam(route);
		const { space } = S.Common;

		let timeout = S.Menu.getTimeout();
		if (!timeout) {
			timeout = S.Popup.getTimeout();
		};

		S.Menu.closeAll();
		S.Popup.closeAll();
		sidebar.rightPanelClose(false);

		focus.clear(true);

		if (routeParam.spaceId && (routeParam.spaceId != space)) {
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

	/**
	 * Switches to a different space, handling errors and fallbacks.
	 * @param {string} id - The space ID to switch to.
	 * @param {string} route - The route to navigate after switching.
	 * @param {boolean} sendEvent - Whether to send analytics event.
	 * @param {any} routeParam - Additional route parameters.
	 * @param {boolean} useFallback - Whether to use fallback on error.
	 */
	switchSpace (id: string, route: string, sendEvent: boolean, routeParam: any, useFallback: boolean) {
		routeParam = routeParam || {};

		if (this.isOpening) {
			return;
		};

		if (!id) {
			console.log('[UtilRouter].swithSpace: id is empty');
			return;
		};

		S.Menu.closeAllForced();
		S.Progress.showSet(false);

		if (sendEvent) {
			const counters = S.Chat.getSpaceCounters(id);
			const { mentionCounter, messageCounter} = counters;

			analytics.event('SwitchSpace', { unreadMessageCount: messageCounter, hasMentions: !!mentionCounter });
		};

		this.isOpening = true;

		C.WorkspaceOpen(id, (message: any) => {
			if (message.error.code) {
				this.isOpening = false;

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
						U.Router.go('/main/void/error', routeParam);
					};
				};
				return;
			};

			this.go('/main/blank', { 
				replace: true, 
				animate: false,
				delay: 0,
				onRouteChange: () => {
					Storage.set('spaceId', id);

					analytics.removeContext();
					S.Common.nullifySpaceKeys();
					S.Common.setLeftSidebarState('vault', 'widget');

					U.Data.onInfo(message.info);

					const onStartingIdCheck = () => {
						U.Data.onAuth({ route, routeParam: { ...routeParam, onRouteChange, animate: false } }, () => {
							this.isOpening = false;
						});
					};

					const onRouteChange = () => {
						routeParam.onRouteChange?.();
					};

					const startingId = S.Auth.startingId.get(id);

					if (startingId) {
						U.Object.getById(startingId, {}, (object: any) => {
							if (object) {
								route = '/' + U.Object.route(object);
							};
							onStartingIdCheck();
						});

						S.Auth.startingId.delete(id);
					} else {
						onStartingIdCheck();
					};
				},
			});
		});
	};

	/**
	 * Gets the current route path as a string.
	 * @returns {string} The current route path.
	 */
	getRoute (): string {
		return String(this.history?.location?.pathname || '');
	};

	/**
	 * Gets the current search query string.
	 * @returns {string} The current search query.
	 */
	getSearch (): string {
		return String(this.history?.location?.search || '');
	};

	/**
	 * Gets the spaceId from the current route or the default space.
	 * @returns {string} The spaceId.
	 */
	getRouteSpaceId () {
		const param = this.getParam(this.getRoute());
		return param.spaceId || S.Common.space;
	};

};

export default new UtilRouter();