'use strict';

const { app, BrowserWindow, session, nativeTheme, ipcMain, powerMonitor, dialog } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const path = require('path');
const storage = require('electron-json-storage');
const port = process.env.SERVER_PORT;
const protocol = 'anytype';
const remote = require('@electron/remote/main');
const { installNativeMessagingHost } = require('./electron/js/lib/installNativeMessagingHost.js');
const binPath = fixPathForAsarUnpack(path.join(__dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}`));
const Store = require('electron-store');
const suffix = app.isPackaged ? '' : 'dev';
const store = new Store({ name: [ 'localStorage', suffix ].join('-') });

// gRPC DevTools extension ID
const GRPC_DEVTOOLS_ID = 'fohdnlaeecihjiendkfhifhlgldpeopm';
const { installExtension } = require('@tomjs/electron-devtools-installer');

// Fix notifications app name
if (is.windows) {
    app.setAppUserModelId(app.name);
};

storage.setDataPath(app.getPath('userData'));

const Api = require('./electron/js/api.js');
const ConfigManager = require('./electron/js/config.js');
const UpdateManager = require('./electron/js/update.js');
const MenuManager = require('./electron/js/menu.js');
const WindowManager = require('./electron/js/window.js');
const Server = require('./electron/js/server.js');
const Util = require('./electron/js/util.js');
const Cors = require('./electron/json/cors.json');
const csp = [];

let deeplinkingUrl = '';
let waitLibraryPromise = null;
let mainWindow = null;
let lastPowerEvent = 'suspend';
let isReady = false;

MenuManager.store = store;

for (let i in Cors) {
	csp.push([ i ].concat(Cors[i]).join(' '));
};

app.commandLine.appendSwitch('ignore-connections-limit', 'localhost, 127.0.0.1');
app.commandLine.appendSwitch('gtk-version', '3');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

app.removeAsDefaultProtocolClient(protocol);

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(protocol, process.execPath, [ path.resolve(process.argv[1]) ]);

		if (!is.macos) {
			deeplinkingUrl = process.argv.find(arg => arg.startsWith(`${protocol}://`));
		};
	};
} else {
	app.setAsDefaultProtocolClient(protocol);
};

powerMonitor.on('suspend', () => {	
	if (lastPowerEvent == 'suspend') {
		return;
	};

	const firstWindow = WindowManager.getFirstWindow();
	if (firstWindow) {
		Util.send(firstWindow, 'power-event', 'suspend');
		lastPowerEvent = 'suspend';
	};
});

powerMonitor.on('resume', () => {	
	if (lastPowerEvent == 'resume') {
		return;
	};

	const firstWindow = WindowManager.getFirstWindow();
	if (firstWindow) {
		Util.send(firstWindow, 'power-event', 'resume');
		lastPowerEvent = 'resume';
	};
	
	WindowManager.sendToAll('reload');
	Util.log('info', '[PowerMonitor] resume');
});

ipcMain.on('storeGet', (e, key) => {
	e.returnValue = store.get(key);
});
ipcMain.on('storeSet', (e, key, value) => {
	e.returnValue = store.set(key, value);
});
ipcMain.on('storeDelete', (e, key) => {
	e.returnValue = store.delete(key);
});

if (is.development && !port) {
	console.error('ERROR: Please define SERVER_PORT env var');
	Api.exit(mainWindow, '', false);
	return;
};

if (!is.development && !app.requestSingleInstanceLock()) {
	Api.exit(mainWindow, '' ,false);
	return;
};

remote.initialize();
Util.setAppPath(path.join(__dirname));

function waitForLibraryAndCreateWindows () {
	const { userDataPath } = ConfigManager.config;

	let currentPath = app.getPath('userData');
	if (userDataPath && (userDataPath != currentPath)) {
		currentPath = userDataPath;
		app.setPath('userData', userDataPath);
	};

	if (process.env.ANYTYPE_USE_SIDE_SERVER) {
		// use the grpc server started from the outside
		Server.setAddress(process.env.ANYTYPE_USE_SIDE_SERVER);
		waitLibraryPromise = Promise.resolve();
	} else {
		waitLibraryPromise = Server.start(binPath, currentPath);
	};

	Util.mkDir(Util.logPath());

	waitLibraryPromise.then(() => {
		global.serverAddress = Server.getAddress();
		createWindow();
		isReady = true;
	}, (err) => {
		dialog.showErrorBox('Error: failed to run server', err.toString());
	});
};

