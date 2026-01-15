const { app, shell, BrowserWindow, Notification } = require('electron');
const { is } = require('electron-util');
const fs = require('fs');
const path = require('path');
const keytar = require('keytar');
const { download } = require('electron-dl');
const si = require('systeminformation');
const { exec, execFile } = require('child_process');
const checkDiskSpace = require('check-disk-space').default;

const MenuManager = require('./menu.js');
const ConfigManager = require('./config.js');
const WindowManager = require('./window.js');
const UpdateManager = require('./update.js');
const Server = require('./server.js');
const Util = require('./util.js');

const KEYTAR_SERVICE = 'Anytype';

class Api {

	isPinChecked = false;
	lastActivityTime = Date.now();
	notificationCallbacks = new Map();
	shownNotificationIds = new Set();

	getInitData (win, tabId) {
		let route = win.route || '';

		win.route = '';

		// Try to get route from active tab data
		if (!route && tabId && win.views && (win.views.length > 0)) {
			const tab = win.views.find(it => it.id == tabId);

			route = tab?.data?.route || '';
		};

		return {
			id: win.id,
			dataPath: Util.dataPath(),
			config: ConfigManager.config,
			isDark: Util.isDarkTheme(),
			isChild: win.isChild,
			route,
			isPinChecked: this.isPinChecked,
			languages: win.webContents.session.availableSpellCheckerLanguages,
			css: Util.getCss(),
			activeIndex: win.activeIndex || 0,
			isSingleTab: win.views && (win.views.length == 1),
		};
	};

	logout (win) {
		WindowManager.sendToAll('logout');
	};

	pinCheck (win) {
		WindowManager.sendToAll('pin-check');
	};

	pinSet (win) {
		WindowManager.sendToAll('pin-set');
	};

	pinRemove (win) {
		WindowManager.sendToAll('pin-remove');
	};

