import { describe, it, expect } from 'vitest';
import { getTopLevelIds } from './blockSelection';

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
