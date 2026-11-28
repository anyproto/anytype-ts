/**
 * Connect to AI apps: an incoming `anytype://ai/connect?app=<id>` link (§5.8). It never becomes a route of its
 * own or a redirect: it is kept here (the catalog id only) until this tab shows an app page with an account
 * and a space, then opens Settings ▸ AI apps once (`Action.openAiApps`, one history entry; a pinned tab opens
 * it in a new tab and keeps its own route). Account selection and PIN unlock keep it; logout drops it.
 *
 * Uses the app's globals `S`, `U`, `Action` and `analytics` (tests stub them).
 */
import { aiLinkOf, parseAiConnectRoute } from './deeplink';

let pending: { app: string } | null = null;
/** Bumped by `clearAiLink`: an open already scheduled is dropped (logout) */
let generation = 0;

/** Pages a link waits behind: loading, the link page itself, the Quick Search window; `void` only while a space is chosen */
const WAIT_ACTIONS = [ 'blank', 'aiConnect', 'quickSearch' ];

/** The tab shows an app page with an account and a space (past account selection and the PIN) */
const canOpen = (): boolean => {
	if (!S.Auth.account?.id || !S.Common.space) {
		return false;
	};

	const p = U.Router.getParam(U.Router.getRoute());

	// The empty-space landing page (`void/empty`) is a page of the app; `void/select` waits for a space (A9)
	return (p.page == 'main') && !WAIT_ACTIONS.includes(p.action) && ((p.action != 'void') || (p.id == 'empty'));
};

/** Opens a waiting link once the tab can; called on every route change and when a link arrives */
export const consumeAiLink = (): boolean => {
	if (!pending || !canOpen()) {
		return false;
	};

	const { app } = pending;
	const g = generation;

	pending = null;
	// After the route change that called us has finished
	window.setTimeout(() => {
		if (g == generation) {
			Action.openAiApps({ app }, analytics.route.deeplink);
		};
	}, 0);
	return true;
};

/** A link arrived (any route): kept as its catalog id only, opened now or once the tab can */
export const aiLinkArrived = (app: string): void => {
	pending = { app: parseAiConnectRoute(`/ai/connect?app=${encodeURIComponent(String(app || ''))}`)?.app || '' };
	consumeAiLink();
};

/** `route` was an AI link (in any spelling): it is now pending (true); anything else is left to the caller (false) */
export const takeAiLink = (route: string): boolean => {
	const ai = aiLinkOf(route);

	if (!ai) {
		return false;
	};
	aiLinkArrived(ai.app);
	return true;
};

export const pendingAiLink = (): { app: string } | null => pending ? { ...pending } : null;

export const clearAiLink = (): void => {
	pending = null;
	generation++;
};
