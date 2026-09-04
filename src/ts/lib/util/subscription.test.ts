import { describe, it, expect } from 'vitest';
import { applySubscriptionPosition, placeCreatedRecord } from './subscription';
import UtilSubscription from './subscription';

/**
 * Regression coverage for GO-7387: in a collection with an explicit sort (e.g. Name Asc),
 * an object created via "+ New object" stayed at the bottom of the list instead of moving
 * to its sorted position.
 *
 * The client optimistically appends the created id to the record list before the
 * middleware processes ObjectCollectionAdd. The middleware then emits SubscriptionAdd
 * with the correct sorted position (afterId), but the reducer skipped every
 * SubscriptionAdd whose id was already present, so the optimistic tail position stuck.
 * Follow-up SubscriptionPosition events are only emitted when the record's relative
 * order changes middleware-side — renaming the object to a name that keeps its slot
 * (empty names sort first under Name Asc, so e.g. "a" never moves) produced no event,
 * and the record was stranded at the bottom permanently.
 *
 * The fix: on sorted subscriptions a SubscriptionAdd for an already present id is
 * applied as a move to the middleware position. Unsorted (manually ordered)
 * subscriptions keep the old behavior — there the optimistic index is the user's
 * chosen insert position and must win. While the record's name is being
 * inline-edited the dispatcher stashes the position via a position lock instead
 * (so the row does not move mid-typing) and the dataview replays it through this
 * function when editing ends.
 */
