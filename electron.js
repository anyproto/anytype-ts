const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, session, nativeImage, nativeTheme, dialog } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const storage = require('electron-json-storage');
const fs = require('fs');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const windowStateKeeper = require('electron-window-state');
const port = process.env.SERVER_PORT;
const keytar = require('keytar');
const bindings = require('bindings');
const envPath = path.join(__dirname, 'electron', 'env.json');
const systemVersion = process.getSystemVersion();
const protocol = 'anytype';
const remote = require('@electron/remote/main');

const ConfigManager = require('./electron/js/config.js');
const UpdateManager = require('./electron/js/updater.js');
const MenuManager = require('./electron/js/menu.js');
const Util = require('./electron/js/util.js');

const MIN_WIDTH = 752;
const MIN_HEIGHT = 480;
const KEYTAR_SERVICE = 'Anytype';

app.removeAsDefaultProtocolClient(protocol);
Util.setPath(path.join(__dirname));

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(protocol, process.execPath, [ path.resolve(process.argv[1]) ]);
	};
} else {
	app.setAsDefaultProtocolClient(protocol);
};

try { env = JSON.parse(fs.readFileSync(envPath)); } catch (e) {};

remote.initialize();

let windows = new Set();
let env = {};
let deeplinkingUrl = '';
let userPath = app.getPath('userData');
let tmpPath = path.join(userPath, 'tmp');
let waitLibraryPromise;
let useGRPC = !process.env.ANYTYPE_USE_ADDON && (env.USE_GRPC || process.env.ANYTYPE_USE_GRPC || is.windows || is.development);
let server;
let dataPath = [];
let win = null;
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

if (is.development && !port) {
	console.error('ERROR: Please define SERVER_PORT env var');
	exit(false);
};

if (app.isPackaged && !app.requestSingleInstanceLock()) {
	exit(false);
};

storage.setDataPath(userPath);

if (process.env.DATA_PATH) {
	try { fs.mkdirSync(process.env.DATA_PATH); } catch (e) {};

	dataPath.push(process.env.DATA_PATH);
} else {
	dataPath.push(userPath);
	if (!app.isPackaged) {
		dataPath.push('dev');
	};
	dataPath.push('data');
};

try { fs.mkdirSync(tmpPath); } catch (e) {};

