import { afterEach, describe, expect, it, vi } from 'vitest';
import UtilCommon from './common';

const setElectron = (electron: any) => {
	(globalThis as any).window.Electron = electron;
};

afterEach(() => {
	setElectron({});
	vi.useRealTimers();
});

describe('storageTags', () => {
	it('prefixes every flag with storage_', () => {
		const info = {
			kind: 'network',
			provider: 'Network drive',
			driveType: 'remote',
			fsType: 'ntfs',
			busType: 'network',
			onSystemDrive: false,
			isDefaultWorkdir: true,
		};
		const want = {
			storage_kind: 'network',
			storage_provider: 'Network drive',
			storage_drive_type: 'remote',
			storage_fs_type: 'ntfs',
			storage_bus_type: 'network',
			storage_on_system_drive: 'false',
			storage_is_default_workdir: 'true',
		};

		expect(UtilCommon.storageTags(info)).toEqual(want);
	});

	it('reads none for a local location without provider', () => {
		const got = UtilCommon.storageTags({
			kind: 'local',
			provider: '',
			driveType: 'fixed',
			fsType: 'apfs',
			busType: 'unknown',
			onSystemDrive: true,
			isDefaultWorkdir: true,
		});

		expect(got.storage_provider).toBe('none');
		expect(got.storage_kind).toBe('local');
	});

	it('reads unknown, not none, for the provider of an unknown location', () => {
		expect(UtilCommon.storageTags({ kind: 'unknown', provider: '' }).storage_provider).toBe('unknown');
	});

	it('reads unknown everywhere when there is no info, never local', () => {
		const want = {
			storage_kind: 'unknown',
			storage_provider: 'unknown',
			storage_drive_type: 'unknown',
			storage_fs_type: 'unknown',
			storage_bus_type: 'unknown',
			storage_on_system_drive: 'unknown',
			storage_is_default_workdir: 'unknown',
		};

		expect(UtilCommon.storageTags(null)).toEqual(want);
	});
});

describe('storageInfo', () => {
	it('resolves null outside electron', async () => {
		await expect(UtilCommon.storageInfo('/x')).resolves.toBe(null);
	});

	it('passes the result through', async () => {
		const storageInfo = vi.fn(() => Promise.resolve({ kind: 'local' }));

		setElectron({ storageInfo });

		await expect(UtilCommon.storageInfo('/data')).resolves.toEqual({ kind: 'local' });
		expect(storageInfo).toHaveBeenCalledWith('/data');
	});

	it('resolves null when the preload throws or rejects', async () => {
		setElectron({
			storageInfo: () => {
				throw new Error('boom');
			},
		});
		await expect(UtilCommon.storageInfo('/data')).resolves.toBe(null);

		setElectron({ storageInfo: () => Promise.reject(new Error('boom')) });
		await expect(UtilCommon.storageInfo('/data')).resolves.toBe(null);
	});

	it('gives up after the timeout', async () => {
		vi.useFakeTimers();
		setElectron({ storageInfo: () => new Promise(() => {}) });

		const promise = UtilCommon.storageInfo('/data', 100);

		await vi.advanceTimersByTimeAsync(150);
		await expect(promise).resolves.toBe(null);
	});
});

describe('checkVaultPathReady', () => {
	const safe = { unsafe: false, kind: '', provider: '', path: 'Z:\\anytype' };
	const unsafe = { unsafe: true, kind: 'network', provider: 'Network drive', path: 'Z:\\anytype' };

	it('resolves the final answer from the preload', async () => {
		setElectron({ checkVaultPath: () => safe, checkVaultPathReady: () => Promise.resolve(unsafe) });

		await expect(UtilCommon.checkVaultPathReady('Z:\\anytype')).resolves.toEqual(unsafe);
	});

	it('falls back to the synchronous answer without the async bridge, on errors and on timeout', async () => {
		setElectron({ checkVaultPath: () => safe });
		await expect(UtilCommon.checkVaultPathReady('Z:\\anytype')).resolves.toEqual(safe);

		setElectron({ checkVaultPath: () => safe, checkVaultPathReady: () => Promise.reject(new Error('boom')) });
		await expect(UtilCommon.checkVaultPathReady('Z:\\anytype')).resolves.toEqual(safe);

		vi.useFakeTimers();
		setElectron({ checkVaultPath: () => safe, checkVaultPathReady: () => new Promise(() => {}) });

		const promise = UtilCommon.checkVaultPathReady('Z:\\anytype', 100);

		await vi.advanceTimersByTimeAsync(150);
		await expect(promise).resolves.toEqual(safe);
	});

	it('resolves the web fallback outside electron', async () => {
		await expect(UtilCommon.checkVaultPathReady('/x')).resolves.toEqual({ unsafe: false, kind: '', provider: '', path: '/x' });
	});
});

describe('withStorageTags', () => {
	const UNKNOWN_TAGS = UtilCommon.storageTags(null);

	// The test window is a plain object: give it just enough of an event target
	const listen = () => {
		const listeners: Record<string, Set<any>> = {};
		const win = (globalThis as any).window;

		win.addEventListener = (type: string, fn: any) => (listeners[type] = listeners[type] || new Set()).add(fn);
		win.removeEventListener = (type: string, fn: any) => listeners[type]?.delete(fn);

		return {
			fire: (type: string) => [ ...(listeners[type] || []) ].forEach(fn => fn()),
			count: () => Object.values(listeners).reduce((n, set) => n + set.size, 0),
		};
	};

	it('sends once with the tags when the info arrives, and stops listening', async () => {
		const events = listen();
		const send = vi.fn();

		setElectron({ storageInfo: () => Promise.resolve({ kind: 'local', provider: '', driveType: 'fixed', fsType: 'ntfs', busType: 'nvme', onSystemDrive: true, isDefaultWorkdir: true }) });
		UtilCommon.withStorageTags('C:\\data', send, 100);

		await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
		expect(send.mock.calls[0][0]).toMatchObject({ storage_kind: 'local', storage_fs_type: 'ntfs' });
		expect(events.count()).toBe(0);

		events.fire('pagehide');
		expect(send).toHaveBeenCalledTimes(1);
	});

	it('sends once with unknown tags when the lookup fails', async () => {
		listen();
		const send = vi.fn();

		setElectron({ storageInfo: () => Promise.reject(new Error('powershell blocked')) });
		UtilCommon.withStorageTags('Z:\\data', send, 100);

		await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
		expect(send).toHaveBeenCalledWith(UNKNOWN_TAGS);
	});

	it('sends once with unknown tags when the lookup times out', async () => {
		vi.useFakeTimers();
		listen();
		const send = vi.fn();

		setElectron({ storageInfo: () => new Promise(() => {}) });
		UtilCommon.withStorageTags('Z:\\data', send, 100);

		await vi.advanceTimersByTimeAsync(150);
		expect(send).toHaveBeenCalledTimes(1);
		expect(send).toHaveBeenCalledWith(UNKNOWN_TAGS);
	});

	it('sends at once on unload, and ignores the answer that comes later', async () => {
		const events = listen();
		const send = vi.fn();

		let answer: (v: any) => void = () => {};
		setElectron({ storageInfo: () => new Promise(resolve => { answer = resolve; }) });
		UtilCommon.withStorageTags('Z:\\data', send, 1000);

		events.fire('beforeunload');
		expect(send).toHaveBeenCalledTimes(1);
		expect(send).toHaveBeenCalledWith(UNKNOWN_TAGS);

		events.fire('pagehide');
		answer({ kind: 'network' });
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(send).toHaveBeenCalledTimes(1);
		expect(events.count()).toBe(0);
	});
});
