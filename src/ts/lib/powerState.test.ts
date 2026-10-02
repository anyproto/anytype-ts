import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as I from 'Interface';
import { PowerStateReporter, POWER_RETRY_BASE, POWER_RETRY_ATTEMPTS } from './powerState';

describe('PowerStateReporter', () => {

	let reporter: PowerStateReporter;
	let calls: { state: I.AppDeviceState; callBack: (message: any) => void }[];
	let snapshot: any;

	const answer = (i: number, code = 0) => calls[i].callBack({ error: { code } });
	const flush = () => Promise.resolve().then(() => Promise.resolve());

	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});

		calls = [];
		snapshot = { state: '', seq: 0 };
		reporter = new PowerStateReporter();

		vi.stubGlobal('C', { AppSetDeviceState: (state: I.AppDeviceState, callBack: any) => calls.push({ state, callBack }) });
		vi.stubGlobal('Renderer', { send: vi.fn(() => Promise.resolve(snapshot)) });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('holds events until the account is running (the middleware ignores them before)', async () => {
		reporter.onEvent('resume', 1, 'live');
		expect(calls.length).toBe(0);

		reporter.onAccountReady();
		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Foreground ]);
	});

	it('replays the latest state kept by the main process after a reload', async () => {
		snapshot = { state: 'resume', seq: 4 };

		reporter.onAccountReady();
		await flush();

		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Foreground ]);
		expect(reporter.getLatest()).toEqual({ state: 'resume', seq: 4 });
	});

	it('does not replay what another tab already delivered', async () => {
		snapshot = { state: 'resume', seq: 4, delivered: 4 };

		reporter.onAccountReady();
		await flush();

		expect(calls.length).toBe(0);
	});

	it('tells the main process what it delivered', () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 3, 'live');
		answer(0);

		expect((globalThis as any).Renderer.send).toHaveBeenCalledWith('powerStateDelivered', 3);
	});

	it('re-asserts the latest state when an older call completes after it', () => {
		reporter.onAccountReady();
		reporter.onEvent('suspend', 1, 'live');
		reporter.onEvent('resume', 2, 'live');

		// Foreground lands first, then the stale Background
		answer(1);
		answer(0);

		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Background, I.AppDeviceState.Foreground, I.AppDeviceState.Foreground ]);
	});

	it('does not re-assert when the older call completes first', () => {
		reporter.onAccountReady();
		reporter.onEvent('suspend', 1, 'live');
		reporter.onEvent('resume', 2, 'live');

		answer(0);
		answer(1);

		expect(calls.length).toBe(2);
	});

	it('replays nothing received before logout into the next account', async () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 1, 'live');
		answer(0, 1);
		reporter.onLogout();

		snapshot = { state: 'resume', seq: 1, delivered: 0 };
		reporter.onAccountReady();
		await flush();

		expect(calls.length).toBe(1);
	});

	it('does not replay when no power event happened yet', async () => {
		reporter.onAccountReady();
		await flush();

		expect(calls.length).toBe(0);
	});

	it('does not replay an event already delivered live', async () => {
		reporter.onAccountReady();
		reporter.onEvent('suspend', 2, 'live');
		answer(0);

		snapshot = { state: 'suspend', seq: 2 };
		reporter.onAccountReady();
		await flush();

		expect(calls.length).toBe(1);
		expect(calls[0].state).toBe(I.AppDeviceState.Background);
	});

	it('forwards every resume, also repeated ones (no dedup)', () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 1, 'live');
		answer(0);
		reporter.onEvent('resume', 2, 'live');

		expect(calls.length).toBe(2);
	});

	it('ignores an older event', () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 5, 'live');
		reporter.onEvent('suspend', 4, 'replay');

		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Foreground ]);
	});

	it('retries on error with backoff and gives up after the attempts', () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 1, 'live');

		answer(0, 1);
		vi.advanceTimersByTime(POWER_RETRY_BASE - 1);
		expect(calls.length).toBe(1);
		vi.advanceTimersByTime(1);
		expect(calls.length).toBe(2);

		answer(1, 1);
		vi.advanceTimersByTime(POWER_RETRY_BASE * 2);
		expect(calls.length).toBe(3);

		for (let i = 2; i < POWER_RETRY_ATTEMPTS; i++) {
			answer(i, 1);
			vi.advanceTimersByTime(POWER_RETRY_BASE * 64);
		};

		expect(calls.length).toBe(POWER_RETRY_ATTEMPTS);
	});

	it('stops retrying an older state once a newer event arrived', () => {
		reporter.onAccountReady();
		reporter.onEvent('suspend', 1, 'live');
		reporter.onEvent('resume', 2, 'live');

		answer(0, 1);
		vi.advanceTimersByTime(POWER_RETRY_BASE * 64);

		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Background, I.AppDeviceState.Foreground ]);
	});

	it('stops after logout', () => {
		reporter.onAccountReady();
		reporter.onEvent('resume', 1, 'live');
		answer(0, 1);
		reporter.onLogout();
		vi.advanceTimersByTime(POWER_RETRY_BASE * 64);

		expect(calls.length).toBe(1);
	});

	it('accepts events of an older main process without sequence numbers', () => {
		reporter.onAccountReady();
		reporter.onEvent('suspend', 0, 'live');
		answer(0);
		reporter.onEvent('resume', 0, 'live');

		expect(calls.map(it => it.state)).toEqual([ I.AppDeviceState.Background, I.AppDeviceState.Foreground ]);
	});
});
