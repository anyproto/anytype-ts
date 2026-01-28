import $ from 'jquery';
import { I, C, S, U, J, Preview, analytics, Storage, sidebar, translate, focus, Renderer } from 'Lib';

interface RouteParam {
	page: string;
	action: string;
	id: string;
	spaceId?: string;
	viewId?: string;
	relationKey?: string;
	messageId?: string;
	objectId?: string;
	additional?: { key: string, value: string }[];
};

/**
 * UtilRouter handles application navigation and routing.
 *
 * Key responsibilities:
 * - Building and parsing route URLs
 * - Navigating between pages with optional animations
 * - Managing browser history
 * - Switching between spaces with proper state management
 *
 * Routes follow the pattern: /page/action/id/[key/value pairs]
 * Example: /main/edit/abc123/spaceId/xyz
 */
class UtilRouter {

	history: any = null;
	isOpening = false;

	/**
	 * Initializes the router with a history object.
	 * @param {any} history - The history object to use for navigation.
	 */
	init (history: any) {
		this.history = history;
		this.isOpening = false; // Reset flag on init to prevent stuck state
	};

	/**
	 * Parses a route path into its parameter object.
	 * @param {string} path - The route path string.
	 * @returns {RouteParam} The parsed route parameters.
	 */
	getParam (route: string): any {
		route = String(route || '');

		const parts = route.split('?');
		if (!parts.length) {
			return {};
		};

		const path = String(parts[0] || '').split('/');
		const search = String(parts[1] || '');

		if (path[0] == '') {
			path.shift();
		};

		const param: any = {
			page: String(path[0] || 'index'),
			action: String(path[1] || 'index'),
			id: String(path[2] || ''),
		};

		if (path.length > 3) {
			for (let i = 3; i < path.length; i++) {
				param[path[i]] = path[(i + 1)];
				i++;
			};
		};

		const searchParam = search ? U.Common.searchParam(search) : {};

		if (param.page == 'object') {
			param.id = searchParam.objectId;
		};

		if ([ 'object', 'invite', 'membership' ].includes(param.page)) {
			param.action = param.page;
			param.page = 'main';
		};

		if (param.page == 'hi') {
			param.action = 'oneToOne';
			param.page = 'main';
		};

		const ret = Object.assign(param, searchParam);
		const out: any = {};

		for (const k in ret) {
			out[U.Common.safeDecodeUri(k)] = U.Common.safeDecodeUri(ret[k]);
		};

		return out;
	};

	/**
	 * Builds a route string from route parameters.
	 * @param {Partial<RouteParam>} param - The route parameters.
	 * @returns {string} The route string.
	 */
	build (param: Partial<RouteParam>): string {
		const page = String(param.page || 'index');
		const action = String(param.action || 'index');
		const id = String(param.id || '');
		const additional = param.additional || [];

		let route = [ '', page, action, id ];

		for (const k in param) {
			if ([ 'page', 'action', 'id', 'additional' ].includes(k)) {
				continue;
			};

			route = route.concat([ k, param[k] ]);
		};

		if (additional.length) {
			route = route.concat(additional.map(it => [ it.key, it.value ]).flat());
		};

		route = route.map(it => encodeURIComponent(it));
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

		const { space } = S.Common;
		const { replace, animate, delay, onFadeOut, onFadeIn, onRouteChange } = param;
		const routeParam = this.getParam(route);
		const newRoute = this.build(routeParam);

		let updateTabRoute = param.updateTabRoute;
		if (updateTabRoute === undefined) {
			updateTabRoute = true;
		};

		let timeout = S.Menu.getTimeout();
		if (!timeout) {
			timeout = S.Popup.getTimeout();
		};

		S.Menu.closeAll();
		S.Popup.closeAll();
		focus.clear(true);

		if (routeParam.spaceId && (routeParam.spaceId != space) && ![ 'object', 'invite' ].includes(routeParam.action)) {
			this.switchSpace(routeParam.spaceId, newRoute, false, param, false);
			return;
		};

		const change = () => {
			this.history.push(newRoute);

			if (updateTabRoute) {
				Renderer.send('updateTab', U.Common.getElectron().tabId(), { route: newRoute });
			};

			onRouteChange?.();
		};

		const onTimeout = () => {
			Preview.hideAll();

			if (replace) {
				this.history.entries = [];
				this.history.index = -1;
			};

			if (!animate) {
				onFadeOut?.();
				change();
				onFadeIn?.();
				return;
			};

			const fade = $('#globalFade');
			const t = delay || J.Constant.delay.route;
			const wait = t;

			fade.css({ transitionDuration: `${t / 1000}s` }).show();
				
			window.setTimeout(() => fade.addClass('show'), 15);

			window.setTimeout(() => {
				onFadeOut?.();
				change();
			}, t);

			window.setTimeout(() => {
				onFadeIn?.();
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
					U.Space.openDashboard();
					window.setTimeout(() => {
						S.Popup.open('confirm', {
							data: {
								icon: 'error',
								title: translate('commonError'),
								text: message.error.description,
								canCancel: true,
							},
						});
					}, J.Constant.delay.popup);
				} else {
					U.Space.openFirstSpaceOrVoid(it => (it.targetSpaceId != id) && it.isLocalOk);
				};
				return;
			};

			this.go('/main/blank', { 
				updateTabRoute: false,
				onRouteChange: () => {
					Storage.set('spaceId', id);

					analytics.removeContext();
					S.Common.nullifySpaceKeys();

					U.Data.onInfo(message.info);
					S.Common.setLeftSidebarState('vault', '');
					this.rightSidebarCheck(false);

					const onStartingIdCheck = () => {
						U.Data.onAuth({ route, routeParam }, () => {
							this.isOpening = false;
							S.Common.setLeftSidebarState('vault', 'widget');
							sidebar.leftPanelSubPageOpen('widget', false, true);
						});
					};

					const startingId = S.Auth.startingId.get(id);

					if (startingId) {
						U.Object.getById(startingId, {}, (object: any) => {
							if (object) {
								route = U.Object.route(object);
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

	rightSidebarCheck (isPopup: boolean) {
		const state = S.Common.getRightSidebarState(isPopup);

		if (state.page == 'type') {
			sidebar.rightPanelClose(isPopup, false);
		};
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

	isDoubleRedirect (page: string, action: string): boolean {
		if ((page == 'main') && [ 'object', 'invite', 'membership', 'blank' ].includes(action)) {
			return true;
		};

		return false;
	};

	isTripleRedirect (page: string, action: string): boolean {
		if ((page == 'main') && (action == 'history')) {
			return true;
		};

		if ((page == 'auth') && (action == 'pin-check')) {
			return true;
		};

		return false;
	};

};

export default new UtilRouter();