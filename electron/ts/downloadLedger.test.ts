import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	get: vi.fn(),
	set: vi.fn(),
	log: vi.fn(),
}));

vi.mock('electron-json-storage', () => ({
	default: {
		get: mocks.get,
		set: mocks.set,
	},
}));

vi.mock('./util', () => ({ default: { log: mocks.log } }));

import { DownloadLedger } from './downloadLedger';

const stored = (data: any) => mocks.get.mockImplementation((_name: string, cb: any) => cb(null, data));

beforeEach(() => {
	vi.clearAllMocks();
	stored({});
	mocks.set.mockImplementation((_name: string, _data: any, cb: any) => cb?.(null));
});

describe('DownloadLedger', () => {
	test('remembers where an object was downloaded, per destination', async () => {
		const ledger = new DownloadLedger();

		await ledger.set('object', '/downloads', { path: '/downloads/file.pdf', size: 10, mtimeMs: 1 });

		await expect(ledger.get('object', '/downloads')).resolves.toMatchObject({ path: '/downloads/file.pdf', size: 10, mtimeMs: 1 });

		// A different folder is an explicit request for a copy there
		await expect(ledger.get('object', '/desktop')).resolves.toBe(null);
		await expect(ledger.get('other', '/downloads')).resolves.toBe(null);
	});

	test('reads the store once, however many lookups follow', async () => {
		const ledger = new DownloadLedger();

		await ledger.get('a', '/downloads');
		await ledger.get('b', '/downloads');

		expect(mocks.get).toHaveBeenCalledOnce();
	});

	test('starts empty when the store cannot be read', async () => {
		mocks.get.mockImplementation((_name: string, cb: any) => cb(new Error('corrupt'), null));

		const ledger = new DownloadLedger();

		await expect(ledger.get('object', '/downloads')).resolves.toBe(null);
		expect(mocks.log).toHaveBeenCalled();
	});

	test('drops the oldest entries instead of growing without end', async () => {
		const ledger = new DownloadLedger();
		const data: any = {};

		for (let i = 0; i < 500; i++) {
			data[`object${i}|/downloads`] = { path: `/downloads/${i}`, size: 1, mtimeMs: 1, savedAt: i + 1 };
		};

		stored(data);

		await ledger.set('fresh', '/downloads', { path: '/downloads/fresh', size: 1, mtimeMs: 1 });

		expect(Object.keys(ledger.data).length).toBe(500);
		expect(ledger.data['object0|/downloads']).toBeUndefined();
		await expect(ledger.get('fresh', '/downloads')).resolves.toMatchObject({ path: '/downloads/fresh' });
	});

	test('survives a store written as something other than an object', async () => {
		// electron-json-storage answers with {} for a missing key, but a corrupted
		// file can come back as anything
		stored([]);

		const ledger = new DownloadLedger();

		await expect(ledger.get('object', '/downloads')).resolves.toBe(null);
	});
});
