import { describe, it, expect } from 'vitest';
import { getTopLevelIds, getIndentTargetId } from './blockSelection';

// parentOf helper built from a flat { child: parent } map
const parentOf = (map: any) => (id: string) => String(map[id] || '');

describe('getTopLevelIds', () => {

	it('keeps a flat list of siblings untouched and in order', () => {
		const map = { a: 'root', b: 'root', c: 'root' };

		expect(getTopLevelIds([ 'a', 'b', 'c' ], parentOf(map))).toEqual([ 'a', 'b', 'c' ]);
	});

	it('drops children whose parent is in the list', () => {
		// a
		//   a1
		//   a2
		// b
		const map = { a: 'root', a1: 'a', a2: 'a', b: 'root' };

		expect(getTopLevelIds([ 'a', 'a1', 'a2', 'b' ], parentOf(map))).toEqual([ 'a', 'b' ]);
	});

	it('drops deeply nested descendants, not just direct children', () => {
		const map = { a: 'root', a1: 'a', a11: 'a1', a111: 'a11' };

		expect(getTopLevelIds([ 'a', 'a1', 'a11', 'a111' ], parentOf(map))).toEqual([ 'a' ]);
	});

	it('keeps a child when its parent is not selected', () => {
		const map = { a: 'root', a1: 'a', b: 'root' };

		expect(getTopLevelIds([ 'a1', 'b' ], parentOf(map))).toEqual([ 'a1', 'b' ]);
	});

	it('keeps an intermediate node when only its grandparent is missing', () => {
		const map = { a: 'root', a1: 'a', a11: 'a1' };

		expect(getTopLevelIds([ 'a1', 'a11' ], parentOf(map))).toEqual([ 'a1' ]);
	});

	it('removes duplicates and preserves first occurrence order', () => {
		const map = { a: 'root', b: 'root' };

		expect(getTopLevelIds([ 'b', 'a', 'b' ], parentOf(map))).toEqual([ 'b', 'a' ]);
	});

	it('returns an empty list for empty input', () => {
		expect(getTopLevelIds([], parentOf({}))).toEqual([]);
	});

	it('ignores empty ids', () => {
		expect(getTopLevelIds([ '', 'a' ], parentOf({ a: 'root' }))).toEqual([ 'a' ]);
	});

	it('does not hang on a cyclic parent chain', () => {
		const map = { a: 'b', b: 'a', c: 'root' };

		expect(getTopLevelIds([ 'a', 'c' ], parentOf(map))).toEqual([ 'a', 'c' ]);
	});

});

describe('getIndentTargetId', () => {

	it('returns the previous sibling for a middle child', () => {
		expect(getIndentTargetId([ 'a', 'b', 'c' ], 'b')).toEqual('a');
	});

	it('returns the previous sibling for the last child', () => {
		expect(getIndentTargetId([ 'a', 'b', 'c' ], 'c')).toEqual('b');
	});

	// JS-9844: a first child has no previous sibling, so Tab must do nothing.
	// Falling back to the previous block in document order resolved to the parent,
	// and re-inserting into the parent the blocks already sat in appended them at its end.
	it('returns nothing for a first child', () => {
		expect(getIndentTargetId([ 'a', 'b', 'c' ], 'a')).toEqual('');
	});

	it('returns nothing for an only child', () => {
		expect(getIndentTargetId([ 'a' ], 'a')).toEqual('');
	});

	it('returns nothing when the block is not among the children', () => {
		expect(getIndentTargetId([ 'a', 'b' ], 'z')).toEqual('');
	});

	it('returns nothing for an empty children list', () => {
		expect(getIndentTargetId([], 'a')).toEqual('');
	});

	it('tolerates a missing children list', () => {
		expect(getIndentTargetId(null, 'a')).toEqual('');
	});

	it('returns nothing when the previous sibling id is empty', () => {
		expect(getIndentTargetId([ '', 'b' ], 'b')).toEqual('');
	});

});
