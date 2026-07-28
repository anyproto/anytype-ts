import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinkApprovalManager, approvalKey, PENDING_BACKSTOP_MS, CODE_BACKSTOP_MS } from './linkApproval';

const CLIENT_A = { processName: 'Claude', processPath: '/Applications/Claude.app', name: 'My Notes', origin: '' };
const CLIENT_B = { processName: '', processPath: '', name: 'Web Clipper', origin: 'chrome-extension://abcdef' };

const makeHandlers = () => {
	const calls = {
		open: [] as any[],
		close: [] as string[],
		code: [] as any[],
		decision: [] as any[],
	};

	return {
		calls,
		targets: [ 1 ],
		open (payload: any) { calls.open.push(payload); },
		close (key: string) { calls.close.push(key); },
		code (key: string, challenge: string) { calls.code.push({ key, challenge }); },
		liveTargets () { return this.targets; },
		sendDecision (targetId: number, payload: any) {
			if (!this.targets.includes(targetId)) {
				return false;
			};
			calls.decision.push({ targetId, ...payload });
			return true;
		},
	};
};

const request = (manager: LinkApprovalManager, clientInfo: any, sourceId = 1) => {
	manager.request({ clientInfo, scope: 0, theme: '', lang: 'en-US' }, sourceId);
};

describe('LinkApprovalManager', () => {

	let handlers: ReturnType<typeof makeHandlers>;
	let manager: LinkApprovalManager;

	beforeEach(() => {
		vi.useFakeTimers();
		handlers = makeHandlers();
		manager = new LinkApprovalManager(handlers);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('opens a window for a request', () => {
		request(manager, CLIENT_A);

		expect(handlers.calls.open).toHaveLength(1);
		expect(handlers.calls.open[0].clientInfo).toEqual(CLIENT_A);
		expect(handlers.calls.open[0].key).toBe(approvalKey(CLIENT_A.processPath, CLIENT_A.origin));
	});

	test('opens one window when every renderer reports the same request', () => {
		request(manager, CLIENT_A, 1);
		request(manager, CLIENT_A, 2);
		request(manager, CLIENT_A, 3);

		expect(handlers.calls.open).toHaveLength(1);
	});

	test('queues a second caller instead of opening a second window', () => {
		request(manager, CLIENT_A);
		request(manager, CLIENT_B);

		expect(handlers.calls.open).toHaveLength(1);
		expect(handlers.calls.open[0].clientInfo).toEqual(CLIENT_A);
	});

	test('opens the queued caller once the current one is answered', () => {
		request(manager, CLIENT_A);
		request(manager, CLIENT_B);

		manager.hide(CLIENT_A);

		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
		expect(handlers.calls.open).toHaveLength(2);
		expect(handlers.calls.open[1].clientInfo).toEqual(CLIENT_B);
	});

	test('relays the decision to the renderer that reported the request', () => {
		request(manager, CLIENT_A, 7);
		handlers.targets = [ 1, 7 ];

		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });

		expect(handlers.calls.decision).toEqual([ {
			targetId: 7,
			processPath: CLIENT_A.processPath,
			origin: CLIENT_A.origin,
			allow: true,
		} ]);
	});

	test('relays to another live renderer when the reporting one is gone', () => {
		request(manager, CLIENT_A, 7);
		handlers.targets = [ 3 ];

		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: false });

		expect(handlers.calls.decision).toHaveLength(1);
		expect(handlers.calls.decision[0].targetId).toBe(3);
		expect(handlers.calls.decision[0].allow).toBe(false);
	});

	test('drops the request when no renderer is left to relay through', () => {
		request(manager, CLIENT_A, 7);
		request(manager, CLIENT_B, 7);
		handlers.targets = [];

		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });

		expect(handlers.calls.decision).toHaveLength(0);
		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
		expect(handlers.calls.open[1].clientInfo).toEqual(CLIENT_B);
	});

	test('ignores a second decision for the same request', () => {
		request(manager, CLIENT_A, 1);

		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });
		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: false });

		expect(handlers.calls.decision).toHaveLength(1);
	});

	test('ignores a decision for a caller that is not on screen', () => {
		request(manager, CLIENT_A, 1);

		manager.decide({ processPath: CLIENT_B.processPath, origin: CLIENT_B.origin, allow: true });

		expect(handlers.calls.decision).toHaveLength(0);
	});

	test('shows the code the approving renderer got back', () => {
		const key = approvalKey(CLIENT_A.processPath, CLIENT_A.origin);

		request(manager, CLIENT_A, 1);
		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });
		manager.result({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, challenge: '3719' });

		expect(handlers.calls.code).toEqual([ { key, challenge: '3719' } ]);
		expect(handlers.calls.close).toHaveLength(0);
	});

	test('closes and advances when the approve call came back with an error', () => {
		request(manager, CLIENT_A, 1);
		request(manager, CLIENT_B, 1);
		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });
		manager.result({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, error: { code: 102 } });

		expect(handlers.calls.code).toHaveLength(0);
		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
		expect(handlers.calls.open[1].clientInfo).toEqual(CLIENT_B);
	});

	test('closes and advances after a denial', () => {
		request(manager, CLIENT_A, 1);
		request(manager, CLIENT_B, 1);
		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: false });
		manager.result({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, challenge: '' });

		expect(handlers.calls.code).toHaveLength(0);
		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
		expect(handlers.calls.open[1].clientInfo).toEqual(CLIENT_B);
	});

	test('removes a queued caller silently when it is hidden before being shown', () => {
		request(manager, CLIENT_A);
		request(manager, CLIENT_B);

		manager.hide(CLIENT_B);

		expect(handlers.calls.close).toHaveLength(0);

		manager.hide(CLIENT_A);

		expect(handlers.calls.open).toHaveLength(1);
	});

	test('closes a pending prompt that never got a hide event', () => {
		request(manager, CLIENT_A);
		request(manager, CLIENT_B);

		vi.advanceTimersByTime(PENDING_BACKSTOP_MS);

		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
		expect(handlers.calls.open[1].clientInfo).toEqual(CLIENT_B);
	});

	test('does not close twice when hide arrives before the backstop', () => {
		request(manager, CLIENT_A);
		manager.hide(CLIENT_A);

		vi.advanceTimersByTime(PENDING_BACKSTOP_MS * 2);

		expect(handlers.calls.close).toHaveLength(1);
	});

	test('keeps a displayed code up past the pending backstop', () => {
		request(manager, CLIENT_A);
		manager.decide({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true });
		manager.result({ processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, challenge: '3719' });

		vi.advanceTimersByTime(PENDING_BACKSTOP_MS);
		expect(handlers.calls.close).toHaveLength(0);

		vi.advanceTimersByTime(CODE_BACKSTOP_MS);
		expect(handlers.calls.close).toEqual([ approvalKey(CLIENT_A.processPath, CLIENT_A.origin) ]);
	});

	test('treats callers differing only in origin case or whitespace as distinct', () => {
		const upper = { ...CLIENT_B, origin: 'CHROME-EXTENSION://ABCDEF' };
		const padded = { ...CLIENT_B, origin: ' chrome-extension://abcdef ' };

		request(manager, CLIENT_B);
		request(manager, upper);
		request(manager, padded);

		manager.hide(CLIENT_B);
		expect(handlers.calls.open[1].clientInfo).toEqual(upper);

		manager.hide(upper);
		expect(handlers.calls.open[2].clientInfo).toEqual(padded);
	});

});
