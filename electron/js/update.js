const { app } = require('electron');
const { is } = require('electron-util');
const { autoUpdater } = require('electron-updater');

const ConfigManager = require('./config.js');
const Util = require('./util.js');

const TIMEOUT_UPDATE = 600 * 1000;

class UpdateManager {

	win = null;
	isUpdating = false;
	autoUpdate = false;
	timeout = 0;

	setWindow (win) {
		this.win = win;
	};

	init () {
		const { channel } = ConfigManager.config;

		console.log('[UpdateManager].init, channel: ', channel);

		autoUpdater.logger = Util.getLogger();
		autoUpdater.logger.transports.file.level = 'debug';
		autoUpdater.autoDownload = false;
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.channel = channel;

		this.setTimeout();

		autoUpdater.on('checking-for-update', () => {
			Util.log('info', 'Checking for update');
			Util.send(this.win, 'checking-for-update', this.autoUpdate);
		});

		autoUpdater.on('update-available', (info) => {
			this.isUpdating = true;
			this.clearTimeout();

			Util.log('info', 'Update available: ' + JSON.stringify(info, null, 3));
			Util.send(this.win, 'update-available', this.autoUpdate, info);

			if (this.autoUpdate) {
				this.download();
			};
		});

		autoUpdater.on('update-not-available', (info) => {
			this.isUpdating = false;

			Util.log('info', 'Update not available: ' + JSON.stringify(info, null, 3));
			Util.send(this.win, 'update-not-available', this.autoUpdate);
		});
		
		autoUpdater.on('error', (err) => { 
			this.isUpdating = false;

			Util.log('Error: ' + err);
			Util.send(this.win, 'update-error', err, this.autoUpdate);
		});
		
		autoUpdater.on('download-progress', (progress) => {
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

		autoUpdater.on('update-downloaded', info => {
			const Api = require('./api.js');

			this.isUpdating = false;

			Util.log('info', 'Update downloaded: ' + JSON.stringify(info, null, 3));
			Util.send(this.win, 'update-downloaded');

			if (!this.autoUpdate) {
				Api.exit(this.win, '', true);
			} else {
				Util.send(this.win, 'update-confirm', this.autoUpdate, info);
			};
		});
	};

	isAllowed () {
		const { config } = ConfigManager;

		if (config.updateDisabled) {
			console.log('[UpdateManager].isAllowed, updateDisabled');
			return false;
		};

		const [ osMajor, osMinor, osPatch ] = String(process.getSystemVersion() || '').split('.');
		const [ appMajor, appMinor, appPatch ] = String(app.getVersion() || '').split('.');
		
		console.log('[UpdateManager].isAllowed, osVersion: ', [ osMajor, osMinor, osPatch ], 'appVersion', [ appMajor, appMinor, appPatch ]);

		if (is.windows && (osMajor <= 8)) {
			console.log('[UpdateManager].isAllowed, Windows version <= 8');
			return false;
		};

		if (is.macos && (osMajor <= 10)) {
			console.log('[UpdateManager].isAllowed, MacOS version <= 10');
			return false;
		};

		if (!/-(alpha|beta)/.test(appPatch) && isNaN(appPatch)) {
			console.log('[UpdateManager].isAllowed, App version is not valid');
			return false;
		};

		return true;
	};

	setChannel (channel) {
		autoUpdater.channel = channel;
		this.checkUpdate(false);
	};

	checkUpdate (auto) {
		if (!this.isAllowed() || this.isUpdating) {
			return;
		};

		autoUpdater.checkForUpdatesAndNotify().catch((err) => {
			Util.log('info', `checkForUpdatesAndNotify error: ${err}`);
		});

		this.setTimeout();
		this.autoUpdate = auto;
	};

	download () {
		autoUpdater.downloadUpdate();
	};

	relaunch () {
		Util.log('info', 'Relaunch');
		app.isQuiting = true;

		autoUpdater.quitAndInstall();
	};

	cancel () {
		this.isUpdating = false;
		this.clearTimeout();
	};

	setTimeout () {
		const { config } = ConfigManager;
		const t = Number(config.updateTimeout) || TIMEOUT_UPDATE;

		this.clearTimeout();
		this.timeout = setTimeout(() => this.checkUpdate(true), t);
	};

	clearTimeout () {
		clearTimeout(this.timeout);
	};

};

module.exports = new UpdateManager();