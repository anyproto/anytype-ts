import * as I from 'Interface';
import { MEMBERSHIP_ERROR_TIMEOUT } from 'Store/membership';

/** A request still unanswered after this is shown as unavailable; a late answer still applies */
export const MEMBERSHIP_WATCHDOG = 20000;
/** First automatic retry delay, doubled per attempt */
export const MEMBERSHIP_RETRY_BASE = 5000;
/** Retry delay ceiling */
export const MEMBERSHIP_RETRY_MAX = 5 * 60 * 1000;
/** Focus, online and resume trigger a fetch at most this often */
export const MEMBERSHIP_TRIGGER_GAP = 10000;
/** Minimum time between two Refresh presses (the middleware enforces the real limits) */
export const MEMBERSHIP_REFRESH_THROTTLE = 5000;
/** A login offers finalization only if the status turns FRESH within this time */
export const MEMBERSHIP_LOGIN_OFFER_TTL = 5 * 60 * 1000;
/** Forced poll window asked for by Refresh (the middleware caps it at 180s) */
export const MEMBERSHIP_REFRESH_FORCE_SEC = 180;

const RESOURCES = [ I.MembershipResource.Status, I.MembershipResource.Products ];

type Outcome = 'answer' | 'timeout' | 'blocked';
type Done = (outcome: Outcome) => void;

interface FetchParam {
	/** explicit user action: sent even if the browser reports offline */
	isManual?: boolean;
	forceRefreshSec?: number;
};

interface ActiveRequest {
	ticket: I.MembershipTicket;
	callbacks: Done[];
};

/**
 * Jittered exponential backoff: a delay between half and all of base * 2^attempt, capped.
 */
export const membershipBackoff = (attempt: number, random: () => number = Math.random): number => {
	const exp = Math.min(MEMBERSHIP_RETRY_MAX, MEMBERSHIP_RETRY_BASE * Math.pow(2, Math.max(0, attempt)));
	return Math.round(exp / 2 + random() * exp / 2);
};

export type MembershipPageKind = 'purchased' | 'intro' | 'state';

/**
 * Chooses what the membership page shows from the state of each resource. The status alone picks
 * Purchased (its embedded product resolves hidden plans; an entry that can not be resolved at all
 * gets a fallback, never "no membership") or Intro, which also needs the catalog.
 */
export const getMembershipPage = (statusView: I.MembershipView, productsView: I.MembershipView, data: I.MembershipData | null): { kind: MembershipPageKind; view: I.MembershipView } => {
	if ((statusView != I.MembershipView.Usable) || !data) {
		return { kind: 'state', view: (statusView == I.MembershipView.Usable) ? I.MembershipView.Pending : statusView };
	};

	const product = data.getTopProduct();
	const hasUnresolved = data.getUnresolvedProducts().length > 0;

	if ((product && !product.isIntro) || (!product && hasUnresolved)) {
		return { kind: 'purchased', view: statusView };
	};

	if (productsView == I.MembershipView.Usable) {
		return { kind: 'intro', view: productsView };
	};

	return { kind: 'state', view: productsView };
};

/**
 * Loads membership status and products and keeps them usable.
 *
 * - Both resources are fetched in parallel, at most one automatic request per resource at a time;
 *   duplicate fetches join the one in flight.
 * - A watchdog turns a request that does not answer into "unavailable"; a late answer still
 *   applies through the revision rules of the store.
 * - Every path settles: offline, not the Anytype network, errors, ignored answers, timeouts.
 * - Retries run on error and STALE with jittered backoff while the membership page is open,
 *   the window is focused and the browser is online. Page open, focus, online and resume trigger
 *   a fetch when something needs one.
 * - Refresh always sends a forced GetStatus (never joined into an automatic one, which would drop
 *   the flag) and joins an automatic GetProducts in flight.
 */
export class MembershipLoader {

