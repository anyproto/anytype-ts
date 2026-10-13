import { JsonValue, parseJson, jsonField, jsonText, jsonHasData, jsonMerge, jsonStringify } from './json';

export const STATUS_TTL = 10000;
export const MAX_STATUS_BYTES = 65508;
export const STATUS_CHANNEL = 'chat-status-session';
export const STATUS_UPDATE_CHANNEL = 'chat-status-update';

export type ToolStatus = 'in_progress' | 'complete' | 'error';
/** A chat is one timeline; a discussion groups each publisher's run and places it by reply_to. */
export type StatusMode = 'chat' | 'discussion';
export interface ChatStatusScope { accountId: string; spaceId: string; chatId: string; }
export interface MessageAnchor { id: string; orderId: string; }
export interface StatusPayload { text: string | null; replyTo?: string; data?: JsonValue; }
export interface ActivityItem {
	id: string;
	groupId: string;
	publisherIdentity: string;
	kind: 'tool' | 'generic';
	toolCallId?: string;
	text: string | null;
	data: JsonValue;
	lifecycle?: ToolStatus;
	firstSeenAt: number;
	lastSeenAt: number;
	sequence: number;
	fresh: boolean;
	expanded: boolean;
}
export interface ActivityGroup {
	id: string;
	before?: MessageAnchor;
	after?: MessageAnchor;
	/** Discussion mode: the group's only publisher, and the message its run answers. */
	publisherIdentity?: string;
	replyTo?: string;
	sealed: boolean;
	itemIds: string[];
	createdAt: number;
	expanded: boolean;
}
export interface LiveStatus {
	publisherIdentity: string;
	text: string | null;
	lastSeenAt: number;
	itemId?: string;
	replyTo?: string;
}
export interface StatusDelta {
	scope: ChatStatusScope;
	revision: number;
	items: ActivityItem[];
	groups: ActivityGroup[];
	live: LiveStatus[];
	tail?: MessageAnchor;
	reset?: boolean;
	owner?: boolean;
	removed?: boolean;
	reason?: StatusCommand['type'];
}
export type StatusCommand =
	| { type: 'attach'; mode?: StatusMode }
	| { type: 'detach' | 'disconnect' }
	| { type: 'tail'; tail?: MessageAnchor }
	| { type: 'status'; publisherIdentity: string; payload: string }
	| { type: 'message'; message: MessageAnchor; publisherIdentity: string }
	| { type: 'expand'; kind: 'item' | 'group'; id: string; expanded: boolean }
	| { type: 'clearAccount' | 'clearSpace' };

export function scopeKey (scope: ChatStatusScope): string {
	return JSON.stringify([ scope.accountId, scope.spaceId, scope.chatId ]);
};

export function decodeStatus (source: string): StatusPayload | null {
	try {
		if (new TextEncoder().encode(source).length > MAX_STATUS_BYTES) return null;
		const value = parseJson(source);
		if (value.kind != 'object') return null;
		const text = jsonText(jsonField(value, 'text'));
		const replyTo = jsonText(jsonField(value, 'reply_to'));
		const payload: StatusPayload = { text: text.trim() ? text : null, data: jsonField(value, 'data') };
		if (replyTo) payload.replyTo = replyTo;
		return payload;
	} catch {
		return null;
	};
};

function toolStatus (data: JsonValue): ToolStatus | undefined {
	const status = jsonText(jsonField(data, 'status'));
	return [ 'in_progress', 'complete', 'error' ].includes(status) ? status as ToolStatus : undefined;
};

/** Pure, application-memory journal. Tool updates mutate identity, never timeline position. */
export class ChatStatusJournal {
	readonly items = new Map<string, ActivityItem>();
	readonly groups = new Map<string, ActivityGroup>();
	readonly live = new Map<string, LiveStatus>();
	private calls = new Map<string, string>();
	private generic = new Map<string, { fingerprint: string; itemId?: string; at: number; interval: number }>();
	private changedItems = new Set<string>();
	private changedGroups = new Set<string>();
	/** Open group and message interval per lane, see lane(). */
	private openGroupIds = new Map<string, string>();
	private intervals = new Map<string, number>();
	private sequence = 0;
	revision = 0;
	tail?: MessageAnchor;

	constructor (readonly scope: ChatStatusScope, readonly mode: StatusMode = 'chat') {};

	/**
	 * A chat has one lane: any message seals the open group. A discussion has one per
	 * publisher, so a comment elsewhere does not split an agent's run.
	 */
	private lane (publisherIdentity: string): string {
		return (this.mode == 'discussion') ? publisherIdentity : '';
	};

	private interval (lane: string): number {
		return this.intervals.get(lane) || 0;
	};

	private group (now: number, publisherIdentity: string, replyTo: string): ActivityGroup {
		const lane = this.lane(publisherIdentity);
		let group = this.groups.get(this.openGroupIds.get(lane));
		// A run that moves to another thread starts a new group there
		if (group && (this.mode == 'discussion') && ((group.replyTo || '') != replyTo)) {
			this.seal(lane);
			group = undefined;
		};
		if (!group) {
			group = { id: `group-${++this.sequence}`, before: this.tail, sealed: false, itemIds: [], createdAt: now, expanded: false };
			if (this.mode == 'discussion') {
				group.publisherIdentity = publisherIdentity;
				if (replyTo) group.replyTo = replyTo;
			};
			this.groups.set(group.id, group);
			this.openGroupIds.set(lane, group.id);
		};
		this.changedGroups.add(group.id);
		return group;
	};

