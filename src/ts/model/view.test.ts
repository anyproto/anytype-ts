import { describe, it, expect } from 'vitest';
import View from './view';
import * as I from 'Interface';

const makeView = (overrides: Partial<I.View> = {}): View => {
	return new View({
		id: 'test-view',
		name: 'Test View',
		type: I.ViewType.Grid,
		coverRelationKey: '',
		coverFit: false,
		cardSize: I.CardSize.Small,
		listSize: I.ListSize.Compact,
		hideIcon: false,
		groupRelationKey: '',
		endRelationKey: '',
		groupBackgroundColors: false,
		wrapContent: false,
		pageLimit: 0,
		defaultTemplateId: '',
		defaultTypeId: '',
		sorts: [],
		filters: [],
		relations: [],
		...overrides,
	} as I.View);
};

describe('View', () => {

	describe('constructor', () => {
		it('should set id and name', () => {
			const view = makeView({ id: 'v1', name: 'My View' });

			expect(view.id).toBe('v1');
			expect(view.name).toBe('My View');
		});

		it('should default to Grid type', () => {
			const view = makeView();

			expect(view.type).toBe(I.ViewType.Grid);
		});

		it('should set boolean properties', () => {
			const view = makeView({ hideIcon: true, coverFit: true });

			expect(view.hideIcon).toBe(true);
			expect(view.coverFit).toBe(true);
		});

		it('should handle empty arrays for filters/sorts/relations', () => {
			const view = makeView();

			expect(view.filters).toEqual([]);
			expect(view.sorts).toEqual([]);
			expect(view.relations).toEqual([]);
		});
	});

	describe('type checks', () => {
		it('isGrid should return true for Grid type', () => {
			const view = makeView({ type: I.ViewType.Grid });

			expect(view.isGrid()).toBe(true);
			expect(view.isList()).toBe(false);
		});

		it('isList should return true for List type', () => {
			const view = makeView({ type: I.ViewType.List });

			expect(view.isList()).toBe(true);
		});

		it('isGallery should return true for Gallery type', () => {
			const view = makeView({ type: I.ViewType.Gallery });

			expect(view.isGallery()).toBe(true);
		});

		it('isBoard should return true for Board type', () => {
			const view = makeView({ type: I.ViewType.Board });

			expect(view.isBoard()).toBe(true);
		});

		it('isBoard should return false for non-Board type', () => {
			const view = makeView({ type: I.ViewType.Grid });

			expect(view.isBoard()).toBe(false);
		});
	});

	describe('getRelation', () => {
		it('should find relation by key', () => {
			const view = makeView({
				relations: [
					{ relationKey: 'name', isVisible: true },
					{ relationKey: 'type', isVisible: false },
				],
			});

			const rel = view.getRelation('name');

			expect(rel).toBeDefined();
			expect(rel.relationKey).toBe('name');
		});

		it('should return undefined for missing relation', () => {
			const view = makeView({ relations: [] });

			expect(view.getRelation('missing')).toBeUndefined();
		});
	});

	describe('getFilter', () => {
		it('should find filter by id', () => {
			const view = makeView({
				filters: [
					{ id: 'f1', relationKey: 'name', condition: 0, value: '' },
					{ id: 'f2', relationKey: 'type', condition: 0, value: '' },
				],
			});

			const filter = view.getFilter('f1');

			expect(filter).toBeDefined();
			expect(filter.id).toBe('f1');
		});
	});

	describe('getSort', () => {
		it('should find sort by id', () => {
			const view = makeView({
				sorts: [
					{ id: 's1', relationKey: 'name', type: I.SortType.Asc },
				],
			});

			const sort = view.getSort('s1');

			expect(sort).toBeDefined();
			expect(sort.id).toBe('s1');
		});
	});

});