describe('applySubscriptionPosition', () => {

	const base = [ 'r1', 'r2', 'r3' ];

	describe('SubscriptionAdd, id not in the list', () => {

		it('inserts at head when afterId is empty', () => {
			expect(applySubscriptionPosition(base, 'x', '', true, false)).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
		});

		it('inserts after afterId', () => {
			expect(applySubscriptionPosition(base, 'x', 'r2', true, false)).toEqual([ 'r1', 'r2', 'x', 'r3' ]);
		});

	});

	describe('SubscriptionAdd, id already in the list (optimistic insert)', () => {

		it('keeps the optimistic position on unsorted subscriptions', () => {
			expect(applySubscriptionPosition([ ...base, 'x' ], 'x', '', true, false)).toBeNull();
		});

		it('moves an optimistically appended record to the head on sorted subscriptions (GO-7387)', () => {
			expect(applySubscriptionPosition([ ...base, 'x' ], 'x', '', true, true)).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
		});

		it('moves an optimistically appended record after afterId on sorted subscriptions', () => {
			expect(applySubscriptionPosition([ ...base, 'x' ], 'x', 'r1', true, true)).toEqual([ 'r1', 'x', 'r2', 'r3' ]);
		});

		it('keeps the list unchanged when the record is already at the middleware position', () => {
			expect(applySubscriptionPosition([ 'x', ...base ], 'x', '', true, true)).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
		});

	});

	describe('SubscriptionPosition', () => {

		it('moves a record towards the head, placing it after afterId', () => {
			expect(applySubscriptionPosition([ ...base, 'x' ], 'x', 'r1', false, false)).toEqual([ 'r1', 'x', 'r2', 'r3' ]);
		});

		it('moves a record towards the tail, placing it after afterId', () => {
			expect(applySubscriptionPosition([ 'x', ...base ], 'x', 'r2', false, false)).toEqual([ 'r1', 'r2', 'x', 'r3' ]);
		});

		it('moves a record to the head when afterId is empty', () => {
			expect(applySubscriptionPosition([ ...base, 'x' ], 'x', '', false, false)).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
		});

		it('inserts a missing record after afterId', () => {
			expect(applySubscriptionPosition(base, 'x', 'r3', false, false)).toEqual([ 'r1', 'r2', 'r3', 'x' ]);
		});

	});

	describe('GO-7387 scenario replay', () => {

		// Name Asc collection of bookmarks; B1 sorts before "b", B2..B7 after "c" and before "z".
		// Objects are created unnamed (sorting to the head middleware-side), optimistically
		// appended at the tail client-side, then renamed to a, z, b, c.
		it('places every created object correctly once SubscriptionAdd is applied as a move', () => {
			const apply = (records: string[], id: string, afterId: string, isAdding: boolean) => {
				return applySubscriptionPosition(records, id, afterId, isAdding, true) || records;
			};

			let records = [ 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7' ];

			// create "a": optimistic append, then SubscriptionAdd(head); the rename to "a"
			// keeps the head slot middleware-side, so no SubscriptionPosition ever follows
			records = apply([ ...records, 'a' ], 'a', '', true);
			expect(records[0]).toBe('a');

			// create "z": optimistic append, SubscriptionAdd(head), rename moves it after B7
			records = apply([ ...records, 'z' ], 'z', '', true);
			records = apply(records, 'z', 'B7', false);

			// create "b": same flow, rename moves it after B1
			records = apply([ ...records, 'b' ], 'b', '', true);
			records = apply(records, 'b', 'B1', false);

			// create "c": same flow, rename moves it after "b"
			records = apply([ ...records, 'c' ], 'c', '', true);
			records = apply(records, 'c', 'b', false);

			expect(records).toEqual([ 'a', 'B1', 'b', 'c', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'z' ]);
		});

	});

});

/**
 * Regression coverage for the GO-7387 follow-up: on a sorted subscription the middleware often adds a
 * newly created record at its sorted position before the ObjectCreate callback runs (a race). The
 * callback then must move the record to the creation spot so the row stays put while its name is typed,
 * and defer the sorted position so it is restored on commit - including for an unnamed record, which
 * sorts to the head. Previously the callback dragged the already-placed record to the creation spot with
 * no way back, so it never returned to its sorted position.
 */
describe('placeCreatedRecord', () => {

	const base = [ 'r1', 'r2', 'r3' ];

	describe('record not yet in the list', () => {

		it('appends to the tail when dir is positive', () => {
			const { records, deferAfterId } = placeCreatedRecord(base, 'x', 1, -1, false);
			expect(records).toEqual([ 'r1', 'r2', 'r3', 'x' ]);
			expect(deferAfterId).toBeNull();
		});

		it('prepends to the head when dir is negative', () => {
			const { records, deferAfterId } = placeCreatedRecord(base, 'x', -1, -1, false);
			expect(records).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
			expect(deferAfterId).toBeNull();
		});

		it('inserts at an explicit index', () => {
			const { records, deferAfterId } = placeCreatedRecord(base, 'x', 1, 1, false);
			expect(records).toEqual([ 'r1', 'x', 'r2', 'r3' ]);
			expect(deferAfterId).toBeNull();
		});

	});

	describe('record already placed by the subscription (race)', () => {

		it('moves it to the creation spot and defers the head position on sorted subscriptions', () => {
			const { records, deferAfterId } = placeCreatedRecord([ 'x', 'r1', 'r2', 'r3' ], 'x', 1, -1, true);
			expect(records).toEqual([ 'r1', 'r2', 'r3', 'x' ]);
			expect(deferAfterId).toBe('');
		});

		it('defers the predecessor position when placed mid-list', () => {
			const { records, deferAfterId } = placeCreatedRecord([ 'r1', 'r2', 'x', 'r3' ], 'x', 1, -1, true);
			expect(records).toEqual([ 'r1', 'r2', 'r3', 'x' ]);
			expect(deferAfterId).toBe('r2');
		});

		it('moves without deferring on unsorted subscriptions', () => {
			const { records, deferAfterId } = placeCreatedRecord([ 'x', 'r1', 'r2', 'r3' ], 'x', 1, -1, false);
			expect(records).toEqual([ 'r1', 'r2', 'r3', 'x' ]);
			expect(deferAfterId).toBeNull();
		});

	});

	it('does not mutate the input list', () => {
		const input = [ 'x', 'r1', 'r2' ];
		placeCreatedRecord(input, 'x', 1, -1, true);
		expect(input).toEqual([ 'x', 'r1', 'r2' ]);
	});

	// Full race flow: the row is moved to the creation spot for editing, then the deferred sorted
	// position is replayed on commit - an unnamed record returns to the head (GO-7387)
	it('restores the sorted position on commit via applySubscriptionPosition', () => {
		const placement = placeCreatedRecord([ 'x', 'r1', 'r2', 'r3' ], 'x', 1, -1, true);
		expect(placement.records).toEqual([ 'r1', 'r2', 'r3', 'x' ]);

		const committed = applySubscriptionPosition(placement.records, 'x', placement.deferAfterId as string, false, true);
		expect(committed).toEqual([ 'x', 'r1', 'r2', 'r3' ]);
	});

});

/**
 * "Created in" deep-links via createdInContextRef, which locates the block, message or relation
 * inside the context object. That key is hidden and never appears in a view's relation list, so a
 * subscription asked only for createdInContext (a dataview column, a widget, a list) would render
 * the property but resolve no locator — degrading the click to a plain open with no scroll.
 * mapKeys pairs them, the same way it pairs name/pluralName and layout/resolvedLayout.
 */
describe('mapKeys — createdInContext pairing', () => {

	it('adds the locator whenever the context key is requested', () => {
		const keys = UtilSubscription.mapKeys({ idField: 'id', keys: [ 'name', 'createdInContext' ] });

		expect(keys).toContain('createdInContextRef');
	});

	it('does not add the locator when the context key is absent', () => {
		const keys = UtilSubscription.mapKeys({ idField: 'id', keys: [ 'name', 'lastModifiedDate' ] });

		expect(keys).not.toContain('createdInContextRef');
	});

	it('keeps the existing companion pairings intact', () => {
		const keys = UtilSubscription.mapKeys({ idField: 'id', keys: [ 'name', 'layout', 'createdInContext' ] });

		expect(keys).toEqual(expect.arrayContaining([ 'id', 'pluralName', 'resolvedLayout', 'createdInContextRef' ]));
	});

});
