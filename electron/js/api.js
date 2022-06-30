const { app, shell } = require('electron');
const keytar = require('keytar');
const { download } = require('electron-dl');

const ConfigManager = require('./config.js');
const WindowManager = require('./window.js');
const UpdateManager = require('./update.js');
const Server = require('./server.js');
const Util = require('./util.js');

const KEYTAR_SERVICE = 'Anytype';

class Api {

	appOnLoad (win) {
		Util.send(win, 'init', Util.dataPath(), ConfigManager.config, Util.isDarkTheme());
	};

	setConfig (win, config) {
		ConfigManager.set(config, (err) => { Util.send(win, 'config', ConfigManager.config); });
	};

	keytarSet (win, key, value) {
		if (key && value) {
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	};

	keytarGet (win, key) {
		console.log('[Api].keytarGet', key);

		keytar.getPassword(KEYTAR_SERVICE, key).then((value) => { 
			Util.send(win, 'keytarGet', key, value); 
		});
	};

	keytarDelete (win, key) {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	};

	updateDownload (win) {
		UpdateManager.download();
	};

	updateCancel (win) {
		UpdateManager.cancel();
	};

	async download (win, url) {
		await download(win, url, { saveAs: true });
	};

	winCommand (win, cmd, param) {
		WindowManager.command(win, cmd, param);
	};

	windowOpen (win, route) {
		WindowManager.createMain({ withState: false, route: route });
	};

	urlOpen (win, url) {
		shell.openExternal(url);
	};

	pathOpen (win, path) {
		shell.openPath(path);
	};

};

module.exports = new Api();