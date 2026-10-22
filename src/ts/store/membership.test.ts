import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as I from 'Interface';

vi.mock('Model', async () => ({
	MembershipProduct: (await import('../model/membershipProduct')).default,
	MembershipData: (await import('../model/membershipData')).default,
}));

import { MembershipStore, MEMBERSHIP_CACHE_LIFETIME, MEMBERSHIP_ERROR_TIMEOUT, membershipPurchaseKey } from './membership';

const Status = I.MembershipResource.Status;
const Products = I.MembershipResource.Products;

const rev = (counter: number, epoch = 'e1'): I.MembershipRevision => ({ epoch, counter });

const fs = (freshness: I.MembershipFreshness, revision: I.MembershipRevision | null, extra: Partial<I.MembershipFetchState> = {}): I.MembershipFetchState => ({
	freshness,
	lastSuccessfulFetchAt: 0,
	lastRefreshError: I.MembershipRefreshError.Null,
	revision,
	...extra,
});

const product = (id: string, extra: any = {}) => ({ id, name: `Product ${id}`, isTopLevel: true, ...extra });

const status = (...items: { id: string; status?: I.MembershipStatus; dateEnds?: number; product?: any }[]): any => ({
	products: items.map(it => ({
		product: it.product === undefined ? product(it.id) : it.product,
		info: { dateEnds: it.dateEnds || 0 },
		status: it.status ?? I.MembershipStatus.Active,
	})),
});

