import { describe, it, expect } from 'vitest';
import * as I from 'Interface';
import Dataview from './dataview';

/**
 * Regression coverage for JS-9842 "Editing filter on inline collection crashes".
 *
 * A corrupt filter persisted with an empty relationKey and operator None survived
 * getFilteredFilters (the `it.relationKey ? ... : true` branch let it through), so the
 * filter menu resolved `relation: null` and crashed on `item.relation.relationKey`
 * in Component/menu/dataview/filter/list.tsx.
 *
 * Advanced (And/Or) filters legitimately carry an empty relationKey and must survive.
 */

const relations: any = {
	name: { relationKey: 'name', isDeleted: false, isArchived: false },
	deletedKey: { relationKey: 'deletedKey', isDeleted: true, isArchived: false },
	archivedKey: { relationKey: 'archivedKey', isDeleted: false, isArchived: true },
};

(globalThis as any).S = {
	Record: {
		getRelationByKey: (relationKey: string) => relations[relationKey] || null,
	},
};

describe('Dataview.getFilteredFilters', () => {

	it('should keep a filter with a resolvable relation', () => {
		const filters: any = [ { id: 'f1', relationKey: 'name', operator: I.FilterOperator.None } ];

		expect(Dataview.getFilteredFilters(filters)).toEqual(filters);
	});

	it('should drop filters with deleted or archived relations', () => {
		const filters: any = [
			{ id: 'f1', relationKey: 'deletedKey', operator: I.FilterOperator.None },
			{ id: 'f2', relationKey: 'archivedKey', operator: I.FilterOperator.None },
		];

		expect(Dataview.getFilteredFilters(filters)).toEqual([]);
	});

	it('should drop a filter with an unresolvable relation', () => {
		const filters: any = [ { id: 'f1', relationKey: 'missingKey', operator: I.FilterOperator.None } ];

		expect(Dataview.getFilteredFilters(filters)).toEqual([]);
	});

	it('should drop a corrupt filter with an empty relationKey and operator None', () => {
		const filters: any = [
			{ id: 'f1', relationKey: '', operator: I.FilterOperator.None },
			{ id: 'f2', relationKey: 'name', operator: I.FilterOperator.None },
		];

		expect(Dataview.getFilteredFilters(filters)).toEqual([ filters[1] ]);
	});

	it('should drop a filter with a missing relationKey and operator None', () => {
		const filters: any = [ { id: 'f1', operator: I.FilterOperator.None } ];

		expect(Dataview.getFilteredFilters(filters)).toEqual([]);
	});

	it('should keep advanced filters with an empty relationKey', () => {
		const filters: any = [
			{
				id: 'f1',
				relationKey: '',
				operator: I.FilterOperator.And,
				nestedFilters: [ { id: 'n1', relationKey: 'name', operator: I.FilterOperator.None } ],
			},
			{ id: 'f2', relationKey: '', operator: I.FilterOperator.Or, nestedFilters: [] },
		];

		expect(Dataview.getFilteredFilters(filters)).toEqual(filters);
	});

	it('should not touch nested filters inside advanced groups', () => {
		const filters: any = [
			{
				id: 'f1',
				relationKey: '',
				operator: I.FilterOperator.And,
				nestedFilters: [
					{ id: 'n1', relationKey: '', operator: I.FilterOperator.None },
					{ id: 'n2', relationKey: 'deletedKey', operator: I.FilterOperator.None },
				],
			},
		];

		expect(Dataview.getFilteredFilters(filters)).toEqual(filters);
	});

	it('should handle empty input', () => {
		expect(Dataview.getFilteredFilters(null as any)).toEqual([]);
		expect(Dataview.getFilteredFilters(undefined as any)).toEqual([]);
		expect(Dataview.getFilteredFilters([])).toEqual([]);
	});

});

describe('Dataview.getFilteredSorts', () => {

	it('should keep a sort with a resolvable relation', () => {
		const sorts: any = [ { id: 's1', relationKey: 'name' } ];

		expect(Dataview.getFilteredSorts(sorts)).toEqual(sorts);
	});

	it('should drop sorts with empty, missing or deleted relations', () => {
		const sorts: any = [
			{ id: 's1', relationKey: '' },
			{ id: 's2' },
			{ id: 's3', relationKey: 'deletedKey' },
		];

		expect(Dataview.getFilteredSorts(sorts)).toEqual([]);
	});

	it('should not throw on null entries', () => {
		const sorts: any = [ null, { id: 's1', relationKey: 'name' } ];

		expect(Dataview.getFilteredSorts(sorts)).toEqual([ sorts[1] ]);
	});

	it('should handle empty input', () => {
		expect(Dataview.getFilteredSorts(null as any)).toEqual([]);
	});

});
