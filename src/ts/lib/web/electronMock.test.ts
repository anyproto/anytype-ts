import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ElectronMock tab session', () => {

	let storage: Map<string, string>;

	beforeEach(() => {
		storage = new Map();
		vi.resetModules();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage.get(key) || null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
		});
		vi.stubGlobal('navigator', {
			languages: [ 'en-US' ],
			platform: 'Linux',
			userAgent: 'Vitest',
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('keeps the session token separate from persisted tab data', async () => {
		const { electronMock } = await import('./electronMock');
		const tabId = electronMock.tabId();

		await electronMock.Api(1, 'updateTab', [ tabId, { route: '/main/object/test', token: 'session-token' } ]);

		const tab = await electronMock.Api(1, 'getTab', [ tabId ]);
		const tabs = await electronMock.Api(1, 'getTabs');

		expect(tab).toEqual({
			id: tabId,
			data: { route: '/main/object/test' },
			token: 'session-token',
		});
		expect(tabs.tabs[0].data).not.toHaveProperty('token');
	});

});
