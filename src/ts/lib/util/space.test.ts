import { describe, it, expect, beforeEach, vi } from 'vitest';
import UtilSpace from './space';
import Storage from '../storage';

/**
 * Regression coverage for JS-9815 (read side).
 *
 * `getLastObject()` used to blindly stamp the current space onto whatever id was
 * stored, with no check that the object belonged to that space — so a polluted
 * bucket produced an `ObjectOpen(oldObjectId, newSpaceId)` and a hard
 * "build tree: tree does not exist" error instead of a graceful fallback.
 *
 * The fix records the object's space alongside the id and rejects entries whose
 * space does not match the current one.
 */
describe('UtilSpace.getLastObject (per-space validation)', () => {

	let store: Record<string, string>;

	beforeEach(() => {
		store = {};

		vi.stubGlobal('localStorage', {
			getItem: (k: string) => (k in store ? store[k] : null),
			setItem: (k: string, v: string) => { store[k] = v; },
			removeItem: (k: string) => { delete store[k]; },
		});

		vi.stubGlobal('U', { Common: { getElectron: () => ({}) } });
		vi.stubGlobal('S', { Common: { space: '' }, Auth: { account: null } });

		Storage.set('space', {}, true);
	});

	it('returns the last object stamped with the current space', () => {
		(globalThis as any).S.Common.space = 'spaceA';
		Storage.setLastOpened({ id: 'objA', layout: 0, spaceId: 'spaceA' }, 'spaceA');

		const home = UtilSpace.getLastObject();

		expect(home).not.toBeNull();
		expect(home.id).toBe('objA');
		expect(home.spaceId).toBe('spaceA');
	});

	it('rejects an entry that belongs to a different space (no stale open)', () => {
		// Current space is spaceA, but its bucket holds an object from spaceZ (pollution).
		(globalThis as any).S.Common.space = 'spaceA';
		Storage.setLastOpened({ id: 'objZ', layout: 0, spaceId: 'spaceZ' }, 'spaceA');

		expect(UtilSpace.getLastObject()).toBeNull();
	});

	it('returns null when nothing was opened in the space', () => {
		(globalThis as any).S.Common.space = 'spaceEmpty';

		expect(UtilSpace.getLastObject()).toBeNull();
	});

});
