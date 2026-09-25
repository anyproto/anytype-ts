import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatStatusReceiver } from '../chatStatus';
import { ChatStatus } from '../../store/chatStatus';
import { ChatStatusSession } from './session';
import { STATUS_UPDATE_CHANNEL } from './model';

const rpc = vi.hoisted(() => ({ ChatGetMessages: vi.fn(), PubsubSubscribe: vi.fn(), PubsubUnsubscribe: vi.fn() }));
vi.mock('../api/command', () => rpc);
vi.mock('../../store/auth', () => ({ Auth: { account: { id: 'self' } } }));

const scope = { accountId: 'self', spaceId: 'space', chatId: 'chat' };
type Callback = (...args: any[]) => void;
const payload = (status: string) => new TextEncoder().encode(JSON.stringify({ text: 'Search', data: { tool_call_id: 'call', status } }));

describe('status transport ownership', () => {
	let receiver: ChatStatusReceiver;
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		ChatStatus.clear('self');
		const listeners = new Map<string, Callback>();
		const session = new ChatStatusSession((_id, delta) => listeners.get(STATUS_UPDATE_CHANNEL)?.(null, structuredClone(delta)));
		vi.stubGlobal('window', {
			addEventListener: vi.fn(),
			Electron: {
				on: (channel: string, callback: Callback) => listeners.set(channel, callback),
				send: (_channel: string, messageScope: any, command: any) => session.receive(7, messageScope, command),
			},
		});
		rpc.ChatGetMessages.mockImplementation((_chat, _before, _after, _limit, _boundary, callback) => callback({ messages: [ { id: 'm1', orderId: '001' } ] }));
		rpc.PubsubSubscribe.mockImplementation((_space, _topics, _id, callback) => callback({ error: { code: 0 } }));
		receiver = new ChatStatusReceiver();
	});
	afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

	it('shares one subscription, accepts same-account agents and retains calls across chat reopen', () => {
		const releaseA = receiver.retain('space', 'chat');
		const releaseB = receiver.retain('space', 'chat');
		expect(rpc.PubsubSubscribe).toHaveBeenCalledTimes(1);
		expect(rpc.PubsubSubscribe.mock.calls[0][1]).toEqual([ 'status/chat' ]);
		receiver.onMessage('space', { topic: 'status/chat', identity: 'self', payload: payload('in_progress') });
		const view = ChatStatus.get(scope);
		expect(view.items.size).toBe(1);
		releaseA();
		expect(rpc.PubsubUnsubscribe).not.toHaveBeenCalled();
		releaseB();
		expect(rpc.PubsubUnsubscribe).toHaveBeenCalledTimes(1);
		const releaseC = receiver.retain('space', 'chat');
		receiver.onMessage('space', { topic: 'status/chat', identity: 'self', payload: payload('complete') });
		expect(view.items.size).toBe(1);
		expect(Array.from(view.items.values())[0].lifecycle).toBe('complete');
		releaseC();
	});

	it('does not subscribe from a stale tail response after the view closes', () => {
		let complete: Callback;
		rpc.ChatGetMessages.mockImplementation((...args) => { complete = args[5]; });
		const release = receiver.retain('space', 'chat');
		release();
		complete({ messages: [] });
		expect(rpc.PubsubSubscribe).not.toHaveBeenCalled();
	});

	it('cleans up a late subscription without tearing down the replacement subscription', () => {
		const callbacks: Callback[] = [];
		rpc.PubsubSubscribe.mockImplementation((...args) => callbacks.push(args[3]));
		const release = receiver.retain('space', 'chat');
		const firstId = rpc.PubsubSubscribe.mock.calls[0][2];
		release();
		const releaseNext = receiver.retain('space', 'chat');
		const nextId = rpc.PubsubSubscribe.mock.calls[1][2];
		expect(firstId).not.toBe(nextId);
		callbacks[0]({ error: { code: 0 } });
		expect(rpc.PubsubUnsubscribe).toHaveBeenLastCalledWith(firstId);
		callbacks[1]({ error: { code: 0 } });
		releaseNext();
	});

	it('clears a removed account and ignores events from unopened chats and invalid UTF-8', () => {
		receiver.retain('space', 'chat');
		receiver.onMessage('space', { topic: 'status/other', identity: 'self', payload: payload('in_progress') });
		receiver.onMessage('space', { topic: 'status/chat', identity: 'self', payload: new Uint8Array([ 0xff ]) });
		expect(ChatStatus.get(scope).items.size).toBe(0);
		receiver.onMessage('space', { topic: 'status/chat', identity: 'self', payload: payload('in_progress') });
		receiver.clear('self');
		expect(ChatStatus.get(scope).items.size).toBe(0);
		expect(rpc.PubsubUnsubscribe).toHaveBeenCalled();
	});
});
