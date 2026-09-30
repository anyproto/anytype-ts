import { ChatStatusJournal, ChatStatusScope, StatusCommand, StatusDelta, decodeStatus, scopeKey } from './model';

interface Session {
	journal: ChatStatusJournal;
	clients: Set<number>;
}

/** One elected stream owner per chat; all open views receive journal deltas. No disk writes. */
export class ChatStatusSession {
	private sessions = new Map<string, Session>();

	constructor (private send: (clientId: number, delta: StatusDelta) => void, private now = Date.now) {};

	receive (clientId: number, scope: ChatStatusScope, command: StatusCommand): void {
		if (!scope?.accountId || !scope.spaceId || !scope.chatId || !command?.type) return;
		if ((command.type == 'clearAccount') || (command.type == 'clearSpace')) {
			this.clear(scope.accountId, command.type == 'clearSpace' ? scope.spaceId : undefined);
			return;
		};
		const key = scopeKey(scope);
		let session = this.sessions.get(key);
		if (command.type == 'attach') {
			if (!session) {
				session = { journal: new ChatStatusJournal(scope), clients: new Set() };
				this.sessions.set(key, session);
			};
			session.clients.add(clientId);
			this.publish(session, true);
			return;
		};
		if (!session?.clients.has(clientId)) return;
		if (command.type == 'detach') {
			this.detach(session, clientId);
			return;
		};
		const { journal } = session;
		let changed = false;
		if (command.type == 'expand') {
			changed = journal.expand(command.kind, command.id, command.expanded);
		} else {
			if (this.owner(session) != clientId) return;
			switch (command.type) {
				case 'tail': changed = journal.setTail(command.tail); break;
				case 'message': changed = journal.message(command.message, command.publisherIdentity); break;
				case 'status': {
					if (typeof command.payload != 'string') return;
					const payload = decodeStatus(command.payload);
					changed = payload ? journal.status(command.publisherIdentity, payload, this.now()) : false;
					break;
				};
				case 'disconnect': journal.disconnect(); changed = true; break;
			};
		};
		if (changed) this.publish(session, false, command.type);
	};

	removeClient (clientId: number): void {
		this.sessions.forEach(session => {
			if (session.clients.has(clientId)) this.detach(session, clientId);
		});
	};

	private detach (session: Session, clientId: number): void {
		const wasOwner = this.owner(session) == clientId;
		session.clients.delete(clientId);
		if (wasOwner) {
			// Ownership handoff has an observation gap. Existing calls still correlate.
			session.journal.disconnect();
			this.publish(session, true);
		};
	};

	private clear (accountId: string, spaceId?: string): void {
		this.sessions.forEach((session, key) => {
			const scope = session.journal.scope;
			if ((scope.accountId != accountId) || (spaceId && (scope.spaceId != spaceId))) return;
			const revision = session.journal.revision + 1;
			session.clients.forEach(clientId => this.send(clientId, {
				scope, revision, items: [], groups: [], live: [], reset: true, owner: false, removed: true,
			}));
			this.sessions.delete(key);
		});
	};

	private owner (session: Session): number | undefined {
		return session.clients.values().next().value;
	};

	private publish (session: Session, reset = false, reason?: StatusCommand['type']): void {
		const delta = session.journal.delta(reset);
		delta.reason = reason;
		session.clients.forEach(clientId => this.send(clientId, { ...delta, owner: this.owner(session) == clientId }));
	};
}
