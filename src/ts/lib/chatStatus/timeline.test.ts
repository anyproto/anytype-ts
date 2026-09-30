import { describe, expect, it } from 'vitest';
import { activityGaps, activityPublisher, chatRowGrouping, ChatRow } from './timeline';
import { ActivityGroup } from './model';

const messages = [ { id: 'm2', orderId: '002' }, { id: 'm4', orderId: '004' } ];
const group = (id: string, before?: string, after?: string): ActivityGroup => ({
	id, before: before ? { id: `m${Number(before)}`, orderId: before } : undefined,
	after: after ? { id: `m${Number(after)}`, orderId: after } : undefined,
	sealed: !!after, itemIds: [], createdAt: 100, expanded: false,
});

describe('message and activity author runs', () => {
	const message: ChatRow = { creator: 'agent', createdAt: 1000, section: 'today' };
	const activity: ChatRow = { creator: 'agent', createdAt: 1001, section: 'today' };
	const single = { isFirst: true, isLast: true };
	it('moves the avatar from a message to trailing activity, then to the next message', () => {
		expect(chatRowGrouping([ message, activity ])).toEqual([
			{ isFirst: true, isLast: false }, { isFirst: false, isLast: true },
		]);
		expect(chatRowGrouping([ message, activity, { ...message, createdAt: 1002 } ])).toEqual([
			{ isFirst: true, isLast: false }, { isFirst: false, isLast: false }, { isFirst: false, isLast: true },
		]);
	});
	it('keeps different publishers and mixed-author activity out of a message run', () => {
		const creator = activityPublisher([ { publisherIdentity: 'agent' }, { publisherIdentity: 'other' } ]);
		expect(creator).toBeUndefined();
		expect(chatRowGrouping([ message, { ...activity, creator }, message ])).toEqual([ single, single, single ]);
		expect(chatRowGrouping([ message, { ...activity, creator: 'other' } ])).toEqual([ single, single ]);
		expect(activityPublisher([ { publisherIdentity: 'agent' }, { publisherIdentity: 'agent' } ])).toBe('agent');
	});
	it('preserves date, reply and five-minute boundaries', () => {
		for (const boundary of [ { section: 'tomorrow' }, { replyToMessageId: 'earlier' }, { createdAt: 1300 } ]) {
			expect(chatRowGrouping([ message, { ...activity, ...boundary } ])).toEqual([ single, single ]);
		};
	});
	it('groups activity-only runs and handles an empty timeline', () => {
		expect(chatRowGrouping([ activity ])).toEqual([ single ]);
		expect(chatRowGrouping([])).toEqual([]);
	});
});

describe('activity timeline gaps', () => {
	it('places activities between loaded anchors and at the live tail', () => {
		const gaps = activityGaps([ group('a', '002', '004'), group('b', '004') ], messages, false, true);
		expect(gaps.get('m4').map(it => it.id)).toEqual([ 'a' ]);
		expect(gaps.get('').map(it => it.id)).toEqual([ 'b' ]);
	});
	it('keeps off-window history out of the current page', () => {
		const gaps = activityGaps([ group('old', '001'), group('new', '005') ], messages, false, false);
		expect(gaps.size).toBe(0);
	});
	it('preserves separated groups after deleted anchors and renders activity in an empty chat', () => {
		const groups = [ group('a', '002', '003'), group('b', '003', '004') ];
		expect(activityGaps(groups, messages, true, true).get('m4').map(it => it.id)).toEqual([ 'a', 'b' ]);
		expect(activityGaps(groups, [], true, true).get('')).toHaveLength(2);
	});
	it('shows the gap before a loaded following anchor even if the preceding message is paged out', () => {
		expect(activityGaps([ group('a', '001', '002') ], messages, false, false).get('m2')).toHaveLength(1);
	});
});
