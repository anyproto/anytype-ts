const { app } = require('electron');
const { is } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

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

		autoUpdater.logger = log;
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
			Util.send(this.win, 'update-available', this.autoUpdate);

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

		autoUpdater.on('update-downloaded', (info) => {
			const Api = require('./api.js');

			this.isUpdating = false;

			Util.log('info', 'Update downloaded: ' + JSON.stringify(info, null, 3));
			Util.send(this.win, 'update-downloaded');

			if (!this.autoUpdate) {
				Api.exit(this.win, '', true);
			} else {
				Util.send(this.win, 'update-confirm');
			};
		});
	};

	isAllowed () {
		const [ major, minor, patch ] = String(process.getSystemVersion() || '').split('.');

		if (is.windows && (major <= 8)) {
			return false;
		};

		return true;
	};

	setChannel (channel) {
		autoUpdater.channel = channel;
		this.checkUpdate(false);
	};

	checkUpdate (auto) {
		if (!this.isAllowed()) {
			return;
		};

		Util.log('info', 'isUpdating: ' + this.isUpdating);

		if (this.isUpdating) {
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