import * as I from 'Interface';
import * as S from 'Store';
import * as C from './api/command';

const TOPIC_PREFIX = 'typing/';
const SUB_PREFIX = 'typing-';

const REFRESH_INTERVAL = 2000;	// republish while typing/focus continues; never faster
const CARRIAGE_INTERVAL = 300;	// caret moves are published faster than the heartbeat, but still throttled
const IDLE_TIMEOUT = 3000;		// publish a stop after this long without keystrokes
const EXPIRE_TTL = 5000;		// drop remote entries without refresh (≥ 2x refresh, survives one lost message)
const SWEEP_INTERVAL = 1000;

interface TypingPayload {
	sessionId: string;
	blockId?: string;
	range?: I.TextRange;
	active: boolean;
};

/**
 * Presence publishes and consumes ephemeral typing signals over the pubsub
 * middleware channel (topic `typing/<objectId>`), following the conventions in
 * anytype-heart docs/pubsub/CLIENTS.md:
 *
 * - full-state messages `{ sessionId, blockId, active }`, refreshed every 3s
 *   while typing, best-effort `active: false` on idle/blur/close;
 * - receiver expiry by local clock (8s TTL) — closing messages only shorten
 *   the ghost period, expiry is the mechanism of truth;
 * - own session filtered out (local echo), own account filtered out (you never
 *   see yourself typing);
 * - sender identity always taken from the signature-verified event.
 */
class Presence {

	private sessionId = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
	private subs: Map<string, { spaceId: string; refs: number }> = new Map();
	private sent: Map<string, { blockId: string; at: number }> = new Map();
	private ranges: Map<string, I.TextRange> = new Map();
	private idleTimers: Map<string, number> = new Map();
	private carriageTimers: Map<string, number> = new Map();
	private held: Map<string, { blockId: string; timer: number }> = new Map();
	private sweepTimer = 0;

	constructor () {
		// best-effort goodbyes on app/window close so others don't wait out the TTL
		window.addEventListener('beforeunload', () => this.stopAll());
	};

	private getTopic (objectId: string): string {
		return TOPIC_PREFIX + objectId;
	};

	private getSubId (objectId: string): string {
		// sessionId-scoped so another window's unsubscribe can't tear down ours
		return `${SUB_PREFIX}${this.sessionId}-${objectId}`;
	};

	/**
	 * Subscribes to typing signals of an object; refcounted, so several
	 * surfaces (editor page, chat block) can subscribe independently.
	 */
	subscribe (spaceId: string, objectId: string): void {
		if (!spaceId || !objectId) {
			return;
		};

		const sub = this.subs.get(objectId);
		if (sub) {
			sub.refs++;
			return;
		};

		this.subs.set(objectId, { spaceId, refs: 1 });
		C.PubsubSubscribe(spaceId, [ this.getTopic(objectId) ], this.getSubId(objectId));

		if (!this.sweepTimer) {
			this.sweepTimer = window.setInterval(() => S.Presence.prune(EXPIRE_TTL), SWEEP_INTERVAL);
		};
	};

	/**
	 * Drops one reference; the last one sends a closing message (others should
	 * not wait out the TTL to see us go), unsubscribes and clears local state.
	 */
	unsubscribe (objectId: string): void {
		const sub = this.subs.get(objectId);
		if (!sub) {
			return;
		};

		if (--sub.refs > 0) {
			return;
		};

		this.stop(objectId);
		this.subs.delete(objectId);
		C.PubsubUnsubscribe(this.getSubId(objectId));
		S.Presence.clearObject(objectId);

		if (!this.subs.size && this.sweepTimer) {
			window.clearInterval(this.sweepTimer);
			this.sweepTimer = 0;
		};
	};

	/**
	 * Reports local typing activity in an object (blockId '' = chat input).
	 * Throttled to one publish per REFRESH_INTERVAL unless the block changed;
	 * (re)arms the idle timer that publishes the stop.
	 */
	typing (objectId: string, blockId: string): void {
		const sub = this.subs.get(objectId);
		if (!sub) {
			return;
		};

		blockId = String(blockId || '');

		const now = Date.now();
		const last = this.sent.get(objectId);

		if (!last || (last.blockId != blockId) || (now - last.at >= REFRESH_INTERVAL)) {
			this.sent.set(objectId, { blockId, at: now });
			this.publish(objectId, blockId, true);
		};

		this.setIdleTimer(objectId);
	};

	/**
	 * Reports that the local user focused an editor block: publishes
	 * immediately (presence must be snappy) and keeps refreshing on a
	 * heartbeat for as long as the focus is held, independent of keystrokes.
	 */
	focusBlock (objectId: string, blockId: string, range?: I.TextRange): void {
		const sub = this.subs.get(objectId);
		if (!sub || !blockId) {
			return;
		};

		const held = this.held.get(objectId);
		if (held) {
			if (held.blockId == blockId) {
				return;
			};
			window.clearInterval(held.timer);
		};

		this.setRange(objectId, range);
		this.sent.set(objectId, { blockId, at: Date.now() });
		this.publish(objectId, blockId, true);

		const timer = window.setInterval(() => {
			this.sent.set(objectId, { blockId, at: Date.now() });
			this.publish(objectId, blockId, true);
		}, REFRESH_INTERVAL);

		this.held.set(objectId, { blockId, timer });
	};

