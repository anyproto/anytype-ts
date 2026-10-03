import { action, computed, makeObservable, observable } from 'mobx';
import * as I from 'Interface';
import * as M from 'Model';

/** Middleware cache lifetime in seconds: older data gets a quiet "updating" hint */
export const MEMBERSHIP_CACHE_LIFETIME = 10 * 60;

/** Client-side error code of a request the watchdog gave up on */
export const MEMBERSHIP_ERROR_TIMEOUT = -1;

const emptyResourceState = (): I.MembershipResourceState => ({
	known: false,
	freshness: I.MembershipFreshness.None,
	lastSuccessfulFetchAt: 0,
	lastRefreshError: I.MembershipRefreshError.Null,
	errorCode: 0,
	clientErrorCode: 0,
	revision: null,
	inFlight: 0,
	block: I.MembershipBlock.None,
	attempted: false,
});

/**
 * Payload of a response or an event for one resource. `value` is the status data or the products
 * list; it is only read when the freshness says it is usable.
 */
export interface MembershipPayload {
	fetchState: I.MembershipFetchState | null;
	value: any;
	errorCode: number;
};

export interface MembershipApplyResult {
	/** the payload was accepted (a newer revision, or a revisionless result that still applies) */
	applied: boolean;
	/** status only: the purchased products, their status or end dates changed, or the status became known */
	purchaseChanged: boolean;
};

/**
 * Signature of what a purchase changes: product ids, status and end dates.
 */
export const membershipPurchaseKey = (data: I.MembershipData | null): string => {
	if (!data) {
		return '';
	};

	return (data.products || []).map(it => [ it.product?.id, it.status, it.info?.dateEnds ].join(':')).sort().join(',');
};

/**
 * Membership status and products, each with its own load state.
 *
 * Responses and events are ordered by the middleware revision `(epoch, counter)` per resource:
 * equal or older revisions are ignored, an epoch change resets the ordering. Results without a
 * revision (transport errors, watchdog timeouts) apply only if neither the request generation
 * nor the accepted revision moved since the request started. Request bookkeeping is settled on
 * every path, also when the payload is ignored.
 */
class MembershipStore {

	public productsList: I.MembershipProduct[] = [];
	public dataValue: I.MembershipData = null;
	public statusState: I.MembershipResourceState = emptyResourceState();
	public productsState: I.MembershipResourceState = emptyResourceState();
	public refreshing = false;
	public refreshThrottled = false;

	/** bumped on account switch and logout: results of an older session are dropped */
	public session = 1;

	private gens: Record<string, number> = {};
	private epochGens: Record<string, number> = {};

	constructor () {
		makeObservable(this, {
			productsList: observable,
			dataValue: observable,
			statusState: observable,
			productsState: observable,
			refreshing: observable,
			refreshThrottled: observable,
			products: computed,
			data: computed,
			isStatusKnown: computed,
			productsSet: action,
			dataSet: action,
			beginRequest: action,
			settleRequest: action,
			setBlock: action,
			applyResult: action,
			applyClientError: action,
			refreshSet: action,
			refreshThrottledSet: action,
			clearAll: action,
		});
	};

	get products (): I.MembershipProduct[] {
		return this.productsList || [];
	};

	/**
	 * The membership status, null while it is unknown (never fetched, or the middleware has nothing).
	 */
	get data (): I.MembershipData | null {
		return this.dataValue;
	};

	/**
	 * True when the status is known, so "no purchases" really means the free tier.
	 */
	get isStatusKnown (): boolean {
		return this.statusState.known && !!this.dataValue;
	};

	getState (resource: I.MembershipResource): I.MembershipResourceState {
		return resource == I.MembershipResource.Status ? this.statusState : this.productsState;
	};

	/**
	 * What a screen can render for a resource.
	 */
	getView (resource: I.MembershipResource): I.MembershipView {
		const state = this.getState(resource);

		if (state.known) {
			return I.MembershipView.Usable;
		};

		if (state.inFlight > 0) {
			return I.MembershipView.Pending;
		};

		switch (state.block) {
			case I.MembershipBlock.Offline: return I.MembershipView.Offline;
			case I.MembershipBlock.NotAnytypeNetwork: return I.MembershipView.NotAnytypeNetwork;
		};

		return state.attempted ? I.MembershipView.Unavailable : I.MembershipView.Pending;
	};

