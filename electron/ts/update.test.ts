import os from 'os';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppUpdater } from 'electron-updater/out/AppUpdater';

// A feed answers with an update, or is missing (404), or answers with an HTTP status, or fails some other way
type Feed = { version: string; minimumSystemVersion?: string } | { status: number } | { error: string };

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	updater: null as any,
}));

// update.ts reads `autoUpdater` on every use, so each test can hand it a fresh updater
vi.mock('electron-updater', () => ({
	get autoUpdater () {
		return mocks.updater;
	},
}));

vi.mock('electron', () => ({ app: { getVersion: () => '0.57.10' } }));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false } }));
vi.mock('./config', () => ({ default: { config: { channel: 'latest' } } }));
vi.mock('./util', () => ({
	default: {
		log: vi.fn(),
		send: mocks.send,
		getLogger: () => ({ transports: { file: {} }, info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
	},
}));

/**
 * electron-updater's real AppUpdater (check, OS support, rollout, downgrade and download
 * bookkeeping), with only the feed fetch and the file transfer replaced. A feed answer can be
 * held back to reproduce a check that is still waiting for the network.
 */
class TestUpdater extends AppUpdater {

	feeds: Record<string, Feed> = {};
	requests: string[] = [];
	downloaded: string[] = [];
	held: (() => void)[] = [];
	hold = false;
	downloadError = '';
	holdAfterDownloaded = false;
	heldDownload: (() => void) | null = null;

	constructor (version: string) {
		super(null, {
			version,
			name: 'Anytype',
			isPackaged: true,
			appUpdateConfigPath: '/nonexistent/app-update.yml',
			userDataPath: '/nonexistent',
			baseCachePath: '/nonexistent',
			whenReady: () => Promise.resolve(),
			quit: () => {},
			relaunch: () => {},
			onQuit: () => {},
		} as any);
	};

	protected async getUpdateInfoAndProvider (): Promise<any> {
		const channel = this.channel;

		this.requests.push(channel);

		if (this.hold) {
			await new Promise<void>(resolve => this.held.push(resolve));
		};

		const feed = this.feeds[channel];
		if (!feed) {
			const err: any = new Error(`Cannot find channel "${channel}-mac.yml" update info: HttpError: 404`);
			err.code = 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND';
			throw err;
		};

		if ('status' in feed) {
			const err: any = new Error(`HttpError: ${feed.status}`);
			err.statusCode = feed.status;
			throw err;
		};

		if ('error' in feed) {
			throw new Error(feed.error);
		};

		const file = `Anytype-${feed.version}-mac.zip`;
		return {
			info: { version: feed.version, files: [ { url: file, sha512: 'x' } ], path: file, sha512: 'x', releaseDate: '', minimumSystemVersion: feed.minimumSystemVersion },
			provider: { fileExtraDownloadHeaders: null },
		};
	};

	protected async doDownloadUpdate (options: any): Promise<string[]> {
		this.downloaded.push(options.updateInfoAndProvider.info.version);
		this.emit('download-progress', { bytesPerSecond: 1, percent: 50, transferred: 1, total: 2, delta: 1 });

		if (this.downloadError) {
			throw new Error(this.downloadError);
		};

		this.emit('update-downloaded', options.updateInfoAndProvider.info);

		// electron-updater still copies the blockmap after announcing the download
		if (this.holdAfterDownloaded) {
			await new Promise<void>(resolve => this.heldDownload = resolve);
		};
		return [];
	};

	quitAndInstall (): void {};

	release (): void {
		const held = this.held;

		this.held = [];
		held.forEach(resolve => resolve());
	};

};

const MACOS_12 = '21.6.0';
const MACOS_13 = '22.1.0';
const ONLY_MACOS_13 = '22.0.0';

const flush = async () => {
	for (let i = 0; i < 20; i++) {
		await new Promise(resolve => setTimeout(resolve, 0));
	};
};

const sent = (event: string) => mocks.send.mock.calls.filter(it => it[1] == event);

let Update: any;
let updater: TestUpdater;

const start = async (version: string, darwin: string, feeds: Record<string, Feed>) => {
	vi.spyOn(os, 'release').mockReturnValue(darwin);

	updater = new TestUpdater(version);
	updater.feeds = feeds;
	mocks.updater = updater;

	Update = (await import('./update')).default;
	Update.init();
};

beforeEach(() => {
	vi.resetModules();
	mocks.send.mockReset();
	(process as any).getSystemVersion = () => '12.7.6';
});

afterEach(() => {
	Update.clearTimeout();
	vi.restoreAllMocks();
});

describe('legacy update feed', () => {

	test('an update that runs on this OS comes from the user\'s channel only', async () => {
		await start('0.57.10', MACOS_12, { latest: { version: '0.57.11' } });

		Update.checkUpdate(false);
		await flush();

		expect(updater.requests).toEqual([ 'latest' ]);
		expect(updater.downloaded).toEqual([ '0.57.11' ]);
	});

	test('on macOS 13 the update that needs macOS 13 is taken, and the legacy feed is not asked', async () => {
		await start('0.57.10', MACOS_13, { latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 } });

		Update.checkUpdate(false);
		await flush();

		expect(updater.requests).toEqual([ 'latest' ]);
		expect(updater.downloaded).toEqual([ '0.58.0' ]);
	});

	test('on macOS 12 the update that needs macOS 13 is skipped for the legacy feed', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.11' },
		});

		Update.checkUpdate(true);
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'legacy' ]);
		expect(updater.downloaded).toEqual([ '0.57.11' ]);
		expect(sent('update-not-available')).toHaveLength(0);
	});

	test('an older build on the legacy feed is never installed', async () => {
		await start('0.57.12-beta', MACOS_12, {
			beta: { version: '0.58.0-beta', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.11' },
		});
		Update.setChannel('beta');
		await flush();

		expect(updater.requests).toEqual([ 'beta', 'legacy' ]);
		expect(updater.downloaded).toEqual([]);
		expect(sent('update-not-available')).toHaveLength(1);
	});

	test('a manual check during the legacy lookup neither downgrades nor asks again', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.9' },
		});
		updater.hold = true;

		Update.checkUpdate(true);
		await flush();
		updater.release();
		await flush();

		// The legacy feed has been asked and has not answered yet
		expect(updater.requests).toEqual([ 'latest', 'legacy' ]);

		Update.checkUpdate(false);
		updater.hold = false;
		updater.release();
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'legacy' ]);
		expect(updater.downloaded).toEqual([]);

		// The running check answers the person who asked
		expect(sent('update-not-available').map(it => it[2])).toEqual([ false ]);
	});

	test('a channel picked during a check is checked once that check settles', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			beta: { version: '0.57.12-beta' },
		});
		updater.hold = true;

		Update.checkUpdate(true);
		await flush();
		Update.setChannel('beta');
		updater.hold = false;
		updater.release();
		await flush();
		updater.release();
		await flush();

		// The overtaken check skips its own fallback
		expect(updater.requests).toEqual([ 'latest', 'beta' ]);
		expect(updater.downloaded).toEqual([ '0.57.12-beta' ]);
	});

	test('a missing legacy feed reads as no update, not as an error', async () => {
		await start('0.57.10', MACOS_12, { latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 } });

		Update.checkUpdate(false);
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'legacy' ]);
		expect(sent('update-not-available')).toHaveLength(1);
		expect(sent('update-error')).toHaveLength(0);
	});

	test('a broken legacy feed is still reported as an error', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { error: 'This file could not be downloaded, or the latest version does not have a valid semver version' },
		});

		Update.checkUpdate(false);
		await flush();

		expect(sent('update-error')).toHaveLength(1);
		expect(sent('update-not-available')).toHaveLength(0);
	});

	test('an error on the user\'s channel is reported as an error', async () => {
		await start('0.57.10', MACOS_12, { latest: { error: 'net::ERR_INTERNET_DISCONNECTED' } });

		Update.checkUpdate(false);
		await flush();

		expect(updater.requests).toEqual([ 'latest' ]);
		expect(sent('update-error')).toHaveLength(1);
	});

	test('an install error after a legacy download is reported as an error', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.11' },
		});

		Update.checkUpdate(false);
		await flush();
		expect(updater.downloaded).toEqual([ '0.57.11' ]);

		updater.emit('error', new Error('Squirrel.Mac: code signature did not pass validation'));

		expect(sent('update-error')).toHaveLength(1);
		expect(sent('update-not-available')).toHaveLength(0);
	});

	test('the next check starts from the user\'s channel, with downgrades allowed as before', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.10' },
		});

		Update.checkUpdate(true);
		await flush();

		updater.feeds = { latest: { version: '0.57.12' } };
		Update.checkUpdate(true);
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'legacy', 'latest' ]);
		expect(updater.channel).toBe('latest');
		expect(updater.allowDowngrade).toBe(true);
		expect(updater.downloaded).toEqual([ '0.57.12' ]);
	});

	test('a failed download does not block the next check', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { version: '0.57.11' },
		});
		updater.downloadError = 'net::ERR_CONNECTION_RESET';

		Update.checkUpdate(true);
		await flush();
		expect(sent('update-error')).toHaveLength(1);

		updater.downloadError = '';
		Update.checkUpdate(false);
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'legacy', 'latest', 'legacy' ]);
		expect(updater.downloaded).toEqual([ '0.57.11', '0.57.11' ]);
	});

	test('the release bucket\'s 403 for a missing legacy feed reads as no update', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { status: 403 },
		});

		Update.checkUpdate(false);
		await flush();

		expect(sent('update-not-available')).toHaveLength(1);
		expect(sent('update-error')).toHaveLength(0);
	});

	test('retry checks again instead of downloading an update from a channel the user left', async () => {
		await start('0.57.10', MACOS_12, {
			beta: { version: '0.57.12-beta' },
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			legacy: { error: '503 Service Unavailable' },
		});
		updater.hold = true;

		Update.setChannel('beta');
		await flush();
		Update.setChannel('latest');
		updater.hold = false;
		updater.release();
		await flush();

		// beta was found but not taken, and the legacy lookup for latest failed
		expect(sent('update-error')).toHaveLength(1);

		Update.retry();
		await flush();

		expect(updater.requests).toEqual([ 'beta', 'latest', 'legacy', 'latest', 'legacy' ]);
		expect(updater.downloaded).toEqual([]);
	});

	test('a timer tick during a running check keeps polling', async () => {
		await start('0.57.10', MACOS_12, { latest: { version: '0.57.10' } });
		updater.hold = true;

		Update.checkUpdate(true);
		await flush();
		Update.clearTimeout();
		Update.timeout = null;

		Update.checkUpdate(true);
		expect(Update.timeout).not.toBeNull();

		updater.hold = false;
		updater.release();
		await flush();
	});

	test('a check overtaken by a channel change reports nothing and skips its fallback', async () => {
		await start('0.57.10', MACOS_12, {
			latest: { version: '0.58.0', minimumSystemVersion: ONLY_MACOS_13 },
			beta: { version: '0.57.12-beta' },
		});
		updater.hold = true;

		Update.checkUpdate(false);
		await flush();
		Update.setChannel('beta');
		updater.hold = false;
		updater.release();
		await flush();

		expect(updater.requests).toEqual([ 'latest', 'beta' ]);
		expect(sent('update-not-available')).toHaveLength(0);
		expect(sent('update-error')).toHaveLength(0);
		expect(updater.downloaded).toEqual([ '0.57.12-beta' ]);
	});

	test('a download call that joins a running download does not leave the updater busy', async () => {
		await start('0.57.10', MACOS_12, { latest: { version: '0.57.11' } });
		updater.holdAfterDownloaded = true;

		Update.checkUpdate(true);
		await flush();
		expect(Update.isDownloading).toBe(false);

		// Between the downloaded event and the end of the transfer, a second call joins it
		Update.download();
		expect(Update.isDownloading).toBe(true);

		updater.heldDownload?.();
		await flush();

		expect(updater.downloaded).toEqual([ '0.57.11' ]);
		expect(Update.isDownloading).toBe(false);
	});

});
