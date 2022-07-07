const { app, BrowserWindow, nativeImage, dialog, screen } = require('electron');
const { is } = require('electron-util');
const version = app.getVersion();
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const remote = require('@electron/remote/main');
const port = process.env.SERVER_PORT;

const UpdateManager = require('./update.js');
const MenuManager = require('./menu.js');
const Util = require('./util.js');

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 752;
const MIN_HEIGHT = 480;

class WindowManager {

	list = new Set();

	create (options, param) {
		const { route, isChild } = options;

		param = Object.assign({
			backgroundColor: Util.getBgColor(),
			icon: path.join(Util.imagePath(), 'icon.png'),
			show: false,
			titleBarStyle: 'hidden-inset',
			webPreferences: {},
		}, param);

		param.webPreferences = Object.assign({
			nativeWindowOpen: true,
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: false,
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

		win.once('ready-to-show', () => { win.show(); });
		win.on('focus', () => { 
			UpdateManager.setWindow(win);
			MenuManager.setWindow(win); 
		});
		win.on('enter-full-screen', () => { Util.send(win, 'enter-full-screen'); });
		win.on('leave-full-screen', () => { Util.send(win, 'leave-full-screen'); });

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
				preload: path.join(Util.electronPath(), 'js', 'preload.js'),
			},
		};

		if (is.linux) {
			param.icon = image;
		} else {
			param.frame = false;
			param.titleBarStyle = 'hidden';
		};

		if (is.macos) {
			app.dock.setIcon(image);

			param.icon = path.join(Util.imagePath(), 'icon.icns');
			param.trafficLightPosition = { x: 20, y: 18 };
		};

		if (is.windows) {
			param.icon = path.join(Util.imagePath(), 'icon64x64.png');
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

			param = Object.assign(param, {
				x: width / 2 - param.width / 2,
				y: height / 2 - param.height / 2 + 20,
			});
		};

		const win = this.create(options, param);

		remote.enable(win.webContents);

		if (!isChild) {
			state.manage(win);
		};

		if (is.development) {
			win.loadURL(`http://localhost:${port}`);
			win.toggleDevTools();
		} else {
			win.loadURL('file://' + path.join(Util.appPath, 'dist', 'index.html'));
		};
		return win;
	};

	createAbout () {
		const win = this.create({}, { 
			width: 400, 
			height: 400, 
			useContentSize: true,
		});

		win.loadURL('file://' + path.join(Util.electronPath(), 'about', `index.html?version=${version}&theme=${Util.getTheme()}`));
		win.setMenu(null);

		win.webContents.on('will-navigate', (e, url) => {
			e.preventDefault();
			shell.openExternal(url);
		});

		win.webContents.on('new-window', (e, url) => {
			e.preventDefault();
			shell.openExternal(url);
		});

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

			case 'saveAsHTML':
				dialog.showOpenDialog({ properties: [ 'openDirectory' ] }).then((result) => {
					const files = result.filePaths;

					if ((files == undefined) || !files.length) {
						Util.send(win, 'command', 'saveAsHTMLSuccess');
					} else {
						Util.savePage(win, files[0], param.name);
					};
				});
				break;
		};
	};

	updateTheme () {
		this.list.forEach(it => {
			Util.send(it, 'native-theme', Util.isDarkTheme());
		});
	};

};

module.exports = new WindowManager();