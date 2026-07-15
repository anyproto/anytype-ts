import { describe, it, expect } from 'vitest';
import { evictedCount, reachedEdge, shouldRefetchForward, shouldSuppressLiveAdd, liveAddIndex, mergeWindowSnapshot } from './chatWindow';

const msg = (id: string, orderId: string, flags: any = {}) => ({
	id,
	orderId,
	isReadMessage: false,
	isReadMention: false,
	isReadReaction: false,
	isSynced: false,
	...flags,
});

describe('chatWindow', () => {
	it('evictedCount returns overflow past max, else 0', () => {
		expect(evictedCount(550, 500)).toBe(50);
		expect(evictedCount(500, 500)).toBe(0);
		expect(evictedCount(10, 500)).toBe(0);
	});

	it('reachedEdge is true only for a short page', () => {
		expect(reachedEdge(49, 50)).toBe(true);
		expect(reachedEdge(50, 50)).toBe(false);
		expect(reachedEdge(0, 50)).toBe(true);
	});

	it('shouldRefetchForward only when not at end, at window bottom, and not already loading', () => {
		expect(shouldRefetchForward(false, true, false)).toBe(true);
		expect(shouldRefetchForward(true, true, false)).toBe(false);
		expect(shouldRefetchForward(false, false, false)).toBe(false);
		expect(shouldRefetchForward(false, true, true)).toBe(false);
	});

	it('shouldSuppressLiveAdd only for a genuinely-newer message while not at end', () => {
		expect(shouldSuppressLiveAdd(false, '!z', '!m')).toBe(true);
		expect(shouldSuppressLiveAdd(true, '!z', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!a', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!z', '')).toBe(false);
	});

	describe('liveAddIndex', () => {
		const window = [ '!b', '!d', '!f' ].map(orderId => ({ orderId }));

		it('appends a newer message at the tail', () => {
			expect(liveAddIndex(window, '!z', true)).toBe(3);
		});

		it('inserts an out-of-order older message at its sorted position', () => {
			expect(liveAddIndex(window, '!c', true)).toBe(1);
			expect(liveAddIndex(window, '!e', true)).toBe(2);
		});

		it('inserts before the head only when the window is at the chat start', () => {
			expect(liveAddIndex(window, '!a', true)).toBe(0);
		});

		it('skips a message older than the window head while older history exists', () => {
			expect(liveAddIndex(window, '!a', false)).toBe(-1);
		});

		it('inserts into an empty window at 0', () => {
			expect(liveAddIndex([], '!a', false)).toBe(0);
			expect(liveAddIndex([], '!a', true)).toBe(0);
		});
	});

	describe('mergeWindowSnapshot', () => {
		const none = new Set<string>();

		it('returns the snapshot as-is over an empty window', () => {
			const snapshot = [ msg('1', '!a'), msg('2', '!b') ];
			expect(mergeWindowSnapshot([], snapshot, none, none, true)).toEqual(snapshot);
		});

		it('keeps monotonic flags set by events during the load (true wins)', () => {
			const current = [ msg('1', '!a', { isReadMessage: true, isSynced: true }) ];
			const snapshot = [ msg('1', '!a') ];
			const [ merged ] = mergeWindowSnapshot(current, snapshot, none, none, true);

			expect(merged.isReadMessage).toBe(true);
			expect(merged.isSynced).toBe(true);
		});

		it('takes snapshot content for untouched messages present in both', () => {
			const current = [ { ...msg('1', '!a'), text: 'old' } ];
			const snapshot = [ { ...msg('1', '!a'), text: 'edited' } ];
			const [ merged ] = mergeWindowSnapshot(current, snapshot, none, none, true);

			expect(merged.text).toBe('edited');
		});

		it('keeps the current instance for messages touched by events during the load', () => {
			const current = [ { ...msg('1', '!a'), text: 'edited live' } ];
			const snapshot = [ { ...msg('1', '!a'), text: 'stale' } ];
			const touched = new Set([ '1' ]);
			const [ merged ] = mergeWindowSnapshot(current, snapshot, none, touched, true);

			expect(merged.text).toBe('edited live');
		});

		it('touched messages still gain monotonic flags from the snapshot', () => {
			const current = [ { ...msg('1', '!a'), text: 'edited live' } ];
			const snapshot = [ { ...msg('1', '!a', { isReadMessage: true, isSynced: true }), text: 'stale' } ];
			const touched = new Set([ '1' ]);
			const [ merged ] = mergeWindowSnapshot(current, snapshot, none, touched, true);

			expect(merged.text).toBe('edited live');
			expect(merged.isReadMessage).toBe(true);
			expect(merged.isSynced).toBe(true);
		});

		it('ignores touched ids that are not in the current window', () => {
			const snapshot = [ msg('1', '!a') ];
			const touched = new Set([ '1' ]);

			expect(mergeWindowSnapshot([], snapshot, none, touched, true)).toEqual(snapshot);
		});

		it('does not resurrect messages deleted during the load', () => {
			const snapshot = [ msg('1', '!a'), msg('2', '!b') ];
			const deleted = new Set([ '2' ]);

			expect(mergeWindowSnapshot([], snapshot, deleted, none, true).map(it => it.id)).toEqual([ '1' ]);
		});

		it('preserves live adds newer than the snapshot tail when keepTrailing is set', () => {
			const current = [ msg('1', '!a'), msg('3', '!c') ];
			const snapshot = [ msg('1', '!a'), msg('2', '!b') ];

			expect(mergeWindowSnapshot(current, snapshot, none, none, true).map(it => it.id)).toEqual([ '1', '2', '3' ]);
		});

		it('drops current messages outside the snapshot on a history jump (no keepTrailing)', () => {
			const current = [ msg('1', '!a'), msg('9', '!z') ];
			const snapshot = [ msg('4', '!d'), msg('5', '!e') ];

			expect(mergeWindowSnapshot(current, snapshot, none, none, false).map(it => it.id)).toEqual([ '4', '5' ]);
		});

		it('does not keep trailing messages that were deleted during the load', () => {
			const current = [ msg('1', '!a'), msg('3', '!c') ];
			const snapshot = [ msg('1', '!a') ];
			const deleted = new Set([ '3' ]);

			expect(mergeWindowSnapshot(current, snapshot, deleted, none, true).map(it => it.id)).toEqual([ '1' ]);
		});

		it('keeps all current messages as trailing when the snapshot is empty and keepTrailing is set', () => {
			const current = [ msg('1', '!a') ];

			expect(mergeWindowSnapshot(current, [], none, none, true).map(it => it.id)).toEqual([ '1' ]);
		});
	});
});
