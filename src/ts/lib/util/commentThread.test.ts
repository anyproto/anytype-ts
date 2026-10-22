import { describe, expect, it } from 'vitest';
import { buildThreads, insertByOrder, newThreadIndex, placeMessage, ThreadMessage } from './commentThread';

const msg = (id: string, orderId: string, replyToMessageId = ''): ThreadMessage => ({ id, orderId, replyToMessageId });

// Flattens a build result to ids so a failure reads as the thread layout it got.
const layout = (result: ReturnType<typeof buildThreads<ThreadMessage>>) => ({
	posts: result.posts.map(it => it.id),
	replies: Object.fromEntries([ ...result.replies ].map(([ rootId, list ]) => [ rootId, list.map(it => it.id) ])),
});

describe('buildThreads', () => {
	it('puts posts at the top level and direct replies under their post', () => {
		const want = { posts: [ 'p1', 'p2' ], replies: { p1: [ 'r1', 'r2' ], p2: [ 'r3' ] } };

		const got = buildThreads([
			msg('p1', '01'), msg('r1', '02', 'p1'), msg('p2', '03'), msg('r2', '04', 'p1'), msg('r3', '05', 'p2'),
		]);

		expect(layout(got)).toEqual(want);
	});

	it('files replies to replies under the top-level post, flat and in order', () => {
		const want = { posts: [ 'p1' ], replies: { p1: [ 'r1', 'r2', 'r3', 'r4' ] } };

		const got = buildThreads([
			msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1'), msg('r3', '04', 'r2'), msg('r4', '05', 'p1'),
		]);

		expect(layout(got)).toEqual(want);
	});

	it('orders the input by orderId before placing it', () => {
		const want = { posts: [ 'p1' ], replies: { p1: [ 'r1', 'r2' ] } };

		const got = buildThreads([ msg('r2', '03', 'r1'), msg('p1', '01'), msg('r1', '02', 'p1') ]);

		expect(layout(got)).toEqual(want);
	});

	it('places a child that comes before its parent once the parent is placed', () => {
		// orderIds out of causal order: the reply chain sorts before its post
		const want = { posts: [ 'p1' ], replies: { p1: [ 'r2', 'r1' ] } };

		const got = buildThreads([ msg('r1', '03', 'p1'), msg('r2', '02', 'r1'), msg('p1', '04') ]);

		expect(layout(got)).toEqual(want);
	});

	it('leaves a reply whose parent never arrives unplaced', () => {
		const want = { posts: [ 'p1' ], replies: {} };

		const got = buildThreads([ msg('p1', '01'), msg('r1', '02', 'gone'), msg('r2', '03', 'r1') ]);

		expect(layout(got)).toEqual(want);
		expect([ ...got.index.pending.keys() ]).toEqual([ 'gone', 'r1' ]);
	});

	it('terminates on a reply cycle and places nothing from it', () => {
		const want = { posts: [ 'p1' ], replies: {} };

		const got = buildThreads([ msg('p1', '01'), msg('a', '02', 'b'), msg('b', '03', 'a'), msg('self', '04', 'self') ]);

		expect(layout(got)).toEqual(want);
	});

	it('lays out an own message without an orderId last, as a live insert does', () => {
		const want = { posts: [ 'p1', 'p2', 'mine' ], replies: { p1: [ 'r1', 'reply' ] } };

		const got = buildThreads([ msg('mine', ''), msg('p1', '01'), msg('reply', '', 'p1'), msg('r1', '02', 'p1'), msg('p2', '03') ]);

		expect(layout(got)).toEqual(want);
	});

	it('places a duplicate id once', () => {
		const want = { posts: [ 'p1' ], replies: { p1: [ 'r1' ] } };

		const got = buildThreads([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r1', '02', 'p1') ]);

		expect(layout(got)).toEqual(want);
	});
});

describe('placeMessage', () => {
	it('places a live post and a live reply to a reply', () => {
		const index = newThreadIndex<ThreadMessage>();
		placeMessage(index, msg('p1', '01'));
		placeMessage(index, msg('r1', '02', 'p1'));

		const got = placeMessage(index, msg('r2', '03', 'r1'));

		expect(got.map(it => [ it.message.id, it.rootId ])).toEqual([ [ 'r2', 'p1' ] ]);
	});

	it('parks a message with an unknown parent and releases it, with its own waiting children, when the parent comes', () => {
		const index = newThreadIndex<ThreadMessage>();
		placeMessage(index, msg('p1', '01'));

		expect(placeMessage(index, msg('r3', '04', 'r2'))).toEqual([]);
		expect(placeMessage(index, msg('r2', '03', 'r1'))).toEqual([]);
		const got = placeMessage(index, msg('r1', '02', 'p1'));

		expect(got.map(it => [ it.message.id, it.rootId ])).toEqual([ [ 'r1', 'p1' ], [ 'r2', 'p1' ], [ 'r3', 'p1' ] ]);
		expect(index.pending.size).toBe(0);
	});

	it('ignores a message that is already placed', () => {
		const index = newThreadIndex<ThreadMessage>();
		placeMessage(index, msg('p1', '01'));

		expect(placeMessage(index, msg('p1', '01'))).toEqual([]);
	});

	it('keeps placing children of a removed message in its thread', () => {
		// a hard delete drops the message from the lists, not from the index
		const index = newThreadIndex<ThreadMessage>();
		placeMessage(index, msg('p1', '01'));
		placeMessage(index, msg('r1', '02', 'p1'));

		const got = placeMessage(index, msg('r2', '03', 'r1'));

		expect(got[0].rootId).toBe('p1');
	});
});

describe('insertByOrder', () => {
	const list = () => [ { id: 'a', orderId: '02' }, { id: 'b', orderId: '04' } ];

	it('inserts into an empty list', () => {
		const got: { id: string, orderId: string }[] = [];

		insertByOrder(got, { id: 'x', orderId: '01' });

		expect(got.map(it => it.id)).toEqual([ 'x' ]);
	});

	it('appends the newest, and inserts an older one at its position', () => {
		const got = list();

		insertByOrder(got, { id: 'x', orderId: '05' });
		insertByOrder(got, { id: 'y', orderId: '03' });
		insertByOrder(got, { id: 'z', orderId: '01' });

		expect(got.map(it => it.id)).toEqual([ 'z', 'a', 'y', 'b', 'x' ]);
	});

	it('puts an equal orderId after the existing one', () => {
		const got = list();

		insertByOrder(got, { id: 'x', orderId: '02' });

		expect(got.map(it => it.id)).toEqual([ 'a', 'x', 'b' ]);
	});

	it('appends a message without an orderId (own message before its ChatAdd event)', () => {
		const got = list();

		insertByOrder(got, { id: 'x', orderId: '' });

		expect(got.map(it => it.id)).toEqual([ 'a', 'b', 'x' ]);
	});
});
