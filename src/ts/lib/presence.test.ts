import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => ({ PubsubSubscribe: vi.fn(), PubsubUnsubscribe: vi.fn(), PubsubPublish: vi.fn() }));
const store = vi.hoisted(() => ({
	Presence: { setTyping: vi.fn(), clearTyping: vi.fn(), clearObject: vi.fn(), prune: vi.fn() },
	Auth: { account: { id: 'self' } },
	Common: { sendTyping: true },
}));
vi.mock('./api/command', () => rpc);
vi.mock('Store', () => store);
vi.mock('./focus', () => ({ focus: { state: {}, clear: vi.fn() } }));

const sent = () => rpc.PubsubPublish.mock.calls.map(([ , , payload ]) => JSON.parse(new TextDecoder().decode(payload)));
const message = (body: object, identity = 'peer') => ({ topic: 'typing/discussion', identity, payload: new TextEncoder().encode(JSON.stringify(body)) });

describe('typing replyTo', () => {
	let presence: typeof import('./presence').presence;

	beforeEach(async () => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		store.Common.sendTyping = true;
		(window as any).addEventListener = vi.fn();
		(window as any).setInterval = (...args: any[]) => (globalThis as any).setInterval(...args);
		(window as any).clearInterval = (...args: any[]) => (globalThis as any).clearInterval(...args);
		vi.resetModules();
		presence = (await import('./presence')).presence;
		presence.subscribe('space', 'discussion');
	});

	afterEach(() => {
		presence.unsubscribe('discussion');
		vi.useRealTimers();
	});

	it('publishes replyTo, and publishes at once when the reply target changes', () => {
		presence.typing('discussion', '', 'post1');
		presence.typing('discussion', '', 'post1');
		presence.typing('discussion', '', 'post2');
		presence.typing('discussion', '');

		expect(sent().map(it => it.replyTo)).toEqual([ 'post1', 'post2', undefined ]);
		expect(sent().every(it => it.active && !('blockId' in it))).toBe(true);
	});

	it('publishes nothing while typing is turned off, but still sends the stop it owes', () => {
		presence.typing('discussion', '', 'post1');
		store.Common.sendTyping = false;
		vi.advanceTimersByTime(2500);
		presence.typing('discussion', '', 'post1');
		presence.typing('discussion', '', 'post2');

		expect(sent().map(it => it.active)).toEqual([ true ]);

		vi.advanceTimersByTime(3000);
		expect(sent().map(it => it.active)).toEqual([ true, false ]);

		presence.typing('discussion', '');
		vi.advanceTimersByTime(5000);
		expect(sent()).toHaveLength(2);
	});

	it('keeps a received replyTo, and reads a missing or malformed one as the main composer', () => {
		presence.onMessage(message({ sessionId: 'remote', active: true, replyTo: 'post1' }));
		presence.onMessage(message({ sessionId: 'remote', active: true }));
		presence.onMessage(message({ sessionId: 'remote', active: true, replyTo: { x: 1 } }));

		expect(store.Presence.setTyping.mock.calls.map(([ , entry ]) => entry.replyTo)).toEqual([ 'post1', '', '' ]);
	});
});
