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
const TAB_BAR_HEIGHT = 44;

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

		win.webContents.on('context-menu', (e, param) => {
			Util.send(win, 'spellcheck', param.misspelledWord, param.dictionarySuggestions, param.x, param.y, param.selectionRect);
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
			param.trafficLightPosition = { x: 10, y: 18 };
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
				state = windowStateKeeper({ defaultWidth: DEFAULT_WIDTH, defaultHeight: DEFAULT_HEIGHT });

				param = Object.assign(param, {
					x: state.x,
					y: state.y,
					width: state.width,
					height: state.height,
				});
			} catch (e) {};
		} else {
			const { width, height } = this.getScreenSize();

			param = Object.assign(param, this.getWindowPosition(param, width, height));
		};

		const win = this.create(options, param);

		if (!isChild) {
			state.manage(win);
		};

		win.loadURL(this.getUrlForNewWindow());

		win.webContents.once('did-finish-load', () => {
			Util.send(win, 'set-theme', Util.getTheme());
		});

		win.once('ready-to-show', () => win.show());
		win.on('enter-full-screen', () => MenuManager.initMenu());
		win.on('leave-full-screen', () => MenuManager.initMenu());
		win.on('resize', () => {
			const { width, height } = win.getBounds();

			if (win.views && win.views[win.activeIndex]) {
				const tabBarHeight = this.getTabBarHeight(win);
				win.views[win.activeIndex].setBounds({ x: 0, y: tabBarHeight, width, height: height - tabBarHeight });
			};
		});

		this.createTab(win);
		return win;
	};

	createChallenge (options) {
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
		const id = randomUUID();
		const view = new WebContentsView({
			webPreferences: {
				...this.getPreferencesForNewWindow(),
				additionalArguments: [ `--tab-id=${id}` ],
			},
		});

		win.views = win.views || [];
		win.activeIndex = win.activeIndex || 0;
		win.views.push(view);

		view.id = id;
		view.data = {};
		view.webContents.loadURL(this.getUrlForNewTab());

		view.on('close', () => Util.sendToTab(win, view.id, 'will-close-tab'));

		// Send initial single tab state when view finishes loading
		view.webContents.once('did-finish-load', () => {
			const isSingleTab = win.views && (win.views.length == 1);
			Util.sendToTab(win, view.id, 'set-single-tab', isSingleTab);

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

		if (win.views[win.activeIndex]) {
			win.contentView.removeChildView(win.views[win.activeIndex]);
		};

		const bounds = win.getBounds();
		const index = win.views.findIndex(it => it.id == id);
		const tabBarHeight = this.getTabBarHeight(win);

		view.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });

		win.activeIndex = index;
		win.contentView.addChildView(view);

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

		if (win.activeIndex == index) {
			win.contentView.removeChildView(view);
		};

		win.views.splice(index, 1);
		Util.send(win, 'remove-tab', id);

		this.updateTabBarVisibility(win);

		if (updateActive) {
			const newIndex = index < win.views.length ? index : index - 1;
			this.setActiveTab(win, win.views[newIndex]?.id);
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

		// Update active index
		const activeView = win.views[win.activeIndex];
		if (activeView) {
			win.activeIndex = win.views.findIndex(v => v.id == activeView.id);
		};

		// Send updated tabs list to tabs.html
		Util.send(win, 'update-tabs',
			win.views.map(it => ({ id: it.id, data: it.data })),
			win.views[win.activeIndex]?.id
		);
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
		const hasMultipleTabs = win.views && win.views.length > 1;
		const shouldShow = alwaysShow || hasMultipleTabs;
		return shouldShow ? TAB_BAR_HEIGHT : 0;
	};

	updateTabBarVisibility (win) {
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
		if (win.views && win.views[win.activeIndex]) {
			const bounds = win.getBounds();
			const tabBarHeight = this.getTabBarHeight(win);

			win.views[win.activeIndex].setBounds({
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

	reloadAll () {
		this.sendToAll('reload');
	};

	getFirstWindow () {
		return this.list.values().next().value;
	};
	
};

module.exports = new WindowManager();
