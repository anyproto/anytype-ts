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

	// Legacy entries (written before the fix) have no spaceId. They live in the
	// correct space bucket, so they are still trusted for backward compat — and the
	// self-heal in checkErrorOnOpen recovers the rare poisoned legacy entry.
	it('accepts a legacy entry that has no spaceId field', () => {
		(globalThis as any).S.Common.space = 'spaceA';
		Storage.setLastOpened({ id: 'objLegacy', layout: 0 }, 'spaceA');

		const home = UtilSpace.getLastObject();

		expect(home).not.toBeNull();
		expect(home.id).toBe('objLegacy');
		expect(home.spaceId).toBe('spaceA');
	});

});

/**
 * Regression coverage for the chat last-opened regression (JS-9821 follow-up).
 *
 * The space's last-opened object is recorded in exactly one place. Chat-layout
 * objects skip ObjectOpen (JS-9821), so they must record themselves via this
 * shared helper — otherwise switching spaces and back reopens the previously
 * opened page instead of the chat. These cover the recording rules and per-space
 * keying (extracted from the previously inline ObjectOpen condition).
 */
describe('UtilSpace.setLastObject (per-space recording)', () => {

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
		vi.stubGlobal('keyboard', { isPopup: () => false });

		Storage.set('space', {}, true);
	});

	it('records the object keyed by its own space', () => {
		(globalThis as any).S.Common.space = 'spaceA';
		UtilSpace.setLastObject({ id: 'chatA', layout: 22, spaceId: 'spaceA' }); // 22 = Chat

		const stored = Storage.getLastOpened('spaceA');
		expect(stored.id).toBe('chatA');
		expect(stored.spaceId).toBe('spaceA');
		expect(stored.layout).toBe(22);
	});

	it('falls back to the current space when the object has no spaceId', () => {
		(globalThis as any).S.Common.space = 'spaceB';
		UtilSpace.setLastObject({ id: 'chatB', layout: 22 });

		expect(Storage.getLastOpened('spaceB').id).toBe('chatB');
	});

	it('prefers an explicit spaceId arg over the current space', () => {
		(globalThis as any).S.Common.space = 'spaceCurrent';
		UtilSpace.setLastObject({ id: 'chatC', layout: 22 }, 'spaceTarget');

		expect(Storage.getLastOpened('spaceTarget').id).toBe('chatC');
		expect(Storage.getLastOpened('spaceCurrent').id).toBeUndefined();
	});

	it('does not record the Dashboard/home layout', () => {
		(globalThis as any).S.Common.space = 'spaceD';
		UtilSpace.setLastObject({ id: 'home', layout: 7, spaceId: 'spaceD' }); // 7 = Dashboard

		expect(Storage.getLastOpened('spaceD').id).toBeUndefined();
	});

	it('does not record when opened in a popup', () => {
		(globalThis as any).keyboard.isPopup = () => true;
		(globalThis as any).S.Common.space = 'spaceE';
		UtilSpace.setLastObject({ id: 'chatE', layout: 22, spaceId: 'spaceE' });

		expect(Storage.getLastOpened('spaceE').id).toBeUndefined();
	});

	it('does not record an empty object', () => {
		(globalThis as any).S.Common.space = 'spaceF';
		UtilSpace.setLastObject({ _empty_: true, id: 'x', layout: 22, spaceId: 'spaceF' });

		expect(Storage.getLastOpened('spaceF').id).toBeUndefined();
	});

});