if (useGRPC) {
	let binPath = fixPathForAsarUnpack(path.join(__dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}`));
	server = require('./electron/js/server.js');

	if (process.env.ANYTYPE_USE_SIDE_SERVER) {
		// use the grpc server started from the outside
		server.setAddress(process.env.ANYTYPE_USE_SIDE_SERVER);
		waitLibraryPromise = Promise.resolve();
	} else {
		waitLibraryPromise = server.start(binPath, userPath);
	};
} else {
	waitLibraryPromise = Promise.resolve();
};

function waitForLibraryAndCreateWindows () {
	waitLibraryPromise.then((res) => {
		if (server) {
			global.serverAddr = server.getAddress();
		};
		createMainWindow();
	}, (err) => {
		electron.dialog.showErrorBox('Error: failed to run server', err.toString());
	});
};

nativeTheme.on('updated', () => {
	MenuManager.updateTrayIcon();
	Util.send(win, 'native-theme', Util.isDarkTheme());
});

function createMainWindow () {
	const image = nativeImage.createFromPath(path.join(Util.imagePath(), 'icon512x512.png'));

	let state = windowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 600
	});

	let param = {
		backgroundColor: Util.getBgColor(),
		show: false,
		x: state.x,
		y: state.y,
		width: state.width,
		height: state.height,
		minWidth: MIN_WIDTH,
		minHeight: MIN_HEIGHT,
		webPreferences: {
			nativeWindowOpen: true,
			nodeIntegration: true,
			contextIsolation: false,
			spellcheck: false
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

	win = new BrowserWindow(param);
	remote.enable(win.webContents);

	state.manage(win);

	win.once('ready-to-show', () => {
		win.show();

		if (deeplinkingUrl) {
			Util.send(win, 'route', deeplinkingUrl.replace(`${protocol}://`, '/'));
		};
	});

	win.on('close', (e) => {
		Util.log('info', 'close: ' + app.isQuiting);

		if (app.isQuiting) {
			return;
		};
		
		e.preventDefault();
		if (!is.linux) {
			if (win.isFullScreen()) {
				win.setFullScreen(false);
				win.once('leave-full-screen', () => { win.hide(); });
			} else {
				win.hide();
			};
		} else {
			exit(false);
		};
		return false;
	});

	win.on('enter-full-screen', () => {
		Util.send(win, 'enter-full-screen');
	});

	win.on('leave-full-screen', () => {
		Util.send(win, 'leave-full-screen');
	});

	if (process.env.ELECTRON_DEV_EXTENSIONS) {
		BrowserWindow.addDevToolsExtension(
			path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.6.0_0')
		);
	};

	if (is.development) {
		win.loadURL('http://localhost:' + port);
		win.toggleDevTools();
	} else {
		win.loadFile('./dist/index.html');
	};

	ipcMain.on('appLoaded', () => {
		Util.send(win, 'init', dataPath.join('/'), ConfigManager.config, Util.isDarkTheme());
	});

	ipcMain.on('keytarSet', (e, key, value) => {
		if (key && value) {
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	});

	ipcMain.on('keytarGet', (e, key) => {
		keytar.getPassword(KEYTAR_SERVICE, key).then((value) => {
			Util.send(win, 'keytarGet', key, value);
		});
	});

	ipcMain.on('keytarDelete', (e, key) => {
		keytar.deletePassword(KEYTAR_SERVICE, key);
	});

	ipcMain.on('exit', (e, relaunch) => {
		exit(relaunch);
	});

	ipcMain.on('shutdown', (e, relaunch) => {
		shutdown(relaunch);
	});

	ipcMain.on('updateDownload', (e) => {
		UpdateManager.download();
	});

	ipcMain.on('updateConfirm', (e) => {
		exit(true);
	});

	ipcMain.on('configSet', (e, config) => {
		setConfig(config);
	});

	ipcMain.on('updateCancel', (e) => {
		UpdateManager.cancel();
	});

	ipcMain.on('urlOpen', async (e, url) => {
		shell.openExternal(url).catch((error) => {
			console.log(error);
		});
	});

	ipcMain.on('pathOpen', async (e, path) => {
		shell.openPath(path).catch((err) => {
			console.log(err);
		});
	});

	ipcMain.on('windowOpen', (e, route) => {
		deeplinkingUrl = route;
		createWindow();
	});

	ipcMain.on('download', async (e, url) => {
		const win = BrowserWindow.getFocusedWindow();
		await download(win, url, { saveAs: true });
	});

	ipcMain.on('proxyEvent', function () {
		let args = Object.values(arguments);

		args.shift();
		send.apply(this, args);
	});

	ipcMain.on('winCommand', (e, cmd, param) => {
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
				dialog.showOpenDialog({ 
					properties: [ 'openDirectory' ],
				}).then((result) => {
					const files = result.filePaths;
					if ((files == undefined) || !files.length) {
						Util.send(win, 'command', 'saveAsHTMLSuccess');
						return;
					};

					Util.savePage(win, files[0], param.name);
				});
				break;
		};
	});

	UpdateManager.init(win);
	UpdateManager.exit = exit;

	MenuManager.setConfig = setConfig;
	MenuManager.setChannel = (channel) => {
		if (!UpdateManager.isUpdating) {
			setConfig({ channel: channel }, (error) => { 
				UpdateManager.setChannel(channel); 
			});
		};
	};
	MenuManager.initMenu(win);
	MenuManager.initTray(win);
};

function setConfig (obj, callBack) {
	ConfigManager.set(obj, (err) => {
		Util.send(win, 'config', ConfigManager.config);

		if (callBack) {
			callBack(err);
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
		const scheme = `${protocol}://`;
		deeplinkingUrl = argv.find((arg) => arg.startsWith(scheme));
		if (deeplinkingUrl) {
			Util.send(win, 'route', deeplinkingUrl.replace(scheme, '/'));
		};
	};

	if (win) {
		if (win.isMinimized()) {
			win.restore();
		};
		win.show();
		win.focus();
	};
});

app.on('window-all-closed', (e) => {
	Util.log('info', 'window-all-closed');

	if (is.linux) {
		e.preventDefault();
		exit(false);
	};
});

app.on('before-quit', (e) => {
	Util.log('info', 'before-quit');

	if (app.isQuiting) {
		app.exit(0);
	} else {
		e.preventDefault();
		exit(false);
	};
});

app.on('activate', () => { win ? win.show() : createMainWindow(); });

app.on('open-url', (e, url) => {
	e.preventDefault();

	if (win) {
		Util.send(win, 'route', url.replace(`${protocol}://`, '/'));
		win.show();
	};
});

function shutdown (relaunch) {
	Util.log('info', 'AppShutdown, relaunch: ' + relaunch);

	if (relaunch) {
		Util.log('info', 'Relaunch');
		app.isQuiting = true;
		UpdateManager.relaunch();
	} else {
		app.exit(0);
	};
};

function exit (relaunch) {
	if (app.isQuiting) {
		return;
	};

	Util.log('info', 'MW shutdown is starting, relaunch: ' + relaunch);
	Util.send(win, 'shutdownStart');

	if (useGRPC) {
		if (server) {
			server.stop().then(()=>{
				Util.log('info', 'MW shutdown complete');
				shutdown(relaunch);
			});
		} else {
			Util.log('warn', 'MW server not set');
			shutdown(relaunch);
		};
	} else {
		Util.send(win, 'shutdown', relaunch);
	};
};