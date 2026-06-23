import { describe, it, expect, beforeEach, vi } from 'vitest';
import Storage from './storage';

/**
 * Regression coverage for JS-9815.
 *
 * `lastOpenedSimple` is a space-scoped storage key. The bug was that both the
 * read and the write resolved the bucket from the globally-mutable `S.Common.space`
 * at call time. A late `ObjectOpen` response from a previous space — arriving after
 * the user already switched — wrote that previous object into the NEW space's bucket,
 * so the next space switch tried to open `oldObjectId` in `newSpaceId`
 * ("build tree: tree does not exist").
 *
 * The fix lets the caller pass the spaceId the object actually belongs to, so the
 * write lands in the correct bucket regardless of the globally-current space.
 *
 * These tests stub the minimal globals that `storage.ts` relies on, because the
 * vitest harness does not run the AutoImport plugin that injects `S`/`U` in the app.
 */
describe('Storage last-opened (per-space isolation)', () => {

	let store: Record<string, string>;

	beforeEach(() => {
		store = {};

		vi.stubGlobal('localStorage', {
			getItem: (k: string) => (k in store ? store[k] : null),
			setItem: (k: string, v: string) => { store[k] = v; },
			removeItem: (k: string) => { delete store[k]; },
		});

		// No electron store -> storage falls back to localStorage.
		vi.stubGlobal('U', { Common: { getElectron: () => ({}) } });
		vi.stubGlobal('S', { Common: { space: '' }, Auth: { account: null } });

		// Reset the space bucket map in both the localStorage mock and the module cache.
		Storage.set('space', {}, true);
	});

	it('reads/writes the bucket of the explicit space, isolated across spaces', () => {
		Storage.setLastOpened({ id: 'objA', layout: 0 }, 'spaceA');
		Storage.setLastOpened({ id: 'objB', layout: 0 }, 'spaceB');

		expect(Storage.getLastOpened('spaceA').id).toBe('objA');
		expect(Storage.getLastOpened('spaceB').id).toBe('objB');
	});

	it('writes to the object\'s space, not the globally-current space (race guard)', () => {
		// User has already switched to spaceB...
		(globalThis as any).S.Common.space = 'spaceB';

		// ...when a late ObjectOpen response from spaceA lands.
		Storage.setLastOpened({ id: 'objA', layout: 0 }, 'spaceA');

		// spaceB's bucket must NOT be polluted with spaceA's object.
		expect(Storage.getLastOpened('spaceB').id).toBeUndefined();
		expect(Storage.getLastOpened('spaceA').id).toBe('objA');
	});

	it('falls back to the current space when no spaceId is passed', () => {
		(globalThis as any).S.Common.space = 'spaceA';

		Storage.setLastOpened({ id: 'objA', layout: 0 });

		expect(Storage.getLastOpened().id).toBe('objA');
		expect(Storage.getLastOpened('spaceA').id).toBe('objA');
	});

});