	private active: Partial<Record<I.MembershipResource, ActiveRequest>> = {};
	private retryTimer = 0;
	private retryCount = 0;
	private refreshTimer = 0;
	private lastAutoAt = 0;
	private isMounted = false;
	private isStarted = false;
	/**
	 * Top purchase waiting for finalization ('' if none) the session started with (the first known
	 * status, of any freshness), then as last confirmed by a FRESH status. Null before the first
	 * known status.
	 */
	private confirmedFinalization: string = null;
	/** a login asked to offer finalization once the status is FRESH; expires after LOGIN_OFFER_TTL */
	private loginFinalization: { route: string; at: number } = null;
	private page = { openedAt: 0, settled: true, retries: 0, timedOut: false, isWarm: false };

	/**
	 * Fetches both resources in parallel (only those that need it for retries and triggers).
	 */
	load (reason: string, callBack?: () => void, onlyNeeded?: boolean) {
		const resources = onlyNeeded ? RESOURCES.filter(it => S.Membership.needsRetry(it)) : RESOURCES;

		let pending = resources.length;

		const done = () => {
			if (!--pending) {
				callBack?.();
			};
		};

		this.isStarted = true;

		if (!resources.length) {
			callBack?.();
			return;
		};

		if (!this.page.settled && (reason != 'open')) {
			this.page.retries++;
		};

		for (const resource of resources) {
			this.fetch(resource, reason, done);
		};
	};

	/**
	 * Fetches one resource, joining an automatic request already in flight.
	 */
	fetch (resource: I.MembershipResource, reason: string, callBack?: () => void, param?: FetchParam) {
		param = param || {};

		const cb: Done = () => callBack?.();
		const active = this.active[resource];

		if (active) {
			active.callbacks.push(cb);
			return;
		};

		if (!U.Data.isAnytypeNetwork()) {
			S.Membership.setBlock(resource, I.MembershipBlock.NotAnytypeNetwork);
			this.afterSettle();
			cb('blocked');
			return;
		};

		if (!S.Common.isOnline && !param.isManual) {
			S.Membership.setBlock(resource, I.MembershipBlock.Offline);
			this.afterSettle();
			cb('blocked');
			return;
		};

		const request: ActiveRequest = { ticket: null, callbacks: [ cb ] };

		this.active[resource] = request;
		request.ticket = this.send(resource, param, (outcome: Outcome) => {
			if (this.active[resource] === request) {
				delete(this.active[resource]);
			};

			request.callbacks.forEach(it => it(outcome));
		});

		console.log('[Membership] fetch', resource, reason);
	};

	/**
	 * The Refresh button. Returns false when the press was ignored (in flight or throttled).
	 */
	refresh (): boolean {
		if (S.Membership.refreshing || S.Membership.refreshThrottled || !U.Data.isAnytypeNetwork()) {
			return false;
		};

		const session = S.Membership.session;

		let pending = 2;

		const done = () => {
			// a Refresh of a previous account must not settle the button of the current one
			if (!--pending && (session == S.Membership.session)) {
				S.Membership.refreshSet(false);
			};
		};

		S.Membership.refreshSet(true);
		S.Membership.refreshThrottledSet(true);

		window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => S.Membership.refreshThrottledSet(false), MEMBERSHIP_REFRESH_THROTTLE);

		// A manual refresh starts the backoff over
		this.clearRetry();
		this.retryCount = 0;

		// The forced status request is always sent: joining an automatic request would drop the flag.
		// Automatic status fetches started meanwhile join it instead.
		const status = I.MembershipResource.Status;
		const param = { isManual: true, forceRefreshSec: MEMBERSHIP_REFRESH_FORCE_SEC };

		if (this.active[status]) {
			this.send(status, param, () => done());
		} else {
			this.fetch(status, 'refresh', done, param);
		};

		this.fetch(I.MembershipResource.Products, 'refresh', done, { isManual: true });

