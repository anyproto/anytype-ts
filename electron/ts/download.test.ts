import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	download: vi.fn(),
	sendToAllTabs: vi.fn(),
	log: vi.fn(),
}));

// An in-memory stand-in for the persisted ledger. What it stores is asserted in
// downloadLedger.test.ts; here it only has to answer lookups
const ledger = vi.hoisted(() => {
	const data: Record<string, any> = {};

	return {
		data,
		get: vi.fn(async (objectId: string, directory: string) => data[`${objectId}|${directory}`] || null),
		set: vi.fn(async (objectId: string, directory: string, entry: any) => {
			data[`${objectId}|${directory}`] = entry;
		}),
	};
});

vi.mock('./downloadLedger', () => ({ default: ledger }));

// The temp scope main hands opened files, swapped per test
const electron = vi.hoisted(() => ({ tmp: '' }));

vi.mock('electron', () => ({ app: { getPath: () => electron.tmp } }));

vi.mock('electron-dl', () => ({
	download: mocks.download,
}));

vi.mock('./window', () => ({
	default: {
		sendToAllTabs: mocks.sendToAllTabs,
	},
}));

vi.mock('./util', () => ({
	default: {
		log: mocks.log,
	},
}));

import { DownloadManager, openedRoot } from './download';

const win = {} as any;

// The real checksum for "hello", as the middleware would have stored it
const helloChecksum = 'UENFSOKMBA8P0DGGU3H3PI56JLDOFJL6QA77AI4R1KMA0BMNJ4U0';

let directory = '';

class FakeItem {
	cancel = vi.fn();
	getFilename = () => 'file.pdf';
	getTotalBytes = () => 100;
};

/**
 * Stands in for one electron-dl download: hands back the options it was called
 * with, so a test can drive the callbacks the way a real transfer would.
 */
const deferDownload = () => {
	const deferred: any = { options: null };

	mocks.download.mockImplementationOnce((_win: any, url: string, options: any) => {
		deferred.url = url;
		deferred.options = options;

		return new Promise((resolve, reject) => {
			deferred.complete = (path: string) => {
				options.onCompleted?.({ path, filename: 'file.pdf' });
				resolve({});
			};
			deferred.fail = (err: Error) => {
				reject(err);
			};
			deferred.cancel = () => {
				options.onCancel?.({});
				reject(new Error('The download was cancelled'));
			};
		});
	});

	return deferred;
};

// A transfer now starts a tick after start(), since the queue first looks for a
// copy already on disk
const started = (count: number) => vi.waitFor(() => expect(mocks.download).toHaveBeenCalledTimes(count));

const events = (channel: string): any[] => mocks.sendToAllTabs.mock.calls.filter(it => it[0] == channel).map(it => it[1]);

let manager: DownloadManager;

beforeEach(() => {
	manager = new DownloadManager();
	directory = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-reuse-'));
	electron.tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-scope-'));

	Object.keys(ledger.data).forEach(key => delete ledger.data[key]);
	ledger.get.mockClear();
	ledger.set.mockClear();
});

afterEach(() => {
	vi.resetAllMocks();
	fs.rmSync(directory, { recursive: true, force: true });
	fs.rmSync(electron.tmp, { recursive: true, force: true });
});

