import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as I from 'Interface';

vi.mock('Model', async () => ({
	MembershipProduct: (await import('../model/membershipProduct')).default,
	MembershipData: (await import('../model/membershipData')).default,
}));

import { MembershipStore } from 'Store/membership';
import {
	MembershipLoader, membershipBackoff, getMembershipPage, MEMBERSHIP_WATCHDOG, MEMBERSHIP_RETRY_BASE, MEMBERSHIP_RETRY_MAX,
	MEMBERSHIP_REFRESH_THROTTLE, MEMBERSHIP_REFRESH_FORCE_SEC, MEMBERSHIP_TRIGGER_GAP, MEMBERSHIP_LOGIN_OFFER_TTL,
} from './membership';

const Status = I.MembershipResource.Status;
const Products = I.MembershipResource.Products;

type Call = { param: any; callBack: (message: any) => void };

const fs = (freshness: I.MembershipFreshness, counter: number, epoch = 'e'): I.MembershipFetchState => ({
	freshness,
	lastSuccessfulFetchAt: 0,
	lastRefreshError: freshness == I.MembershipFreshness.Fresh ? I.MembershipRefreshError.Null : I.MembershipRefreshError.PaymentNode,
	revision: { epoch, counter },
});

const statusData = (status = I.MembershipStatus.Active): any => ({
	products: [ { product: { id: '4', name: 'Builder', isTopLevel: true }, info: { dateEnds: 0 }, status } ],
});

const ok = (fetchState: I.MembershipFetchState, value: any, key: 'data' | 'products', code = 0) => ({ [key]: value, fetchState, error: { code, description: '' } });