		analytics.event('ClickMembershipRefresh', { route: analytics.route.settingsMembership });
		return true;
	};

	/**
	 * Applies a MembershipV2Update event.
	 */
	onStatusEvent (data: I.MembershipData | null, fetchState: I.MembershipFetchState | null) {
		if (!this.isSessionActive()) {
			return;
		};

		const { applied, purchaseChanged } = S.Membership.applyResult(I.MembershipResource.Status, { fetchState, value: data, errorCode: 0 });

		if (applied) {
			this.afterStatusApplied(purchaseChanged, fetchState);
		};

		this.afterSettle();
	};

	/**
	 * Applies a MembershipV2ProductsUpdate event.
	 */
	onProductsEvent (products: I.MembershipProduct[], fetchState: I.MembershipFetchState | null) {
		if (!this.isSessionActive()) {
			return;
		};

		const { applied } = S.Membership.applyResult(I.MembershipResource.Products, { fetchState, value: products, errorCode: 0 });

		if (applied) {
			analytics.setProduct();
		};

		this.afterSettle();
	};

	/**
	 * The membership page was opened: fetch both, skipping the cache. Within the trigger gap a
	 * reopen fetches only if something is not usable or failed.
	 */
	onPageOpen () {
		const isWarm = RESOURCES.every(it => S.Membership.getView(it) == I.MembershipView.Usable);

		this.isMounted = true;
		this.retryCount = 0;
		this.page = { openedAt: Date.now(), settled: false, retries: 0, timedOut: false, isWarm };

		if (isWarm && !this.hasFailure() && (Date.now() - this.lastAutoAt < MEMBERSHIP_TRIGGER_GAP)) {
			this.isStarted = true;
			this.scheduleRetry();
		} else {
			this.load('open');
		};

		this.checkPageSettled();
	};

	onPageClose () {
		this.isMounted = false;

		// Leaving while still loading is the failure the settlement metric is about
		if (!this.page.settled) {
			this.reportPage('abandoned', RESOURCES.map(it => S.Membership.getView(it)));
		};

		this.clearRetry();
	};

	/**
	 * Login flow (auth setup): offer finalization for the account's current status once it is
	 * FRESH. Runs callBack right away when there is nothing to offer now; the offer may come later.
	 */
	finalizeOnLogin (route: string, callBack: () => void) {
		this.loginFinalization = null;

		if (this.isStatusFresh()) {
			const { purchased, product } = this.getFinalization();

			if (purchased && product) {
				Action.finalizeMembership(product, route, callBack);
			} else {
				callBack();
			};
			return;
		};

		this.loginFinalization = { route, at: Date.now() };
		callBack();
	};

	/**
	 * Focus, online and resume: fetch whatever needs it, at most once per trigger gap.
	 */
	trigger (reason: string) {
		// Only once membership was loaded for this account (not on auth screens or in the quick search panel)
		if (!this.isStarted || !S.Auth.account) {
			return;
		};

		if (!this.needsRetry() || (Date.now() - this.lastAutoAt < MEMBERSHIP_TRIGGER_GAP)) {
			this.scheduleRetry();
			return;
		};

		this.load(reason, null, true);
	};

	/**
	 * Window lost focus, or the browser went offline: retries pause.
	 */
	pause () {
		this.clearRetry();
	};

	/**
	 * Account switch and logout: drop timers and requests of the old session.
	 */
	reset () {
		this.clearRetry();
		window.clearTimeout(this.refreshTimer);
		this.active = {};
		this.retryCount = 0;
		this.lastAutoAt = 0;
		this.isStarted = false;
		this.isMounted = false;
		this.confirmedFinalization = null;
		this.loginFinalization = null;
		this.page.settled = true;
	};

	/**
	 * Something worth fetching right away on a reopen: a failure, or STALE with an error.
	 */
	hasFailure (): boolean {
		return RESOURCES.some(it => {
			const state = S.Membership.getState(it);
			return state.errorCode || state.clientErrorCode || (state.freshness != I.MembershipFreshness.Fresh && (state.lastRefreshError != I.MembershipRefreshError.Null));
		});
	};

	needsRetry (): boolean {
		return RESOURCES.some(it => S.Membership.needsRetry(it) && (S.Membership.getState(it).block != I.MembershipBlock.NotAnytypeNetwork));
	};

	private send (resource: I.MembershipResource, param: FetchParam, onDone: Done): I.MembershipTicket {
		const isOffline = param.isManual && !S.Common.isOnline;

		if (isOffline) {
			S.Membership.setBlock(resource, I.MembershipBlock.Offline);
		};

		const ticket = S.Membership.beginRequest(resource, isOffline);
		const isStatus = resource == I.MembershipResource.Status;

		// Only a request actually sent counts for the trigger gap: an attempt blocked as offline
		// right after a wake must not delay the fetch when the browser comes back online
		this.lastAutoAt = Date.now();

		const watchdog = window.setTimeout(() => {
			if (ticket.settled) {
				return;
			};

			S.Membership.applyClientError(ticket, MEMBERSHIP_ERROR_TIMEOUT);
			S.Membership.settleRequest(ticket);

			// A request of a previous account must not touch the current page telemetry
			if (ticket.session == S.Membership.session) {
				this.page.timedOut = true;
				console.warn('[Membership] still loading past the watchdog', resource);
				analytics.event('MembershipLoadTimeout', { type: resource, count: this.page.settled ? 0 : this.page.retries });
			};

			onDone('timeout');
			this.afterSettle();
		}, MEMBERSHIP_WATCHDOG);

		const callBack = (message: any) => {
			window.clearTimeout(watchdog);

			const wasSettled = ticket.settled;

			this.applyResponse(resource, ticket, message || {});
			S.Membership.settleRequest(ticket);

			if (!wasSettled) {
				onDone('answer');
			};

			// A late answer after the watchdog may still have made data usable
			this.afterSettle();
		};

		if (isStatus) {
			C.MembershipV2GetStatus(true, Number(param.forceRefreshSec) || 0, callBack);
		} else {
			C.MembershipV2GetProducts(true, callBack);
		};

		return ticket;
	};

	private applyResponse (resource: I.MembershipResource, ticket: I.MembershipTicket, message: any) {
		const code = Number(message.error?.code) || 0;
		const fetchState: I.MembershipFetchState | null = message.fetchState || null;

		if (!fetchState && code) {
			// A transport error or an empty response: no revision, ordered by the request generation
			S.Membership.applyClientError(ticket, code);
			return;
		};

		const isStatus = resource == I.MembershipResource.Status;
		const value = isStatus ? message.data : message.products;
		const { applied, purchaseChanged } = S.Membership.applyResult(resource, { fetchState, value, errorCode: code }, ticket);

		if (applied && isStatus) {
			this.afterStatusApplied(purchaseChanged, fetchState);
		};
	};

	/**
	 * Purchase side effects run on the applied state change, whichever source applied it first (a
	 * response, or a buffered event at the same revision that is then ignored):
	 * - the first known status of the session is the baseline: a state that already existed
	 *   (e.g. Finalization after a restart, STALE then FRESH) is not new;
	 * - afterwards finalization opens once when a FRESH status shows the top purchase newly waiting
	 *   for finalization (another product, or a status change into Finalization). Renewals, add-ons
	 *   or refunds never reopen a dismissed dialog, STALE never confirms a purchase, and an
	 *   unchanged FRESH recovery opens nothing;
	 * - a login can ask to offer finalization for the baseline (finalizeOnLogin).
	 */
	private afterStatusApplied (purchaseChanged: boolean, fetchState: I.MembershipFetchState | null) {
		if (purchaseChanged) {
			analytics.setProduct();
		};

		if (!S.Membership.isStatusKnown) {
			return;
		};

		const isFresh = !fetchState || (fetchState.freshness == I.MembershipFreshness.Fresh);
		const { purchased } = this.getFinalization();
		const key = purchased ? String(purchased.product?.id || '') : '';

		if (this.confirmedFinalization === null) {
			this.confirmedFinalization = key;
		} else
		if (isFresh) {
			const isNew = key && (key != this.confirmedFinalization);

			this.confirmedFinalization = key;

			if (isNew) {
				this.loginFinalization = null;
				this.openFinalization(analytics.route.settingsMembership);
				return;
			};
		};

		const login = this.loginFinalization;

		if (isFresh && login) {
			this.loginFinalization = null;

			if (Date.now() - login.at <= MEMBERSHIP_LOGIN_OFFER_TTL) {
				this.openFinalization(login.route);
			};
		};
	};

	private openFinalization (route: string) {
		const { purchased, product } = this.getFinalization();

		if (purchased && product) {
			Action.finalizeMembership(product, route);
		};
	};

	/**
	 * The top purchase when it waits for name finalization.
	 */
	private getFinalization (): { purchased: I.MembershipPurchasedProduct | null; product: I.MembershipProduct | null } {
		const { data } = S.Membership;
		const purchased = data?.getTopPurchasedProduct();
		const product = data?.getTopProduct();

		if (!purchased || !product || !purchased.isFinalization) {
			return { purchased: null, product: null };
		};

		return { purchased, product };
	};

	private isStatusFresh (): boolean {
		return S.Membership.isStatusKnown && (S.Membership.statusState.freshness == I.MembershipFreshness.Fresh);
	};

	/**
	 * Events belong to the running account: after logout, flushed events of the old account are dropped.
	 */
	private isSessionActive (): boolean {
		return this.isStarted && !!S.Auth.account;
	};

	private afterSettle () {
		this.checkPageSettled();

		if (!RESOURCES.some(it => this.active[it])) {
			this.scheduleRetry();
		};
	};

	private scheduleRetry () {
		if (!this.isMounted || !S.Common.isOnline || !S.Common.windowIsFocused) {
			this.clearRetry();
			return;
		};

		if (!this.needsRetry()) {
			this.clearRetry();
			this.retryCount = 0;
			return;
		};

		// An armed retry stays: triggers and events inside the gap must not stretch the backoff
		if (this.retryTimer) {
			return;
		};

		const delay = membershipBackoff(this.retryCount++);

		this.retryTimer = window.setTimeout(() => {
			this.retryTimer = 0;
			this.load('retry', null, true);
		}, delay);
	};

	private clearRetry () {
		window.clearTimeout(this.retryTimer);
		this.retryTimer = 0;
	};

	/**
	 * Reports once per page open how loading ended (UI settlement telemetry).
	 */
	private checkPageSettled () {
		if (this.page.settled) {
			return;
		};

		const views = RESOURCES.map(it => S.Membership.getView(it));
		if (views.includes(I.MembershipView.Pending)) {
			return;
		};

		let type = 'content';

		if (views.includes(I.MembershipView.NotAnytypeNetwork)) {
			type = 'notAnytypeNetwork';
		} else
		if (views.includes(I.MembershipView.Offline)) {
			type = 'offline';
		} else
		if (views.includes(I.MembershipView.Unavailable)) {
			type = this.page.timedOut ? 'timeout' : 'unavailable';
		} else
		if (RESOURCES.some(it => S.Membership.isUpdating(it))) {
			type = 'stale';
		};

		this.reportPage(type, views);
	};

	private reportPage (type: string, views: I.MembershipView[]) {
		const middleTime = Date.now() - this.page.openedAt;
		const origin = this.page.isWarm ? 'warm' : 'cold';

		this.page.settled = true;

		console.log('[Membership] settled', type, origin, 'ms:', middleTime, 'retries:', this.page.retries, 'views:', views.join('/'));
		analytics.event('MembershipLoad', { type, origin, count: this.page.retries, middleTime, status: views.join('/') });
	};

};

export const membership = new MembershipLoader();
