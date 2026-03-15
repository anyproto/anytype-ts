import { describe, it, expect, beforeEach } from 'vitest';
import { history } from './history';

describe('History', () => {

	beforeEach(() => {
		history.clear();
	});

	describe('push', () => {
		it('should add a route to the list', () => {
			history.push('/page/one');

			expect(history.list).toEqual(['/page/one']);
			expect(history.index).toBe(0);
		});

		it('should not add duplicate consecutive routes', () => {
			history.push('/page/one');
			history.push('/page/one');

			expect(history.list).toEqual(['/page/one']);
			expect(history.index).toBe(0);
		});

		it('should add different routes', () => {
			history.push('/page/one');
			history.push('/page/two');

			expect(history.list).toEqual(['/page/one', '/page/two']);
			expect(history.index).toBe(1);
		});

		it('should truncate forward history when pushing from middle', () => {
			history.push('/page/one');
			history.push('/page/two');
			history.push('/page/three');
			history.index = 1; // Go back to /page/two
			history.push('/page/four');

			expect(history.list).toEqual(['/page/one', '/page/two', '/page/four']);
			expect(history.index).toBe(2);
		});
	});

	describe('build', () => {
		it('should build route from match object', () => {
			const match = { params: { page: 'main', action: 'edit', id: '123' } };

			expect(history.build(match)).toBe('main/edit/123');
		});

		it('should handle empty match', () => {
			expect(history.build({})).toBe('//');
		});

		it('should handle null match', () => {
			expect(history.build(null)).toBe('//');
		});
	});

	describe('checkBack', () => {
		it('should return false when at beginning', () => {
			history.push('/page/one');

			expect(history.checkBack()).toBe(false);
		});

		it('should return true when not at beginning', () => {
			history.push('/page/one');
			history.push('/page/two');

			expect(history.checkBack()).toBe(true);
		});
	});

	describe('checkForward', () => {
		it('should return false when at end', () => {
			history.push('/page/one');
			history.push('/page/two');

			expect(history.checkForward()).toBe(false);
		});

		it('should return true when not at end', () => {
			history.push('/page/one');
			history.push('/page/two');
			history.index = 0;

			expect(history.checkForward()).toBe(true);
		});
	});

	describe('clear', () => {
		it('should reset list and index', () => {
			history.push('/page/one');
			history.push('/page/two');
			history.clear();

			expect(history.list).toEqual([]);
			expect(history.index).toBe(0);
		});
	});

	describe('goBack', () => {
		it('should decrement index and call callback', () => {
			history.push('/page/one');
			history.push('/page/two');

			let called = false;
			history.goBack((match) => {
				called = true;
				expect(match.route).toBe('/page/one');
			});

			expect(called).toBe(true);
			expect(history.index).toBe(0);
		});

		it('should not go back past beginning', () => {
			history.push('/page/one');

			let called = false;
			history.goBack(() => { called = true; });

			expect(called).toBe(false);
			expect(history.index).toBe(0);
		});
	});

	describe('goForward', () => {
		it('should increment index and call callback', () => {
			history.push('/page/one');
			history.push('/page/two');
			history.index = 0;

			let called = false;
			history.goForward((match) => {
				called = true;
				expect(match.route).toBe('/page/two');
			});

			expect(called).toBe(true);
			expect(history.index).toBe(1);
		});

		it('should not go forward past end', () => {
			history.push('/page/one');

			let called = false;
			history.goForward(() => { called = true; });

			expect(called).toBe(false);
		});
	});

});