describe('DownloadManager', () => {
	test('runs one download at a time and starts the next when it ends', async () => {
		const first = deferDownload();
		const second = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		manager.start(win, { id: 'b', url: 'http://gateway/file/b', directory });

		// electron-dl attaches a will-download listener per call, so concurrent
		// downloads would report each other's bytes
		await started(1);
		expect(first.url).toBe('http://gateway/file/a');

		first.complete('/tmp/downloads/file.pdf');
		await started(2);

		expect(second.url).toBe('http://gateway/file/b');
	});

	test('reports progress and completion tagged with the download id', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		await started(1);

		first.options.onStarted(new FakeItem());
		first.options.onProgress({ percent: 0.4, transferredBytes: 40, totalBytes: 100 });

		// The first event carries the name the transfer will actually be saved under
		expect(events('file-download-progress')).toEqual([
			{ id: 'a', current: 0, total: 100, name: 'file.pdf' },
			{ id: 'a', current: 40, total: 100 },
		]);

		first.complete('/tmp/downloads/file.pdf');
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', path: '/tmp/downloads/file.pdf' });
	});

	test('cancels an active download through its own item', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		await started(1);

		const item = new FakeItem();

		first.options.onStarted(item);
		manager.cancel('a');

		expect(item.cancel).toHaveBeenCalledOnce();

		first.cancel();
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', isCancelled: true });
	});

	test('never starts a download cancelled while it was still queued', async () => {
		const first = deferDownload();

		deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		manager.start(win, { id: 'b', url: 'http://gateway/file/b', directory });

		manager.cancel('b');

		expect(events('file-download-done')).toEqual([ { id: 'b', isCancelled: true } ]);

		await started(1);
		first.complete('/tmp/downloads/file.pdf');
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(2));

		expect(mocks.download).toHaveBeenCalledOnce();
	});

	test('keeps the queue moving when a download fails', async () => {
		const first = deferDownload();
		const second = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		manager.start(win, { id: 'b', url: 'http://gateway/file/b', directory });

		await started(1);
		first.fail(new Error('Disk full'));

		await started(2);

		expect(events('file-download-done')[0]).toEqual({ id: 'a', error: 'Disk full' });
		expect(second.url).toBe('http://gateway/file/b');
	});

	test('reuses the file it wrote before, untouched, without transferring again', async () => {
		const target = path.join(directory, 'hello.txt');

		fs.writeFileSync(target, 'hello');

		const stat = fs.statSync(target);

		ledger.data[`object|${directory}`] = { path: target, size: stat.size, mtimeMs: stat.mtimeMs };

		manager.start(win, { id: 'a', url: 'http://gateway/file/object', directory, objectId: 'object', name: 'hello.txt' });

		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', path: target });
		expect(mocks.download).not.toHaveBeenCalled();
	});

	test('checks the content when the file was touched since, and reuses it if it still matches', async () => {
		const target = path.join(directory, 'hello.txt');

		fs.writeFileSync(target, 'hello');

		// A mtime that no longer matches what we recorded: touched, but the bytes
		// are the object's own, which the checksum is what proves
		ledger.data[`object|${directory}`] = { path: target, size: 5, mtimeMs: 1 };

		manager.start(win, {
			id: 'a', url: 'http://gateway/file/object', directory,
			objectId: 'object', name: 'hello.txt', size: 5, checksums: [ helloChecksum ],
		});

		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', path: target });
		expect(mocks.download).not.toHaveBeenCalled();
	});

	test('downloads again when the file on disk is no longer the object it names', async () => {
		const target = path.join(directory, 'hello.txt');

		fs.writeFileSync(target, 'edited by the user');

		ledger.data[`object|${directory}`] = { path: target, size: 5, mtimeMs: 1 };

		const first = deferDownload();

		manager.start(win, {
			id: 'a', url: 'http://gateway/file/object', directory,
			objectId: 'object', name: 'hello.txt', size: 5, checksums: [ helloChecksum ],
		});

		await started(1);

		// Never overwritten: the stack uniquifies, and the user's edit survives
		expect(fs.readFileSync(target, 'utf8')).toBe('edited by the user');

		first.complete(path.join(directory, 'hello (1).txt'));
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));
	});

	test('recognises a copy it never wrote, by content alone', async () => {
		const target = path.join(directory, 'hello.txt');

		fs.writeFileSync(target, 'hello');

		// No ledger entry at all — a fresh install, or a file the user already had
		manager.start(win, {
			id: 'a', url: 'http://gateway/file/object', directory,
			objectId: 'object', name: 'hello.txt', size: 5, checksums: [ helloChecksum ],
		});

		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', path: target });
		expect(mocks.download).not.toHaveBeenCalled();

		// Recorded, so the next time costs a stat rather than a hash
		expect(ledger.set).toHaveBeenCalledWith('object', directory, expect.objectContaining({ path: target, size: 5 }));
	});

	test('leaves a same-named stranger of a different size alone', async () => {
		const target = path.join(directory, 'hello.txt');

		fs.writeFileSync(target, 'a completely different file');

		deferDownload();

		manager.start(win, {
			id: 'a', url: 'http://gateway/file/object', directory,
			objectId: 'object', name: 'hello.txt', size: 5, checksums: [ helloChecksum ],
		});

		await started(1);
	});

	test('records where a completed download landed', async () => {
		const target = path.join(directory, 'hello.txt');
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/object', directory, objectId: 'object' });

		await started(1);

		fs.writeFileSync(target, 'hello');
		first.complete(target);

		await vi.waitFor(() => expect(ledger.set).toHaveBeenCalled());

		expect(ledger.set).toHaveBeenCalledWith('object', directory, expect.objectContaining({ path: target, size: 5 }));
	});

	test('forgets a finished download, so a late cancel is a no-op', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		await started(1);

		const item = new FakeItem();

		first.options.onStarted(item);
		first.complete('/tmp/downloads/file.pdf');

		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		manager.cancel('a');

		expect(item.cancel).not.toHaveBeenCalled();
		expect(events('file-download-done').length).toBe(1);
	});
});