	status (publisherIdentity: string, payload: StatusPayload, now: number): boolean {
		if (!publisherIdentity) return false;
		const { text, data } = payload;
		const replyTo = (this.mode == 'discussion') ? (payload.replyTo || '') : '';
		const lane = this.lane(publisherIdentity);
		const toolCallId = jsonText(jsonField(data, 'tool_call_id'));
		const key = JSON.stringify([ publisherIdentity, toolCallId ]);
		const existing = toolCallId ? this.items.get(this.calls.get(key)) : undefined;
		const lifecycle = toolStatus(data);
		if (existing?.lifecycle && (existing.lifecycle != 'in_progress') && lifecycle && (existing.lifecycle != lifecycle)) return false;

		if (existing) {
			existing.data = jsonMerge(existing.data, data);
			existing.text = text;
			existing.lifecycle = lifecycle || existing.lifecycle;
			existing.lastSeenAt = now;
			existing.fresh = true;
			this.changedItems.add(existing.id);
			return true;
		};

		let item: ActivityItem;
		if (!toolCallId) {
			const fingerprint = JSON.stringify(text) + ':' + JSON.stringify(replyTo) + ':' + (data ? jsonStringify(data, false, true) : '');
			const previous = this.generic.get(publisherIdentity);
			if (previous && (previous.fingerprint == fingerprint) && (previous.interval == this.interval(lane)) && (now - previous.at <= STATUS_TTL)) {
				item = this.items.get(previous.itemId);
				if (item) {
					item.lastSeenAt = now;
					item.fresh = true;
					this.changedItems.add(item.id);
				};
				previous.at = now;
				this.setLive(publisherIdentity, text, now, replyTo, item?.id);
				return true;
			};
			// A changed generic/text status supersedes only the prior generic live item.
			const old = this.items.get(this.live.get(publisherIdentity)?.itemId);
			if (old) { old.fresh = false; this.changedItems.add(old.id); };
			this.generic.set(publisherIdentity, { fingerprint, at: now, interval: this.interval(lane) });
		};

		if (jsonHasData(data)) {
			const group = this.group(now, publisherIdentity, replyTo);
			item = {
				id: `item-${++this.sequence}`, groupId: group.id, publisherIdentity,
				kind: toolCallId ? 'tool' : 'generic', toolCallId: toolCallId || undefined,
				text, data, lifecycle, firstSeenAt: now, lastSeenAt: now,
				sequence: this.sequence, fresh: true, expanded: false,
			};
			// A status field without a call ID is ordinary metadata.
			if (!toolCallId) item.lifecycle = undefined;
			this.items.set(item.id, item);
			group.itemIds.push(item.id);
			this.changedItems.add(item.id);
			if (toolCallId) this.calls.set(key, item.id);
			else {
				// Opening a group in a new thread seals the old one, moving the interval on
				const generic = this.generic.get(publisherIdentity);
				generic.itemId = item.id;
				generic.interval = this.interval(lane);
			};
		};
		if (!toolCallId) this.setLive(publisherIdentity, text, now, replyTo, item?.id);
		return true;
	};

	private setLive (publisherIdentity: string, text: string | null, now: number, replyTo: string, itemId?: string): void {
		const live: LiveStatus = { publisherIdentity, text, lastSeenAt: now, itemId };
		if (replyTo) live.replyTo = replyTo;
		this.live.set(publisherIdentity, live);
	};

	setTail (tail?: MessageAnchor): boolean {
		if (!tail?.id || !tail.orderId || (this.tail && (tail.orderId <= this.tail.orderId))) return false;
		this.tail = { ...tail };
		return true;
	};

	message (message: MessageAnchor, publisherIdentity: string): boolean {
		if (!message?.id || !message.orderId || (this.tail && (message.orderId <= this.tail.orderId))) return false;
		this.seal(this.lane(publisherIdentity), message);
		this.tail = { ...message };
		const old = this.items.get(this.live.get(publisherIdentity)?.itemId);
		if (old) { old.fresh = false; this.changedItems.add(old.id); };
		this.live.delete(publisherIdentity);
		return true;
	};

	private seal (lane: string, after?: MessageAnchor): void {
		const group = this.groups.get(this.openGroupIds.get(lane));
		if (group) {
			group.sealed = true;
			group.after = after;
			this.changedGroups.add(group.id);
		};
		this.openGroupIds.delete(lane);
		this.intervals.set(lane, this.interval(lane) + 1);
	};

	disconnect (): void {
		new Set([ '', ...this.openGroupIds.keys() ]).forEach(lane => this.seal(lane));
		this.generic.clear();
		this.live.clear();
		this.items.forEach(item => {
			if (item.fresh) { item.fresh = false; this.changedItems.add(item.id); };
		});
	};

	expand (kind: 'item' | 'group', id: string, expanded: boolean): boolean {
		const value = kind == 'item' ? this.items.get(id) : this.groups.get(id);
		if (!value || (value.expanded == expanded)) return false;
		value.expanded = expanded;
		(kind == 'item' ? this.changedItems : this.changedGroups).add(id);
		return true;
	};

	delta (reset = false): StatusDelta {
		const delta: StatusDelta = {
			scope: this.scope, revision: ++this.revision, reset,
			items: Array.from(reset ? this.items.keys() : this.changedItems).map(id => this.items.get(id)),
			groups: Array.from(reset ? this.groups.keys() : this.changedGroups).map(id => this.groups.get(id)),
			live: Array.from(this.live.values()), tail: this.tail,
		};
		this.changedItems.clear();
		this.changedGroups.clear();
		return delta;
	};
}
