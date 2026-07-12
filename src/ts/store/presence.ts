import { observable, action, makeObservable } from 'mobx';

export interface PresenceTyping {
	identity: string;	// verified account id of the sender (from the pubsub event, never the payload)
	sessionId: string;	// sender app-session id, distinguishes devices/windows of one account
	blockId: string;	// block being typed in; '' means the chat input of the object
	lastSeen: number;	// receiver-local receipt timestamp, drives TTL expiry
};

/**
 * Ephemeral typing/live-cursor presence per object, fed by pubsub typing
 * messages (see anytype-heart docs/pubsub/CLIENTS.md). Entries expire by
 * receiver-local clock via prune(); nothing here is persisted.
 */
class PresenceStore {

	public typingMap: Map<string, Map<string, PresenceTyping>> = observable.map(new Map());

	constructor () {
		makeObservable(this, {
			setTyping: action,
			clearTyping: action,
			clearObject: action,
			prune: action,
		});
	};

	private key (identity: string, sessionId: string): string {
		return [ identity, sessionId ].join(':');
	};

	/**
	 * Upserts a typing entry for an object.
	 */
	setTyping (objectId: string, entry: PresenceTyping): void {
		let map = this.typingMap.get(objectId);
		if (!map) {
			map = observable.map(new Map());
			this.typingMap.set(objectId, map);
		};
		map.set(this.key(entry.identity, entry.sessionId), entry);
	};

	/**
	 * Removes one session's typing entry (explicit closing message).
	 */
	clearTyping (objectId: string, identity: string, sessionId: string): void {
		const map = this.typingMap.get(objectId);
		if (!map) {
			return;
		};
		map.delete(this.key(identity, sessionId));
		if (!map.size) {
			this.typingMap.delete(objectId);
		};
	};

	/**
	 * Drops all entries of an object (on unsubscribe/close).
	 */
	clearObject (objectId: string): void {
		this.typingMap.delete(objectId);
	};

	/**
	 * Expires entries not refreshed within ttl ms, by receiver-local clock.
	 */
	prune (ttl: number): void {
		const now = Date.now();

		for (const [ objectId, map ] of this.typingMap) {
			for (const [ key, entry ] of map) {
				if (now - entry.lastSeen > ttl) {
					map.delete(key);
				};
			};
			if (!map.size) {
				this.typingMap.delete(objectId);
			};
		};
	};

	/**
	 * Everyone currently typing in the object, one entry per account
	 * (multiple sessions of one account collapse to the most recent).
	 */
	getTypers (objectId: string): PresenceTyping[] {
		const map = this.typingMap.get(objectId);
		if (!map) {
			return [];
		};

		const byIdentity: Map<string, PresenceTyping> = new Map();
		for (const entry of map.values()) {
			const current = byIdentity.get(entry.identity);
			if (!current || (entry.lastSeen > current.lastSeen)) {
				byIdentity.set(entry.identity, entry);
			};
		};
		return Array.from(byIdentity.values());
	};

	/**
	 * Everyone currently typing in a specific block of the object.
	 */
	getBlockTypers (objectId: string, blockId: string): PresenceTyping[] {
		return this.getTypers(objectId).filter(it => it.blockId == blockId);
	};

};

export const Presence: PresenceStore = new PresenceStore();
