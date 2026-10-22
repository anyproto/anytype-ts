import { ActivityGroup, ActivityItem, LiveStatus, MessageAnchor } from './model';

export interface ChatRow {
	creator?: string;
	createdAt: number;
	section: string;
	replyToMessageId?: string;
};

export interface ChatRowGrouping {
	isFirst: boolean;
	isLast: boolean;
};

/** Mixed-publisher activity stays separate from any single author's message run. */
export function activityPublisher (items: Pick<ActivityItem, 'publisherIdentity'>[]): string | undefined {
	const identity = items[0]?.publisherIdentity;
	return items.every(item => item.publisherIdentity == identity) ? identity : undefined;
};

/** Apply the same author/time boundaries to messages and the activity between them. */
export function chatRowGrouping (rows: ChatRow[]): ChatRowGrouping[] {
	const starts = rows.map((row, i) => {
		const prev = rows[i - 1];
		return !prev || !row.creator || (row.creator != prev.creator) || (row.section != prev.section) ||
			(row.createdAt - prev.createdAt >= 300) || !!row.replyToMessageId;
	});
	return starts.map((isFirst, i) => ({ isFirst, isLast: starts[i + 1] ?? true }));
};

/** Assign retained groups to loaded message gaps without moving off-window history to the tail. */
export function activityGaps (
	groups: ActivityGroup[], messages: MessageAnchor[], atStart: boolean, atEnd: boolean,
): Map<string, ActivityGroup[]> {
	const gaps = new Map<string, ActivityGroup[]>();
	const add = (beforeId: string, group: ActivityGroup) => {
		if (!gaps.has(beforeId)) gaps.set(beforeId, []);
		gaps.get(beforeId).push(group);
	};
	const index = new Map(messages.map((message, i) => [ message.id, i ]));
	for (const group of groups) {
		if (!messages.length) {
			if (atStart && atEnd) add('', group);
			continue;
		};
		const preceding = index.get(group.before?.id);
		const following = index.get(group.after?.id);
		if (preceding !== undefined) {
			if ((preceding + 1 < messages.length) || atEnd) add(messages[preceding + 1]?.id || '', group);
			continue;
		};
		if (following !== undefined) { add(messages[following].id, group); continue; };
		// Missing/deleted anchors: use their recorded order boundary only inside the loaded range.
		const orderId = group.before?.orderId || group.after?.orderId || '';
		const next = messages.findIndex(message => message.orderId > orderId);
		if (next == 0) {
			if (atStart) add(messages[0].id, group);
		} else if (next > 0) {
			add(messages[next].id, group);
		} else if (atEnd) {
			add('', group);
		};
	};
	return gaps;
};

export interface DiscussionBucket<T> {
	groups: ActivityGroup[];
	live: LiveStatus[];
	typers: T[];
};

export interface DiscussionActivity<T> {
	/** Comment id → the finished runs that produced it. */
	attached: Map<string, ActivityGroup[]>;
	/** Thread root (top-level post) id → activity in that thread. */
	threads: Map<string, DiscussionBucket<T>>;
	/** The discussion level: no reply target, or one this client has not placed. */
	root: DiscussionBucket<T>;
};

export interface DiscussionLookup {
	/** The thread root of a placed comment, undefined when it is not placed. */
	threadOf: (messageId: string) => string | undefined;
	isDeleted: (messageId: string) => boolean;
};

/**
 * Places discussion activity: a finished run on the comment it produced, everything else at
 * the end of the thread its reply target leads to, or at the discussion level when it has
 * none or the target is not here (yet). A run whose comment was deleted is not shown.
 */
export function discussionActivity<T extends { replyTo?: string }> (
	groups: ActivityGroup[], live: LiveStatus[], typers: T[], lookup: DiscussionLookup,
): DiscussionActivity<T> {
	const empty = (): DiscussionBucket<T> => ({ groups: [], live: [], typers: [] });
	const result: DiscussionActivity<T> = { attached: new Map(), threads: new Map(), root: empty() };
	const bucket = (replyTo?: string): DiscussionBucket<T> => {
		const rootId = replyTo ? lookup.threadOf(replyTo) : undefined;
		if (rootId === undefined) return result.root;
		if (!result.threads.has(rootId)) result.threads.set(rootId, empty());
		return result.threads.get(rootId);
	};

	for (const group of [ ...groups ].sort((a, b) => a.createdAt - b.createdAt)) {
		const after = group.sealed ? group.after?.id : '';
		if (after && (lookup.threadOf(after) !== undefined)) {
			if (lookup.isDeleted(after)) continue;
			if (!result.attached.has(after)) result.attached.set(after, []);
			result.attached.get(after).push(group);
			continue;
		};
		bucket(group.replyTo).groups.push(group);
	};
	live.forEach(it => bucket(it.replyTo).live.push(it));
	typers.forEach(it => bucket(it.replyTo).typers.push(it));
	return result;
};