describe('MembershipLoader', () => {

	let store: MembershipStore;
	let loader: MembershipLoader;
	let statusCalls: Call[];
	let productsCalls: Call[];
	let common: any;
	let events: ReturnType<typeof vi.fn>;
	let finalize: ReturnType<typeof vi.fn>;
	let isAnytypeNetwork: boolean;

	const answerStatus = (i: number, message: any) => statusCalls[i].callBack(message);
	const answerProducts = (i: number, message: any) => productsCalls[i].callBack(message);
	const eventCodes = () => events.mock.calls.map(it => it[0]);

	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(1);
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		store = new MembershipStore();
		loader = new MembershipLoader();
		statusCalls = [];
		productsCalls = [];
		common = { isOnline: true, windowIsFocused: true };
		events = vi.fn();
		finalize = vi.fn();
		isAnytypeNetwork = true;

		vi.stubGlobal('S', { Membership: store, Common: common, Auth: { account: { id: 'a' } } });
		vi.stubGlobal('U', { Data: { isAnytypeNetwork: () => isAnytypeNetwork } });
		vi.stubGlobal('C', {
			MembershipV2GetStatus: (noCache: boolean, forceRefreshSec: number, callBack: any) => statusCalls.push({ param: { noCache, forceRefreshSec }, callBack }),
			MembershipV2GetProducts: (noCache: boolean, callBack: any) => productsCalls.push({ param: { noCache }, callBack }),
		});
		vi.stubGlobal('analytics', { event: events, setProduct: vi.fn(), route: { settingsMembership: 'ScreenSettingsMembership' } });
		vi.stubGlobal('Action', { finalizeMembership: finalize });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe('loading', () => {

		it('fetches status and products in parallel, skipping the cache', () => {
			loader.load('auth');

			expect(statusCalls.length).toBe(1);
			expect(productsCalls.length).toBe(1);
			expect(statusCalls[0].param).toEqual({ noCache: true, forceRefreshSec: 0 });
			expect(productsCalls[0].param).toEqual({ noCache: true });
		});

		it('joins duplicate fetches into the request in flight and settles every caller', () => {
			const a = vi.fn();
			const b = vi.fn();

			loader.load('auth', a);
			loader.load('open', b);

			expect(statusCalls.length).toBe(1);
			expect(productsCalls.length).toBe(1);

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			expect(a).toHaveBeenCalledTimes(1);
			expect(b).toHaveBeenCalledTimes(1);
			expect(store.getView(Status)).toBe(I.MembershipView.Usable);
			expect(store.getView(Products)).toBe(I.MembershipView.Usable);
		});

		it('settles offline and outside the Anytype network without sending', () => {
			const done = vi.fn();

			common.isOnline = false;
			loader.load('auth', done);

			expect(statusCalls.length + productsCalls.length).toBe(0);
			expect(done).toHaveBeenCalledTimes(1);
			expect(store.getView(Status)).toBe(I.MembershipView.Offline);

			isAnytypeNetwork = false;
			loader.fetch(Products, 'test', done);

			expect(done).toHaveBeenCalledTimes(2);
			expect(store.getView(Products)).toBe(I.MembershipView.NotAnytypeNetwork);
		});

		it('turns a request without an answer into unavailable after the watchdog, and still applies a late answer', () => {
			const done = vi.fn();

			loader.onPageOpen();
			loader.fetch(Status, 'test', done);

			vi.advanceTimersByTime(MEMBERSHIP_WATCHDOG - 1);
			expect(store.getView(Status)).toBe(I.MembershipView.Pending);

			vi.advanceTimersByTime(1);
			expect(store.getView(Status)).toBe(I.MembershipView.Unavailable);
			expect(done).toHaveBeenCalledTimes(1);
			expect(eventCodes()).toContain('MembershipLoadTimeout');

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));

			expect(store.getView(Status)).toBe(I.MembershipView.Usable);
			expect(done).toHaveBeenCalledTimes(1);
		});

		it('lets a new request start once the watchdog gave up on the old one', () => {
			loader.fetch(Status, 'test');
			vi.advanceTimersByTime(MEMBERSHIP_WATCHDOG);
			loader.fetch(Status, 'test');

			expect(statusCalls.length).toBe(2);
		});
	});

	describe('retries', () => {

		it('backs off with jitter up to the ceiling', () => {
			expect(membershipBackoff(0, () => 0)).toBe(MEMBERSHIP_RETRY_BASE / 2);
			expect(membershipBackoff(0, () => 1)).toBe(MEMBERSHIP_RETRY_BASE);
			expect(membershipBackoff(1, () => 1)).toBe(MEMBERSHIP_RETRY_BASE * 2);
			expect(membershipBackoff(20, () => 1)).toBe(MEMBERSHIP_RETRY_MAX);
			expect(membershipBackoff(20, () => 0)).toBe(MEMBERSHIP_RETRY_MAX / 2);
		});

		it('retries a status-only failure while the page is open, with growing delays', () => {
			loader.onPageOpen();

			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
			answerStatus(0, { error: { code: 14, description: 'unavailable' } });

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE - 1);
			expect(statusCalls.length).toBe(1);

			vi.advanceTimersByTime(1);
			expect(statusCalls.length).toBe(2);

			// only the failed resource is retried
			expect(productsCalls.length).toBe(1);

			answerStatus(1, { error: { code: 14, description: 'unavailable' } });

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE * 2 - 1);
			expect(statusCalls.length).toBe(2);

			vi.advanceTimersByTime(1);
			expect(statusCalls.length).toBe(3);
		});

		it('retries STALE and stops once FRESH', () => {
			loader.onPageOpen();

			answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			expect(statusCalls.length).toBe(2);

			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 2), statusData(), 'data'));

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_MAX * 2);
			expect(statusCalls.length).toBe(2);
		});

		it.each([ 'windowIsFocused', 'isOnline' ])('does not re-arm a retry when an answer lands after %s was lost', key => {
			loader.onPageOpen();

			common[key] = false;
			loader.pause();

			answerStatus(0, { error: { code: 14, description: '' } });
			answerProducts(0, { error: { code: 14, description: '' } });

			expect(vi.getTimerCount()).toBe(0);
			vi.advanceTimersByTime(MEMBERSHIP_RETRY_MAX);
			expect(statusCalls.length).toBe(1);
		});

		it('waits for every request in flight before arming a retry', () => {
			loader.onPageOpen();
			answerStatus(0, { error: { code: 14, description: '' } });

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			expect(statusCalls.length).toBe(1);

			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			expect(statusCalls.length).toBe(2);
		});

		it('does not stretch the backoff on triggers inside the gap', () => {
			loader.onPageOpen();
			answerStatus(0, { error: { code: 14, description: '' } });
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			for (let i = 0; i < 5; i++) {
				loader.trigger('focus');
			};

			expect(vi.getTimerCount()).toBe(1);

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			expect(statusCalls.length).toBe(2);
		});

		it('pauses while the page is closed, the window is in the background or offline', () => {
			loader.onPageOpen();
			answerStatus(0, { error: { code: 14, description: '' } });
			answerProducts(0, { error: { code: 14, description: '' } });

			loader.onPageClose();
			vi.advanceTimersByTime(MEMBERSHIP_RETRY_MAX);
			expect(statusCalls.length).toBe(1);

			loader.onPageOpen();
			expect(statusCalls.length).toBe(2);
			expect(productsCalls.length).toBe(2);
			answerStatus(1, { error: { code: 14, description: '' } });
			answerProducts(1, { error: { code: 14, description: '' } });

			common.windowIsFocused = false;
			loader.pause();
			vi.advanceTimersByTime(MEMBERSHIP_RETRY_MAX);
			expect(statusCalls.length).toBe(2);
		});

		it('retries a STALE startup result on focus while the page is closed, at most once per gap', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			// no timers while the page is closed
			vi.advanceTimersByTime(MEMBERSHIP_RETRY_MAX);
			expect(statusCalls.length).toBe(1);

			loader.trigger('focus');
			expect(statusCalls.length).toBe(2);

			expect(productsCalls.length).toBe(1);
			answerStatus(1, { error: { code: 14, description: '' } });

			loader.trigger('focus');
			expect(statusCalls.length).toBe(2);

			vi.advanceTimersByTime(MEMBERSHIP_TRIGGER_GAP);
			loader.trigger('online');
			expect(statusCalls.length).toBe(3);
		});

		it('fetches on online right after an attempt blocked as offline', () => {
			common.isOnline = false;
			loader.load('auth');
			expect(statusCalls.length).toBe(0);

			common.isOnline = true;
			loader.trigger('online');

			expect(statusCalls.length).toBe(1);
			expect(productsCalls.length).toBe(1);
		});

		it('does not count the not-Anytype-network state as worth a retry', () => {
			isAnytypeNetwork = false;
			loader.load('auth');

			expect(loader.needsRetry()).toBe(false);
		});

		it('does not trigger before membership was loaded for the account', () => {
			loader.trigger('focus');
			expect(statusCalls.length).toBe(0);
		});

		it('does not trigger when everything is FRESH', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			vi.advanceTimersByTime(MEMBERSHIP_TRIGGER_GAP);
			loader.trigger('resume');
			expect(statusCalls.length).toBe(1);
		});

		it('drops everything on reset', () => {
			loader.onPageOpen();
			loader.reset();
			store.clearAll();

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			expect(store.data).toBeNull();

			loader.trigger('focus');
			expect(statusCalls.length).toBe(1);
		});
	});

	describe('refresh', () => {

		it('always sends a forced status request and joins the automatic products request', () => {
			loader.load('auth');
			expect(loader.refresh()).toBe(true);

			expect(statusCalls.length).toBe(2);
			expect(statusCalls[1].param).toEqual({ noCache: true, forceRefreshSec: MEMBERSHIP_REFRESH_FORCE_SEC });
			expect(productsCalls.length).toBe(1);
			expect(store.refreshing).toBe(true);

			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 2), statusData(), 'data'));
			expect(store.refreshing).toBe(true);

			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
			expect(store.refreshing).toBe(false);
		});

		it('is ignored while in flight and throttled after a press', () => {
			expect(loader.refresh()).toBe(true);
			expect(loader.refresh()).toBe(false);

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			expect(store.refreshing).toBe(false);
			expect(loader.refresh()).toBe(false);

			vi.advanceTimersByTime(MEMBERSHIP_REFRESH_THROTTLE);
			expect(store.refreshThrottled).toBe(false);
			expect(loader.refresh()).toBe(true);
			expect(statusCalls.length).toBe(2);
		});

		it('is sent even if the browser reports offline', () => {
			common.isOnline = false;

			expect(loader.refresh()).toBe(true);
			expect(statusCalls.length).toBe(1);
			expect(productsCalls.length).toBe(1);
		});

		it('settles on an equal-revision answer', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 3), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 3), [], 'products'));

			loader.refresh();
			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 3), statusData(), 'data'));
			answerProducts(1, ok(fs(I.MembershipFreshness.Fresh, 3), [], 'products'));

			expect(store.refreshing).toBe(false);
		});

		it('settles after a FRESH event then a late transport error, without a downgrade', () => {
			loader.onPageOpen();
			loader.refresh();

			loader.onStatusEvent(statusData() as any, fs(I.MembershipFreshness.Fresh, 5));
			answerStatus(1, { error: { code: 14, description: 'unavailable' } });
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			expect(store.refreshing).toBe(false);
			expect(store.getState(Status).clientErrorCode).toBe(0);
			expect(store.isUpdating(Status)).toBe(false);
		});

		it('stays disabled while the forced status is in flight past the throttle', () => {
			expect(loader.refresh()).toBe(true);
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			vi.advanceTimersByTime(MEMBERSHIP_REFRESH_THROTTLE + 1000);

			expect(store.refreshThrottled).toBe(false);
			expect(store.refreshing).toBe(true);
			expect(loader.refresh()).toBe(false);
			expect(statusCalls.length).toBe(1);
		});

		it('starts the backoff over', () => {
			const fail = { error: { code: 14, description: '' } };

			loader.onPageOpen();
			answerStatus(0, fail);
			answerProducts(0, fail);

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			answerStatus(1, fail);
			answerProducts(1, fail);

			// the next automatic retry would wait 2x; Refresh resets it
			expect(loader.refresh()).toBe(true);
			answerStatus(2, fail);
			answerProducts(2, fail);

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE - 1);
			expect(statusCalls.length).toBe(3);
			vi.advanceTimersByTime(1);
			expect(statusCalls.length).toBe(4);
		});

		it('keeps the offline state when sent while offline and it fails', () => {
			common.isOnline = false;
			loader.refresh();

			answerStatus(0, { error: { code: 14, description: '' } });
			answerProducts(0, { error: { code: 14, description: '' } });

			expect(store.getView(Status)).toBe(I.MembershipView.Offline);
		});

		it('does not settle the button of the next account', () => {
			loader.refresh();

			store.clearAll();
			loader.reset();

			expect(loader.refresh()).toBe(true);

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			expect(store.refreshing).toBe(true);
		});

		it('is ignored outside the Anytype network', () => {
			isAnytypeNetwork = false;
			expect(loader.refresh()).toBe(false);
			expect(statusCalls.length).toBe(0);
		});

		it('settles when the watchdog gives up', () => {
			loader.refresh();
			vi.advanceTimersByTime(MEMBERSHIP_WATCHDOG);

			expect(store.refreshing).toBe(false);
		});
	});

	describe('side effects', () => {

		const free = (): any => ({ products: [ { product: { id: '1', name: 'Starter', isTopLevel: true, isIntro: true }, info: { dateEnds: 0 }, status: I.MembershipStatus.Active } ] });
		const fin = () => statusData(I.MembershipStatus.Finalization);

		const startFree = () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), free(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
		};

		it('opens finalization once for a new purchase when the response lands before the event', () => {
			startFree();

			loader.refresh();
			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 2), fin(), 'data'));
			expect(finalize).toHaveBeenCalledTimes(1);

			// the buffered event at the same revision is ignored
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('opens finalization once for a new purchase when the event lands before the response', () => {
			startFree();

			loader.refresh();
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			expect(finalize).toHaveBeenCalledTimes(1);

			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 2), fin(), 'data'));
			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('does not reopen finalization on an unchanged FRESH recovery', () => {
			startFree();
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));

			// the user dismissed the dialog; an unchanged FRESH recovery event follows
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 3));
			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('treats a finalization state the session started with as not new (startup STALE then FRESH)', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), fin(), 'data'));
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));

			expect(finalize).not.toHaveBeenCalled();
		});

		it('never confirms a purchase from STALE data', () => {
			startFree();

			loader.fetch(Status, 'test');
			answerStatus(1, ok(fs(I.MembershipFreshness.Stale, 2), fin(), 'data'));
			expect(finalize).not.toHaveBeenCalled();

			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 3));
			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('drops events while no account session is running', () => {
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 1));
			expect(store.data).toBeNull();

			startFree();
			loader.reset();
			store.clearAll();

			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			loader.onProductsEvent([], fs(I.MembershipFreshness.Fresh, 2));

			expect(store.data).toBeNull();
			expect(store.getState(Products).known).toBe(false);
			expect(finalize).not.toHaveBeenCalled();
		});

		it('does not reopen a dismissed finalization on a renewal or an add-on', () => {
			startFree();
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			expect(finalize).toHaveBeenCalledTimes(1);

			const renewed = fin();
			renewed.products[0].info.dateEnds = 2000000000;
			loader.onStatusEvent(renewed, fs(I.MembershipFreshness.Fresh, 3));

			const addOn = fin();
			addOn.products.push({ product: { id: '9', name: 'Storage', isTopLevel: false }, info: { dateEnds: 0 }, status: I.MembershipStatus.Active });
			loader.onStatusEvent(addOn, fs(I.MembershipFreshness.Fresh, 4));

			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('opens finalization when the same plan moves into finalization', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(I.MembershipStatus.Pending), 'data'));

			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			expect(finalize).toHaveBeenCalledTimes(1);
		});

		it('opens finalization for another plan that waits for it', () => {
			startFree();
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));

			const other = fin();
			other.products[0].product = { id: '5', name: 'Team', isTopLevel: true };
			loader.onStatusEvent(other, fs(I.MembershipFreshness.Fresh, 3));

			expect(finalize).toHaveBeenCalledTimes(2);
		});

		it('does not open when a purchase leaves finalization', () => {
			startFree();
			loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
			loader.onStatusEvent(statusData(), fs(I.MembershipFreshness.Fresh, 3));
			loader.onStatusEvent(free(), fs(I.MembershipFreshness.Fresh, 4));

			expect(finalize).toHaveBeenCalledTimes(1);
		});

		describe('login', () => {

			it('offers finalization once after a phrase recovery, for a purchase made on another device', () => {
				const next = vi.fn();

				loader.load('auth');
				loader.finalizeOnLogin('ScreenAuthLogin', next);

				// STALE never confirms it
				answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), fin(), 'data'));
				expect(finalize).not.toHaveBeenCalled();

				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 3));

				expect(finalize).toHaveBeenCalledTimes(1);
				expect(finalize.mock.calls[0][1]).toBe('ScreenAuthLogin');
			});

			it('offers nothing when the status turns FRESH after the offer expired', () => {
				loader.load('auth');
				loader.finalizeOnLogin('ScreenAuthLogin', () => {});
				answerStatus(0, { error: { code: 14, description: '' } });

				vi.advanceTimersByTime(MEMBERSHIP_LOGIN_OFFER_TTL + 1);
				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 1));

				expect(finalize).not.toHaveBeenCalled();
			});

			it('offers once when two login steps ask', () => {
				loader.load('auth');
				loader.finalizeOnLogin('ScreenAuthLogin', () => {});
				answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), fin(), 'data'));
				expect(finalize).toHaveBeenCalledTimes(1);

				loader.finalizeOnLogin('ScreenAuthSetup', () => {});
				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));

				expect(finalize).toHaveBeenCalledTimes(2);
				expect(finalize.mock.calls[1][1]).toBe('ScreenAuthSetup');
			});

			it('offers finalization right away when the status is already FRESH', () => {
				const next = vi.fn();

				loader.load('auth');
				answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), fin(), 'data'));
				loader.finalizeOnLogin('ScreenAuthSetup', next);

				expect(finalize).toHaveBeenCalledTimes(1);
				expect(finalize.mock.calls[0][1]).toBe('ScreenAuthSetup');
				expect(finalize.mock.calls[0][2]).toBe(next);
			});

			it('offers finalization once the status arrives FRESH after the login flow asked', () => {
				const next = vi.fn();

				loader.load('auth');
				loader.finalizeOnLogin('ScreenAuthSetup', next);
				expect(next).toHaveBeenCalledTimes(1);

				answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), fin(), 'data'));
				expect(finalize).not.toHaveBeenCalled();

				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 2));
				loader.onStatusEvent(fin(), fs(I.MembershipFreshness.Fresh, 3));

				expect(finalize).toHaveBeenCalledTimes(1);
				expect(finalize.mock.calls[0][1]).toBe('ScreenAuthSetup');
			});

			it('offers nothing without a finalization state', () => {
				const next = vi.fn();

				loader.load('auth');
				loader.finalizeOnLogin('ScreenAuthSetup', next);
				answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), free(), 'data'));

				expect(next).toHaveBeenCalledTimes(1);
				expect(finalize).not.toHaveBeenCalled();
			});
		});
	});

	describe('telemetry', () => {

		it('reports how the page settled once per open', () => {
			loader.onPageOpen();
			vi.advanceTimersByTime(1200);

			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
			loader.onStatusEvent(statusData() as any, fs(I.MembershipFreshness.Fresh, 2));

			const settle = events.mock.calls.filter(it => it[0] == 'MembershipLoad');

			expect(settle.length).toBe(1);
			expect(settle[0][1]).toEqual({ type: 'content', origin: 'cold', count: 0, middleTime: 1200, status: 'usable/usable' });
		});

		it('reports a timeout with the retry count', () => {
			loader.onPageOpen();
			vi.advanceTimersByTime(MEMBERSHIP_WATCHDOG);

			const settle = events.mock.calls.find(it => it[0] == 'MembershipLoad');
			expect(settle[1]).toEqual(expect.objectContaining({ type: 'timeout', count: 0, status: 'unavailable/unavailable' }));

			const timeout = events.mock.calls.find(it => it[0] == 'MembershipLoadTimeout');
			expect(timeout[1]).toEqual({ type: 'status', count: 0 });
		});

		it('reports a page left while still loading as abandoned', () => {
			loader.onPageOpen();
			vi.advanceTimersByTime(3000);
			loader.onPageClose();

			const settle = events.mock.calls.filter(it => it[0] == 'MembershipLoad');
			expect(settle.length).toBe(1);
			expect(settle[0][1]).toEqual(expect.objectContaining({ type: 'abandoned', middleTime: 3000, status: 'pending/pending' }));
		});

		it('marks a warm open and skips the fetch within the gap when everything is FRESH', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			loader.onPageOpen();

			expect(statusCalls.length).toBe(1);
			expect(events.mock.calls.find(it => it[0] == 'MembershipLoad')[1]).toEqual(expect.objectContaining({ type: 'content', origin: 'warm', middleTime: 0 }));
		});

		it('fetches on a reopen within the gap when something failed', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), statusData(), 'data', 4));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			loader.onPageOpen();
			expect(statusCalls.length).toBe(2);
		});

		it('skips a reopen within the gap for quiet STALE data but still retries it', () => {
			const quiet = { ...fs(I.MembershipFreshness.Stale, 1), lastRefreshError: I.MembershipRefreshError.Null };

			loader.load('auth');
			answerStatus(0, ok(quiet, statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			loader.onPageOpen();
			expect(statusCalls.length).toBe(1);

			vi.advanceTimersByTime(MEMBERSHIP_RETRY_BASE);
			expect(statusCalls.length).toBe(2);
			expect(productsCalls.length).toBe(1);
		});

		it('fetches on a reopen within the gap after a transport error', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			loader.fetch(Status, 'test');
			answerStatus(1, { error: { code: 14, description: '' } });

			loader.onPageOpen();
			expect(statusCalls.length).toBe(3);
		});

		it('fetches on a reopen within the gap for STALE with a refresh error', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Stale, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			loader.onPageOpen();
			expect(statusCalls.length).toBe(2);
		});

		it('reports abandoned only for an unsettled page', () => {
			loader.onPageOpen();
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));
			loader.onPageClose();

			expect(events.mock.calls.filter(it => it[0] == 'MembershipLoad').map(it => it[1].type)).toEqual([ 'content' ]);
		});

		it('reports nothing for a page reset by a logout', () => {
			loader.onPageOpen();
			loader.reset();
			loader.onPageClose();

			expect(events.mock.calls.filter(it => it[0] == 'MembershipLoad')).toEqual([]);
		});

		it('keeps the watchdog of a previous account out of the page telemetry', () => {
			loader.load('auth');
			vi.advanceTimersByTime(10000);

			loader.reset();
			store.clearAll();

			loader.onPageOpen();
			answerStatus(1, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(1, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			vi.advanceTimersByTime(10000);
			expect(eventCodes()).not.toContain('MembershipLoadTimeout');
		});

		it('fetches on a reopen after the gap', () => {
			loader.load('auth');
			answerStatus(0, ok(fs(I.MembershipFreshness.Fresh, 1), statusData(), 'data'));
			answerProducts(0, ok(fs(I.MembershipFreshness.Fresh, 1), [], 'products'));

			vi.advanceTimersByTime(MEMBERSHIP_TRIGGER_GAP);
			loader.onPageOpen();
			expect(statusCalls.length).toBe(2);
			expect(productsCalls.length).toBe(2);
		});
	});
});

