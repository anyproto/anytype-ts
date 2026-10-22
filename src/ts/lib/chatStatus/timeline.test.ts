import { describe, expect, it } from 'vitest';
import { activityGaps, activityPublisher, chatRowGrouping, ChatRow, discussionActivity } from './timeline';
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

describe('discussion activity placement', () => {
	// p1 thread: p1, r1, r2 (r2 deleted); p2 has no replies; 'late' is not placed yet
	const roots = new Map([ [ 'p1', 'p1' ], [ 'r1', 'p1' ], [ 'r2', 'p1' ], [ 'p2', 'p2' ] ]);
	const lookup = { threadOf: (id: string) => roots.get(id), isDeleted: (id: string) => id == 'r2' };
	const run = (id: string, replyTo?: string, after?: string, createdAt = 100): ActivityGroup => ({
		id, replyTo, after: after ? { id: after, orderId: '009' } : undefined,
		sealed: !!after, itemIds: [], createdAt, expanded: false,
	});
	const ids = (groups: ActivityGroup[]) => groups.map(it => it.id);

	it('attaches a finished run to its comment and places the rest by thread', () => {
		const result = discussionActivity([
			run('done', 'r1', 'r1'),
			run('open', 'r1', '', 200),
			run('elsewhere', 'p2'),
			run('first', 'p1', '', 50),
			run('noTarget'),
		], [], [], lookup);

		expect(ids(result.attached.get('r1'))).toEqual([ 'done' ]);
		expect(ids(result.threads.get('p1').groups)).toEqual([ 'first', 'open' ]);
		expect(ids(result.threads.get('p2').groups)).toEqual([ 'elsewhere' ]);
		expect(ids(result.root.groups)).toEqual([ 'noTarget' ]);
	});

	it('falls back to the discussion level for a target not placed yet, and to the thread for a comment not placed yet', () => {
		const result = discussionActivity([ run('unknown', 'late'), run('pending', 'p2', 'late') ], [], [], lookup);

		expect(ids(result.root.groups)).toEqual([ 'unknown' ]);
		expect(ids(result.threads.get('p2').groups)).toEqual([ 'pending' ]);
		expect(result.attached.size).toBe(0);
	});

	it('drops a run whose comment was deleted', () => {
		const result = discussionActivity([ run('gone', 'p1', 'r2') ], [], [], lookup);

		expect(result.attached.size).toBe(0);
		expect(result.threads.size).toBe(0);
		expect(result.root.groups).toEqual([]);
	});

	it('places live status and typing by reply target', () => {
		const live = [ { publisherIdentity: 'agent', text: 'Reading', lastSeenAt: 1, replyTo: 'r1' }, { publisherIdentity: 'bot', text: null, lastSeenAt: 1 } ];
		const typers = [ { identity: 'anna', replyTo: 'p2' }, { identity: 'ben', replyTo: '' }, { identity: 'eve', replyTo: 'late' } ];
		const result = discussionActivity([], live, typers, lookup);

		expect(result.threads.get('p1').live.map(it => it.publisherIdentity)).toEqual([ 'agent' ]);
		expect(result.root.live.map(it => it.publisherIdentity)).toEqual([ 'bot' ]);
		expect(result.threads.get('p2').typers.map(it => it.identity)).toEqual([ 'anna' ]);
		expect(result.root.typers.map(it => it.identity)).toEqual([ 'ben', 'eve' ]);
	});
});
