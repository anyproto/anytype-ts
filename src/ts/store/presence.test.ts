import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Presence } from './presence';

const OBJECT_ID = 'object1';

const entry = (identity: string, sessionId: string, blockId: string, lastSeen: number) => {
	return { identity, sessionId, blockId, lastSeen };
};

describe('PresenceStore', () => {

	beforeEach(() => {
		Presence.typingMap.clear();
		vi.useFakeTimers();
		vi.setSystemTime(new Date(1_000_000));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('setTyping / getTypers', () => {
		it('should return typers of an object', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', 'block1', Date.now()));
			Presence.setTyping(OBJECT_ID, entry('accB', 's2', '', Date.now()));

			const got = Presence.getTypers(OBJECT_ID);

			expect(got).toHaveLength(2);
			expect(got.map(it => it.identity).sort()).toEqual([ 'accA', 'accB' ]);
		});

		it('should collapse several sessions of one account to the most recent', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', 'block1', Date.now() - 1000));
			Presence.setTyping(OBJECT_ID, entry('accA', 's2', 'block2', Date.now()));

			const got = Presence.getTypers(OBJECT_ID);

			expect(got).toHaveLength(1);
			expect(got[0].blockId).toBe('block2');
		});

		it('should refresh an existing entry in place', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', 'block1', Date.now() - 1000));
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', 'block2', Date.now()));

			const got = Presence.getTypers(OBJECT_ID);

			expect(got).toHaveLength(1);
			expect(got[0].blockId).toBe('block2');
		});
	});

	describe('getBlockTypers', () => {
		it('should filter by block', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', 'block1', Date.now()));
			Presence.setTyping(OBJECT_ID, entry('accB', 's2', '', Date.now()));

			expect(Presence.getBlockTypers(OBJECT_ID, 'block1')).toHaveLength(1);
			expect(Presence.getBlockTypers(OBJECT_ID, 'block2')).toHaveLength(0);
			expect(Presence.getBlockTypers(OBJECT_ID, '')).toHaveLength(1);
		});
	});

	describe('clearTyping', () => {
		it('should remove one session only', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', '', Date.now()));
			Presence.setTyping(OBJECT_ID, entry('accA', 's2', '', Date.now()));

			Presence.clearTyping(OBJECT_ID, 'accA', 's1');

			expect(Presence.getTypers(OBJECT_ID)).toHaveLength(1);
		});

		it('should drop the object map when the last entry goes', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', '', Date.now()));

			Presence.clearTyping(OBJECT_ID, 'accA', 's1');

			expect(Presence.typingMap.has(OBJECT_ID)).toBe(false);
		});
	});

	describe('prune', () => {
		it('should expire stale entries by receiver-local clock', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', '', Date.now() - 6000));
			Presence.setTyping(OBJECT_ID, entry('accB', 's2', '', Date.now() - 1000));

			Presence.prune(5000);

			const got = Presence.getTypers(OBJECT_ID);
			expect(got).toHaveLength(1);
			expect(got[0].identity).toBe('accB');
		});

		it('should drop empty object maps', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', '', Date.now() - 6000));

			Presence.prune(5000);

			expect(Presence.typingMap.has(OBJECT_ID)).toBe(false);
		});
	});

	describe('clearObject', () => {
		it('should drop all entries of the object', () => {
			Presence.setTyping(OBJECT_ID, entry('accA', 's1', '', Date.now()));
			Presence.setTyping('object2', entry('accB', 's2', '', Date.now()));

			Presence.clearObject(OBJECT_ID);

			expect(Presence.getTypers(OBJECT_ID)).toHaveLength(0);
			expect(Presence.getTypers('object2')).toHaveLength(1);
		});
	});
});
