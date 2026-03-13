import { app, shell, BrowserWindow, Menu, Notification, ipcMain, session } from 'electron';
import { is } from 'electron-util';
import fs from 'fs';
import path from 'path';
import keytar from 'keytar';
import { download } from 'electron-dl';
import { exec, execFile } from 'child_process';
import checkDiskSpace from 'check-disk-space';

import MenuManager from './menu';
import ConfigManager from './config';
import WindowManager from './window';
import UpdateManager from './update';
import Server from './server';
import Util from './util';
import { getSafeStorage } from './safeStorage';

const KEYTAR_SERVICE = 'Anytype';

class Api {

	isPinChecked: boolean = false;
	hasPinSet: boolean = false;
	lastActivityTime: number = Date.now();
	notificationCallbacks: Map<string, any> = new Map();
	shownNotificationIds: Set<string> = new Set();
	pinTimer: ReturnType<typeof setTimeout> | null = null;
	pinTimeValue: number = 0;

	// Commands that should only be processed from the active tab.
	// Each tab has its own gRPC session/stream, so events like PayloadBroadcast
	// and notifications arrive in every tab independently. Without this guard,
	// the active tab would receive duplicate IPC messages (once per tab).
	activeTabOnly: Set<string> = new Set([ 'payloadBroadcast', 'notification' ]);

	getInitData (win: any, tabId: string): any {
		let route = win.route || '';

		win.route = '';

		// Try to get route from active tab data
		if (!route && tabId && win.views && (win.views.length > 0)) {
			const tab = win.views.find((it: any) => it.id == tabId);

			route = tab?.data?.route || '';
		};

		const tab = tabId ? (win.views || []).find((it: any) => it.id == tabId) : null;

		return {
			id: win.id,
			dataPath: Util.dataPath(),
			config: ConfigManager.config,
			isDark: Util.isDarkTheme(),
			isChild: win.isChild,
			route,
			spaceId: tab?.data?.spaceId || '',
			isPinChecked: this.isPinChecked,
			isPinned: tab?.data?.isPinned || false,
			languages: win.webContents.session.availableSpellCheckerLanguages,
			css: Util.getCss(),
			activeTabId: win.activeTabId,
			isSingleTab: win.views && (win.views.length == 1) && !win.views.some((it: any) => it.data && it.data.isPinned),
		};
	};

	logout (win: any): void {
		WindowManager.sendToAll('logout');
	};

	pinCheck (win?: any): void {
		WindowManager.sendToAll('pin-check');
		WindowManager.list.forEach((w: any) => WindowManager.updateTabBarVisibility(w));
	};

	pinSet (win: any): void {
		WindowManager.sendToAll('pin-set');
	};

	pinRemove (win: any): void {
		WindowManager.sendToAll('pin-remove');
	};