describe('getMembershipPage', () => {

	const Usable = I.MembershipView.Usable;
	let store: MembershipStore;

	const purchase = (id: string, product: any, status = I.MembershipStatus.Active) => ({ product, info: { dateEnds: 0 }, status });
	const setStatus = (...products: any[]) => store.applyResult(Status, { fetchState: fs(I.MembershipFreshness.Fresh, 1), value: { products }, errorCode: 0 });
	const setCatalog = (...products: any[]) => store.applyResult(Products, { fetchState: fs(I.MembershipFreshness.Fresh, 1), value: products, errorCode: 0 });
	const page = () => getMembershipPage(store.getView(Status), store.getView(Products), store.data);

	beforeEach(() => {
		store = new MembershipStore();
		vi.stubGlobal('S', { Membership: store });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows the state of the status while it is not usable', () => {
		expect(page()).toEqual({ kind: 'state', view: I.MembershipView.Pending });

		const ticket = store.beginRequest(Status);
		store.settleRequest(ticket);
		expect(page()).toEqual({ kind: 'state', view: I.MembershipView.Unavailable });
	});

	it('resolves a purchased hidden plan (id 20) from the catalog without needing it visible', () => {
		setCatalog({ id: '1', isTopLevel: true, isIntro: true }, { id: '20', isTopLevel: true, isHidden: true, name: 'Legacy' });
		setStatus(purchase('20', { id: '20' }));

		expect(page()).toEqual({ kind: 'purchased', view: Usable });
		expect(store.data.getTopProduct().name).toBe('Legacy');
	});

	it('shows Purchased from the status alone while the catalog is unavailable', () => {
		setStatus(purchase('20', { id: '20', isTopLevel: true, isHidden: true, name: 'Embedded' }));

		const ticket = store.beginRequest(Products);
		store.settleRequest(ticket);

		expect(page().kind).toBe('purchased');
	});

	it('shows the Purchased fallback for a reference that can not be resolved', () => {
		setStatus(purchase('x', null));
		expect(page().kind).toBe('purchased');
	});

	it('shows Intro for a known empty catalog (no spinner)', () => {
		setCatalog();
		setStatus();

		expect(page()).toEqual({ kind: 'intro', view: Usable });
	});

	it('shows Intro for a free user with an unresolvable add-on', () => {
		setCatalog({ id: '1', isTopLevel: true, isIntro: true });
		setStatus(purchase('1', { id: '1' }), purchase('x', null));

		expect(page().kind).toBe('intro');
	});

	it('shows Intro for a free user with a resolved non top-level add-on', () => {
		setStatus(purchase('7', { id: '7', isTopLevel: false, name: 'Storage' }));
		setCatalog();

		expect(page().kind).toBe('intro');
	});

	it('shows the catalog state when Intro needs a catalog that is not usable', () => {
		setStatus();
		expect(page()).toEqual({ kind: 'state', view: I.MembershipView.Pending });

		const ticket = store.beginRequest(Products);
		store.settleRequest(ticket);
		expect(page()).toEqual({ kind: 'state', view: I.MembershipView.Unavailable });
	});
});
