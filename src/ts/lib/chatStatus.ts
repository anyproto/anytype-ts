import * as C from './api/command';
import { Auth } from '../store/auth';
import { ChatStatus } from '../store/chatStatus';
import { ChatStatusScope, StatusCommand, StatusDelta, MessageAnchor, scopeKey, STATUS_CHANNEL, STATUS_UPDATE_CHANNEL, MAX_STATUS_BYTES } from './chatStatus/model';
import { ChatStatusSession } from './chatStatus/session';

interface Subscription {
	scope: ChatStatusScope;
	refs: number;
	owner: boolean;
	active: boolean;
	epoch: number;
	subId: string;
	retry?: ReturnType<typeof setTimeout>;
}

export class ChatStatusReceiver {
	private subs = new Map<string, Subscription>();
	private initialized = false;
	private nonce = Math.random().toString(36).slice(2);
	private subscriptionSequence = 0;
	private local: ChatStatusSession;

	private init (): void {
		if (this.initialized) return;
		this.initialized = true;
		if (window.isWebVersion || !window.Electron?.send) {
			this.local = new ChatStatusSession((_client, delta) => this.update(structuredClone(delta)));
		} else {
			window.Electron.on(STATUS_UPDATE_CHANNEL, (_event, delta: StatusDelta) => this.update(delta));
		};
		window.addEventListener('beforeunload', () => {
			this.subs.forEach(sub => { this.stop(sub); this.send(sub.scope, { type: 'detach' }); });
		});
	};

	scope (spaceId: string, chatId: string): ChatStatusScope {
		return { accountId: Auth.account?.id || '', spaceId, chatId };
	};

	retain (spaceId: string, chatId: string): () => void {
		const scope = this.scope(spaceId, chatId);
		if (!scope.accountId || !spaceId || !chatId) return () => {};
		this.init();
		const key = scopeKey(scope);
		let sub = this.subs.get(key);
		if (sub) {
			sub.refs++;
		} else {
			sub = { scope, refs: 1, owner: false, active: false, epoch: 0, subId: '' };
			this.subs.set(key, sub);
			this.send(scope, { type: 'attach' });
		};
		return () => {
			if ((this.subs.get(key) != sub) || (--sub.refs > 0)) return;
			this.stop(sub);
			this.subs.delete(key);
			this.send(scope, { type: 'detach' });
		};
	};

	private update (delta: StatusDelta): void {
		const sub = this.subs.get(scopeKey(delta.scope));
		if (!sub || (delta.scope.accountId != Auth.account?.id)) return;
		ChatStatus.get(delta.scope).apply(delta);
		if (delta.removed) {
			this.stop(sub);
			this.subs.delete(scopeKey(delta.scope));
			return;
		};
		if (sub.owner != delta.owner) {
			sub.owner = !!delta.owner;
			if (sub.owner) this.start(sub);
			else this.stop(sub);
		};
	};

	private start (sub: Subscription): void {
		const epoch = ++sub.epoch;
		// Establish the actual tail independently of which history page this view displays.
		C.ChatGetMessages(sub.scope.chatId, '', '', 1, false, response => {
			if ((sub.epoch != epoch) || !sub.owner) return;
			if (response.error?.code) {
				sub.retry = setTimeout(() => this.start(sub), 3000);
				return;
			};
			const messages = response.messages || [];
			const tail = messages[messages.length - 1];
			this.send(sub.scope, { type: 'tail', tail: tail ? { id: tail.id, orderId: tail.orderId } : undefined });
			sub.active = true;
			const subId = `status-${this.nonce}-${++this.subscriptionSequence}`;
			sub.subId = subId;
			C.PubsubSubscribe(sub.scope.spaceId, [ `status/${sub.scope.chatId}` ], subId, response => {
				if ((sub.epoch != epoch) || !sub.owner) {
					if (!response.error?.code) C.PubsubUnsubscribe(subId);
					return;
				};
				if (response.error?.code) {
					sub.active = false;
					sub.retry = setTimeout(() => this.start(sub), 3000);
				};
			});
		});
	};

	private stop (sub: Subscription): void {
		sub.epoch++;
		clearTimeout(sub.retry);
		if (sub.active) C.PubsubUnsubscribe(sub.subId);
		sub.active = false;
	};

	onMessage (spaceId: string, data: { topic: string; payload: Uint8Array; identity: string }): void {
		if (!data.topic.startsWith('status/') || !data.identity || (data.payload.length > MAX_STATUS_BYTES)) return;
		const scope = this.scope(spaceId, data.topic.slice(7));
		const sub = this.subs.get(scopeKey(scope));
		if (!sub?.owner || !sub.active) return;
		try {
			this.send(scope, { type: 'status', publisherIdentity: data.identity, payload: new TextDecoder('utf-8', { fatal: true }).decode(data.payload) });
		} catch { /* Invalid UTF-8 is not a status. */ };
	};

	onChatMessage (spaceId: string, chatId: string, message: MessageAnchor & { creator: string }): void {
		const scope = this.scope(spaceId, chatId);
		if (this.subs.get(scopeKey(scope))?.owner) {
			this.send(scope, { type: 'message', message: { id: message.id, orderId: message.orderId }, publisherIdentity: message.creator });
		};
	};

	expand (scope: ChatStatusScope, kind: 'item' | 'group', id: string, expanded: boolean): void {
		this.send(scope, { type: 'expand', kind, id, expanded });
	};

	disconnect (): void {
		this.subs.forEach(sub => {
			if (sub.owner) { this.stop(sub); this.send(sub.scope, { type: 'disconnect' }); };
		});
	};

	reconnect (): void {
		this.subs.forEach(sub => { if (sub.owner) this.start(sub); });
	};

	clear (accountId: string, spaceId?: string): void {
		if (!accountId) return;
		this.init();
		this.send({ accountId, spaceId: spaceId || '*', chatId: '*' }, { type: spaceId ? 'clearSpace' : 'clearAccount' });
		this.subs.forEach((sub, key) => {
			if ((sub.scope.accountId == accountId) && (!spaceId || (sub.scope.spaceId == spaceId))) {
				this.stop(sub);
				this.subs.delete(key);
			};
		});
		ChatStatus.clear(accountId, spaceId);
	};

	private send (scope: ChatStatusScope, command: StatusCommand): void {
		if (this.local) this.local.receive(0, scope, command);
		else window.Electron.send(STATUS_CHANNEL, scope, command);
	};
}

export const chatStatus = new ChatStatusReceiver();
