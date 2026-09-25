import { ActivityGroup, MessageAnchor } from './model';

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
