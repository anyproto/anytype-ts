import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	download: vi.fn(),
	sendToAllTabs: vi.fn(),
	log: vi.fn(),
}));

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

import { DownloadManager } from './download';

const win = {} as any;
const directory = '/tmp/downloads';

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

const events = (channel: string): any[] => mocks.sendToAllTabs.mock.calls.filter(it => it[0] == channel).map(it => it[1]);

let manager: DownloadManager;

beforeEach(() => {
	manager = new DownloadManager();
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('DownloadManager', () => {
	test('runs one download at a time and starts the next when it ends', async () => {
		const first = deferDownload();
		const second = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		manager.start(win, { id: 'b', url: 'http://gateway/file/b', directory });

		// electron-dl attaches a will-download listener per call, so concurrent
		// downloads would report each other's bytes
		expect(mocks.download).toHaveBeenCalledOnce();
		expect(first.url).toBe('http://gateway/file/a');

		first.complete('/tmp/downloads/file.pdf');
		await vi.waitFor(() => expect(mocks.download).toHaveBeenCalledTimes(2));

		expect(second.url).toBe('http://gateway/file/b');
	});

	test('reports progress and completion tagged with the download id', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });

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

		first.complete('/tmp/downloads/file.pdf');
		await vi.waitFor(() => expect(events('file-download-done').length).toBe(2));

		expect(mocks.download).toHaveBeenCalledOnce();
	});

	test('keeps the queue moving when a download fails', async () => {
		const first = deferDownload();
		const second = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });
		manager.start(win, { id: 'b', url: 'http://gateway/file/b', directory });

		first.fail(new Error('Disk full'));

		await vi.waitFor(() => expect(mocks.download).toHaveBeenCalledTimes(2));

		expect(events('file-download-done')[0]).toEqual({ id: 'a', error: 'Disk full' });
		expect(second.url).toBe('http://gateway/file/b');
	});

	test('forgets a finished download, so a late cancel is a no-op', async () => {
		const first = deferDownload();

		manager.start(win, { id: 'a', url: 'http://gateway/file/a', directory });

		const item = new FakeItem();

		first.options.onStarted(item);
		first.complete('/tmp/downloads/file.pdf');

		await vi.waitFor(() => expect(events('file-download-done').length).toBe(1));

		manager.cancel('a');

		expect(item.cancel).not.toHaveBeenCalled();
		expect(events('file-download-done').length).toBe(1);
	});
});
