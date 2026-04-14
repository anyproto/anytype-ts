import { app, BrowserWindow, WebContentsView, nativeImage, dialog, ipcMain } from 'electron';
import { is, fixPathForAsarUnpack } from 'electron-util';
import path from 'path';
import windowStateKeeper from 'electron-window-state';
import * as remote from '@electron/remote/main';
import { randomUUID } from 'crypto';

import Api from './api';
import ConfigManager from './config';
import UpdateManager from './update';
import MenuManager from './menu';
import Util from './util';
import { getSafeStorage } from './safeStorage';
import { AppWindow, TabView, TabData, CreateMainOptions, CreateTabOptions, SavedTabState, SavedWindowsState, Bounds } from './types';

const port: string = Util.getPort();

const TABS_STORAGE_KEY = 'savedTabs';
const WINDOWS_STORAGE_KEY = 'savedWindows';

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const NEW_WINDOW_SHIFT = 30;
const TAB_BAR_HEIGHT = 52;
const MENU_BAR_HEIGHT = 28;

class WindowManager {

	list: Set<AppWindow> = new Set();

	create (options: Partial<CreateMainOptions> & Record<string, any>, param: Record<string, any>): AppWindow {

		const { showMenuBar } = ConfigManager.config;
		const theme = Util.getTheme();
		const bgColor = Util.getBgColor(theme);

		param = Object.assign({
			backgroundColor: bgColor,
			show: false,
			titleBarStyle: 'hidden-inset',
		}, param);
		param.webPreferences = Object.assign(this.getPreferencesForNewWindow(), param.webPreferences || {});

		const bw = new BrowserWindow(param);

		remote.enable(bw.webContents);

		const win = Object.assign(bw, options) as AppWindow;
		win.windowId = win.id;

		this.list.add(win);

		win.on('closed', () => {
			this.list.delete(win);
		});

		win.on('focus', () => {
			UpdateManager.setWindow(win);
			MenuManager.setWindow(win);

			// Restore focus to active tab's webContents when window regains focus
			// Use setImmediate to avoid focus race conditions when multiple windows exist
			setImmediate(() => {
				if (win.isDestroyed() || !win.isFocused()) {
					return;
				};
				const activeView = Util.getActiveView(win);
				if (activeView && activeView.webContents && !activeView.webContents.isDestroyed()) {
					activeView.webContents.focus();
				};
			});
		});

		win.on('enter-full-screen', () => {
			win.setMenuBarVisibility(false);
			win.setAutoHideMenuBar(true);
			Util.send(win, 'enter-full-screen');
		});
		win.on('leave-full-screen', () => {
			const { showMenuBar } = ConfigManager.config;
			win.setMenuBarVisibility(showMenuBar);
			win.setAutoHideMenuBar(!showMenuBar);
			Util.send(win, 'leave-full-screen');
		});
		win.on('swipe', (e: Electron.Event, direction: string) => Util.send(win, 'commandGlobal', 'mouseNavigation', direction));

		win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
			Api.openUrl(win, url);
			return { action: 'deny' as const };
		});

		win.setMenuBarVisibility(showMenuBar);
		win.setAutoHideMenuBar(!showMenuBar);

		return win;
	};

	createMain (options: CreateMainOptions): AppWindow {
		const { isChild, initialBounds, initialTabData, restoredTabs } = options;
		const image = nativeImage.createFromPath(path.join(Util.imagePath(), 'icons', '512x512.png'));

		let state: ReturnType<typeof windowStateKeeper> | Record<string, any> = {};
		let param: Record<string, any> = {
			minWidth: MIN_WIDTH,
			minHeight: MIN_HEIGHT,
			width: DEFAULT_WIDTH,
			height: DEFAULT_HEIGHT,
		};

		if (is.macos) {
			app.dock.setIcon(image);

			param.frame = false;
			param.titleBarStyle = 'hidden';
			param.icon = path.join(Util.imagePath(), 'icon.icns');
			param.trafficLightPosition = { x: 12, y: 19 };
		} else
		if (is.windows) {
			param.frame = false;
			param.titleBarStyle = 'hidden';
			param.icon = path.join(Util.imagePath(), 'icons', '256x256.ico');
		} else
		if (is.linux) {
			param.icon = image;
		};

		if (!isChild) {
			try {
				state = windowStateKeeper({
					defaultWidth: DEFAULT_WIDTH,
					defaultHeight: DEFAULT_HEIGHT,
					maximize: true,
					fullScreen: true,
				});

				param = Object.assign(param, {
					x: state.x,
					y: state.y,
					width: state.width,
					height: state.height,
				});
			} catch (e) {
				console.error('[WindowManager] Failed to restore window state:', e);
			};
		} else if (initialBounds) {
			// Use provided bounds for detached tab windows
			param = Object.assign(param, {
				x: initialBounds.x,
				y: initialBounds.y,
				width: initialBounds.width || DEFAULT_WIDTH,
				height: initialBounds.height || DEFAULT_HEIGHT,
			});
		} else {
			const { width, height } = this.getScreenSize();

			param = Object.assign(param, this.getWindowPosition(param as { width: number; height: number }, width, height));
		};

		const win = this.create(options, param);

		if (!isChild) {
			state.manage(win);
		};

		win.loadURL(this.getUrlForNewWindow());

		win.once('ready-to-show', () => {
			if (!isChild && state.isMaximized) {
				win.maximize();
			};
			if (!isChild && state.isFullScreen) {
				win.setFullScreen(true);
			};
			win.show();
		});
		win.on('enter-full-screen', () => MenuManager.initMenu());
		win.on('leave-full-screen', () => MenuManager.initMenu());
		const updateViewBounds = () => {
			const bounds = this.getBounds(win);
			if (!bounds) {
				return;
			};

			const activeView = Util.getActiveView(win);
			if (activeView) {
				const tabBarHeight = this.getTabBarHeight(win);
				activeView.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });
			};
		};

		win.on('resize', updateViewBounds);
		win.on('maximize', updateViewBounds);
		win.on('unmaximize', updateViewBounds);
		win.on('restore', updateViewBounds);

		// Handle tab creation
		if (initialTabData) {
			// Create window from detached tab with provided data
			this.createTab(win, initialTabData, { setActive: true });
		} else {
			// Try to restore saved tabs. If this window was created as part of multi-window
			// restoration, restoredTabs is provided explicitly; otherwise read from storage.
			const savedState = restoredTabs || this.loadTabs();
			if (savedState && savedState.tabs && savedState.tabs.length > 0) {
				const activeIndex = savedState.activeIndex || 0;

				// Create all tabs from saved state with lazy loading for non-active tabs
				for (let i = 0; i < savedState.tabs.length; i++) {
					const tabData = savedState.tabs[i];
					const isActiveTab = i === activeIndex;

					// Defer loading for non-active tabs, don't auto-activate
					this.createTab(win, tabData.data || {}, {
						deferLoad: !isActiveTab,
						setActive: false,
					});
				};

				// Set the active tab (this will trigger loading for the active tab)
				if (win.views && win.views[activeIndex]) {
					this.setActiveTab(win, win.views[activeIndex].id);
				};
			} else {
				this.createTab(win, {}, { setActive: true });
			};
		};

		return win;
	};

	createChallenge (options: { challenge: string } & Record<string, any>): AppWindow {
		console.log('[WindowManager] createChallenge called', options);
		// Check if challenge window already exists
		for (const win of this.list) {
			if (win && win.isChallenge && (win.challenge == options.challenge) && !win.isDestroyed()) {
				console.log('[WindowManager] Challenge window already exists');
				return win;
			};
		};

		console.log('[WindowManager] Creating new challenge window');
		const { width, height } = this.getScreenSize();

		const win = this.create({ ...options, isChallenge: true }, {
			backgroundColor: '',
			width: 424,
			height: 232,
			x: Math.floor(width / 2 - 212),
			y: Math.floor(height - 282),
			titleBarStyle: 'hidden',
			alwaysOnTop: true,
			focusable: true,
			skipTaskbar: true,
		});

		win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		win.loadURL(`file://${path.join(Util.appPath, 'dist', 'challenge', 'index.html')}`);
		win.setMenu(null);
		win.showInactive(); // show inactive to prevent focus loose from other app

		win.webContents.once('did-finish-load', () => {
			win.webContents.send('challenge', options);
		});

		setTimeout(() => this.closeChallenge(options), 30000);
		return win;
	};

	getScreenSize (): { width: number; height: number } {
		const ret = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

		try {
			const { screen } = require('electron');
			const primaryDisplay = screen.getPrimaryDisplay();
			const { width, height } = primaryDisplay.workAreaSize;

			ret.width = width;
			ret.height = height;
		} catch (e) {};

		return ret;
	};

	closeChallenge (options: { challenge: string }): void {
		for (const win of this.list) {
			if (win && win.isChallenge && (win.challenge == options.challenge) && !win.isDestroyed()) {
				win.close();
			};
		};
	};

	command (win: AppWindow, cmd: string, param: Record<string, any>): void {
		param = param || {};

		switch (cmd) {
			case 'menu':
				MenuManager.menu.popup({ x: 16, y: 38 });
				break;

			case 'printHtml':
			case 'printPdf':
				const ext = cmd.replace(/print/, '').toLowerCase();
				dialog.showSaveDialog(win, {
					buttonLabel: 'Export',
					defaultPath: `${app.getPath('documents')}/${param.name}.${ext}`,
					properties: [ 'createDirectory', 'showOverwriteConfirmation' ],
				}).then((result: Electron.SaveDialogReturnValue) => {
					const fp = result.filePath;
					if (!fp) {
						Util.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
					} else {
						(Util[cmd as 'printHtml' | 'printPdf'] as Function)(win, path.dirname(fp), path.basename(fp), param.options);
					};
				}).catch(() => {
					Util.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
				});
				break;
		};
	};

	createTab (win: AppWindow, param: TabData, options?: CreateTabOptions): TabView {

		const id = randomUUID();
		const { deferLoad, setActive } = options || {};
		const wcv = new WebContentsView({
			webPreferences: {
				...this.getPreferencesForNewWindow(),
				additionalArguments: [ `--tab-id=${id}`, `--win-id=${win.id}` ],
			},
		});

		win.views = win.views || [];
		const view = Object.assign(wcv, { id, data: { ...param }, isLoaded: false }) as TabView;
		win.views.push(view);
		win.activeTabId = win.activeTabId || id;

		view.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
			Api.openUrl(win, url);
			return { action: 'deny' as const };
		});

		view.webContents.on('context-menu', (e: Electron.Event, param: Electron.ContextMenuParams) => {
			Util.sendToTab(win, view.id, 'spellcheck', param.misspelledWord, param.dictionarySuggestions, param.x, param.y, param.selectionRect);
		});

		// Alt key handling for menu bar toggle (Windows/Linux)
		// This allows Alt to work even when focus is on the tab content, not the tabs.html
		if (is.windows || is.linux) {
			let altKeyPressed = false;
			let altKeyUsedWithOther = false;

			view.webContents.on('before-input-event', (e: Electron.Event, input: Electron.Input) => {
				const { showMenuBar } = ConfigManager.config;

				// Only handle Alt toggle if menu bar is hidden by config
				if (showMenuBar) {
					return;
				};

				if (input.type === 'keyDown') {
					if (input.key === 'Alt') {
						altKeyPressed = true;
						altKeyUsedWithOther = false;
					} else
					if (altKeyPressed) {
						// Alt was used as modifier with another key
						altKeyUsedWithOther = true;
					};
				} else
				if ((input.type === 'keyUp') && (input.key === 'Alt')) {
					// Alt was released - toggle menu bar if it wasn't used as modifier
					if (altKeyPressed && !altKeyUsedWithOther) {
						Util.send(win, 'alt-key-toggle');
					};
					altKeyPressed = false;
					altKeyUsedWithOther = false;
				};
			});
		};

		// Re-apply tab state after every load (initial and reload after resume)
		view.webContents.on('did-finish-load', () => {
			view.isLoaded = true;
			const hasPinnedTab = win.views && win.views.some((it: TabView) => it.data && it.data.isPinned);
			const isSingleTab = win.views && (win.views.length == 1) && !hasPinnedTab;
			Util.sendToTab(win, view.id, 'set-single-tab', isSingleTab);

			// Apply zoom level from config
			const zoom = Number(ConfigManager.config.zoom) || 0;
			if (zoom) {
				view.webContents.setZoomLevel(zoom);
			};

			// Also update tab bar visibility in case state changed during loading
			this.updateTabBarVisibility(win);
		});

		// Recover from renderer crashes (e.g. GPU process lost after suspend)
		view.webContents.on('render-process-gone', (e: Electron.Event, details: Electron.RenderProcessGoneDetails) => {
			Util.log('info', `[Window] render-process-gone: ${details.reason}`);

			if (details.reason !== 'clean-exit') {
				setTimeout(() => {
					if (view.webContents && !view.webContents.isDestroyed()) {
						view.webContents.reload();
					};
				}, 500);
			};
		});

		remote.enable(view.webContents);

		// Only load the tab content if not deferred
		if (!deferLoad) {
			view.webContents.loadURL(this.getUrlForNewTab());
		};

		Util.send(win, 'create-tab', { id: view.id, data: view.data });

		// Only set active if not explicitly disabled
		if (setActive !== false) {
			this.setActiveTab(win, id);
		};

		this.updateTabBarVisibility(win);

		return view;
	};

	getBounds (win: AppWindow): Bounds | null {
		if (!win || win.isDestroyed()) {
			return null;
		};

		return win.getContentBounds();
	};

	setActiveTab (win: AppWindow, id: string): void {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find((it: TabView) => it.id == id);
		if (!view) {
			return;
		};

		const currentActive = Util.getActiveView(win);
		if (currentActive) {
			win.contentView.removeChildView(currentActive);
		};

		const bounds = this.getBounds(win);
		const tabBarHeight = this.getTabBarHeight(win);

		view.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });

		win.activeTabId = id;
		win.contentView.addChildView(view);

		// Lazy load: if the tab hasn't been loaded yet, load it now
		if (!view.isLoaded && view.webContents && !view.webContents.isDestroyed() && !view.webContents.isLoading()) {
			view.webContents.loadURL(this.getUrlForNewTab());
		};

		// Focus the new tab's webContents to receive keyboard events
		view.webContents.focus();

		win.webContents.send('set-active-tab', id);
		Util.sendToAllTabs(win, 'set-active-tab', id);
	};

	updateTab (win: AppWindow, id: string, data: Partial<TabData>): void {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find((it: TabView) => it.id == id);
		if (!view) {
			return;
		};

		view.data = Object.assign(view.data || {}, data);
		Util.send(win, 'update-tab', { id: view.id, data: view.data });
	};

	removeTab (win: AppWindow, id: string, updateActive: boolean): void {
		id = String(id || '');

		if (!id || !win.views || (win.views.length <= 1)) {
			return;
		};

		const view = win.views.find((it: TabView) => it.id == id);
		const index = win.views.findIndex((it: TabView) => it.id == id);

		if (win.activeTabId == id) {
			win.contentView.removeChildView(view);
		};

		win.views.splice(index, 1);
		Util.send(win, 'remove-tab', id);
		this.updateTabBarVisibility(win);

		if (updateActive && (win.activeTabId == id)) {
			const newIndex = index < win.views.length ? index : index - 1;
			this.setActiveTab(win, win.views[newIndex]?.id);
		};

		// Send close-session to allow renderer to close its session, then destroy the webContents
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			const timeout = 5000; // 5 second timeout
			let handler: ((...args: any[]) => void) | null = null;

			const cleanup = () => {
				if (handler) {
					ipcMain.removeListener('tab-session-closed', handler);
				};
				if (view.webContents && !view.webContents.isDestroyed()) {
					view.webContents.close();
				};
			};

			const timeoutId = setTimeout(() => {
				Util.log('warn', `[WindowManager].removeTab: Timeout waiting for tab ${id} to close session`);
				cleanup();
			}, timeout);

			// Listen for the tab to signal it's ready to close
			handler = (event: Electron.Event, readyTabId: string) => {
				if (readyTabId === id) {
					clearTimeout(timeoutId);
					cleanup();
				};
			};

			ipcMain.on('tab-session-closed', handler);

			// Tell the tab to close its session
			Util.sendToTab(win, view.id, 'close-session');
		};
	};

	closeActiveTab (win: AppWindow): void {

		const activeView = win.views.find((it: TabView) => it.id == win.activeTabId);

		if (activeView && activeView.data && activeView.data.isPinned) {
			Api.close(win);
			return;
		};

		if (win.views.length > 1) {
			this.removeTab(win, win.activeTabId, true);
		} else {
			Api.close(win);
		};
	};

	closeOtherWindows (win: AppWindow): void {
		this.list.forEach((it: AppWindow) => {
			if ((it !== win) && !it.isDestroyed()) {
				it.close();
			};
		});
	};

	closeOtherTabs (win: AppWindow, id: string, forced?: boolean): void {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const views = win.views.filter((it: TabView) => {
			if (it.id == id) {
				return false;
			};

			if (!forced && it.data && it.data.isPinned) {
				return false;
			};

			return true;
		});

		views.forEach((view: TabView) => {
			this.removeTab(win, view.id, false);
		});

		this.setActiveTab(win, id);
	};

	findTabByRoute (win: AppWindow, route: string): TabView | null {
		if (!win || !win.views || !route) {
			return null;
		};
		return win.views.find((it: TabView) => it.data && (it.data.route === route)) || null;
	};

	openRouteInTab (win: AppWindow, route: string, data: Partial<TabData>): void {
		if (!win || !win.views || !route) {
			return;
		};

		const existing = this.findTabByRoute(win, route);
		if (existing) {
			this.setActiveTab(win, existing.id);
		} else {
			this.createTab(win, { ...data, route }, { setActive: true });
		};
	};

	openSpaceInTab (win: AppWindow, spaceId: string, spaceType: number): void {
		if (!win || !win.views || !spaceId) {
			return;
		};

		const existing = win.views.find((it: TabView) => it.data && (it.data.spaceId === spaceId));
		if (existing) {
			this.setActiveTab(win, existing.id);
		} else {
			this.createTab(win, { spaceId, spaceType }, { setActive: true });
		};
	};

	pinTab (win: AppWindow, id: string): void {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find((it: TabView) => it.id == id);
		if (!view) {
			return;
		};

		view.data = view.data || {};
		view.data.isPinned = true;

		// Move to rightmost pinned position
		const index = win.views.indexOf(view);
		win.views.splice(index, 1);

		const lastPinnedIndex = win.views.reduce((acc: number, v: TabView, i: number) => (v.data && v.data.isPinned) ? i : acc, -1);
		win.views.splice(lastPinnedIndex + 1, 0, view);

		Util.sendToTab(win, id, 'set-pinned', true);
		this.sendUpdateTabs(win);
		this.updateTabBarVisibility(win);
	};

	unpinTab (win: AppWindow, id: string): void {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find((it: TabView) => it.id == id);
		if (!view) {
			return;
		};

		view.data = view.data || {};
		view.data.isPinned = false;

		// Move to leftmost unpinned position (right after last pinned tab)
		const index = win.views.indexOf(view);
		win.views.splice(index, 1);

		const lastPinnedIndex = win.views.reduce((acc: number, v: TabView, i: number) => (v.data && v.data.isPinned) ? i : acc, -1);
		win.views.splice(lastPinnedIndex + 1, 0, view);

		Util.sendToTab(win, id, 'set-pinned', false);
		this.sendUpdateTabs(win);
		this.updateTabBarVisibility(win);
	};

	sendUpdateTabs (win: AppWindow): void {

		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasPinnedTab = win.views && win.views.some((it: TabView) => it.data && it.data.isPinned);
		const isVisible = alwaysShow || hasPinnedTab || (win.views && win.views.length > 1);

		Util.send(win, 'update-tabs',
			win.views.map((it: TabView) => ({ id: it.id, data: it.data })),
			win.activeTabId,
			isVisible
		);
	};

	reorderTabs (win: AppWindow, tabIds: string[]): void {
		if (!win.views || !tabIds || !tabIds.length) {
			return;
		};

		// Reorder the views array based on the new tab order
		const newViews: TabView[] = [];
		tabIds.forEach((id: string) => {
			const view = win.views.find((v: TabView) => v.id == id);
			if (view) {
				newViews.push(view);
			};
		});

		// Validate zone separation: pinned tabs must come before unpinned tabs
		let seenUnpinned = false;
		let isValid = true;
		for (const view of newViews) {
			const isPinned = view.data && view.data.isPinned;
			if (isPinned && seenUnpinned) {
				isValid = false;
				break;
			};
			if (!isPinned) {
				seenUnpinned = true;
			};
		};

		if (!isValid) {
			// Reject reorder and send current state back
			this.sendUpdateTabs(win);
			return;
		};

		// Update the views array
		win.views = newViews;

		this.sendUpdateTabs(win);
		this.updateTabBarVisibility(win);
	};

	nextTab (win: AppWindow): void {
		if (!win.views || (win.views.length <= 1)) {
			return;
		};

		const index = win.views.findIndex((it: TabView) => it.id == win.activeTabId);
		const nextIndex = (index + 1) % win.views.length;

		this.setActiveTab(win, win.views[nextIndex].id);
	};

	prevTab (win: AppWindow): void {
		if (!win.views || (win.views.length <= 1)) {
			return;
		};

		const index = win.views.findIndex((it: TabView) => it.id == win.activeTabId);
		const prevIndex = (index - 1 + win.views.length) % win.views.length;

		this.setActiveTab(win, win.views[prevIndex].id);
	};

	getPreferencesForNewWindow (): Electron.WebPreferences {
		return {
			preload: fixPathForAsarUnpack(path.join(Util.electronPath(), 'js', 'preload.cjs')),
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: true,
			sandbox: false,
			additionalArguments: [],
		};
	};

	getUrlForNewWindow (): string {
		return is.development ? `http://localhost:${port}/tabs.html` : 'file://' + path.join(Util.appPath, 'dist', 'tabs.html');
	};

	getUrlForNewTab (): string {
		return this.getUrlForNewWindow().replace('tabs.html', 'index.html');
	};

	getWindowPosition (param: { width: number; height: number }, displayWidth: number, displayHeight: number): { x: number; y: number } {
		const currentWindow = BrowserWindow.getFocusedWindow();

		let x = Math.round(displayWidth / 2 - param.width / 2);
		let y = Math.round(displayHeight / 2 - param.height / 2 + 20);

		if (currentWindow) {
			const [ xPos, yPos ] = currentWindow.getPosition();

			x = xPos + NEW_WINDOW_SHIFT;
			y = yPos + NEW_WINDOW_SHIFT;

			const xLimit = x + param.width > displayWidth;
			const yLimit = y + param.height > displayHeight;

			if (xLimit || yLimit) {
				x = 0;
				y = 0;
			};
		};

		return { x, y };
	};

	getTabBarHeight (win: AppWindow): number {



		// Hide tabs when PIN check is required
		if (Api.hasPinSet && !Api.isPinChecked) {
			return 0;
		};

		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const configShowMenuBar = ConfigManager.config.showMenuBar;
		const hasMultipleTabs = win.views && win.views.length > 1;
		const hasPinnedTab = win.views && win.views.some((it: TabView) => it.data && it.data.isPinned);
		const shouldShowTabs = alwaysShow || hasPinnedTab || hasMultipleTabs;

		// Check for temporary menu bar visibility (Alt key toggle)
		const showMenuBar = win.tempMenuBarVisible !== undefined ? win.tempMenuBarVisible : configShowMenuBar;

		let height = 0;
		if (is.windows && showMenuBar) {
			height += MENU_BAR_HEIGHT;
		};
		if (shouldShowTabs) {
			height += TAB_BAR_HEIGHT;
		};

		return height;
	};

	updateTabBarVisibility (win: AppWindow): void {
		if (!win || win.isDestroyed()) {
			return;
		};



		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasMultipleTabs = win.views && (win.views.length > 1);
		const hasPinnedTab = win.views && win.views.some((it: TabView) => it.data && it.data.isPinned);
		const isPinCheckRequired = Api.hasPinSet && !Api.isPinChecked;
		const isVisible = !isPinCheckRequired && (alwaysShow || hasPinnedTab || hasMultipleTabs);
		const isSingleTab = win.views && (win.views.length == 1) && !hasPinnedTab;

		// Send to tabs.html window (tab bar UI)
		Util.send(win, 'update-tab-bar-visibility', isVisible);

		// Send to all renderer views (for body class)
		Util.sendToAllTabs(win, 'set-single-tab', isSingleTab);

		// Update active view bounds
		const view = Util.getActiveView(win);
		if (view && !view.webContents?.isDestroyed()) {
			const bounds = this.getBounds(win);
			const tabBarHeight = this.getTabBarHeight(win);

			view.setBounds({
				x: 0,
				y: tabBarHeight,
				width: bounds.width,
				height: bounds.height - tabBarHeight,
			});
		};
	};

	sendToAll (...args: [string, ...any[]]): void {
		this.list.forEach((it: AppWindow) => Util.send(it, ...args));
	};

	sendToAllTabs (...args: [string, ...any[]]): void {
		this.list.forEach((it: AppWindow) => Util.sendToAllTabs(it, ...args));
	};

	reloadAll (): void {
		this.sendToAllTabs('reload');
	};

	getFirstWindow (): AppWindow | undefined {
		return this.list.values().next().value;
	};

	private serializeWindow (win: AppWindow): SavedTabState | null {
		if (!win || !win.views || win.isDestroyed() || win.isChallenge) {
			return null;
		};

		const tabsData = win.views.map((view: TabView) => ({
			data: view.data || {},
		}));

		if (!tabsData.length) {
			return null;
		};

		const activeIndex = win.views.findIndex((view: TabView) => view.id === win.activeTabId);
		const b = win.getBounds();

		return {
			tabs: tabsData,
			activeIndex: activeIndex >= 0 ? activeIndex : 0,
			bounds: { x: b.x, y: b.y, width: b.width, height: b.height },
		};
	};

	/**
	 * Saves the state of all open main windows for restoration on next app start.
	 * The window passed in (usually the active/exiting one) is placed first so its
	 * tabs are restored into the initial window created at startup.
	 */
	saveTabs (win: AppWindow | null): void {
		const store = getSafeStorage();
		const seen = new Set<number>();
		const windows: SavedTabState[] = [];

		const push = (w: AppWindow) => {
			if (!w || seen.has(w.id)) {
				return;
			};
			const state = this.serializeWindow(w);
			if (state) {
				seen.add(w.id);
				windows.push(state);
			};
		};

		push(win);
		this.list.forEach((w: AppWindow) => push(w));

		const payload: SavedWindowsState = { windows };
		store.set(WINDOWS_STORAGE_KEY, payload);
		store.delete(TABS_STORAGE_KEY);
		Util.log('info', `[WindowManager].saveTabs: Saved ${windows.length} window(s)`);
	};

	/**
	 * Loads saved window states from storage.
	 * Falls back to the legacy single-window key for users upgrading from older versions.
	 */
	loadAllWindows (): SavedTabState[] {
		const store = getSafeStorage();

		const multi = store.get(WINDOWS_STORAGE_KEY) as SavedWindowsState | undefined;
		if (multi && Array.isArray(multi.windows) && multi.windows.length) {
			Util.log('info', `[WindowManager].loadAllWindows: Found ${multi.windows.length} saved window(s)`);
			return multi.windows.filter(w => w && w.tabs && w.tabs.length);
		};

		const legacy = store.get(TABS_STORAGE_KEY) as SavedTabState | undefined;
		if (legacy && legacy.tabs && legacy.tabs.length) {
			Util.log('info', `[WindowManager].loadAllWindows: Found legacy saved tabs`);
			return [ legacy ];
		};

		return [];
	};

	loadTabs (): SavedTabState | null {
		const all = this.loadAllWindows();
		return all.length ? all[0] : null;
	};

	clearSavedTabs (): void {
		const store = getSafeStorage();

		store.delete(WINDOWS_STORAGE_KEY);
		store.delete(TABS_STORAGE_KEY);
		Util.log('info', '[WindowManager].clearSavedTabs: Cleared saved tabs');
	};


};

export default new WindowManager();
