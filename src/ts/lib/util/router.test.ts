import { describe, it, expect } from 'vitest';
import UtilRouter from './router';

describe('UtilRouter', () => {

	describe('getParam', () => {
		it('should parse basic route with page/action/id', () => {
			const result = UtilRouter.getParam('/main/edit/abc123');

			expect(result.page).toBe('main');
			expect(result.action).toBe('edit');
			expect(result.id).toBe('abc123');
		});

		it('should default page and action to index', () => {
			const result = UtilRouter.getParam('');

			expect(result.page).toBe('index');
			expect(result.action).toBe('index');
			expect(result.id).toBe('');
		});

		it('should parse route with additional key/value pairs', () => {
			const result = UtilRouter.getParam('/main/edit/abc123/spaceId/space1/viewId/view1');

			expect(result.page).toBe('main');
			expect(result.action).toBe('edit');
			expect(result.id).toBe('abc123');
			expect(result.spaceId).toBe('space1');
			expect(result.viewId).toBe('view1');
		});

		it('should handle leading slash', () => {
			const result = UtilRouter.getParam('/auth/login');

			expect(result.page).toBe('auth');
			expect(result.action).toBe('login');
		});

		it('should remap "invite" page to main/invite', () => {
			const result = UtilRouter.getParam('/invite/someId');

			expect(result.page).toBe('main');
			expect(result.action).toBe('invite');
		});

		it('should remap "membership" page to main/membership', () => {
			const result = UtilRouter.getParam('/membership');

			expect(result.page).toBe('main');
			expect(result.action).toBe('membership');
		});

		it('should remap "hi" page to main/oneToOne', () => {
			const result = UtilRouter.getParam('/hi/something');

			expect(result.page).toBe('main');
			expect(result.action).toBe('oneToOne');
		});

		it('should handle null/undefined input', () => {
			const result = UtilRouter.getParam(null as any);

			expect(result.page).toBe('index');
			expect(result.action).toBe('index');
		});

		it('should handle route with only page', () => {
			const result = UtilRouter.getParam('/auth');

			expect(result.page).toBe('auth');
			expect(result.action).toBe('index');
			expect(result.id).toBe('');
		});
	});

	describe('build', () => {
		it('should build a basic route', () => {
			const route = UtilRouter.build({ page: 'main', action: 'edit', id: 'abc123' });

			expect(route).toBe('/main/edit/abc123');
		});

		it('should default page and action to index', () => {
			const route = UtilRouter.build({});

			expect(route).toBe('/index/index/');
		});

		it('should include additional key/value pairs', () => {
			const route = UtilRouter.build({
				page: 'main',
				action: 'edit',
				id: 'abc',
				spaceId: 'space1',
			});

			expect(route).toContain('main');
			expect(route).toContain('edit');
			expect(route).toContain('abc');
			expect(route).toContain('spaceId');
			expect(route).toContain('space1');
		});

		it('should handle additional array', () => {
			const route = UtilRouter.build({
				page: 'main',
				action: 'edit',
				id: 'abc',
				additional: [{ key: 'viewId', value: 'v1' }],
			});

			expect(route).toContain('viewId');
			expect(route).toContain('v1');
		});

		it('should encode URI components', () => {
			const route = UtilRouter.build({ page: 'main', action: 'edit', id: 'id with spaces' });

			expect(route).toContain('id%20with%20spaces');
		});
	});

	describe('getRoute', () => {
		it('should return empty string when no history', () => {
			UtilRouter.history = null;
			expect(UtilRouter.getRoute()).toBe('');
		});

		it('should return pathname from history', () => {
			UtilRouter.history = { location: { pathname: '/main/edit/abc' } };
			expect(UtilRouter.getRoute()).toBe('/main/edit/abc');
		});
	});

	describe('getSearch', () => {
		it('should return empty string when no history', () => {
			UtilRouter.history = null;
			expect(UtilRouter.getSearch()).toBe('');
		});

		it('should return search from history', () => {
			UtilRouter.history = { location: { search: '?q=test' } };
			expect(UtilRouter.getSearch()).toBe('?q=test');
		});
	});

	describe('isDoubleRedirect', () => {
		it('should return true for main/object', () => {
			expect(UtilRouter.isDoubleRedirect('main', 'object')).toBe(true);
		});

		it('should return true for main/invite', () => {
			expect(UtilRouter.isDoubleRedirect('main', 'invite')).toBe(true);
		});

		it('should return true for main/membership', () => {
			expect(UtilRouter.isDoubleRedirect('main', 'membership')).toBe(true);
		});

		it('should return true for main/blank', () => {
			expect(UtilRouter.isDoubleRedirect('main', 'blank')).toBe(true);
		});

		it('should return false for other routes', () => {
			expect(UtilRouter.isDoubleRedirect('main', 'edit')).toBe(false);
			expect(UtilRouter.isDoubleRedirect('auth', 'login')).toBe(false);
		});
	});

	describe('isTripleRedirect', () => {
		it('should return true for main/history', () => {
			expect(UtilRouter.isTripleRedirect('main', 'history')).toBe(true);
		});

		it('should return true for auth/pin-check', () => {
			expect(UtilRouter.isTripleRedirect('auth', 'pin-check')).toBe(true);
		});

		it('should return false for other routes', () => {
			expect(UtilRouter.isTripleRedirect('main', 'edit')).toBe(false);
			expect(UtilRouter.isTripleRedirect('auth', 'login')).toBe(false);
		});
	});

});
