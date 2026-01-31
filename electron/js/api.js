const { app, shell, BrowserWindow, Notification, ipcMain, nativeTheme } = require('electron');
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
	hasPinSet = false;
	lastActivityTime = Date.now();
	notificationCallbacks = new Map();
	shownNotificationIds = new Set();
	pinTimer = null;
	pinTimeValue = 0;

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
			activeTabId: win.activeTabId,
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

		const view = Util.getActiveView(win);
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

	setPinChecked (win, isPinChecked, pinTimeout, hasPinSet) {
		this.isPinChecked = isPinChecked;
		if (hasPinSet !== undefined) {
			this.hasPinSet = hasPinSet;
		};
		if (isPinChecked) {
			this.lastActivityTime = Date.now();
			if (pinTimeout) {
				this.startPinTimer(win, pinTimeout);
			};
		} else {
			this.stopPinTimer();
		};

		// Update tab bar visibility for all windows when PIN state changes
		WindowManager.list.forEach(w => WindowManager.updateTabBarVisibility(w));
	};

	setHasPinSet (win, hasPinSet) {
		this.hasPinSet = hasPinSet;

		// Update tab bar visibility for all windows when PIN state changes
		WindowManager.list.forEach(w => WindowManager.updateTabBarVisibility(w));
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

	/**
	 * Starts or restarts the centralized pin timeout timer.
	 * Called when pin is enabled or user activity is detected.
	 * @param {BrowserWindow} win - The window (not used, for API consistency)
	 * @param {number} pinTimeout - Timeout in milliseconds
	 */
	startPinTimer (win, pinTimeout) {
		if (!pinTimeout || !this.isPinChecked) {
			return;
		};

		this.pinTimeValue = pinTimeout;
		this.lastActivityTime = Date.now();

		this.stopPinTimer();
		this.pinTimer = setTimeout(() => {
			if (!this.isPinChecked) {
				return;
			};

			this.isPinChecked = false;
			WindowManager.sendToAll('pin-check');
		}, pinTimeout);
	};

	/**
	 * Resets the pin timer due to user activity.
	 * Called from any renderer when user activity is detected.
	 */
	resetPinTimer (win) {
		if (!this.isPinChecked || !this.pinTimeValue) {
			return;
		};

		this.lastActivityTime = Date.now();

		this.stopPinTimer();
		this.pinTimer = setTimeout(() => {
			if (!this.isPinChecked) {
				return;
			};

			this.isPinChecked = false;
			WindowManager.sendToAll('pin-check');
		}, this.pinTimeValue);
	};

	/**
	 * Stops the pin timer.
	 * Called when pin is disabled or user logs out.
	 */
	stopPinTimer (win) {
		if (this.pinTimer) {
			clearTimeout(this.pinTimer);
			this.pinTimer = null;
		};
	};

	setTheme (win, theme) {
		this.setConfig(win, { theme });

		Util.setNativeThemeSource();

		const resolvedTheme = Util.getTheme();
		this.setBackground(win, resolvedTheme);
		
		WindowManager.sendToAll('set-theme', theme);
		WindowManager.sendToAllTabs('set-theme', theme);
	};

	setBackground (win, theme) {
		const bgColor = Util.isWayland() ? '#00000000' : Util.getBgColor(theme);

		BrowserWindow.getAllWindows().forEach(win => win && !win.isDestroyed() && win.setBackgroundColor(bgColor));
	};

	setZoom (win, zoom) {
		zoom = Number(zoom) || 0;
		zoom = Math.max(-5, Math.min(5, zoom));

		const view = Util.getActiveView(win);
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

			// Notify tabs.html about menu bar visibility change
			Util.send(win, 'set-menu-bar-visibility', show);

			// Clear any temporary visibility override
			delete win.tempMenuBarVisible;

			// Update tab bar height when menu bar visibility changes
			WindowManager.updateTabBarVisibility(win);

			win.setMenuBarVisibility(show);
			win.setAutoHideMenuBar(!show);
		});
	};

	// Temporary menu bar visibility for Alt key toggle (doesn't persist to config)
	setMenuBarTemporaryVisibility (win, show) {
		const { config } = ConfigManager;

		// Only allow temporary show when menu bar is hidden by config
		if (config.showMenuBar) {
			return;
		};

		if (show) {
			win.tempMenuBarVisible = true;
		} else {
			delete win.tempMenuBarVisible;
		};

		// Update view bounds
		WindowManager.updateTabBarVisibility(win);
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
		this.setConfig(win, { hardwareAcceleration: enabled }, () => this.exit(win, '', true, false));
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
		const maxRetries = is.windows ? 3 : 1;
		const retryDelay = 500; // ms

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			let value = null;
			let shouldRetry = false;

			try {
				value = await keytar.getPassword(KEYTAR_SERVICE, key);
				shouldRetry = (value === null);

				if (shouldRetry) {
					Util.log('warn', `[Api].keytarGet: Got null for key "${key}", attempt ${attempt}/${maxRetries}`);
				};
			} catch (err) {
				Util.log('error', `[Api].keytarGet: Error for key "${key}", attempt ${attempt}/${maxRetries}:`, err.message);
				shouldRetry = true;
			};

			if (!shouldRetry || (attempt >= maxRetries)) {
				return value;
			};

			// On Windows, retry with delay as Credential Manager can be temporarily
			// unavailable after sleep/reboot
			await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
		};

		return null;
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
		this.exit(win, '', true, true);
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

	openWindows (win, routes, token) {
		if (!routes || !routes.length) {
			return;
		};

		for (const route of routes) {
			WindowManager.createMain({ route, token, isChild: true });
		};
	};

	openTab (win, data, options) {
		WindowManager.createTab(win, data, options);
	};

	openTabs (win, tabs) {
		if (!tabs || !tabs.length) {
			return;
		};

		for (const tab of tabs) {
			WindowManager.createTab(win, tab.data, { setActive: false });
		};
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

	shutdown (win, relaunch, isUpdate) {
		Util.log('info', '[Api].shutdown, relaunch: ' + relaunch + ', isUpdate: ' + isUpdate);

		if (relaunch) {
			if (isUpdate) {
				UpdateManager.relaunch();
			} else {
				app.relaunch();
				app.exit(0);
			};
		} else {
			app.exit(0);
		};
	};

	exit (win, signal, relaunch, isUpdate) {
		if (app.isQuiting) {
			return;
		};

		app.isQuiting = true;

		// Save tabs before closing
		WindowManager.saveTabs(win);

		if (win && !win.isDestroyed()) {
			win.hide();
		};

		Util.log('info', '[Api].exit, relaunch: ' + relaunch + ', isUpdate: ' + isUpdate);

		// Send shutdown start to all tabs and wait for them to close their sessions
		this.closeAllTabSessions(win).then(() => {
			Util.send(win, 'shutdownStart');
			Server.stop(signal).then(() => this.shutdown(win, relaunch, isUpdate));
		});
	};

	/**
	 * Closes sessions for all tabs in the window
	 * @param {BrowserWindow} win - The window
	 * @returns {Promise} Resolves when all sessions are closed
	 */
	closeAllTabSessions (win) {
		if (!win || win.isDestroyed() || !win.views || win.views.length === 0) {
			return Promise.resolve();
		};

		const timeout = 5000; // 5 second timeout per tab
		const promises = win.views.map(view => {
			return new Promise(resolve => {
				if (!view.webContents || view.webContents.isDestroyed()) {
					resolve();
					return;
				};

				let handler = null;

				const cleanup = () => {
					if (handler) {
						ipcMain.removeListener('tab-session-closed', handler);
					};
					resolve();
				};

				const timeoutId = setTimeout(() => {
					Util.log('warn', `[Api].closeAllTabSessions: Timeout waiting for tab ${view.id} to close session`);
					cleanup();
				}, timeout);

				// Listen for the tab to signal it's ready to close
				handler = (event, readyTabId) => {
					if (readyTabId === view.id) {
						clearTimeout(timeoutId);
						cleanup();
					};
				};

				ipcMain.on('tab-session-closed', handler);

				// Tell the tab to close its session
				Util.sendToTab(win, view.id, 'close-session');
			});
		});

		return Promise.all(promises);
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
		const view = Util.getActiveView(win);
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

	getTabs (win) {
		const ConfigManager = require('./config.js');
		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasMultipleTabs = win.views && win.views.length > 1;

		return {
			tabs: (win.views || []).map(it => ({ id: it.id, data: it.data })),
			id: win.activeTabId || win.views?.[0]?.id,
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

	getWindowBounds (win) {
		return WindowManager.getBounds(win);
	};

	getCursorScreenPoint (win) {
		const { screen } = require('electron');
		return screen.getCursorScreenPoint();
	};

	/**
	 * Detaches a tab from its window, either creating a new window or moving to an existing one
	 * @param {BrowserWindow} win - Source window
	 * @param {Object} param - Parameters { tabId, mouseX, mouseY }
	 */
	detachTab (win, param) {
		const { tabId, mouseX, mouseY } = param || {};

		if (!tabId || !win || !win.views) {
			return;
		};

		// Don't detach if this is the only tab
		if (win.views.length <= 1) {
			return;
		};

		// Find the tab to detach
		const tab = win.views.find(it => it.id == tabId);
		if (!tab) {
			return;
		};

		// Get tab data before removing
		const tabData = { ...tab.data };

		// Check if there's another window at the mouse position
		const targetWin = this.getWindowAtPoint(mouseX, mouseY, win);

		if (targetWin) {
			// Transfer tab to existing window
			this.transferTabToWindow(win, targetWin, tabId, tabData);
		} else {
			// Create new window with this tab
			this.createWindowFromTab(win, tabId, tabData, mouseX, mouseY);
		};
	};

	/**
	 * Finds a window at the given screen coordinates, excluding a specific window
	 * @param {number} x - Screen X coordinate
	 * @param {number} y - Screen Y coordinate
	 * @param {BrowserWindow} excludeWin - Window to exclude from search
	 * @returns {BrowserWindow|null}
	 */
	getWindowAtPoint (x, y, excludeWin) {
		for (const win of WindowManager.list) {
			if (win === excludeWin || win.isDestroyed() || win.isChallenge) {
				continue;
			};

			const bounds = WindowManager.getBounds(win);
			if (!bounds) {
				continue;
			};

			if (x >= bounds.x && x <= bounds.x + bounds.width &&
				y >= bounds.y && y <= bounds.y + bounds.height) {
				return win;
			};
		};

		return null;
	};

	/**
	 * Transfers a tab from source window to target window
	 * @param {BrowserWindow} sourceWin - Source window
	 * @param {BrowserWindow} targetWin - Target window
	 * @param {string} tabId - Tab ID to transfer
	 * @param {Object} tabData - Tab data
	 */
	transferTabToWindow (sourceWin, targetWin, tabId, tabData) {
		// Create tab in target window first
		WindowManager.createTab(targetWin, tabData, { setActive: true });

		// Remove tab from source window after target is ready
		setTimeout(() => {
			WindowManager.removeTab(sourceWin, tabId, true);
			// Focus target window once after removal is done
			if (targetWin && !targetWin.isDestroyed()) {
				targetWin.focus();
			};
		}, 100);
	};

	/**
	 * Creates a new window from a detached tab
	 * @param {BrowserWindow} sourceWin - Source window
	 * @param {string} tabId - Tab ID to detach
	 * @param {Object} tabData - Tab data
	 * @param {number} mouseX - Mouse X screen coordinate
	 * @param {number} mouseY - Mouse Y screen coordinate
	 */
	createWindowFromTab (sourceWin, tabId, tabData, mouseX, mouseY) {
		// Get source window size
		const sourceBounds = WindowManager.getBounds(sourceWin);
		const width = sourceBounds?.width;
		const height = sourceBounds?.height;

		// Create new window first, then remove tab from source (to avoid race conditions)
		const newWin = WindowManager.createMain({
			isChild: true,
			initialBounds: { x: mouseX - 50, y: mouseY - 20, width, height },
			initialTabData: tabData,
		});

		// Remove tab from source window after new window is created
		setTimeout(() => {
			WindowManager.removeTab(sourceWin, tabId, true);
			// Focus new window once after removal is done
			if (newWin && !newWin.isDestroyed()) {
				newWin.focus();
			};
		}, 100);
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
		if (payload.type == 'openObject') {
			this.focusWindow(win);
		};
		
		Util.sendToActiveTab(win, 'payload-broadcast', payload);
	};

};

module.exports = new Api();
