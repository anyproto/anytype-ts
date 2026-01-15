const { app, BrowserWindow, WebContentsView, nativeImage, dialog } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const remote = require('@electron/remote/main');
const { randomUUID } = require('crypto');

const ConfigManager = require('./config.js');
const UpdateManager = require('./update.js');
const MenuManager = require('./menu.js');
const Util = require('./util.js');
const port = Util.getPort();

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const NEW_WINDOW_SHIFT = 30;
const TAB_BAR_HEIGHT = 52;
const MENU_BAR_HEIGHT = 28;

class WindowManager {

	list = new Set();

	create (options, param) {
		const Api = require('./api.js');
		const { showMenuBar } = ConfigManager.config;
		const theme = Util.getTheme();
		const bgColor = Util.getBgColor(theme);

		param = Object.assign({
			backgroundColor: bgColor,
			show: false,
			titleBarStyle: 'hidden-inset',
		}, param);
		param.webPreferences = Object.assign(this.getPreferencesForNewWindow(), param.webPreferences || {});

		let win = new BrowserWindow(param);

		remote.enable(win.webContents);

		win = Object.assign(win, options);
		win.windowId = win.id;

		this.list.add(win);

		win.on('closed', () => {
			this.list.delete(win);
			win = null;
		});

		win.on('focus', () => { 
			UpdateManager.setWindow(win);
			MenuManager.setWindow(win);
		});

		win.on('enter-full-screen', () => Util.send(win, 'enter-full-screen'));
		win.on('leave-full-screen', () => Util.send(win, 'leave-full-screen'));
		win.on('swipe', (e, direction) => Util.send(win, 'commandGlobal', 'mouseNavigation', direction));

		win.webContents.setWindowOpenHandler(({ url }) => {
			Api.openUrl(win, url);
			return { action: 'deny' };
		});

		win.setMenuBarVisibility(showMenuBar);
		win.setAutoHideMenuBar(!showMenuBar);

		return win;
	};

	createMain (options) {
		const { isChild } = options;
		const image = nativeImage.createFromPath(path.join(Util.imagePath(), 'icons', '512x512.png'));

		let state = {};
		let param = {
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
			param.trafficLightPosition = { x: 18, y: 18 };
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
		} else {
			const { width, height } = this.getScreenSize();

			param = Object.assign(param, this.getWindowPosition(param, width, height));
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
		win.on('resize', () => {
			const { width, height } = win.getBounds();

			const activeView = Util.getActiveView(win);
			if (activeView) {
				const tabBarHeight = this.getTabBarHeight(win);
				activeView.setBounds({ x: 0, y: tabBarHeight, width, height: height - tabBarHeight });
			};
		});

		this.createTab(win);
		return win;
	};

	createChallenge (options) {
		// Check if challenge window already exists
		for (const win of this.list) {
			if (win && win.isChallenge && (win.challenge == options.challenge) && !win.isDestroyed()) {
				return win;
			};
		};

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
			win.webContents.postMessage('challenge', options);
		});

