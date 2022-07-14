'use strict';

const electron = require('electron');
const { app, BrowserWindow, session, nativeTheme, ipcMain } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const path = require('path');
const os = require('os');
const storage = require('electron-json-storage');
const port = process.env.SERVER_PORT;
const protocol = 'anytype';
const remote = require('@electron/remote/main');

const userPath = app.getPath('userData');
const tmpPath = path.join(userPath, 'tmp');
const logPath = path.join(userPath, 'logs');
const binPath = fixPathForAsarUnpack(path.join(__dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}`));

const Api = require('./electron/js/api.js');
const ConfigManager = require('./electron/js/config.js');
const UpdateManager = require('./electron/js/update.js');
const MenuManager = require('./electron/js/menu.js');
const WindowManager = require('./electron/js/window.js');
const Server = require('./electron/js/server.js');
const Util = require('./electron/js/util.js');

app.removeAsDefaultProtocolClient(protocol);

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(protocol, process.execPath, [ path.resolve(process.argv[1]) ]);
	};
} else {
	app.setAsDefaultProtocolClient(protocol);
};

let deeplinkingUrl = '';
let waitLibraryPromise = null;
let mainWindow = null;
let csp = [
	"default-src 'self' 'unsafe-eval'",
	"img-src 'self' http://*:* https://*:* data: blob: file://*",
	"media-src 'self' http://*:* https://*:* data: blob: file://*",
	"style-src 'unsafe-inline' http://localhost:* file://*",
	"font-src data: file://*",
	"connect-src http://localhost:* http://127.0.0.1:* ws://localhost:* https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data: https://*.wistia.com https://*.wistia.net https://embedwistia-a.akamaihd.net",
	"script-src-elem file: http://localhost:* https://sentry.io devtools://devtools 'unsafe-inline' https://*.wistia.com https://*.wistia.net",
	"frame-src chrome-extension://react-developer-tools"
];

remote.initialize();
Util.setAppPath(path.join(__dirname));

if (is.development && !port) {
	console.error('ERROR: Please define SERVER_PORT env var');
	Api.exit(mainWindow, false);
};

if (app.isPackaged && !app.requestSingleInstanceLock()) {
	Api.exit(mainWindow, false);
};

storage.setDataPath(userPath);
Util.mkDir(tmpPath);
Util.mkDir(logPath);

if (process.env.ANYTYPE_USE_SIDE_SERVER) {
	// use the grpc server started from the outside
	Server.setAddress(process.env.ANYTYPE_USE_SIDE_SERVER);
	waitLibraryPromise = Promise.resolve();
} else {
	waitLibraryPromise = Server.start(binPath, userPath);
};

function waitForLibraryAndCreateWindows () {
	waitLibraryPromise.then((res) => {
		global.serverAddress = Server.getAddress();
		createWindow();
	}, (err) => {
		electron.dialog.showErrorBox('Error: failed to run server', err.toString());
	});
};

// MacOs 12.2 (M1): doesn't fire on manual theme switch
nativeTheme.on('updated', () => {
	MenuManager.updateTrayIcon();
	WindowManager.updateTheme();
});

function createWindow () {
	mainWindow = WindowManager.createMain({ route: Util.getRouteFromUrl(deeplinkingUrl), isChild: false });

	if (process.env.ELECTRON_DEV_EXTENSIONS) {
		BrowserWindow.addDevToolsExtension(
			path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.6.0_0')
		);
	};

	mainWindow.on('close', (e) => {
		Util.log('info', 'closeMain: ' + app.isQuiting);

		if (app.isQuiting) {
			return;
		};
		
		e.preventDefault();
		if (!is.linux) {
			if (mainWindow.isFullScreen()) {
				mainWindow.setFullScreen(false);
				mainWindow.once('leave-full-screen', () => { win.hide(); });
			} else {
				mainWindow.hide();
			};
		} else {
			Api.exit(mainWindow, false);
		};
		return false;
	});

	UpdateManager.setWindow(mainWindow);
	UpdateManager.init();

	MenuManager.setWindow(mainWindow);
	MenuManager.initMenu();
	MenuManager.initTray();

	ipcMain.handle('Api', (e, id, cmd, args) => {
		const Api = require('./electron/js/api.js');
		const win = BrowserWindow.fromId(id);

		if (!win) {
			console.error('[Api] window is not defined', cmd, id);
			return;
		};

		args = args || [];
		args.unshift(win);

		if (Api[cmd]) {
			Api[cmd].apply(Api, args);
		} else {
			console.error('[Api] method not defined:', cmd);
		};
	});
};

app.on('ready', () => {
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		})
	});

	ConfigManager.init(waitForLibraryAndCreateWindows);
});

app.on('second-instance', (event, argv, cwd) => {
	Util.log('info', 'second-instance');

	if (!is.macos) {
		deeplinkingUrl = argv.find((arg) => arg.startsWith(`${protocol}://`));
	};

	if (mainWindow) {
		if (deeplinkingUrl) {
			Util.send(mainWindow, 'route', Util.getRouteFromUrl(deeplinkingUrl));
		};

		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		};

		mainWindow.show();
		mainWindow.focus();
	};
});

app.on('window-all-closed', (e) => {
	Util.log('info', 'window-all-closed');

	if (is.linux) {
		e.preventDefault();
		Api.exit(mainWindow, false);
	};
});

app.on('before-quit', (e) => {
	Util.log('info', 'before-quit');

	if (app.isQuiting) {
		app.exit(0);
	} else {
		e.preventDefault();
		Api.exit(mainWindow, false);
	};
});

app.on('activate', () => { 
	WindowManager.list.size ? mainWindow.show() : createWindow();
});

app.on('open-url', (e, url) => {
	e.preventDefault();

	if (mainWindow) {
		Util.send(mainWindow, 'route', Util.getRouteFromUrl(url));
		mainWindow.show();
	};
});

app.on('certificate-error', (e, webContents, url, error, certificate, callback) => {
	const u = new URL(url);

	console.log(url, u);

	if ([ '127.0.0.1', 'localhost' ].includes(u.hostname)) {
		e.preventDefault();
		callback(true);
	} else {
		callback(false);
	};
});