import { ActivityGroup, ActivityItem, MessageAnchor } from './model';

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
