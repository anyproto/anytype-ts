const { app, shell, BrowserWindow } = require('electron');
const { is } = require('electron-util');
const fs = require('fs');
const path = require('path');
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
	isPinChecked = false;

	appOnLoad (win) {
		const cssPath = path.join(Util.userPath(), 'custom.css');

		let css = '';
		if (fs.existsSync(cssPath)) {
			css = fs.readFileSync(cssPath, 'utf8');
		};

		Util.send(win, 'init', {
			dataPath: Util.dataPath(),
			config: ConfigManager.config,
			isDark: Util.isDarkTheme(),
			isChild: win.isChild,
			route: win.route,
			account: this.account,
			isPinChecked: this.isPinChecked,
			languages: win.webContents.session.availableSpellCheckerLanguages,
			css: String(css || ''),
		});
		win.route = '';
	};

	logout (win) {
		WindowManager.sendToAll('logout');
	};

	pinCheck (win) {
		WindowManager.sendToAll('pin-check');
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

	setZoom (win, zoom) {
		zoom = Number(zoom) || 0;
		zoom = Math.max(-5, Math.min(5, zoom));

		win.webContents.setZoomLevel(zoom);
		Util.send(win, 'zoom');
		this.setConfig(win, { zoom });
	};

	setHideTray (win, show) {
		ConfigManager.set({ hideTray: !show }, () => {
			Util.send(win, 'config', ConfigManager.config);

			MenuManager.initMenu();
			MenuManager.initTray();
		});
	};

	setMenuBarVisibility (win, show) {
		ConfigManager.set({ hideMenuBar: !show }, () => {
			Util.send(win, 'config', ConfigManager.config);

			win.setMenuBarVisibility(show);
			win.setAutoHideMenuBar(!show);
		});
	};

	spellcheckAdd (win, s) {
		win.webContents.session.addWordToSpellCheckerDictionary(s);
	};

	keytarSet (win, key, value) {
		if (key && value) {
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	};

	async keytarGet (win, key) {
		return await keytar.getPassword(KEYTAR_SERVICE, key);
	};

	keytarDelete (win, key) {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	};

	updateCheck (win) {
		if (this.isPinChecked || !this.account) {
			UpdateManager.checkUpdate(false);
		};
	};

	updateDownload (win) {
		UpdateManager.download();
	};

	updateConfirm (win) {
		this.exit(win, '', true);
	};

	updateCancel (win) {
		UpdateManager.cancel();
	};

	async download (win, url, options) {
		await download(win, url, options);
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

		if (win && !win.isDestroyed()) {
			win.hide();
		};

		Util.log('info', '[Api].exit, relaunch: ' + relaunch);
		Util.send(win, 'shutdownStart');

		Server.stop(signal).then(() => this.shutdown(win, relaunch));
	};

	setInterfaceLang (win, lang) {
		ConfigManager.set({ interfaceLang: lang }, (err) => {
			WindowManager.reloadAll();
			MenuManager.initMenu();
			MenuManager.initTray();
		});
	};

	setSpellingLang (win, languages) {
		languages = languages || [];

		win.webContents.session.setSpellCheckerLanguages(languages);
		win.webContents.session.setSpellCheckerEnabled(languages.length ? true : false);

		this.setConfig(win, { languages });
	};

	setBadge (win, t) {
		if (is.macos) {
			app.dock.setBadge(t);
		};
	};

	setUserDataPath (win, p) {
		this.setConfig(win, { userDataPath: p });
		app.setPath('userData', p);
		WindowManager.sendToAll('data-path', Util.dataPath());
	};

	showChallenge (win, param) {
		WindowManager.createChallenge(param);
	};

	reload (win, route) {
		win.route = route;
		win.webContents.reload();
	};

};

module.exports = new Api();