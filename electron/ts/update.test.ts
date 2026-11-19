import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	checkForUpdatesAndNotify: vi.fn(async (): Promise<any> => null),
	downloadUpdate: vi.fn(),
	send: vi.fn(),
}));

// Stands in for electron-updater: the tests emit its events by hand, nothing touches the network
const autoUpdater = vi.hoisted(() => ({ emitter: null as any }));

vi.mock('electron-updater', async () => {
	const { EventEmitter } = await import('events');

	autoUpdater.emitter = Object.assign(new EventEmitter(), {
		checkForUpdatesAndNotify: mocks.checkForUpdatesAndNotify,
		downloadUpdate: mocks.downloadUpdate,
		quitAndInstall: vi.fn(),
	});

	return { autoUpdater: autoUpdater.emitter };
});

vi.mock('electron', () => ({ app: { getVersion: () => '0.57.0' } }));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false, development: false } }));
vi.mock('./config', () => ({ default: { config: { channel: 'latest' } } }));
vi.mock('./util', () => ({
	default: {
		log: vi.fn(),
		send: mocks.send,
		getLogger: () => ({ transports: { file: {} } }),
	},
}));

import UpdateManager from './update';

/**
 * A failed download of an update left isUpdating set, and checkUpdate() returns early while it
 * is set. After an automatic download had failed, "Check for updates" did nothing and showed
 * nothing until the app was restarted.
 */

const emitter = (): EventEmitter => autoUpdater.emitter;

const failDownload = () => {
	emitter().emit('update-available', { version: '0.57.4' });
	emitter().emit('download-progress', { bytesPerSecond: 7424, percent: 1, transferred: 1, total: 100 });
	emitter().emit('error', new Error('net::ERR_CONNECTION_CLOSED'));
};

beforeEach(() => {
	// init() and checkUpdate() schedule the next automatic check with a timer
	vi.useFakeTimers();
	vi.stubGlobal('process', { ...process, getSystemVersion: () => '15.0.0' });

	emitter().removeAllListeners();
	mocks.checkForUpdatesAndNotify.mockClear();
	mocks.downloadUpdate.mockClear();
	mocks.send.mockClear();

	UpdateManager.isUpdating = false;
	UpdateManager.isDownloading = false;
	UpdateManager.autoUpdate = false;
	UpdateManager.init();
});

afterEach(() => {
	UpdateManager.clearTimeout();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('UpdateManager.checkUpdate', () => {

	test('asks the server for an update', () => {
		UpdateManager.checkUpdate(false);

		expect(mocks.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1);
	});

	test('does nothing while an update is being downloaded', () => {
		emitter().emit('update-available', { version: '0.57.4' });
		emitter().emit('download-progress', { bytesPerSecond: 7424, percent: 1, transferred: 1, total: 100 });

		UpdateManager.checkUpdate(false);

		expect(mocks.checkForUpdatesAndNotify).not.toHaveBeenCalled();
	});

	test('asks the server again after the download has failed', () => {
		failDownload();

		UpdateManager.checkUpdate(false);

		expect(mocks.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1);
	});

	test('reports the failed download to the window', () => {
		UpdateManager.autoUpdate = true;
		failDownload();

		const call = mocks.send.mock.calls.find(it => it[1] == 'update-error');

		expect(call.slice(3)).toEqual([ true, true ]);
		expect(UpdateManager.isDownloading).toBe(false);
	});

});
