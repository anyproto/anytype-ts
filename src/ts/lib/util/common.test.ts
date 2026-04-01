import { describe, it, expect } from 'vitest';

describe('UtilCommon', () => {

	describe('objectCopy', () => {
		it('should deep copy an object', () => {
			const original = { a: 1, b: { c: 2 } };
			const copy = U.Common.objectCopy(original);

			expect(copy).toEqual(original);
			expect(copy).not.toBe(original);
			expect(copy.b).not.toBe(original.b);
		});

		it('should deep copy an array', () => {
			const original = [1, 2, { a: 3 }];
			const copy = U.Common.objectCopy(original);

			expect(copy).toEqual(original);
			expect(copy).not.toBe(original);
		});

		it('should handle undefined by returning empty object', () => {
			const copy = U.Common.objectCopy(undefined);

			expect(copy).toEqual({});
		});
	});

	describe('objectLength', () => {
		it('should return length for arrays', () => {
			expect(U.Common.objectLength([1, 2, 3])).toBe(3);
		});

		it('should return key count for objects', () => {
			expect(U.Common.objectLength({ a: 1, b: 2 })).toBe(2);
		});

		it('should return 0 for empty object', () => {
			expect(U.Common.objectLength({})).toBe(0);
		});

		it('should return 0 for null/undefined', () => {
			expect(U.Common.objectLength(null)).toBe(0);
			expect(U.Common.objectLength(undefined)).toBe(0);
		});
	});

	describe('objectCompare', () => {
		it('should return true for equal objects', () => {
			expect(U.Common.objectCompare({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
		});

		it('should return false for different values', () => {
			expect(U.Common.objectCompare({ a: 1 }, { a: 2 })).toBe(false);
		});

		it('should return false for different key counts', () => {
			expect(U.Common.objectCompare({ a: 1 }, { a: 1, b: 2 })).toBe(false);
		});

		it('should deeply compare nested objects', () => {
			expect(U.Common.objectCompare({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
			expect(U.Common.objectCompare({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
		});

		it('should handle null inputs', () => {
			expect(U.Common.objectCompare(null, null)).toBe(true);
			expect(U.Common.objectCompare(null, { a: 1 })).toBe(false);
		});
	});

	describe('compareJSON', () => {
		it('should return true for identical JSON', () => {
			expect(U.Common.compareJSON({ a: 1 }, { a: 1 })).toBe(true);
		});

		it('should return false for different JSON', () => {
			expect(U.Common.compareJSON({ a: 1 }, { a: 2 })).toBe(false);
		});

		it('should be sensitive to key order', () => {
			// JSON.stringify is order-dependent
			expect(U.Common.compareJSON({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(false);
		});
	});

	describe('hasProperty', () => {
		it('should return true for own property', () => {
			expect(U.Common.hasProperty({ a: 1 }, 'a')).toBe(true);
		});

		it('should return false for missing property', () => {
			expect(U.Common.hasProperty({ a: 1 }, 'b')).toBe(false);
		});

		it('should return false for prototype property', () => {
			expect(U.Common.hasProperty({}, 'toString')).toBe(false);
		});

		it('should handle null/undefined', () => {
			expect(U.Common.hasProperty(null, 'a')).toBe(false);
			expect(U.Common.hasProperty(undefined, 'a')).toBe(false);
		});
	});

	describe('getKeyByValue', () => {
		it('should find key by value', () => {
			expect(U.Common.getKeyByValue({ a: 1, b: 2, c: 3 }, 2)).toBe('b');
		});

		it('should return undefined for missing value', () => {
			expect(U.Common.getKeyByValue({ a: 1 }, 99)).toBeUndefined();
		});

		it('should handle null object', () => {
			expect(U.Common.getKeyByValue(null, 1)).toBeUndefined();
		});
	});

	describe('arrayUnique', () => {
		it('should remove duplicates from number array', () => {
			expect(U.Common.arrayUnique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
		});

		it('should remove duplicates from string array', () => {
			expect(U.Common.arrayUnique(['a', 'b', 'a'])).toEqual(['a', 'b']);
		});

		it('should return same array for single element', () => {
			const arr = [1];

			expect(U.Common.arrayUnique(arr)).toBe(arr);
		});

		it('should return same array for empty array', () => {
			const arr: any[] = [];

			expect(U.Common.arrayUnique(arr)).toBe(arr);
		});
	});

	describe('mapToArray', () => {
		it('should group items by field', () => {
			const items = [
				{ type: 'a', value: 1 },
				{ type: 'b', value: 2 },
				{ type: 'a', value: 3 },
			];

			const map = U.Common.mapToArray(items, 'type');

			expect(map['a']).toHaveLength(2);
			expect(map['b']).toHaveLength(1);
			expect(map['a'][0].value).toBe(1);
			expect(map['a'][1].value).toBe(3);
		});

		it('should handle empty array', () => {
			const map = U.Common.mapToArray([], 'type');

			expect(Object.keys(map)).toHaveLength(0);
		});

		it('should handle null input', () => {
			const map = U.Common.mapToArray(null as any, 'type');

			expect(Object.keys(map)).toHaveLength(0);
		});
	});

	describe('unmap', () => {
		it('should flatten grouped map back to array', () => {
			const map = {
				a: [{ type: 'a', value: 1 }, { type: 'a', value: 3 }],
				b: [{ type: 'b', value: 2 }],
			};

			const result = U.Common.unmap(map);

			expect(result).toHaveLength(3);
		});

		it('should handle empty map', () => {
			expect(U.Common.unmap({})).toEqual([]);
		});
	});

	describe('formatNumber', () => {
		it('should format a number to string', () => {
			expect(typeof U.Common.formatNumber(42)).toBe('string');
		});
	});

});