// MacOs 12.2 (M1): doesn't fire on manual theme switch
nativeTheme.on('updated', () => {
	const isDark = Util.isDarkTheme();

	MenuManager.updateTrayIcon();
	Api.setBackground(isDark ? 'dark' : '');

	WindowManager.sendToAll('native-theme', isDark);
});

function createWindow () {
	mainWindow = WindowManager.createMain({ route: Util.getRouteFromUrl(deeplinkingUrl), isChild: false });

	mainWindow.on('close', e => {
		Util.log('info', 'closeMain: ' + app.isQuiting);

		if (app.isQuiting) {
			return;
		};
		
		e.preventDefault();

		const onClose = () => {
			const { config } = ConfigManager;

			if (config.hideTray && (WindowManager.list.size <= 1)) {
				Api.exit(mainWindow, '', false);
			} else {
				mainWindow.hide();
			};
		};

		if (mainWindow.isFullScreen()) {
			mainWindow.setFullScreen(false);
			mainWindow.once('leave-full-screen', () => onClose());
		} else {
			onClose();
		};
		return false;
	});

	UpdateManager.setWindow(mainWindow);
	UpdateManager.init();

	MenuManager.setWindow(mainWindow);
	MenuManager.initMenu();
	MenuManager.initTray();

	Api.systemInfo(mainWindow);

	installNativeMessagingHost();

	//ipcMain.removeHandler('Api');
	ipcMain.handle('Api', (e, id, cmd, args) => {
		const Api = require('./electron/js/api.js');
		const win = BrowserWindow.fromId(id);

		if (!win) {
			console.error('[Api] window is not defined', cmd, id);
			return;
		};

		if (Api[cmd]) {
			return Api[cmd].apply(Api, [ win ].concat(args || []));
		} else {
			console.error('[Api] method not defined:', cmd);
			return null;
		};
	});
};

app.on('ready', async () => {
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		});
	});

	// Load gRPC DevTools extension in development mode
	if (is.development) {
		try {
			// Install the extension using electron-devtools-installer
			await installExtension(GRPC_DEVTOOLS_ID, {
				loadExtensionOptions: {
					allowFileAccess: true
				}
			});

			console.log(`✅ gRPC DevTools extension installed`);
		} catch (e) {
			console.error('❌ Failed to install gRPC DevTools extension:', e.message);
		};
	};

	ConfigManager.init(waitForLibraryAndCreateWindows);
});

app.on('second-instance', (event, argv) => {
	Util.log('info', 'second-instance');

	if (!mainWindow) {
		return;
	};

	if (!is.macos) {
		deeplinkingUrl = argv.find(arg => arg.startsWith(`${protocol}://`));
	};

	if (deeplinkingUrl) {
		Util.send(mainWindow, 'route', Util.getRouteFromUrl(deeplinkingUrl));
	};

	if (mainWindow.isMinimized()) {
		mainWindow.restore();
	};
	if (!mainWindow.isVisible()) {
		mainWindow.show();
	};

	mainWindow.focus();

	// Ensure focus is properly stolen on macOS
	if (is.macos) {
		app.focus({ steal: true });
	};
});

app.on('before-quit', e => {
	Util.log('info', 'before-quit');

	if (app.isQuiting) {
		app.exit(0);
	} else {
		e.preventDefault();
		Api.exit(mainWindow, '', false);
	};
});

app.on('activate', () => { 
	if (WindowManager.list.size && mainWindow) {
		mainWindow.show();
	} else 
	if (isReady) {
		createWindow();
	};
});

app.on('open-url', (e, url) => {
	e.preventDefault();

	deeplinkingUrl = url;

	if (!mainWindow) {
		return;
	};

	Util.send(mainWindow, 'route', Util.getRouteFromUrl(url));

	if (mainWindow.isMinimized()) {
		mainWindow.restore();
	};

	if (!mainWindow.isVisible()) {
		mainWindow.show();
	};

	mainWindow.focus();

	if (is.macos) {
		app.focus({ steal: true });
	};
});
