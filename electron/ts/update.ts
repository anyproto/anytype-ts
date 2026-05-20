import { app } from 'electron';
import { is } from 'electron-util';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import ConfigManager from './config';
import Util from './util';
import { AppWindow, DownloadProgress } from './types';

const TIMEOUT_UPDATE = 600 * 1000;

class UpdateManager {

	win: AppWindow | null = null;
	isUpdating: boolean = false;
	isDownloading: boolean = false;
	isRelaunching: boolean = false;
	autoUpdate: boolean = false;
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

		this.setTimeout();

		autoUpdater.on('checking-for-update', () => {
			Util.log('info', 'Checking for update');
		});

		autoUpdater.on('update-available', (info: UpdateInfo) => {
			this.clearTimeout();

			Util.log('info', `Update available: ${JSON.stringify(info, null, 3)}`);
			this.download();
		});

		autoUpdater.on('update-not-available', (info: UpdateInfo) => {
			Util.log('info', `Update not available: ${JSON.stringify(info, null, 3)}`);
			Util.send(this.win, 'update-not-available', this.autoUpdate);
		});

		autoUpdater.on('error', (err: Error) => {
			Util.log(`Error: ${err}`);
			Util.send(this.win, 'update-error', err, this.autoUpdate, this.isDownloading);
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
		autoUpdater.channel = channel;
		this.checkUpdate(false);
	};

	checkUpdate (auto: boolean): void {
		if (!this.isAllowed() || this.isUpdating) {
			return;
		};

		autoUpdater.checkForUpdatesAndNotify().catch((err: Error) => {
			Util.log('info', `checkForUpdatesAndNotify error: ${err}`);
		});

		this.setTimeout();
		this.autoUpdate = auto;
	};

	download (): void {
		this.isDownloading = true;
		Util.send(this.win, 'download-started');
		autoUpdater.downloadUpdate();
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