	/**
	 * Usable data that may be out of date for a reason worth a quiet hint: the latest refresh
	 * failed, or the data is older than the cache lifetime. STALE data after a restart that is
	 * still within the lifetime (or of unknown age) and has no error is normal and gets no hint.
	 */
	isUpdating (resource: I.MembershipResource, now?: number): boolean {
		const state = this.getState(resource);

		if (!state.known) {
			return false;
		};

		if (state.clientErrorCode) {
			return true;
		};

		if (state.freshness != I.MembershipFreshness.Stale) {
			return false;
		};

		if (state.errorCode || (state.lastRefreshError != I.MembershipRefreshError.Null)) {
			return true;
		};

		now = Number(now) || Math.floor(Date.now() / 1000);
		return (state.lastSuccessfulFetchAt > 0) && (now - state.lastSuccessfulFetchAt > MEMBERSHIP_CACHE_LIFETIME);
	};

	/**
	 * A resource is worth another request: nothing usable, not FRESH, or the last attempt failed.
	 */
	needsRetry (resource: I.MembershipResource): boolean {
		const state = this.getState(resource);
		return !state.known || (state.freshness != I.MembershipFreshness.Fresh) || !!state.clientErrorCode || !!state.errorCode;
	};

	/**
	 * Starts a request: takes a ticket that its result is ordered against.
	 */
	beginRequest (resource: I.MembershipResource, keepBlock?: boolean): I.MembershipTicket {
		const state = this.getState(resource);
		const gen = (this.gens[resource] || 0) + 1;

		this.gens[resource] = gen;
		state.inFlight++;
		state.attempted = true;

		// A manual request sent while offline keeps the offline state if it fails
		if (!keepBlock) {
			state.block = I.MembershipBlock.None;
		};

		return {
			resource,
			session: this.session,
			gen,
			revision: state.revision ? { ...state.revision } : null,
			settled: false,
		};
	};

	/**
	 * Settles the bookkeeping of a request, once: on its result, or when the watchdog gives up.
	 */
	settleRequest (ticket: I.MembershipTicket) {
		if (!ticket || ticket.settled) {
			return;
		};

		ticket.settled = true;

		if (ticket.session != this.session) {
			return;
		};

		const state = this.getState(ticket.resource);
		state.inFlight = Math.max(0, state.inFlight - 1);
	};

	/**
	 * Records that no request was sent (offline, not the Anytype network).
	 */
	setBlock (resource: I.MembershipResource, block: I.MembershipBlock) {
		this.getState(resource).block = block;
	};

	/**
	 * Applies a response (with its ticket) or an event (without one).
	 */
	applyResult (resource: I.MembershipResource, payload: MembershipPayload, ticket?: I.MembershipTicket): MembershipApplyResult {
		const ret: MembershipApplyResult = { applied: false, purchaseChanged: false };

		if (ticket && (ticket.session != this.session)) {
			return ret;
		};

		const state = this.getState(resource);
		const revision = payload.fetchState?.revision;

		if (revision) {
			const current = state.revision;

			if (current && (current.epoch == revision.epoch)) {
				if (revision.counter < current.counter) {
					return ret;
				};

				if (revision.counter == current.counter) {
					// Same payload as shown: keep the value, but take the metadata, which the middleware
					// changes without a new revision (FRESH ages into STALE, a failed call at an
					// unchanged state returns its error)
					this.applyMetadata(resource, payload);
					return ret;
				};
			} else
			if (current) {
				// A new epoch: the payments service restarted. A response to a request sent before
				// the previous epoch change is older than everything since.
				if (ticket && (ticket.gen <= (this.epochGens[resource] || 0))) {
					return ret;
				};
				this.epochGens[resource] = this.gens[resource] || 0;
			};

			state.revision = { ...revision };
		} else
		if (ticket && !this.isTicketCurrent(ticket)) {
			// No revision: a newer request started or a newer revision arrived in the meantime
			return ret;
		};

		ret.applied = true;
		ret.purchaseChanged = this.applyPayload(resource, payload);
		return ret;
	};

	/**
	 * Applies a failure without a revision (transport error, watchdog timeout): only if neither the
	 * request generation nor the accepted revision moved since the request started.
	 */
	applyClientError (ticket: I.MembershipTicket, code: number): boolean {
		if (!ticket || (ticket.session != this.session) || !this.isTicketCurrent(ticket)) {
			return false;
		};

		this.getState(ticket.resource).clientErrorCode = Number(code) || 1;
		return true;
	};

	refreshSet (v: boolean) {
		this.refreshing = Boolean(v);
	};

	refreshThrottledSet (v: boolean) {
		this.refreshThrottled = Boolean(v);
	};

