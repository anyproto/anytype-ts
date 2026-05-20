import { describe, it, expect } from 'vitest';
import Sort from './sort';
import * as I from 'Interface';

describe('Sort', () => {

	describe('constructor', () => {
		it('should set basic properties', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
				type: I.SortType.Asc,
			} as I.Sort);

			expect(sort.id).toBe('s1');
			expect(sort.relationKey).toBe('name');
			expect(sort.type).toBe(I.SortType.Asc);
		});

		it('should default to Asc sort type', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
			} as I.Sort);

			expect(sort.type).toBe(I.SortType.Asc);
		});

		it('should handle Desc sort type', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
				type: I.SortType.Desc,
			} as I.Sort);

			expect(sort.type).toBe(I.SortType.Desc);
		});

		it('should default customOrder to empty array', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
				type: I.SortType.Asc,
			} as I.Sort);

			expect(sort.customOrder).toEqual([]);
		});

		it('should preserve customOrder array', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
				type: I.SortType.Custom,
				customOrder: ['a', 'b', 'c'],
			} as I.Sort);

			expect(sort.customOrder).toEqual(['a', 'b', 'c']);
		});

		it('should coerce non-array customOrder to empty array', () => {
			const sort = new Sort({
				id: 's1',
				relationKey: 'name',
				type: I.SortType.Asc,
				customOrder: 'invalid' as any,
			} as I.Sort);

			expect(sort.customOrder).toEqual([]);
		});

		it('should coerce string id to string', () => {
			const sort = new Sort({
				id: 42 as any,
				relationKey: 'name',
				type: I.SortType.Asc,
			} as I.Sort);

			expect(sort.id).toBe('42');
		});
	});

});