	/**
	 * Reports the local carriage (caret) position inside the block we hold focus
	 * in, so others can draw it. Published on its own throttle — caret moves must
	 * feel live, but a keystroke or arrow key must not mean a message each.
	 */
	carriage (objectId: string, blockId: string, range: I.TextRange): void {
		const held = this.held.get(objectId);
		if (!held || !range || (held.blockId != blockId)) {
			return;
		};

		const current = this.ranges.get(objectId);
		if (current && (current.from == range.from) && (current.to == range.to)) {
			return;
		};

		this.setRange(objectId, range);

		const now = Date.now();
		const last = this.sent.get(objectId);
		const elapsed = last ? now - last.at : CARRIAGE_INTERVAL;

		if (elapsed >= CARRIAGE_INTERVAL) {
			this.sent.set(objectId, { blockId, at: now });
			this.publish(objectId, blockId, true);
			return;
		};

		// inside the throttle window: make sure the latest position still goes out
		if (!this.carriageTimers.has(objectId)) {
			this.carriageTimers.set(objectId, window.setTimeout(() => {
				this.carriageTimers.delete(objectId);

				if (this.held.get(objectId)?.blockId == blockId) {
					this.sent.set(objectId, { blockId, at: Date.now() });
					this.publish(objectId, blockId, true);
				};
			}, CARRIAGE_INTERVAL - elapsed));
		};
	};

	/**
	 * Reports that the local user left an editor block: stops the heartbeat
	 * and publishes the closing message immediately.
	 */
	blurBlock (objectId: string, blockId: string): void {
		const held = this.held.get(objectId);
		if (!held || (blockId && (held.blockId != blockId))) {
			return;
		};

		window.clearInterval(held.timer);
		this.held.delete(objectId);
		this.stop(objectId);
	};

	/**
	 * Publishes the closing message if we owe one (last state was active).
	 * Call on blur, message send, object close, app quit.
	 */
	stop (objectId: string): void {
		const timer = this.idleTimers.get(objectId);
		if (timer) {
			window.clearTimeout(timer);
			this.idleTimers.delete(objectId);
		};

		const carriageTimer = this.carriageTimers.get(objectId);
		if (carriageTimer) {
			window.clearTimeout(carriageTimer);
			this.carriageTimers.delete(objectId);
		};

		const held = this.held.get(objectId);
		if (held) {
			window.clearInterval(held.timer);
			this.held.delete(objectId);
		};

		this.ranges.delete(objectId);

		if (!this.sent.has(objectId)) {
			return;
		};

		this.sent.delete(objectId);
		this.publish(objectId, '', false);
	};

	/**
	 * Sends closing messages everywhere we owe one; call before app quit.
	 */
	stopAll (): void {
		for (const objectId of Array.from(this.sent.keys())) {
			this.stop(objectId);
		};
	};

	private setRange (objectId: string, range: I.TextRange): void {
		if (!range) {
			this.ranges.delete(objectId);
			return;
		};

		this.ranges.set(objectId, {
			from: Math.max(0, Number(range.from) || 0),
			to: Math.max(0, Number(range.to) || 0),
		});
	};

	private setIdleTimer (objectId: string): void {
		const timer = this.idleTimers.get(objectId);
		if (timer) {
			window.clearTimeout(timer);
		};
		this.idleTimers.set(objectId, window.setTimeout(() => this.stop(objectId), IDLE_TIMEOUT));
	};

	private publish (objectId: string, blockId: string, active: boolean): void {
		const sub = this.subs.get(objectId);
		if (!sub) {
			return;
		};

		const payload: TypingPayload = { sessionId: this.sessionId, active };
		if (blockId) {
			payload.blockId = blockId;

			const range = this.ranges.get(objectId);
			if (range) {
				payload.range = range;
			};
		};

		C.PubsubPublish(sub.spaceId, this.getTopic(objectId), new TextEncoder().encode(JSON.stringify(payload)));
	};

	/**
	 * Handles an incoming Event.Pubsub.Message (routed by the dispatcher).
	 */
	onMessage (data: { topic: string; payload: Uint8Array; identity: string }): void {
		if (!data.topic.startsWith(TOPIC_PREFIX)) {
			return;
		};

		const objectId = data.topic.substring(TOPIC_PREFIX.length);

		let payload: TypingPayload = null;
		try {
			payload = JSON.parse(new TextDecoder().decode(data.payload));
		} catch (e) {
			return;
		};

		if (!payload || !payload.sessionId || (payload.sessionId == this.sessionId)) {
			return;
		};

		if (data.identity == S.Auth.account?.id) {
			return;
		};

		if (payload.active) {
			const range = payload.range;

			S.Presence.setTyping(objectId, {
				identity: data.identity,
				sessionId: String(payload.sessionId),
				blockId: String(payload.blockId || ''),
				range: range ? { from: Math.max(0, Number(range.from) || 0), to: Math.max(0, Number(range.to) || 0) } : null,
				lastSeen: Date.now(),
			});
		} else {
			S.Presence.clearTyping(objectId, data.identity, String(payload.sessionId));
		};
	};

};

export const presence = new Presence();