describe('MembershipStore', () => {

	let store: MembershipStore;

	beforeEach(() => {
		store = new MembershipStore();
		vi.stubGlobal('S', { Membership: store });
	});

	describe('views', () => {

		it('is pending before the first request and while a request is in flight', () => {
			expect(store.getView(Status)).toBe(I.MembershipView.Pending);

			const ticket = store.beginRequest(Status);
			expect(store.getView(Status)).toBe(I.MembershipView.Pending);

			store.settleRequest(ticket);
			expect(store.getView(Status)).toBe(I.MembershipView.Unavailable);
		});

		it('turns a timed-out request into unavailable and keeps it there', () => {
			const ticket = store.beginRequest(Products);

			expect(store.applyClientError(ticket, MEMBERSHIP_ERROR_TIMEOUT)).toBe(true);
			store.settleRequest(ticket);

			expect(store.getView(Products)).toBe(I.MembershipView.Unavailable);
			expect(store.getState(Products).clientErrorCode).toBe(MEMBERSHIP_ERROR_TIMEOUT);
		});

		it('settles a ticket once', () => {
			const ticket = store.beginRequest(Status);

			store.settleRequest(ticket);
			store.settleRequest(ticket);

			expect(store.getState(Status).inFlight).toBe(0);
		});

		it('reports offline and not the Anytype network when nothing was sent', () => {
			store.setBlock(Status, I.MembershipBlock.Offline);
			store.setBlock(Products, I.MembershipBlock.NotAnytypeNetwork);

			expect(store.getView(Status)).toBe(I.MembershipView.Offline);
			expect(store.getView(Products)).toBe(I.MembershipView.NotAnytypeNetwork);
		});

		it('treats a successfully fetched empty catalog as usable, not loading', () => {
			const ticket = store.beginRequest(Products);

			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: [], errorCode: 0 }, ticket);
			store.settleRequest(ticket);

			expect(store.getView(Products)).toBe(I.MembershipView.Usable);
			expect(store.products).toEqual([]);
		});

		it('keeps usable data visible while a retry is in flight', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(1)), value: status({ id: '1' }), errorCode: 0 });
			store.beginRequest(Status);

			expect(store.getView(Status)).toBe(I.MembershipView.Usable);
		});
	});

	describe('NONE and unknown status', () => {

		it('keeps NONE as unknown, never as no membership', () => {
			const ticket = store.beginRequest(Status);
			const res = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.None, rev(1)), value: { products: [] }, errorCode: 4 }, ticket);
			store.settleRequest(ticket);

			expect(res.applied).toBe(true);
			expect(store.data).toBeNull();
			expect(store.isStatusKnown).toBe(false);
			expect(store.getView(Status)).toBe(I.MembershipView.Unavailable);
			expect(store.getState(Status).errorCode).toBe(4);
		});

		it('keeps data held from an older epoch on NONE but marks it stale', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(5, 'old')), value: status({ id: '2' }), errorCode: 0 });
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.None, rev(1, 'new')), value: { products: [] }, errorCode: 0 });

			expect(store.data.products.length).toBe(1);
			expect(store.getState(Status).freshness).toBe(I.MembershipFreshness.Stale);
		});

		it('is not known from data alone', () => {
			store.dataSet({ products: [] } as any);
			expect(store.isStatusKnown).toBe(false);
		});

		it('shows a known empty status as known with no purchases', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: null, errorCode: 0 });

			expect(store.isStatusKnown).toBe(true);
			expect(store.data.products).toEqual([]);
		});
	});

	describe('revision ordering', () => {

		it('ignores older revisions entirely', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(3)), value: status({ id: '3' }), errorCode: 0 });

			expect(store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(2), { lastRefreshError: I.MembershipRefreshError.PaymentNode }), value: status({ id: '1' }), errorCode: 4 }).applied).toBe(false);

			expect(store.data.products[0].product.id).toBe('3');
			expect(store.getState(Status)).toEqual(expect.objectContaining({ freshness: I.MembershipFreshness.Fresh, errorCode: 0, lastRefreshError: I.MembershipRefreshError.Null }));
		});

		it('keeps the value of an equal revision but takes its metadata', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(3), { lastSuccessfulFetchAt: 100 }), value: status({ id: '3' }), errorCode: 0 });

			const res = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(3), { lastSuccessfulFetchAt: 100, lastRefreshError: I.MembershipRefreshError.PaymentNode }), value: status({ id: '1' }), errorCode: 4 });

			expect(res.applied).toBe(false);
			expect(store.data.products[0].product.id).toBe('3');
			expect(store.getState(Status)).toEqual(expect.objectContaining({ freshness: I.MembershipFreshness.Stale, errorCode: 4, lastRefreshError: I.MembershipRefreshError.PaymentNode }));
			expect(store.isUpdating(Status)).toBe(true);
			expect(store.needsRetry(Status)).toBe(true);
		});

		it('keeps a watchdog timeout when a late equal-revision answer is itself an error', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(3)), value: status({ id: '3' }), errorCode: 0 });

			const ticket = store.beginRequest(Status);
			store.applyClientError(ticket, MEMBERSHIP_ERROR_TIMEOUT);
			store.settleRequest(ticket);

			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(3), { lastRefreshError: I.MembershipRefreshError.PaymentNode }), value: status({ id: '3' }), errorCode: 4 }, ticket);

			expect(store.getState(Status).clientErrorCode).toBe(MEMBERSHIP_ERROR_TIMEOUT);
			expect(store.isUpdating(Status)).toBe(true);
			expect(store.needsRetry(Status)).toBe(true);
		});

		it('clears a transport error on a newer answer', () => {
			const failed = store.beginRequest(Status);
			store.applyClientError(failed, 14);
			store.settleRequest(failed);

			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '3' }), errorCode: 0 });

			expect(store.getState(Status).clientErrorCode).toBe(0);
		});

		it('never downgrades a FRESH event with a late transport error of an earlier request', () => {
			const ticket = store.beginRequest(Status);

			// a FRESH recovery event arrives while the request is in flight
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(7)), value: status({ id: '3' }), errorCode: 0 });

			// then the request fails on the transport
			expect(store.applyClientError(ticket, 14)).toBe(false);
			store.settleRequest(ticket);

			expect(store.getState(Status).clientErrorCode).toBe(0);
			expect(store.getState(Status).inFlight).toBe(0);
			expect(store.isUpdating(Status)).toBe(false);
			expect(store.needsRetry(Status)).toBe(false);
		});

		it('drops a transport error once a newer request started', () => {
			const first = store.beginRequest(Products);
			store.beginRequest(Products);

			expect(store.applyClientError(first, 14)).toBe(false);
		});

		it('applies a transport error when nothing moved', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '3' }), errorCode: 0 });

			const ticket = store.beginRequest(Status);

			expect(store.applyClientError(ticket, 14)).toBe(true);
			expect(store.isUpdating(Status)).toBe(true);
			expect(store.needsRetry(Status)).toBe(true);
		});

		it('settles an equal-revision response and clears an earlier transport error', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(4)), value: status({ id: '3' }), errorCode: 0 });

			const failed = store.beginRequest(Status);
			store.applyClientError(failed, 14);
			store.settleRequest(failed);

			const ticket = store.beginRequest(Status);
			const res = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(4)), value: status({ id: '3' }), errorCode: 0 }, ticket);
			store.settleRequest(ticket);

			expect(res.applied).toBe(false);
			expect(store.getState(Status).inFlight).toBe(0);
			expect(store.getState(Status).clientErrorCode).toBe(0);
		});

		it('resets ordering when the epoch changes', () => {
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(40, 'a')), value: [ product('1') ], errorCode: 0 });

			const res = store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Stale, rev(1, 'b')), value: [ product('2') ], errorCode: 0 });

			expect(res.applied).toBe(true);
			expect(store.products.map(it => it.id)).toEqual([ '2' ]);
			expect(store.getState(Products).revision).toEqual(rev(1, 'b'));
		});

		it('drops a response from before an epoch change', () => {
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(40, 'a')), value: [ product('1') ], errorCode: 0 });

			const old = store.beginRequest(Products);

			// the service restarts: an event of the new epoch arrives first
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1, 'b')), value: [ product('2') ], errorCode: 0 });

			// the old request now answers with the old epoch
			expect(store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(41, 'a')), value: [ product('1') ], errorCode: 0 }, old).applied).toBe(false);
			expect(store.products.map(it => it.id)).toEqual([ '2' ]);
		});

		it('applies a revisionless middleware error only if nothing moved', () => {
			const old = store.beginRequest(Status);
			const current = store.beginRequest(Status);

			expect(store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.None, null), value: null, errorCode: 3 }, old).applied).toBe(false);
			expect(store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.None, null), value: null, errorCode: 3 }, current).applied).toBe(true);
			expect(store.getState(Status).errorCode).toBe(3);
		});

		it('resets everything on account switch and drops results of the old session', () => {
			const ticket = store.beginRequest(Status);

			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(9)), value: status({ id: '3' }), errorCode: 0 });
			store.clearAll();

			expect(store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(10)), value: status({ id: '3' }), errorCode: 0 }, ticket).applied).toBe(false);
			store.settleRequest(ticket);

			expect(store.data).toBeNull();
			expect(store.getState(Status).revision).toBeNull();
			expect(store.getState(Status).inFlight).toBe(0);

			// ordering starts over: a low counter of the same epoch applies again
			expect(store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '3' }), errorCode: 0 }).applied).toBe(true);
		});
	});

	describe('payload', () => {

		it('replaces the catalog with an empty snapshot', () => {
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: [ product('1') ], errorCode: 0 });
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(2)), value: [], errorCode: 0 });

			expect(store.products).toEqual([]);
			expect(store.getView(Products)).toBe(I.MembershipView.Usable);
		});

		it('keeps the metadata of held data on NONE', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(5, 'a'), { lastSuccessfulFetchAt: 100 }), value: status({ id: '2' }), errorCode: 0 });
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.None, rev(1, 'b')), value: { products: [] }, errorCode: 0 });

			expect(store.getState(Status).lastSuccessfulFetchAt).toBe(100);
		});

		it('replaces the catalog on every snapshot', () => {
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: [ product('1'), product('2') ], errorCode: 0 });
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(2)), value: [ product('2') ], errorCode: 0 });

			expect(store.products.map(it => it.id)).toEqual([ '2' ]);
		});

		it('keeps STALE data from an error response usable', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(2), { lastRefreshError: I.MembershipRefreshError.PaymentNode }), value: status({ id: '4' }), errorCode: 0 });

			expect(store.getView(Status)).toBe(I.MembershipView.Usable);
			expect(store.isUpdating(Status)).toBe(true);
		});

		it('reports a purchase change only on a real change', () => {
			const first = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '4' }), errorCode: 0 });
			const same = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(2)), value: status({ id: '4' }), errorCode: 0 });
			const changed = store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(3)), value: status({ id: '4', status: I.MembershipStatus.Finalization }), errorCode: 0 });

			expect(first.purchaseChanged).toBe(true);
			expect(same).toEqual({ applied: true, purchaseChanged: false });
			expect(changed.purchaseChanged).toBe(true);
		});

		it('builds the purchase key from ids, status and end dates', () => {
			expect(membershipPurchaseKey(null)).toBe('');
			expect(membershipPurchaseKey(status({ id: '1', dateEnds: 5 }))).toBe('1:2:5');
		});
	});

	describe('updating hint', () => {

		const now = 1_000_000;

		it('is quiet for STALE without an error within the cache lifetime (app start)', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(1), { lastSuccessfulFetchAt: now - 60 }), value: status({ id: '1' }), errorCode: 0 });
			expect(store.isUpdating(Status, now)).toBe(false);
		});

		it('is quiet for STALE of unknown age without an error (migrated cache)', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(1)), value: status({ id: '1' }), errorCode: 0 });
			expect(store.isUpdating(Status, now)).toBe(false);
		});

		it('shows for STALE beyond the cache lifetime', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Stale, rev(1), { lastSuccessfulFetchAt: now - MEMBERSHIP_CACHE_LIFETIME - 1 }), value: status({ id: '1' }), errorCode: 0 });
			expect(store.isUpdating(Status, now)).toBe(true);
		});

		it('is quiet for FRESH', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1), { lastSuccessfulFetchAt: now - 3600 }), value: status({ id: '1' }), errorCode: 0 });
			expect(store.isUpdating(Status, now)).toBe(false);
		});
	});

	describe('membership data model', () => {

		it('resolves a hidden purchased product from the full catalog', () => {
			store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: [ product('20', { isHidden: true, name: 'Legacy' }) ], errorCode: 0 });
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '20', product: { id: '20' } }), errorCode: 0 });

			expect(store.data.getTopProduct().name).toBe('Legacy');
		});

		it('falls back to the product embedded in the status when the catalog is missing', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '20', product: product('20', { isHidden: true, name: 'Embedded' }) }), errorCode: 0 });

			expect(store.data.getTopProduct().name).toBe('Embedded');
			expect(store.data.getTopPurchasedProduct()).not.toBeNull();
			expect(store.data.getUnresolvedProducts()).toEqual([]);
		});

		it('reports purchased entries that can not be resolved at all', () => {
			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: 'x', product: null }), errorCode: 0 });

			expect(store.data.getTopProduct()).toBeNull();
			expect(store.data.getUnresolvedProducts().length).toBe(1);
		});

		it('marks an elapsed end date', () => {
			const past = Math.floor(Date.now() / 1000) - 10;
			const future = Math.floor(Date.now() / 1000) + 1000;

			store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, rev(1)), value: status({ id: '1', dateEnds: past }, { id: '2', dateEnds: future }, { id: '3' }), errorCode: 0 });

			expect(store.data.products.map(it => it.isElapsed)).toEqual([ true, false, false ]);
		});
	});
});
