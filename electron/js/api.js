const { app, shell, BrowserWindow } = require('electron');
const keytar = require('keytar');
const { download } = require('electron-dl');

const MenuManager = require('./menu.js');
const ConfigManager = require('./config.js');
const WindowManager = require('./window.js');
const UpdateManager = require('./update.js');
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
		ConfigManager.set(config, (err) => Util.send(win, 'config', ConfigManager.config));
	};

	setAccount (win, account) {
		this.account = account;
	};

	setPinChecked (win, isPinChecked) {
		this.isPinChecked = isPinChecked;
	};

	setTheme (win, theme) {
		this.setConfig(win, { theme });
	};

	setBackground (win, theme) {
		BrowserWindow.getAllWindows().forEach(win => win.setBackgroundColor(Util.getBgColor(theme)));
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
		Util.send(win, 'zoom');
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
		keytar.getPassword(KEYTAR_SERVICE, key).then(value => { 
			this.phrase = value;
			Util.send(win, 'keytarGet', key, value); 
		});
	};

	keytarDelete (win, key) {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	};

	updateCheck (win) {
		if (this.isPinChecked) {
			UpdateManager.checkUpdate(false);
		};
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

	exit (win, signal, relaunch) {
		if (app.isQuiting) {
			return;
		};

		if (win) {
			win.hide();
		};

		Util.log('info', '[Api].exit, relaunch: ' + relaunch);
		Util.send(win, 'shutdownStart');

		Server.stop(signal).then(() => { this.shutdown(win, relaunch); });
	};

	reloadAllWindows () {
		BrowserWindow.getAllWindows().forEach(win => win.webContents.reload());
	};

	changeInterfaceLang (win, lang) {
		console.log('[changeInterfaceLang]', lang);

		ConfigManager.set({ interfaceLang: lang }, (err) => {
			this.reloadAllWindows();

			MenuManager.initMenu();
			MenuManager.initTray();
		});
	};

};

module.exports = new Api();