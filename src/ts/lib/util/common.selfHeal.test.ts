import { describe, it, expect, beforeEach, vi } from 'vitest';
import UtilCommon from './common';
import Storage from '../storage';

/**
 * Regression coverage for the JS-9815 self-heal in `checkErrorOnOpen`.
 *
 * When opening an object fails, a STALE last-opened entry for the current space
 * (a legacy entry without a spaceId, or one belonging to another space) is cleared
 * so switching back does not keep replaying the bad open. A VALID same-space entry
 * is kept — a transient open failure must not drop the user's restore point.
 */
describe('UtilCommon.checkErrorOnOpen self-heal', () => {

	const CODE = 1; // generic error code, e.g. "build tree: tree does not exist"
	let store: Record<string, string>;

	beforeEach(() => {
		store = {};

		vi.stubGlobal('localStorage', {
			getItem: (k: string) => (k in store ? store[k] : null),
			setItem: (k: string, v: string) => { store[k] = v; },
			removeItem: (k: string) => { delete store[k]; },
		});

		vi.stubGlobal('U', { Common: { getElectron: () => ({}) } });
		vi.stubGlobal('translate', (k: string) => k);
		vi.stubGlobal('J', { Error: { Code: {
			ANYTYPE_NEEDS_UPGRADE: 10,
			ANOTHER_ANYTYPE_PROCESS_IS_RUNNING: 108,
			PROTOCOL_NEEDS_UPGRADE: 110,
		} } });
		vi.stubGlobal('S', {
			Common: { space: 'spaceA' },
			Auth: { account: null },
			Popup: { open: vi.fn() },
		});

		Storage.set('space', {}, true);
	});

	it('clears a legacy (no-spaceId) entry whose id matches the failed object', () => {
		Storage.setLastOpened({ id: 'objBad', layout: 0 }, 'spaceA');

		UtilCommon.checkErrorOnOpen('objBad', CODE);

		expect(Storage.getLastOpened('spaceA').id).toBeUndefined();
	});

	it('keeps a valid same-space entry on a transient failure', () => {
		Storage.setLastOpened({ id: 'objGood', layout: 0, spaceId: 'spaceA' }, 'spaceA');

		UtilCommon.checkErrorOnOpen('objGood', CODE);

		expect(Storage.getLastOpened('spaceA').id).toBe('objGood');
	});

	it('does not touch the entry when the failed id differs', () => {
		Storage.setLastOpened({ id: 'objGood', layout: 0 }, 'spaceA');

		UtilCommon.checkErrorOnOpen('objOther', CODE);

		expect(Storage.getLastOpened('spaceA').id).toBe('objGood');
	});

});
