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
		error: [] as string[],
		spaces: [] as any[],
	};

	return {
		calls,
		targets: [ 1 ],
		open (payload: any) { calls.open.push(payload); },
		close (key: string) { calls.close.push(key); },
		code (key: string, challenge: string) { calls.code.push({ key, challenge }); },
		error (key: string) { calls.error.push(key); },
		spaces (key: string, spaces: any[]) { calls.spaces.push({ key, spaces }); },
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

describe('LinkApprovalManager space grants', () => {
	let handlers: ReturnType<typeof makeHandlers>;
	let manager: LinkApprovalManager;
	const spaces = [ { id: 'space-a', name: 'Work' }, { id: 'space-b', name: 'Notes' } ];
	const grant = { spaceIds: [ 'space-a', 'space-b' ], allSpaces: false, perm: 0 };
	const decision = { processPath: CLIENT_A.processPath, origin: CLIENT_A.origin, allow: true };

	beforeEach(() => {
		vi.useFakeTimers();
		handlers = makeHandlers();
		manager = new LinkApprovalManager(handlers);
		manager.request({ clientInfo: CLIENT_A, scope: 1, spaces }, 1);
	});

	afterEach(() => vi.useRealTimers());

	test('does not grant access until a non-empty user selection exists', () => {
		manager.decide(decision);
		manager.decide({ ...decision, grant: { ...grant, spaceIds: [] } });
		expect(handlers.calls.decision).toHaveLength(0);
		expect(handlers.calls.close).toHaveLength(0);
		expect(handlers.calls.error).toHaveLength(2);
	});

	test('relays multiple selected spaces without turning them into all-spaces access', () => {
		manager.decide({ ...decision, grant });
		expect(handlers.calls.decision[0].grant).toEqual(grant);
		expect(handlers.calls.decision[0].grant.spaceIds).not.toBe(grant.spaceIds);
	});

	test('relays the explicit dynamic all-spaces grant, without expanding it to current IDs', () => {
		const all = { spaceIds: [], allSpaces: true, perm: 1 };
		manager.decide({ ...decision, grant: all });
		expect(handlers.calls.decision[0].grant).toEqual(all);
	});

	test('rejects mixed, unknown and removed space selections', () => {
		manager.decide({ ...decision, grant: { ...grant, allSpaces: true } });
		manager.decide({ ...decision, grant: { ...grant, spaceIds: [ 'tech-space' ] } });
		manager.updateSpaces(1, [ spaces[0] ]);
		manager.decide({ ...decision, grant });
		expect(handlers.calls.decision).toHaveLength(0);
		expect(handlers.calls.error).toHaveLength(3);
		expect(handlers.calls.spaces[0].spaces).toEqual([ spaces[0] ]);
	});

	test('allows correcting BAD_INPUT without closing the prompt or advancing the queue', () => {
		request(manager, CLIENT_B);
		manager.decide({ ...decision, grant });
		manager.result({ ...decision, error: { code: 2 } });
		expect(handlers.calls.close).toHaveLength(0);
		expect(handlers.calls.open).toHaveLength(1);
		expect(handlers.calls.error).toHaveLength(1);
		manager.decide({ ...decision, grant: { ...grant, spaceIds: [ 'space-a' ] } });
		expect(handlers.calls.decision).toHaveLength(2);
	});

	test('denies even without a selection and omits the grant', () => {
		manager.decide({ ...decision, allow: false, grant });
		expect(handlers.calls.decision[0]).toEqual({ targetId: 1, ...decision, allow: false });
	});

	test('keeps a Limited request free of space grants', () => {
		manager.hide(CLIENT_A);
		request(manager, CLIENT_A);
		manager.decide({ ...decision, grant });
		expect(handlers.calls.decision).toHaveLength(0);
		manager.decide(decision);
		expect(handlers.calls.decision[0].grant).toBeUndefined();
	});

	test('updates queued catalogs only from their reporting renderer', () => {
		manager.request({ clientInfo: CLIENT_B, scope: 1, spaces }, 7);
		manager.updateSpaces(7, [ spaces[1] ]);
		expect(handlers.calls.spaces).toHaveLength(0);
		manager.hide(CLIENT_A);
		expect(handlers.calls.open[1].spaces).toEqual([ spaces[1] ]);
	});

	test('hands the catalog and decision relay to a surviving renderer', () => {
		const added = { id: 'space-c', name: 'New space' };
		handlers.targets = [ 7 ];
		manager.updateSpaces(7, [ ...spaces, added ]);
		expect(handlers.calls.spaces[0].spaces).toEqual([ ...spaces, added ]);
		manager.decide({ ...decision, grant: { ...grant, spaceIds: [ added.id ] } });
		expect(handlers.calls.error).toHaveLength(0);
		expect(handlers.calls.decision[0]).toEqual({ targetId: 7, ...decision, grant: { ...grant, spaceIds: [ added.id ] } });
	});

	test('hands over queued catalogs too and keeps the new source authoritative', () => {
		manager.request({ clientInfo: CLIENT_B, scope: 1, spaces }, 1);
		handlers.targets = [ 7, 8 ];
		manager.updateSpaces(7, [ spaces[1] ]);
		manager.updateSpaces(8, [ spaces[0] ]);
		manager.updateSpaces(1, spaces);
		manager.hide(CLIENT_A);
		expect(handlers.calls.spaces).toHaveLength(1);
		expect(handlers.calls.open[1].spaces).toEqual([ spaces[1] ]);
	});

	test('does not hand the catalog to another renderer while the source is live', () => {
		handlers.targets = [ 1, 7 ];
		manager.updateSpaces(7, [ spaces[1] ]);
		expect(handlers.calls.spaces).toHaveLength(0);
		manager.decide({ ...decision, grant });
		expect(handlers.calls.decision[0].targetId).toBe(1);
	});

	test('does not accept a catalog handover from a closed renderer', () => {
		handlers.targets = [ 7 ];
		manager.updateSpaces(8, []);
		expect(handlers.calls.spaces).toHaveLength(0);
	});

	test('leaves the full three-minute picking interval to Heart', () => {
		vi.advanceTimersByTime(181000);
		expect(handlers.calls.close).toHaveLength(0);
		vi.advanceTimersByTime(PENDING_BACKSTOP_MS - 181000);
		expect(handlers.calls.close).toHaveLength(1);
	});
});