describe('the temporary scope opened files live in', () => {

	// What a click on a file block asks for: the same object, twice
	const request = (id: string) => ({
		id,
		url: 'http://gateway/file/object',
		directory: '',
		objectId: 'object',
		temporary: true,
		name: 'hello.txt',
		size: 5,
		checksums: [ helloChecksum ],
	});

	test('gives a temporary download a folder of its own, and creates it', async () => {
		const first = deferDownload();

		manager.start(win, request('a'));
		await started(1);

		const dir = path.join(openedRoot(), 'object');

		// The caller names no folder: main picks one per object, so the path is
		// the same on every open and the copy already there is found
		expect(first.options.directory).toBe(dir);
		expect(fs.existsSync(dir)).toBe(true);
	});

	test('overwrites its own copy rather than leaving a second one beside it', async () => {
		const first = deferDownload();

		manager.start(win, request('a'));
		await started(1);

		// Without this the stack uniquifies, and a file whose bytes changed would
		// land as "hello (1).txt", then "hello (2).txt"
		expect(first.options.overwrite).toBe(true);
	});

	test('never overwrites anything in a folder the user chose', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/object', directory, objectId: 'object' });
		await started(1);

		expect(first.options.overwrite).toBeFalsy();
	});

	test('opens the same file twice without transferring it again', async () => {
		const first = deferDownload();

		manager.start(win, request('a'));
		await started(1);

		const target = path.join(openedRoot(), 'object', 'hello.txt');

		fs.writeFileSync(target, 'hello');
		first.complete(target);
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		manager.start(win, request('b'));
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(2));

		expect(events('file-download-done')[1]).toEqual({ id: 'b', path: target });
		expect(mocks.download).toHaveBeenCalledOnce();
	});

	test('sweeps out a folder nothing has landed in for a week', () => {
		const dir = path.join(openedRoot(), 'stale');
		const old = Date.now() / 1000 - (8 * 24 * 60 * 60);

		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, 'hello.txt'), 'hello');
		fs.utimesSync(dir, old, old);

		manager.prune();

		expect(fs.existsSync(dir)).toBe(false);
	});

	test('keeps a folder a file landed in recently', () => {
		const dir = path.join(openedRoot(), 'fresh');

		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, 'hello.txt'), 'hello');

		manager.prune();

		expect(fs.existsSync(dir)).toBe(true);
	});

	test('says nothing when nothing has ever been opened', () => {
		expect(() => manager.prune()).not.toThrow();
	});

});
