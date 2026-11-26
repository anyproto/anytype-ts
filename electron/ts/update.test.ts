import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// What each channel's feed answers: an update (with whether it runs on this OS) or an error
type Feed = { version: string; supported: boolean } | { error: string };

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	feeds: {} as Record<string, any>,
}));

// A stand-in for electron-updater's AppUpdater: the channel setter allows downgrades, the
// way the real one does, and a check runs isUpdateSupported before it reports anything
vi.mock('electron-updater', async () => {
	const { EventEmitter } = await import('events');

	class FakeUpdater extends EventEmitter {
		logger: any = { transports: { file: {} } };
		autoDownload = true;
		autoInstallOnAppQuit = true;
		allowDowngrade = false;
		checkedChannels: { channel: string; allowDowngrade: boolean }[] = [];
		isUpdateSupported: (info: any) => boolean | Promise<boolean> = (info: any) => !info.minimumSystemVersion;
		downloadUpdate = vi.fn();
		private ch = '';

		get channel () {
			return this.ch;
		};

		set channel (value: string) {
			this.ch = value;
			this.allowDowngrade = true;
		};

		async checkForUpdatesAndNotify () {
			this.checkedChannels.push({ channel: this.ch, allowDowngrade: this.allowDowngrade });

			const feed = mocks.feeds[this.ch];
			if (!feed || feed.error) {
				const err = new Error(feed?.error || `Cannot find channel "${this.ch}-mac.yml" update info`);
				this.emit('error', err);
				throw err;
			};

			const info = { version: feed.version, minimumSystemVersion: feed.supported ? undefined : '22.0.0' };
			const supported = await this.isUpdateSupported(info);

			if (!supported || !feed.newer) {
				this.emit('update-not-available', info);
			} else {
				this.emit('update-available', info);
			};
			return null;
		};
	};

	return { autoUpdater: new FakeUpdater() };
});

vi.mock('electron', () => ({ app: { getVersion: () => '0.57.10' } }));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false } }));
vi.mock('./config', () => ({ default: { config: { channel: 'latest' } } }));
vi.mock('./util', () => ({ default: { log: vi.fn(), send: mocks.send, getLogger: () => ({ transports: { file: {} } }) } }));

const flush = async () => {
	for (let i = 0; i < 10; i++) {
		await new Promise(resolve => setTimeout(resolve, 0));
	};
};

const setFeeds = (feeds: Record<string, Feed & { newer?: boolean }>) => {
	mocks.feeds = feeds;
};

const sent = (event: string) => mocks.send.mock.calls.filter(it => it[1] == event);
const channels = (): string[] => updater.checkedChannels.map((it: any) => it.channel);

let Update: any;
let updater: any;

beforeEach(async () => {
	vi.resetModules();
	mocks.send.mockReset();
	(process as any).getSystemVersion = () => '12.7.6';

	updater = (await import('electron-updater')).autoUpdater;
	updater.removeAllListeners();
	updater.checkedChannels = [];
	updater.isUpdateSupported = (info: any) => !info.minimumSystemVersion;
	updater.downloadUpdate.mockReset();

	Update = (await import('./update')).default;
	Update.init();
});

afterEach(() => {
	Update.clearTimeout();
});

describe('legacy update feed', () => {

	test('an update that runs on this OS is taken from the user\'s channel only', async () => {
		setFeeds({ latest: { version: '0.57.11', supported: true, newer: true } });

		Update.checkUpdate(false);
		await flush();

		expect(channels()).toEqual([ 'latest' ]);
		expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
	});

	test('when the update does not run on this OS, the legacy feed is checked without downgrades', async () => {
		setFeeds({
			latest: { version: '0.58.0', supported: false, newer: true },
			legacy: { version: '0.57.11', supported: true, newer: true },
		});

		Update.checkUpdate(true);
		await flush();

		expect(updater.checkedChannels).toEqual([
			{ channel: 'latest', allowDowngrade: true },
			{ channel: 'legacy', allowDowngrade: false },
		]);
		expect(sent('update-not-available')).toHaveLength(0);
		expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
	});

	test('nothing newer on the legacy feed is reported as no update, once', async () => {
		setFeeds({
			latest: { version: '0.58.0', supported: false, newer: true },
			legacy: { version: '0.57.10', supported: true, newer: false },
		});

		Update.checkUpdate(false);
		await flush();

		expect(sent('update-not-available')).toHaveLength(1);
		expect(sent('update-error')).toHaveLength(0);
	});

	test('a missing legacy feed is reported as no update, not as an error', async () => {
		setFeeds({ latest: { version: '0.58.0', supported: false, newer: true } });

		Update.checkUpdate(false);
		await flush();

		expect(channels()).toEqual([ 'latest', 'legacy' ]);
		expect(sent('update-not-available')).toHaveLength(1);
		expect(sent('update-error')).toHaveLength(0);
	});

	test('an error on the user\'s channel is still reported as an error', async () => {
		setFeeds({ latest: { error: 'net::ERR_INTERNET_DISCONNECTED' } });

		Update.checkUpdate(false);
		await flush();

		expect(channels()).toEqual([ 'latest' ]);
		expect(sent('update-error')).toHaveLength(1);
	});

	test('the next check goes back to the user\'s channel with downgrades allowed as before', async () => {
		setFeeds({
			latest: { version: '0.58.0', supported: false, newer: true },
			legacy: { version: '0.57.10', supported: true, newer: false },
		});

		Update.checkUpdate(true);
		await flush();

		setFeeds({ latest: { version: '0.57.12', supported: true, newer: true } });
		Update.checkUpdate(true);
		await flush();

		expect(updater.checkedChannels.slice(2)).toEqual([ { channel: 'latest', allowDowngrade: true } ]);
		expect(updater.channel).toBe('latest');
	});

	test('a channel picked by the user is the one checked first', async () => {
		setFeeds({
			beta: { version: '0.58.0-beta', supported: false, newer: true },
			legacy: { version: '0.57.11', supported: true, newer: true },
		});

		Update.setChannel('beta');
		await flush();

		expect(channels()).toEqual([ 'beta', 'legacy' ]);
	});

});
