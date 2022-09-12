const { app, shell, nativeTheme } = require('electron');
const keytar = require('keytar');
const { download } = require('electron-dl');

const ConfigManager = require('./config.js');
const WindowManager = require('./window.js');
const UpdateManager = require('./update.js');
const MenuManager = require('./menu.js');
const Server = require('./server.js');
const Util = require('./util.js');

const KEYTAR_SERVICE = 'Anytype';

class Api {

	account = null;
	phrase = '';
	isPinChecked = false;

	appOnLoad (win) {
		Util.send(win, 'init', {
			dataPath: Util.dataPath(),
			config: ConfigManager.config,
			isDark: Util.isDarkTheme(),
			isChild: win.isChild,
			route: win.route,
			account: this.account,
			phrase: this.phrase,
			isPinChecked: this.isPinChecked,
			languages: win.webContents.session.availableSpellCheckerLanguages,
		});

		win.route = '';
	};

	setConfig (win, config) {
		ConfigManager.set(config, (err) => { Util.send(win, 'config', ConfigManager.config); });

		if (undefined !== config.allowBeta) {
			MenuManager.initMenu();
		};
	};

	setAccount (win, account) {
		this.account = account;
	};

	setPinChecked (win, isPinChecked) {
		this.isPinChecked = isPinChecked;
	};

	setTheme (win, theme) {
		nativeTheme.themeSource = theme || 'light';
		this.setConfig(win, { theme });
	};

	setLanguage (win, languages) {
		languages = languages || [];

		win.webContents.session.setSpellCheckerLanguages(languages);
		win.webContents.session.setSpellCheckerEnabled(languages.length ? true : false);

		this.setConfig(win, { languages });
	};

	setZoom (win, zoom) {
		zoom = Number(zoom) || 0;
		zoom = Math.max(-5, Math.min(5, zoom));

		win.webContents.setZoomLevel(zoom);
		this.setConfig(win, { zoom });
	};

	spellcheckAdd (win, s) {
		win.webContents.session.addWordToSpellCheckerDictionary(s);
	};

	keytarSet (win, key, value) {
		if (key && value) {
			this.phrase = value;
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	};

	keytarGet (win, key) {
		keytar.getPassword(KEYTAR_SERVICE, key).then((value) => { 
			this.phrase = value;
			Util.send(win, 'keytarGet', key, value); 
		});
	};

	keytarDelete (win, key) {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	};

	updateDownload (win) {
		UpdateManager.download();
	};

	updateConfirm (win) {
		this.exit(win, true);
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
		WindowManager.createMain({ route, isChild: true });
	};

	urlOpen (win, url) {
		shell.openExternal(url);
	};

	pathOpen (win, path) {
		shell.openPath(path);
	};

	shutdown (win, relaunch) {
		Util.log('info', '[Api].shutdown, relaunch: ' + relaunch);

		if (relaunch) {
			UpdateManager.relaunch();
		} else {
			app.exit(0);
		};
	};

	exit (win, relaunch) {
		if (app.isQuiting) {
			return;
		};

		if (win) {
			win.hide();
		};

		Util.log('info', '[Api].exit, relaunch: ' + relaunch);
		Util.send(win, 'shutdownStart');

		Server.stop().then(() => { this.shutdown(win, relaunch); });
	};

};

module.exports = new Api();