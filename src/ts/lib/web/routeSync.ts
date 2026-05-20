/**
 * Syncs memory history ↔ browser URL.
 * Memory history is the source of truth for the app.
 * Browser URL is kept in sync for display and sharing.
 *
 * Key behaviors:
 * - Intermediate routes (/main/blank, /main/void) are skipped entirely
 *   so they never appear in browser history.
 * - When browser back/forward triggers a cross-space route, U.Router.go()
 *   handles space switching. During the async switch, all syncs use
 *   replaceState to avoid duplicating browser history entries.
 * - After memory history reset (e.g. logout), browser back is blocked.
 */
export function initRouteSync (memoryHistory: any, router: any) {
	let isPopstateNavigation = false;

	// Memory history → browser URL
	memoryHistory.listen((location: any, action: string) => {
		const url = location.pathname + (location.search || '') + (location.hash || '');
		const parts = location.pathname.split('/').filter(Boolean);
		const page = parts[0] || '';
		const routeAction = parts[1] || '';

		// Intermediate routes are transient navigation steps during space
		// switching — skip browser history entirely so they never appear
		// as entries (neither pushState nor replaceState).
		if ((page === 'main') && [ 'blank', 'void' ].includes(routeAction)) {
			return;
		}

		// During popstate-triggered navigation (browser back/forward),
		// use replaceState for everything to avoid creating duplicate
		// browser history entries. The browser already moved its position
		// in the history stack.
		if (isPopstateNavigation) {
			window.history.replaceState(null, '', url);

			// Once space switching is complete, exit popstate mode
			if (!router.isOpening) {
				isPopstateNavigation = false;
			}
			return;
		}

		if (action === 'PUSH') {
			window.history.pushState(null, '', url);
		} else
		if (action === 'REPLACE') {
			window.history.replaceState(null, '', url);
		}
	});

	// Browser back/forward → app navigation
	U.Dom.addEvent(window, 'popstate', () => {
		// index < 0 means memory history was reset (e.g. after logout
		// via go() with replace: true which sets entries=[], index=-1).
		// Push current route forward to block browser back into stale history.
		if (memoryHistory.index < 0) {
			const current = memoryHistory.entries[0]?.pathname || '/';
			window.history.pushState(null, '', current);
			return;
		}

		isPopstateNavigation = true;

		// Use router.go() which handles space switching when the route
		// contains a different spaceId than the current space.
		router.go(window.location.pathname, {});

		// For cross-space navigation, router.isOpening stays true during
		// the async WorkspaceOpen call. Poll until it settles, then
		// allow normal pushState sync to resume. Cap at 10s to prevent
		// infinite polling if isOpening gets stuck.
		let attempts = 0;
		const maxAttempts = 200;
		const waitForSettle = () => {
			attempts++;
			if (!router.isOpening || (attempts >= maxAttempts)) {
				isPopstateNavigation = false;
			} else {
				window.setTimeout(waitForSettle, 50);
			}
		};
		window.setTimeout(waitForSettle, 50);
	});
}