	paste (win: any): void {
		if (!win || win.isDestroyed()) {
			return;
		};

		const view = Util.getActiveView(win);
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			view.webContents.paste();
		};
	};

	setConfig (win: any, config: any, callBack?: () => void): void {
		ConfigManager.set(config, () => {
			Util.send(win, 'config', ConfigManager.config);

			// Update tab bar visibility if alwaysShowTabs changed
			if ('alwaysShowTabs' in config) {
				WindowManager.updateTabBarVisibility(win);
			};

			callBack?.();
		});
	};

	setPinChecked (win: any, isPinChecked: boolean, pinTimeout: number, hasPinSet?: boolean): void {
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
		WindowManager.list.forEach((w: any) => WindowManager.updateTabBarVisibility(w));
	};

	setHasPinSet (win: any, hasPinSet: boolean): void {
		this.hasPinSet = hasPinSet;

		// Update tab bar visibility for all windows when PIN state changes
		WindowManager.list.forEach((w: any) => WindowManager.updateTabBarVisibility(w));
	};

	checkPinTimeout (win: any, pinTimeout: number): void {
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
	startPinTimer (win: any, pinTimeout: number): void {
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
			this.pinCheck();
		}, pinTimeout);
	};

	/**
	 * Resets the pin timer due to user activity.
	 * Called from any renderer when user activity is detected.
	 */
	resetPinTimer (win: any): void {
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
			this.pinCheck();
		}, this.pinTimeValue);
	};

	/**
	 * Stops the pin timer.
	 * Called when pin is disabled or user logs out.
	 */
	stopPinTimer (win?: any): void {
		if (this.pinTimer) {
			clearTimeout(this.pinTimer);
			this.pinTimer = null;
		};
	};

	setTheme (win: any, theme: string): void {
		this.setConfig(win, { theme });

		Util.setNativeThemeSource();

		const resolvedTheme = Util.getTheme();
		this.setBackground(win, resolvedTheme);

		WindowManager.sendToAll('set-theme', theme);
		WindowManager.sendToAllTabs('set-theme', theme);
	};

	setBackground (win: any, theme: string): void {
		const useTransparent = Util.isWayland() && !Util.isKDE();
		const bgColor = useTransparent ? '#00000000' : Util.getBgColor(theme);

		BrowserWindow.getAllWindows().forEach(win => win && !win.isDestroyed() && win.setBackgroundColor(bgColor));
	};

	setZoom (win: any, zoom: number): void {
		zoom = Number(zoom) || 0;
		zoom = Math.max(-5, Math.min(5, zoom));

		const view = Util.getActiveView(win);
		if (view && view.webContents) {
			view.webContents.setZoomLevel(zoom);
			Util.sendToActiveTab(win, 'zoom');
		};
		this.setConfig(win, { zoom });
	};

	setHideTray (win: any, show: boolean): void {
		ConfigManager.set({ hideTray: !show }, () => {
			Util.send(win, 'config', ConfigManager.config);
			this.initMenu(win);
		});
	};

	setMenuBarVisibility (win: any, show: boolean): void {
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
	setMenuBarTemporaryVisibility (win: any, show: boolean): void {
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

	setHideSidebar (win: any, v: boolean): void {
		WindowManager.sendToAllTabs('set-hide-sidebar', v);
	};

	setAlwaysShowTabs (win: any, show: boolean): void {
		this.setConfig(win, { alwaysShowTabs: show }, () => {
			WindowManager.updateTabBarVisibility(win);
		});
	};

	setHardwareAcceleration (win: any, enabled: boolean): void {
		const store = getSafeStorage();

		store.set('hardwareAcceleration', enabled);
		this.setConfig(win, { hardwareAcceleration: enabled }, () => this.exit(win, '', true, false));
	};

	spellcheckAdd (win: any, s: string): void {
		win.webContents.session.addWordToSpellCheckerDictionary(s);
	};

	keytarSet (win: any, key: string, value: string): void {
		if (key && value) {
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	};

	async keytarGet (win: any, key: string): Promise<string | null> {
		const maxRetries = is.windows ? 3 : 1;
		const retryDelay = 500; // ms

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			let value: string | null = null;
			let shouldRetry = false;

			try {
				value = await keytar.getPassword(KEYTAR_SERVICE, key);
				shouldRetry = (value === null);

				if (shouldRetry) {
					Util.log('warn', `[Api].keytarGet: Got null for key "${key}", attempt ${attempt}/${maxRetries}`);
				};
			} catch (err: any) {
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

	keytarDelete (win: any, key: string): void {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	};

	updateCheck (win: any): void {
		if (this.isPinChecked || !(this as any).account) {
			UpdateManager.checkUpdate(false);
		};
	};

	updateDownload (win: any): void {
		UpdateManager.download();
	};

	updateConfirm (win: any): void {
		this.exit(win, '', true, true);
	};

	updateCancel (win: any): void {
		UpdateManager.cancel();
	};

	async download (win: any, url: string, options: any): Promise<void> {
		await download(win, url, options);
	};

	winCommand (win: any, cmd: string, param: any): void {
		WindowManager.command(win, cmd, param);
	};

	openWindow (win: any, route: string, token: string): void {
		WindowManager.createMain({ route, token, isChild: true });
	};

	openWindows (win: any, routes: string[], token: string): void {
		if (!routes || !routes.length) {
			return;
		};

		for (const route of routes) {
			WindowManager.createMain({ route, token, isChild: true });
		};
	};

	openTab (win: any, data: any, options?: any): boolean {
		const { isPinned, ...rest } = data || {};
		const route = rest.route || '';

		// Check if a pinned tab with this route already exists
		if (route) {
			const existing = WindowManager.findTabByRoute(win, route);
			if (existing && existing.data && existing.data.isPinned) {
				WindowManager.setActiveTab(win, existing.id);
				return true;
			};
		};

		if (options?.fireAnalytics) {
			Util.sendToActiveTab(win, 'analyticsEvent', 'AddTab', { route: 'Navigation' });
		};

		WindowManager.createTab(win, rest, options);
		return false;
	};

	switchToTabByRoute (win: any, route: string): boolean {
		const existing = WindowManager.findTabByRoute(win, route);
		if (existing && existing.data && existing.data.isPinned) {
			WindowManager.setActiveTab(win, existing.id);
			return true;
		};
		return false;
	};

	openTabs (win: any, tabs: any[]): void {
		if (!tabs || !tabs.length) {
			return;
		};

		for (const tab of tabs) {
			const route = tab.data?.route || '';

			// Skip if a tab with this route already exists
			if (route && WindowManager.findTabByRoute(win, route)) {
				continue;
			};

			WindowManager.createTab(win, tab.data, { setActive: false });
		};
	};

	openUrl (win: any, url: string): void {
		shell.openExternal(url);
	};

	openPath (win: any, fp: string): void {
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

	shutdown (win: any, relaunch: boolean, isUpdate: boolean): void {
		Util.log('info', '[Api].shutdown, relaunch: ' + relaunch + ', isUpdate: ' + isUpdate);

		// Flush browser localStorage to disk before exiting
		try {
			session.defaultSession.flushStorageData();
		} catch (e: any) {
			console.error('[Api].shutdown: Failed to flush storage data:', e.message);
		};

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

	exit (win: any, signal: string, relaunch: boolean, isUpdate?: boolean): void {
		if ((app as any).isQuiting) {
			return;
		};

		(app as any).isQuiting = true;

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
	closeAllTabSessions (win: any): Promise<void[]> {
		if (!win || win.isDestroyed() || !win.views || win.views.length === 0) {
			return Promise.resolve([]);
		};

		const timeout = 5000; // 5 second timeout per tab
		const promises = win.views.map((view: any) => {
			return new Promise<void>(resolve => {
				if (!view.webContents || view.webContents.isDestroyed()) {
					resolve();
					return;
				};

				let handler: any = null;

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
				handler = (event: any, readyTabId: string) => {
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

	setChannel (win: any, id: string): void {
		UpdateManager.setChannel(id);
		this.setConfig(win, { channel: id }, () => {
			this.initMenu(win);
		});
	};

	setInterfaceLang (win: any, lang: string): void {
		ConfigManager.set({ interfaceLang: lang }, () => {
			WindowManager.reloadAll();
			this.initMenu(win);
		});
	};

	initMenu (win: any): void {
		MenuManager.initMenu();
		MenuManager.initTray();
	};

	setSpellingLang (win: any, languages: string[]): void {
		languages = languages || [];

		win.webContents.session.setSpellCheckerLanguages(languages);
		win.webContents.session.setSpellCheckerEnabled(languages.length ? true : false);

		this.setConfig(win, { languages });
	};

	setBadge (win: any, t: string): void {
		if (is.macos) {
			app.dock.setBadge(t);
		};
	};

	setUserDataPath (win: any, p: string): void {
		this.setConfig(win, { userDataPath: p });
		app.setPath('userData', p);
		WindowManager.sendToAll('data-path', Util.dataPath());
	};

	showChallenge (win: any, param: any): void {
		WindowManager.createChallenge(param);
	};

	hideChallenge (win: any, param: any): void {
		WindowManager.closeChallenge(param);
	};

	reload (win: any, route: string): void {
		const view = Util.getActiveView(win);
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			// Only update route if a valid one is provided, otherwise keep the existing route
			if (route) {
				view.data = { ...view.data, route };
			};
			view.webContents.reload();
		};
	};

	moveNetworkConfig (win: any, src: string): { error?: string; path?: string } {
		if (!path.extname(src).match(/yml|yaml/i)) {
			return { error: `Invalid file extension: ${path.extname(src)}. Required YAML` };
		};

		const dst = path.join(Util.userPath(), 'config.yaml');
		try {
			fs.copyFileSync(src, dst);
			return { path: dst };
		} catch (e: any) {
			return { error: e.message };
		};
	};

	shortcutExport (win: any, dst: string, data: any): void {
		try {
			fs.writeFileSync(path.join(dst, 'shortcut.json'), JSON.stringify(data, null, '\t'), 'utf8');
		} catch (err) {};
	};

	shortcutImport (win: any, src: string): any {
		let data: any = {};
		if (fs.existsSync(src)) {
			try { data = JSON.parse(fs.readFileSync(src, 'utf8')); } catch (err) {};
		};
		return data;
	};

	focusWindow (win: any): void {
		if (!win || win.isDestroyed()) {
			return;
		};

		win.show();
		win.focus();
		win.setAlwaysOnTop(true);
		win.setAlwaysOnTop(false);
	};

	async checkDiskSpace (win: any): Promise<any> {
		return await checkDiskSpace(app.getPath('userData'));
	};

	async linuxDistro (win: any): Promise<any> {
		const load = require('linux-distro');
		return await load().catch((err: any) => {
			Util.log('error', `[Api].linuxDistro: ${err.message}`);
			return { name: 'Unknown', version: 'Unknown' };
		});
	};

	menu (win: any): void {
		MenuManager.menu.popup({ x: 12, y: 44 });
	};

	minimize (win: any): void {
		win.minimize();
	};

	maximize (win: any): void {
		win.isMaximized() ? win.unmaximize() : win.maximize();
	};

	close (win: any): void {
		win.close();
	};

	toggleFullScreen (win: any): void {
		win.setFullScreen(!win.isFullScreen());
	};

	getTabs (win: any): any {

		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasMultipleTabs = win.views && win.views.length > 1;

		return {
			tabs: (win.views || []).map((it: any) => ({ id: it.id, data: it.data })),
			id: win.activeTabId || win.views?.[0]?.id,
			isVisible: alwaysShow || hasMultipleTabs,
		};
	};

	setActiveTab (win: any, id: string): void {
		WindowManager.setActiveTab(win, id);
	};

	getTab (win: any, id: string): any {
		const view = (win.views || []).find((it: any) => it.id == id);
		return view ? { id: view.id, data: view.data } : null;
	};

	updateTab (win: any, id: string, data: any): void {
		WindowManager.updateTab(win, id, data);
	};

	removeTab (win: any, id: string, updateActive: boolean): void {
		WindowManager.removeTab(win, id, updateActive);
	};

	closeOtherWindows (win: any): void {
		WindowManager.closeOtherWindows(win);
	};

	closeOtherTabs (win: any, id: string, forced: boolean): void {
		WindowManager.closeOtherTabs(win, id, forced);
	};

	openRouteInTab (win: any, route: string, data: any): void {
		WindowManager.openRouteInTab(win, route, data);
	};

	openSpaceInTab (win: any, spaceId: string, uxType: any): void {
		WindowManager.openSpaceInTab(win, spaceId, uxType);
	};

	pinTab (win: any, id: string): void {
		WindowManager.pinTab(win, id);
	};

	unpinTab (win: any, id: string): void {
		WindowManager.unpinTab(win, id);
	};

	showTabContextMenu (win: any, param: any): void {
		const { tabId, isPinned } = param || {};

		if (!tabId) {
			return;
		};

		const items: any[] = [];

		if (isPinned) {
			items.push({
				label: Util.translate('electronMenuTabUnpin'),
				click: () => {
					WindowManager.unpinTab(win, tabId);
					Util.sendToActiveTab(win, 'analytics', 'UnpinTab');
				},
			});
		} else {
			items.push({
				label: Util.translate('electronMenuTabPin'),
				click: () => {
					WindowManager.pinTab(win, tabId);
					Util.sendToActiveTab(win, 'analytics', 'PinTab');
				},
			});
		};

		const isLastPinned = isPinned && (win.views.length <= 1);

		if (!isLastPinned) {
			items.push({ type: 'separator' });

			items.push({
				label: Util.translate('electronMenuTabClose'),
				click: () => WindowManager.removeTab(win, tabId, true),
			});

			items.push({
				label: Util.translate('electronMenuTabCloseOtherTabs'),
				click: () => WindowManager.closeOtherTabs(win, tabId),
			});
		};

		const menu = Menu.buildFromTemplate(items);
		menu.popup({
			window: win,
			callback: () => {
				Util.send(win, 'tab-context-menu-closed');
			},
		} as any);
	};

	reorderTabs (win: any, tabIds: string[]): void {
		WindowManager.reorderTabs(win, tabIds);
	};

	tabShowTooltip (win: any, data: any): void {
		Util.sendToActiveTab(win, 'tab-show-tooltip', data);
	};

	tabHideTooltip (win: any): void {
		Util.sendToActiveTab(win, 'tab-hide-tooltip');
	};

	setTabsDimmer (win: any, show: boolean): void {
		Util.send(win, 'set-tabs-dimmer', show);
	};

	getWindowBounds (win: any): any {
		return WindowManager.getBounds(win);
	};

	getCursorScreenPoint (win: any): any {
		const { screen } = require('electron');
		return screen.getCursorScreenPoint();
	};

	/**
	 * Detaches a tab from its window, either creating a new window or moving to an existing one
	 * @param {BrowserWindow} win - Source window
	 * @param {Object} param - Parameters { tabId, mouseX, mouseY }
	 */
	detachTab (win: any, param: any): void {
		const { tabId, mouseX, mouseY } = param || {};

		if (!tabId || !win || !win.views) {
			return;
		};

		// Don't detach if this is the only tab
		if (win.views.length <= 1) {
			return;
		};

		// Find the tab to detach
		const tab = win.views.find((it: any) => it.id == tabId);
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
	getWindowAtPoint (x: number, y: number, excludeWin: any): any {
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
	transferTabToWindow (sourceWin: any, targetWin: any, tabId: string, tabData: any): void {
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
	createWindowFromTab (sourceWin: any, tabId: string, tabData: any, mouseX: number, mouseY: number): void {
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

	notification (win: any, param: any): void {
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

	payloadBroadcast (win: any, payload: any): void {
		if (payload.type == 'openObject') {
			this.focusWindow(win);
		};

		Util.sendToActiveTab(win, 'payload-broadcast', payload);
	};

};

export default new Api();