		setTimeout(() => this.closeChallenge(options), 30000);
		return win;
	};

	getScreenSize () {
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

	closeChallenge (options) {
		for (const win of this.list) {
			if (win && win.isChallenge && (win.challenge == options.challenge) && !win.isDestroyed()) {
				win.close();
			};
		};
	};

	command (win, cmd, param) {
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
					fileFilter: { extensions: [ ext ] },
					defaultPath: `${app.getPath('documents')}/${param.name}.${ext}`,
					properties: [ 'createDirectory', 'showOverwriteConfirmation' ],
				}).then((result) => {
					const fp = result.filePath;
					if (!fp) {
						Util.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
					} else {
						Util[cmd](win, path.dirname(fp), path.basename(fp), param.options);
					};
				}).catch(() => {
					Util.send(win, 'commandGlobal', 'saveAsHTMLSuccess');
				});
				break;
		};
	};

	createTab (win, param) {
		const Api = require('./api.js');
		const id = randomUUID();
		const view = new WebContentsView({
			webPreferences: {
				...this.getPreferencesForNewWindow(),
				additionalArguments: [ `--tab-id=${id}` ],
			},
			...param,
		});

		win.views = win.views || [];
		view.id = id;
		win.views.push(view);
		win.activeTabId = win.activeTabId || id;
		view.data = { ...param };
		view.webContents.loadURL(this.getUrlForNewTab());

		view.on('close', () => Util.sendToTab(win, view.id, 'will-close-tab'));

		view.webContents.setWindowOpenHandler(({ url }) => {
			Api.openUrl(win, url);
			return { action: 'deny' };
		});

		view.webContents.on('context-menu', (e, param) => {
			Util.sendToTab(win, view.id, 'spellcheck', param.misspelledWord, param.dictionarySuggestions, param.x, param.y, param.selectionRect);
		});

		// Send initial single tab state when view finishes loading
		view.webContents.once('did-finish-load', () => {
			const isSingleTab = win.views && (win.views.length == 1);
			Util.sendToTab(win, view.id, 'set-single-tab', isSingleTab);

			// Apply zoom level from config
			const zoom = Number(ConfigManager.config.zoom) || 0;
			if (zoom) {
				view.webContents.setZoomLevel(zoom);
			};

			// Also update tab bar visibility in case state changed during loading
			this.updateTabBarVisibility(win);
		});

		remote.enable(view.webContents);

		Util.send(win, 'create-tab', { id: view.id, data: view.data });
		this.setActiveTab(win, id);
		this.updateTabBarVisibility(win);
	};

	setActiveTab (win, id) {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find(it => it.id == id);
		if (!view) {
			return;
		};

		const currentActive = Util.getActiveView(win);
		if (currentActive) {
			win.contentView.removeChildView(currentActive);
		};

		const bounds = win.getBounds();
		const tabBarHeight = this.getTabBarHeight(win);

		view.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });

		win.activeTabId = id;
		win.contentView.addChildView(view);

		// Focus the new tab's webContents to receive keyboard events
		view.webContents.focus();

		Util.send(win, 'set-active-tab', id);
	};

	updateTab (win, id, data) {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const view = win.views.find(it => it.id == id);
		if (!view) {
			return;
		};

		view.data = Object.assign(view.data || {}, data);
		Util.send(win, 'update-tab', { id: view.id, data: view.data });
	};

	removeTab (win, id, updateActive) {
		id = String(id || '');

		if (!id || !win.views || (win.views.length <= 1)) {
			return;
		};

		const view = win.views.find(it => it.id == id);
		const index = win.views.findIndex(it => it.id == id);

		if (win.activeTabId == id) {
			win.contentView.removeChildView(view);
		};

		win.views.splice(index, 1);
		Util.send(win, 'remove-tab', id);
		this.updateTabBarVisibility(win);

		if (updateActive) {
			const newIndex = index < win.views.length ? index : index - 1;
			this.setActiveTab(win, win.views[newIndex]?.id);
		};

		// Send will-close-tab to allow renderer cleanup, then destroy the webContents
		if (view && view.webContents && !view.webContents.isDestroyed()) {
			Util.sendToTab(win, view.id, 'will-close-tab');
			view.webContents.close();
		};
	};

	closeActiveTab (win) {
		const Api = require('./api.js');

		if (win.views.length > 1) {
			this.removeTab(win, win.activeTabId, true);
		} else {
			Api.close(win);
		};
	};

	closeOtherTabs (win, id) {
		id = String(id || '');

		if (!id || !win.views) {
			return;
		};

		const views = win.views.filter(it => it.id != id);

		views.forEach(view => {
			this.removeTab(win, view.id, false);
		});

		this.setActiveTab(win, id);
	};

	reorderTabs (win, tabIds) {
		if (!win.views || !tabIds || !tabIds.length) {
			return;
		};

		// Reorder the views array based on the new tab order
		const newViews = [];
		tabIds.forEach(id => {
			const view = win.views.find(v => v.id == id);
			if (view) {
				newViews.push(view);
			};
		});

		// Update the views array
		win.views = newViews;

		// Send updated tabs list to tabs.html
		Util.send(win, 'update-tabs',
			win.views.map(it => ({ id: it.id, data: it.data })),
			win.activeTabId
		);

		this.updateTabBarVisibility(win);
	};

	nextTab (win) {
		if (!win.views || (win.views.length <= 1)) {
			return;
		};

		const index = win.views.findIndex(it => it.id == win.activeTabId);
		const nextIndex = (index + 1) % win.views.length;

		this.setActiveTab(win, win.views[nextIndex].id);
	};

	prevTab (win) {
		if (!win.views || (win.views.length <= 1)) {
			return;
		};

		const index = win.views.findIndex(it => it.id == win.activeTabId);
		const prevIndex = (index - 1 + win.views.length) % win.views.length;

		this.setActiveTab(win, win.views[prevIndex].id);
	};

	getPreferencesForNewWindow () {
		return {
			preload: fixPathForAsarUnpack(path.join(Util.electronPath(), 'js', 'preload.cjs')),
			nativeWindowOpen: true,
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: true,
			sandbox: false,
			additionalArguments: [],
		};
	};

	getUrlForNewWindow () {
		return is.development ? `http://localhost:${port}/tabs.html` : 'file://' + path.join(Util.appPath, 'dist', 'tabs.html');
	};

	getUrlForNewTab () {
		return this.getUrlForNewWindow().replace('tabs.html', 'index.html');
	};

	getScreenSize () {
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

	getWindowPosition (param, displayWidth, displayHeight) {
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

	getTabBarHeight (win) {
		const ConfigManager = require('./config.js');
		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const showMenuBar = ConfigManager.config.showMenuBar;
		const hasMultipleTabs = win.views && win.views.length > 1;
		const shouldShowTabs = alwaysShow || hasMultipleTabs;

		let height = 0;
		if (is.windows && showMenuBar) {
			height += MENU_BAR_HEIGHT;
		};
		if (shouldShowTabs) {
			height += TAB_BAR_HEIGHT;
		};

		return height;
	};

	updateTabBarVisibility (win) {
		if (!win || win.isDestroyed()) {
			return;
		};

		const ConfigManager = require('./config.js');
		const alwaysShow = ConfigManager.config.alwaysShowTabs;
		const hasMultipleTabs = win.views && (win.views.length > 1);
		const isSingleTab = win.views && (win.views.length == 1);
		const isVisible = alwaysShow || hasMultipleTabs;

		// Send to tabs.html window (tab bar UI)
		Util.send(win, 'update-tab-bar-visibility', isVisible);

		// Send to all renderer views (for body class)
		Util.sendToAllTabs(win, 'set-single-tab', isSingleTab);

		// Update active view bounds
		const view = Util.getActiveView(win);
		if (view && !view.webContents?.isDestroyed()) {
			const bounds = win.getBounds();
			const tabBarHeight = this.getTabBarHeight(win);

			view.setBounds({
				x: 0,
				y: tabBarHeight,
				width: bounds.width,
				height: bounds.height - tabBarHeight,
			});
		};
	};

	sendToAll () {
		const args = [ ...arguments ];
		this.list.forEach(it => Util.send(it, ...args));
	};

	sendToAllTabs () {
		const args = [ ...arguments ];
		this.list.forEach(it => Util.sendToAllTabs(it, ...args));
	};

	reloadAll () {
		this.sendToAll('reload');
	};

	getFirstWindow () {
		return this.list.values().next().value;
	};
	
};

module.exports = new WindowManager();
