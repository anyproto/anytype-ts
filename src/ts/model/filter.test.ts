import { describe, it, expect } from 'vitest';
import Filter from './filter';
import * as I from 'Interface';

describe('Filter', () => {

	describe('constructor', () => {
		it('should set basic properties', () => {
			const filter = new Filter({
				id: 'f1',
				relationKey: 'name',
				condition: I.FilterCondition.Equal,
				value: 'test',
			} as I.Filter);

			expect(filter.id).toBe('f1');
			expect(filter.relationKey).toBe('name');
			expect(filter.condition).toBe(I.FilterCondition.Equal);
			expect(filter.value).toBe('test');
		});

		it('should set default operator', () => {
			const filter = new Filter({
				id: 'f1',
				relationKey: 'name',
				condition: I.FilterCondition.None,
				value: '',
			} as I.Filter);

			expect(filter.operator).toBe(I.FilterOperator.None);
		});

		it('should set default quickOption', () => {
			const filter = new Filter({
				id: 'f1',
				relationKey: 'name',
				condition: I.FilterCondition.None,
				value: '',
			} as I.Filter);

			expect(filter.quickOption).toBe(I.FilterQuickOption.ExactDate);
		});

		it('should handle empty nestedFilters', () => {
			const filter = new Filter({
				id: 'f1',
				relationKey: 'name',
				condition: I.FilterCondition.None,
				value: '',
			} as I.Filter);

			expect(filter.nestedFilters).toEqual([]);
		});

		it('should recursively construct nested filters', () => {
			const filter = new Filter({
				id: 'f1',
				relationKey: 'name',
				condition: I.FilterCondition.Equal,
				value: 'test',
				nestedFilters: [
					{ id: 'f2', relationKey: 'type', condition: I.FilterCondition.NotEqual, value: 'note' },
				],
			} as I.Filter);

			expect(filter.nestedFilters).toHaveLength(1);
			expect(filter.nestedFilters[0].id).toBe('f2');
			expect(filter.nestedFilters[0]).toBeInstanceOf(Filter);
		});

		it('should coerce string id to string', () => {
			const filter = new Filter({
				id: 123 as any,
				relationKey: 'name',
				condition: I.FilterCondition.None,
				value: '',
			} as I.Filter);

			expect(filter.id).toBe('123');
		});
	});

});
