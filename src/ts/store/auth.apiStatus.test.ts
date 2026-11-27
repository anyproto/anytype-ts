import { describe, test, expect, vi, beforeEach } from 'vitest';

const stored: Record<string, any> = {};

vi.mock('Lib/storage', () => ({
	default: {
		get: (key: string) => stored[key],
		set: (key: string, value: any) => { stored[key] = value; },
	},
}));

import { Auth } from './auth';

describe('Local API status after a window reload', () => {
	beforeEach(() => {
		for (const k of Object.keys(stored)) {
			delete stored[k];
		};
		Auth.jsonApiStatusItem = undefined;
	});

	test('a reloaded window (no status event yet) takes the last bind outcome of this run', () => {
		stored.localApiBind = { addr: '127.0.0.1:31009', success: true };
		expect(Auth.jsonApiStatus).toEqual({ success: true, listenAddr: '127.0.0.1:31009', error: '' });
	});

	test('nothing shared yet (a new app start, main cleared it): unknown, as before', () => {
		expect(Auth.jsonApiStatus).toBeNull();
	});

	test('H12: a failed bind with no address keeps its reason after a reload; a cleared status restores null', () => {
		Auth.jsonApiStatusSet({ success: false, listenAddr: '', error: 'address in use' });
		Auth.jsonApiStatusItem = undefined;
		expect(Auth.jsonApiStatus).toEqual({ success: false, listenAddr: '', error: 'address in use' });

		Auth.jsonApiStatusSet(null);
		Auth.jsonApiStatusItem = undefined;
		expect(stored.localApiBind).toBeNull();
		expect(Auth.jsonApiStatus).toBeNull();
	});

	test('a status this window has seen wins, null (disabled) included, and is shared for the next reload', () => {
		stored.localApiBind = { addr: '127.0.0.1:31009', success: true };
		Auth.jsonApiStatusSet(null);
		expect(Auth.jsonApiStatus).toBeNull();
		expect(stored.localApiBind).toBeNull();

		Auth.jsonApiStatusSet({ success: true, listenAddr: '127.0.0.1:31010', error: '' });
		expect(Auth.jsonApiStatus?.listenAddr).toBe('127.0.0.1:31010');
		expect(stored.localApiBind).toEqual({ addr: '127.0.0.1:31010', success: true, error: '' });
	});
});
