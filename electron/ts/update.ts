import { app } from 'electron';
import { is } from 'electron-util';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import ConfigManager from './config';
import Util from './util';
import { AppWindow, DownloadProgress } from './types';

const TIMEOUT_UPDATE = 600 * 1000;

// Feed of builds for operating systems that the regular channels have dropped. An update
// whose feed declares a minimumSystemVersion above this OS is skipped by electron-updater,
// which compares it with os.release(): the Darwin version on macOS, so macOS 13 is 22.0.0.
// The check then falls back to this feed: legacy-mac.yml (both architectures), legacy.yml
// (Windows), legacy-linux.yml (Linux x64) or legacy-linux-<arch>.yml (other Linux architectures).
const LEGACY_CHANNEL = 'legacy';

class UpdateManager {

	win: AppWindow | null = null;
	isUpdating: boolean = false;
	isDownloading: boolean = false;
	isRelaunching: boolean = false;
	autoUpdate: boolean = false;
	channel: string = '';
	isChecking: boolean = false;
	isLegacyLookup: boolean = false;
	isUnsupported: boolean = false;
	isCheckPending: boolean = false;
	timeout: ReturnType<typeof setTimeout> | null = null;

	setWindow (win: AppWindow): void {
		this.win = win;
	};

	init (): void {
		const { channel } = ConfigManager.config;

		console.log('[UpdateManager].init, channel: ', channel);

		autoUpdater.logger = Util.getLogger();
		(autoUpdater.logger as any).transports.file.level = 'debug';
		autoUpdater.autoDownload = false;
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.channel = channel;
		this.channel = channel;

		// Note when the update on the user's channel does not run on this OS, so the check can fall back to the legacy feed
		const isUpdateSupported = autoUpdater.isUpdateSupported;

		autoUpdater.isUpdateSupported = async (info: UpdateInfo) => {
			const ret = await isUpdateSupported(info);

			if (!ret) {
				this.isUnsupported = true;
			};
			return ret;
		};

		this.setTimeout();

		autoUpdater.on('checking-for-update', () => {
			Util.log('info', 'Checking for update');
		});

		autoUpdater.on('update-available', (info: UpdateInfo) => {
			Util.log('info', `Update available: ${JSON.stringify(info, null, 3)}`);

			// The user picked another channel while this check ran: its own check decides
			if (this.isCheckPending) {
				return;
			};

			this.clearTimeout();
			this.download();
		});

		autoUpdater.on('update-not-available', (info: UpdateInfo) => {
			Util.log('info', `Update not available: ${JSON.stringify(info, null, 3)}`);

			// The legacy feed answers instead, or the check for a channel picked meanwhile does
			if (this.needsLegacyCheck() || this.isCheckPending) {
				return;
			};

			Util.send(this.win, 'update-not-available', this.autoUpdate);
		});

		autoUpdater.on('error', (err: Error & { code?: string; statusCode?: number }) => {
			Util.log(`Error: ${err}`);

			if (!this.isDownloading) {
				// The check for a channel picked meanwhile reports instead
				if (this.isCheckPending) {
					return;
				};

				// No legacy feed published means there is no update for this OS. The release bucket
				// answers 403, not 404, for a key that does not exist
				if (this.isLegacyLookup && this.isMissingFeed(err)) {
					Util.send(this.win, 'update-not-available', this.autoUpdate);
					return;
				};
			};

			Util.send(this.win, 'update-error', err, this.autoUpdate, this.isDownloading);

			// A failed download must not block later checks
			if (this.isDownloading) {
				this.isUpdating = false;
				this.setTimeout();
			};

			this.isDownloading = false;
		});

		autoUpdater.on('download-progress', (progress: DownloadProgress) => {
			this.isUpdating = true;

			const msg = [
				`Download speed: ${progress.bytesPerSecond}`,
				'-',
				`Downloaded: ${progress.percent}%`,
				`(${progress.transferred}/${progress.total})`
			];

			Util.log('info', msg.join(' '));
			Util.send(this.win, 'download-progress', progress);
		});

		autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
			this.isUpdating = false;
			this.isDownloading = false;

			Util.log('info', `Update downloaded: ${JSON.stringify(info, null, 3)}`);
			Util.send(this.win, 'update-downloaded', info);
		});
	};

	isAllowed (): boolean {
		const { config } = ConfigManager;

		if (config.updateDisabled) {
			console.log('[UpdateManager].isAllowed, updateDisabled');
			return false;
		};

		const [ osMajor, osMinor, osPatch ] = String(process.getSystemVersion() || '').split('.');
		const [ appMajor, appMinor, appPatch ] = String(app.getVersion() || '').split('.');

		console.log('[UpdateManager].isAllowed, osVersion: ', [ osMajor, osMinor, osPatch ], 'appVersion', [ appMajor, appMinor, appPatch ]);

		if (is.windows && (Number(osMajor) <= 8)) {
			console.log('[UpdateManager].isAllowed, Windows version <= 8');
			return false;
		};

		if (is.macos && (Number(osMajor) <= 10)) {
			console.log('[UpdateManager].isAllowed, MacOS version <= 10');
			return false;
		};

		if (!/-(alpha|beta)/.test(appPatch) && isNaN(appPatch as any)) {
			console.log('[UpdateManager].isAllowed, App version is not valid');
			return false;
		};

		return true;
	};

	setChannel (channel: string): void {
		this.channel = channel;

		// Never switch channels under a running check: run a fresh one once it settles
		if (this.isChecking) {
			this.isCheckPending = true;
			return;
		};

		this.checkUpdate(false);
	};

	checkUpdate (auto: boolean): void {
		if (!this.isAllowed() || this.isUpdating || this.isDownloading) {
			return;
		};

		this.setTimeout();

		// A check is already running: it reports to the user if any caller asked by hand
		if (this.isChecking) {
			this.autoUpdate = this.autoUpdate && auto;
			return;
		};

		this.autoUpdate = auto;
		this.check();
	};

	/**
	 * Retry after an error. A fresh check, not a download of whatever the last check found: that
	 * update may belong to a channel the user has left, or to a feed this OS no longer reads.
	 */
	retry (): void {
		this.checkUpdate(false);
	};

	/**
	 * One check: the user's channel and, when its update does not run on this OS, the legacy feed.
	 * Nothing else touches the updater's channel while it runs, because a pending check reads
	 * allowDowngrade only when its feed answers.
	 */
	async check (): Promise<void> {
		this.isChecking = true;
		this.isUnsupported = false;

		// The channel setter allows downgrades, as the user's channel always has
		autoUpdater.channel = this.channel;

		try {
			await autoUpdater.checkForUpdatesAndNotify();

			if (this.isUnsupported && !this.isCheckPending) {
				Util.log('info', `Update on channel ${this.channel} does not run on this OS, checking ${LEGACY_CHANNEL}`);

				autoUpdater.channel = LEGACY_CHANNEL;

				// Never go back to an older build from this feed
				autoUpdater.allowDowngrade = false;

				this.isLegacyLookup = true;
				try {
					await autoUpdater.checkForUpdatesAndNotify();
				} finally {
					this.isLegacyLookup = false;
				};
			};
		} catch (err) {
			Util.log('info', `checkForUpdatesAndNotify error: ${err}`);
		} finally {
			this.isChecking = false;
		};

		if (this.isCheckPending) {
			this.isCheckPending = false;
			this.checkUpdate(false);
		};
	};

	isMissingFeed (err: Error & { code?: string; statusCode?: number }): boolean {
		return (err?.code == 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND') || (err?.statusCode == 403);
	};

	needsLegacyCheck (): boolean {
		return !this.isLegacyLookup && this.isUnsupported;
	};

	download (): void {
		this.isDownloading = true;
		this.clearTimeout();
		Util.send(this.win, 'download-started');

		// Failures arrive through the error event. A call made while a download runs gets that
		// download's promise and no events of its own, so the flag clears when the promise settles
		autoUpdater.downloadUpdate().catch((err: Error) => {
			Util.log('info', `downloadUpdate error: ${err}`);
		}).finally(() => {
			this.isDownloading = false;
		});
	};

	relaunch (): void {
		Util.log('info', 'Relaunch');
		(app as any).isQuiting = true;
		this.isRelaunching = true;

		autoUpdater.quitAndInstall(false, true);

		// Safety net: on Linux, quitAndInstall() runs the package install synchronously
		// via spawnSync (e.g. pkexec dpkg -i). If the install fails (permission denied,
		// dialog cancelled, etc.), electron-updater does NOT call app.quit(), leaving the
		// app in a zombie state with middleware already stopped. Force exit as a fallback.
		// If quitAndInstall succeeded, it schedules app.quit() via setImmediate which
		// will terminate the process before this timeout fires.
		//
		// Do NOT enable on macOS: Squirrel.Mac needs the app (and its internal proxy
		// server) alive until the native quitAndInstall handoff completes. A premature
		// app.exit here kills the proxy before Squirrel finishes fetching the update,
		// so the install silently fails and the app relaunches at the old version.
		if (is.linux) {
			setTimeout(() => {
				Util.log('error', 'Relaunch: quitAndInstall did not exit the app, forcing exit');
				app.exit(0);
			}, 5000);
		};
	};

	cancel (): void {
		this.isUpdating = false;
		this.isDownloading = false;
		this.clearTimeout();
	};

	setTimeout (): void {
		const { config } = ConfigManager;
		const t = Number(config.updateTimeout) || TIMEOUT_UPDATE;

		this.clearTimeout();
		this.timeout = setTimeout(() => this.checkUpdate(true), t);
	};

	clearTimeout (): void {
		clearTimeout(this.timeout);
	};

};

export default new UpdateManager();