	paste (win) {
		if (!win || win.isDestroyed()) {
			return;
		};

		const view = win.views?.[win.activeIndex];
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			view.webContents.paste();
		};
	};

	setConfig (win, config, callBack) {
		ConfigManager.set(config, () => {
			Util.send(win, 'config', ConfigManager.config);

			// Update tab bar visibility if alwaysShowTabs changed
			if ('alwaysShowTabs' in config) {
				WindowManager.updateTabBarVisibility(win);
			};

			callBack?.();
		});
	};

	setPinChecked (win, isPinChecked) {
		this.isPinChecked = isPinChecked;
		if (isPinChecked) {
			this.lastActivityTime = Date.now();
		};
	};

	checkPinTimeout (win, pinTimeout) {
		if (!this.isPinChecked || !pinTimeout) {
			return;
		};

		const elapsed = Date.now() - this.lastActivityTime;
		if (elapsed >= pinTimeout) {
			this.isPinChecked = false;
			this.pinCheck(win);
		};
	};

	setTheme (win, theme) {
		this.setConfig(win, { theme });
		this.setBackground(win, theme);
		
		WindowManager.sendToAll('set-theme', Util.getTheme());
	};

	setBackground (win, theme) {
		const bgColor = Util.isWayland() ? '#00000000' : Util.getBgColor(theme);

		BrowserWindow.getAllWindows().forEach(win => win && !win.isDestroyed() && win.setBackgroundColor(bgColor));
	};

	setZoom (win, zoom) {
		zoom = Number(zoom) || 0;
		zoom = Math.max(-5, Math.min(5, zoom));

		const view = win.views?.[win.activeIndex];
		if (view && view.webContents) {
			view.webContents.setZoomLevel(zoom);
			Util.sendToActiveTab(win, 'zoom');
		};
		this.setConfig(win, { zoom });
	};

	setHideTray (win, show) {
		ConfigManager.set({ hideTray: !show }, () => {
			Util.send(win, 'config', ConfigManager.config);
			this.initMenu(win);
		});
	};

	setMenuBarVisibility (win, show) {
		ConfigManager.set({ showMenuBar: show }, () => {
			Util.send(win, 'config', ConfigManager.config);

			win.setMenuBarVisibility(show);
			win.setAutoHideMenuBar(!show);
		});
	};

	setAlwaysShowTabs (win, show) {
		this.setConfig(win, { alwaysShowTabs: show }, () => {
			WindowManager.updateTabBarVisibility(win);
		});
	};

	setHardwareAcceleration (win, enabled) {
		const Store = require('electron-store');
		const suffix = app.isPackaged ? '' : 'dev';
		const store = new Store({ name: [ 'localStorage', suffix ].join('-') });

		store.set('hardwareAcceleration', enabled);
		this.setConfig(win, { hardwareAcceleration: enabled }, () => this.exit(win, '', true));
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

	openWindow (win, route, token) {
		WindowManager.createMain({ route, token, isChild: true });
	};

	openTab (win, route, data) {
		WindowManager.createTab(win, { ...data, route });
	};

	openUrl (win, url) {
		shell.openExternal(url);
	};

	openPath (win, fp) {
		if (!fp || !fs.existsSync(fp)) {
			Util.log('error', '[Api].openPath: Invalid path:', fp);
			return;
		};

		fp = path.normalize(fp);

		if (is.macos) {
			execFile('open', [ fp ], (err) => {
				if (err) {
					Util.log('error', '[Api].openPath error:', err);
				};
			});
		} else 
		if (is.windows) {
			exec(`start "" "${fp}"`, { shell: 'cmd.exe' }, (err) => {
				if (err) {
					Util.log('error', '[Api].openPath error:', err);
				};
			});
		} else 
		if (is.linux) {
			execFile('xdg-open', [ fp ], (err) => {
				if (err) {
					Util.log('error', '[Api].openPath error:', err);
				};
			});
		};
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

	setChannel (win, id) {
		UpdateManager.setChannel(id); 
		this.setConfig(win, { channel: id }, () => {
			this.initMenu(win);
		});
	};

	setInterfaceLang (win, lang) {
		ConfigManager.set({ interfaceLang: lang }, () => {
			WindowManager.reloadAll();
			this.initMenu(win);
		});
	};

	initMenu (win) {
		MenuManager.initMenu();
		MenuManager.initTray();
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

	hideChallenge (win, param) {
		WindowManager.closeChallenge(param);
	};

	reload (win, route) {
		const view = win.views?.[win.activeIndex];
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			view.data = { ...view.data, route };
			view.webContents.reload();
		};
	};

	systemInfo (win) {
		const { config } = ConfigManager;

		if (config.systemInfo) {
			return;
		};

		ConfigManager.set({ systemInfo: true }, () => {
			si.getStaticData().then(data => {
				Util.send(win, 'commandGlobal', 'systemInfo', data);
			});
		});
	};

	moveNetworkConfig (win, src) {
		if (!path.extname(src).match(/yml|yaml/i)) {
			return { error: `Invalid file extension: ${path.extname(src)}. Required YAML` };
		};

		const dst = path.join(Util.userPath(), 'config.yaml');
		try {
			fs.copyFileSync(src, dst);
			return { path: dst };
		} catch (e) {
			return { error: e.message };
		};
	};

	shortcutExport (win, dst, data) {
		try {
			fs.writeFileSync(path.join(dst, 'shortcut.json'), JSON.stringify(data, null, '\t'), 'utf8');
		} catch (err) {};
	};

	shortcutImport (win, src) {
		let data = {};
		if (fs.existsSync(src)) {
			try { data = JSON.parse(fs.readFileSync(src, 'utf8')); } catch (err) {};
		};
		return data;
	};

	focusWindow (win) {
		if (!win || win.isDestroyed()) {
			return;
		};

		win.show();
		win.focus();
		win.setAlwaysOnTop(true);
		win.setAlwaysOnTop(false);
	};

	async checkDiskSpace (win) {
		return await checkDiskSpace(app.getPath('userData'));
	};

	async linuxDistro (win) {
		const load = require('linux-distro');
		return await load().catch(err => {
			Util.log('error', `[Api].linuxDistro: ${err.message}`);
			return { name: 'Unknown', version: 'Unknown' };
		});
	};

	menu (win) {
		MenuManager.menu.popup({ x: 12, y: 44 });
	};

	minimize (win) {
		win.minimize();
	};

	maximize (win) {
		win.isMaximized() ? win.unmaximize() : win.maximize();
	};

	close (win) {
		win.close();
	};

	toggleFullScreen (win) {
		win.setFullScreen(!win.isFullScreen());
	};

	createTab (win) {
		WindowManager.createTab(win);
	};

	getTabs (win) {
		const ConfigManager = require('./config.js');
		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasMultipleTabs = win.views && win.views.length > 1;

		return {
			tabs: (win.views || []).map(it => ({ id: it.id, data: it.data })),
			id: win.views[win.activeIndex || 0]?.id,
			isVisible: alwaysShow || hasMultipleTabs,
		};
	};

	setActiveTab (win, id) {
		WindowManager.setActiveTab(win, id);
	};

	getTab (win, id) {
		const view = (win.views || []).find(it => it.id == id);
		return view ? { id: view.id, data: view.data } : null;
	};

	updateTab (win, id, data) {
		WindowManager.updateTab(win, id, data);
	};

	removeTab (win, id, updateActive) {
		WindowManager.removeTab(win, id, updateActive);
	};

	closeOtherTabs (win, id) {
		WindowManager.closeOtherTabs(win, id);
	};

	reorderTabs (win, tabIds) {
		WindowManager.reorderTabs(win, tabIds);
	};

	setTabsDimmer (win, show) {
		Util.send(win, 'set-tabs-dimmer', show);
	};

	notification (win, param) {
		const { id, title, text, cmd, payload } = param || {};

		if (!text) {
			return;
		};

		// Prevent duplicate notifications across tabs
		if (id && this.shownNotificationIds.has(id)) {
			return;
		};

		if (id) {
			this.shownNotificationIds.add(id);

			// Clean up old notification IDs after 30 seconds
			setTimeout(() => this.shownNotificationIds.delete(id), 30000);
		};

		const notification = new Notification({
			title: String(title || ''),
			body: String(text || ''),
		});

		notification.on('click', () => {
			this.focusWindow(win);

			if (cmd) {
				Util.sendToActiveTab(win, 'notification-callback', cmd, payload);
			};
		});

		notification.show();
	};

	payloadBroadcast (win, payload) {
		this.focusWindow(win);
		Util.sendToActiveTab(win, 'payload-broadcast', payload);
	};

};

module.exports = new Api();