	/**
	 * Sets the membership products list.
	 * @param {I.MembershipProduct[]} list - The membership products list.
	 */
	productsSet (list: I.MembershipProduct[]) {
		this.productsList = (list || []).map(it => new M.MembershipProduct(it));
	};

	/**
	 * Sets the membership data.
	 * @param {I.MembershipData | null} data - The membership data.
	 */
	dataSet (data: I.MembershipData | null) {
		this.dataValue = data ? new M.MembershipData(data) : null;
	};

	/**
	 * Gets a membership product by ID.
	 * @param {string} id - The membership product ID.
	 * @returns {I.MembershipProduct | null} The membership product or null if not found.
	 */
	getProduct (id: string): I.MembershipProduct | null {
		return this.productsList.find(it => it.id == id) || null;
	};

	/**
	 * Forgets everything, including the ordering state: used on account switch and logout.
	 */
	clearAll () {
		this.productsList = [];
		this.dataValue = null;
		this.statusState = emptyResourceState();
		this.productsState = emptyResourceState();
		this.refreshing = false;
		this.refreshThrottled = false;
		this.session++;
		this.gens = {};
		this.epochGens = {};
	};

	private isTicketCurrent (ticket: I.MembershipTicket): boolean {
		const a = ticket.revision;
		const b = this.getState(ticket.resource).revision;
		const sameRevision = (!a && !b) || (!!a && !!b && (a.epoch == b.epoch) && (a.counter == b.counter));

		return (ticket.gen == (this.gens[ticket.resource] || 0)) && sameRevision;
	};

	/**
	 * Metadata of an equal-revision answer. A client transport error is cleared only by an answer
	 * without an error.
	 */
	private applyMetadata (resource: I.MembershipResource, payload: MembershipPayload) {
		const state = this.getState(resource);
		const { fetchState } = payload;
		const code = Number(payload.errorCode) || 0;

		state.errorCode = code;

		if (!code) {
			state.clientErrorCode = 0;
		};

		if (!fetchState || (fetchState.freshness == I.MembershipFreshness.None)) {
			return;
		};

		state.lastSuccessfulFetchAt = fetchState.lastSuccessfulFetchAt;
		state.lastRefreshError = fetchState.lastRefreshError;

		if (state.known) {
			state.freshness = fetchState.freshness;
		};
	};

	private applyPayload (resource: I.MembershipResource, payload: MembershipPayload): boolean {
		const state = this.getState(resource);
		const { fetchState, value } = payload;
		const isStatus = resource == I.MembershipResource.Status;
		const before = isStatus ? membershipPurchaseKey(this.dataValue) : '';
		const wasKnown = isStatus && this.isStatusKnown;

		state.clientErrorCode = 0;
		state.errorCode = Number(payload.errorCode) || 0;

		if (!fetchState) {
			// No metadata: an older middleware on success, otherwise a failure that says nothing
			// about the data held
			if (!state.errorCode) {
				this.setValue(resource, value);
				state.known = true;
				state.freshness = I.MembershipFreshness.Fresh;
				state.lastRefreshError = I.MembershipRefreshError.Null;
			} else
			if (state.known) {
				state.freshness = I.MembershipFreshness.Stale;
			};
		} else {
			if (fetchState.freshness == I.MembershipFreshness.None) {
				// Unknown: the payload is a placeholder. Keep what is held (only possible across an
				// epoch) with its own metadata, but never present it as current.
				if (state.known) {
					state.freshness = I.MembershipFreshness.Stale;
				} else {
					state.lastRefreshError = fetchState.lastRefreshError;
				};
			} else {
				state.lastSuccessfulFetchAt = fetchState.lastSuccessfulFetchAt;
				state.lastRefreshError = fetchState.lastRefreshError;
				this.setValue(resource, value);
				state.known = true;
				state.freshness = fetchState.freshness;
			};
		};

		if (!isStatus) {
			return false;
		};

		return (wasKnown != this.isStatusKnown) || (before != membershipPurchaseKey(this.dataValue));
	};

	private setValue (resource: I.MembershipResource, value: any) {
		if (resource == I.MembershipResource.Status) {
			// A usable status without a payload is an empty one: known, no purchases
			this.dataSet(value || ({ products: [] } as I.MembershipData));
		} else {
			// Catalog snapshots replace the list, they are never merged
			this.productsSet(Array.isArray(value) ? value : []);
		};
	};

};

export const Membership: MembershipStore = new MembershipStore();
export { MembershipStore };
