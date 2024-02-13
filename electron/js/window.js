const { app, BrowserWindow, nativeImage, dialog, screen } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const version = app.getVersion();
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const remote = require('@electron/remote/main');
const port = process.env.SERVER_PORT;

const ConfigManager = require('./config.js');
const UpdateManager = require('./update.js');
const MenuManager = require('./menu.js');
const Util = require('./util.js');

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const NEW_WINDOW_SHIFT = 30;

class WindowManager {

	list = new Set();

	create (options, param) {
		const { route, isChild } = options;
		const { hideMenuBar } = ConfigManager.config;

		param = Object.assign({
			backgroundColor: Util.getBgColor('dark'),
			show: false,
			titleBarStyle: 'hidden-inset',
			webPreferences: {},
		}, param);

		param.webPreferences = Object.assign({
			nativeWindowOpen: true,
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: true,
			sandbox: false,
		}, param.webPreferences);

		let win = new BrowserWindow(param);

		win.isChild = isChild;
		win.route = route;
		win.windowId = win.id;

		this.list.add(win);

		win.on('closed', () => {
			this.list.delete(win);
			win = null;
		});

		win.once('ready-to-show', () => win.show());
		win.on('focus', () => { 
			UpdateManager.setWindow(win);
			MenuManager.setWindow(win); 
		});
		win.on('enter-full-screen', () => Util.send(win, 'enter-full-screen'));
		win.on('leave-full-screen', () => Util.send(win, 'leave-full-screen'));

		win.webContents.on('context-menu', (e, param) => {
			Util.send(win, 'spellcheck', param.misspelledWord, param.dictionarySuggestions, param.x, param.y, param.selectionRect);
		});

		if (hideMenuBar) {
			win.setMenuBarVisibility(false);
			win.setAutoHideMenuBar(true);
		};

		return win;
	};

	createMain (options) {
		const { isChild } = options;
		const image = nativeImage.createFromPath(path.join(Util.imagePath(), 'icon512x512.png'));

		let state = {};
		let param = {
			minWidth: MIN_WIDTH,
			minHeight: MIN_HEIGHT,
			width: DEFAULT_WIDTH, 
			height: DEFAULT_HEIGHT,

			webPreferences: {
				preload: fixPathForAsarUnpack(path.join(Util.electronPath(), 'js', 'preload.js')),
			},
		};

		if (is.macos) {
			app.dock.setIcon(image);

			param.frame = false;
			param.titleBarStyle = 'hidden';
			param.icon = path.join(Util.imagePath(), 'icon.icns');
			param.trafficLightPosition = { x: 20, y: 18 };
		} else
		if (is.windows) {
			param.icon = path.join(Util.imagePath(), 'icons', '256x256.ico');
		} else
		if (is.linux) {
			param.icon = image;
		};

		if (!isChild) {
			state = windowStateKeeper({ defaultWidth: DEFAULT_WIDTH, defaultHeight: DEFAULT_HEIGHT });
			param = Object.assign(param, {
				x: state.x,
				y: state.y,
				width: state.width,
				height: state.height,
			});
		} else {
			const primaryDisplay = screen.getPrimaryDisplay();
			const { width, height } = primaryDisplay.workAreaSize;

			param = Object.assign(param, this.getWindowPosition(param, width, height));
		};

		const win = this.create(options, param);

		remote.enable(win.webContents);

		if (!isChild) {
			state.manage(win);
		};

		win.loadURL(is.development ? `http://localhost:${port}` : 'file://' + path.join(Util.appPath, 'dist', 'index.html'));
		win.on('enter-full-screen', () => MenuManager.initMenu());
		win.on('leave-full-screen', () => MenuManager.initMenu());

		if (is.development) {
			win.toggleDevTools();
		};

		return win;
	};

	command (win, cmd, param) {
		param = param || {};

		switch (cmd) {
			case 'menu':
				MenuManager.menu.popup({ x: 16, y: 38 });
				break;

			case 'minimize':
				win.minimize();
				break;

			case 'maximize':
				win.isMaximized() ? win.unmaximize() : win.maximize();
				break;

			case 'close':
				win.hide();
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
				});
				break;
		};
	};

	getWindowPosition (param, displayWidth, displayHeight) {
		const currentWindow = BrowserWindow.getFocusedWindow();

		let x = Math.round(displayWidth / 2 - param.width / 2);
		let y = Math.round(displayHeight / 2 - param.height / 2 + 20);

		if (currentWindow) {
			const [xPos, yPos] = currentWindow.getPosition();

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

	sendToAll () {
		const args = [ ...arguments ];
		this.list.forEach(it => {
			Util.send.apply(this, [ it ].concat(args));
		});
	};

	reloadAll () {
		this.list.forEach(it => it.webContents.reload());
	};

};

module.exports = new WindowManager();
