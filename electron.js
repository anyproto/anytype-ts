const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session, Tray, nativeImage, nativeTheme } = require('electron');
const { is, fixPathForAsarUnpack } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const storage = require('electron-json-storage');
const fs = require('fs');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const version = app.getVersion();
const Util = require('./electron/util.js');
const windowStateKeeper = require('electron-window-state');
const port = process.env.SERVER_PORT;
const openAboutWindow = require('about-window').default;
const keytar = require('keytar');
const bindings = require('bindings');
const envPath = path.join(__dirname, 'electron', 'env.json');
const systemVersion = process.getSystemVersion();
const protocol = 'anytype';

const TIMEOUT_UPDATE = 600 * 1000;
const MIN_WIDTH = 752;
const MIN_HEIGHT = 480;
const KEYTAR_SERVICE = 'Anytype';
const CONFIG_NAME = 'devconfig';

let env = {};
try { env = JSON.parse(fs.readFileSync(envPath)); } catch (e) {};

app.setAsDefaultProtocolClient(protocol);

let isUpdating = false;
let userPath = app.getPath('userData');
let tmpPath = path.join(userPath, 'tmp');
let waitLibraryPromise;
let useGRPC = !process.env.ANYTYPE_USE_ADDON && (env.USE_GRPC || process.env.ANYTYPE_USE_GRPC || (process.platform == "win32") || is.development);
let defaultChannel = version.match('alpha') ? 'alpha' : 'latest';
let timeoutUpdate = 0;
let server;
let dataPath = [];
let config = {};
let win = null;
let tray = null;
let menu = null;
let csp = [
	"default-src 'self' 'unsafe-eval'",
	"img-src 'self' http://*:* https://*:* data: blob: file://*",
	"media-src 'self' http://*:* https://*:* data: blob: file://*",
	"style-src 'unsafe-inline' http://localhost:* file://*",
	"font-src data: file://*",
	"connect-src http://localhost:* http://127.0.0.1:* ws://localhost:* https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data:",
	"script-src-elem file: http://localhost:* https://sentry.io devtools://devtools 'unsafe-inline'",
	"frame-src chrome-extension://react-developer-tools"
];
let autoUpdate = false;

if (is.development && !port) {
	console.error('ERROR: Please define SERVER_PORT env var');
	exit(false);
	return;
};

if (app.isPackaged && !app.requestSingleInstanceLock()) {
	exit(false);
	return;
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
	server = require('./electron/server.js');
	let binPath = path.join(__dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}`);
	binPath = fixPathForAsarUnpack(binPath);

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
		createWindow();
	}, (err) => {
		electron.dialog.showErrorBox('Error: failed to run server', err.toString());
	});
};

function trayIcon () {
	if (is.windows) {
		return path.join(__dirname, '/electron/icon64x64.png');
	} else {
		const dark = nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;
		return path.join(__dirname, '/electron/icon-tray-' + (dark ? 'white' : 'black') + '.png');
	};
};

nativeTheme.on('updated', () => {
	tray.setImage(trayIcon());
});

function initTray () {
	tray = new Tray (trayIcon());
	tray.setToolTip('Anytype');
	tray.setContextMenu(Menu.buildFromTemplate([
		{ label: 'Open Anytype', click: () => { win.show(); } },

		{ type: 'separator' },

		{ label: 'Settings', click: () => { win.show(); send('popup', 'settings'); } },
		{ label: 'Check for updates', click: () => { win.show(); checkUpdate(false); } },

		{ type: 'separator' },

		{ label: 'Import', click: () => { win.show(); send('popup', 'settings', { data: { page: 'importIndex' } }); } },
		{ label: 'Export', click: () => { win.show(); send('popup', 'settings', { data: { page: 'exportMarkdown' } }); } },
		
		{ type: 'separator' },

		{ label: 'New object', click: () => { win.show(); send('command', 'create'); } },
		{ label: 'Search object', click: () => { win.show(); send('popup', 'search', { preventResize: true }); } },
		
		{ type: 'separator' },

		{ label: 'Object diagnostics', click: () => { win.show(); send('debugSync'); } },
		{ label: 'Tree diagnostics', click: () => { win.show(); send('debugTree'); } },

		{ type: 'separator' },

		{ 
			label: 'Quit',
			click: () => { 
				if (win) {
					win.hide();
				};
				exit(false); 
			}
		},
	]));
};

function createWindow () {
	const image = nativeImage.createFromPath(path.join(__dirname, '/electron/icon512x512.png'));

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		})
	});

	initTray();

	let state = windowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 600
	});

	let param = {
		backgroundColor: '#fff',
		show: false,
		x: state.x,
		y: state.y,
		width: state.width,
		height: state.height,
		minWidth: MIN_WIDTH,
		minHeight: MIN_HEIGHT,
		webPreferences: {
			nativeWindowOpen: true,
			enableRemoteModule: true,
			nodeIntegration: true,
			contextIsolation: false,
			spellcheck: false
		},
	};

	if (process.platform == 'linux') {
		param.icon = image;
	};

	if (process.platform == 'darwin') {
		app.dock.setIcon(image);
		param.icon = path.join(__dirname, '/electron/icon.icns');

		const a = systemVersion.split('.');
		if (a.length && (a[0] == 11)) {
			param.trafficLightPosition = { x: 20, y: 36 };
		} else {
			param.trafficLightPosition = { x: 20, y: 21 };
		};
	};

	if (process.platform == 'win32') {
		param.icon = path.join(__dirname, '/electron/icon.ico');
	};

	if (process.platform != 'linux') {
		param.frame = false;
		param.titleBarStyle = 'hidden';
	};

	win = new BrowserWindow(param);

	state.manage(win);

	win.once('ready-to-show', () => {
		win.show();
	});

	win.on('close', (e) => {
		if (app.isQuiting) {
			return;
		};
		
		e.preventDefault();
		if (process.platform == 'darwin') {
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
		send('enter-full-screen');
	});

	win.on('leave-full-screen', () => {
		send('leave-full-screen');
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
		send('dataPath', dataPath.join('/'));
		send('config', config);
	});

	ipcMain.on('keytarSet', (e, key, value) => {
		if (key && value) {
			keytar.setPassword(KEYTAR_SERVICE, key, value);
		};
	});

	ipcMain.on('keytarGet', (e, key) => {
		keytar.getPassword(KEYTAR_SERVICE, key).then((value) => {
			send('keytarGet', key, value);
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
		autoUpdater.downloadUpdate();
	});

	ipcMain.on('updateConfirm', (e) => {
		exit(true);
	});

	ipcMain.on('updateCancel', (e) => {
		isUpdating = false;
		clearTimeout(timeoutUpdate);
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

	ipcMain.on('download', async (e, url) => {
		const win = BrowserWindow.getFocusedWindow();
		await download(win, url, { saveAs: true });
	});

	ipcMain.on('proxyEvent', function () {
		let args = Object.values(arguments);

		args.shift();
		send.apply(this, args);
	});

	ipcMain.on('winCommand', (e, cmd) => {
		switch (cmd) {
			case 'menu':
				menu.popup({ x: 16, y: 38 });
				break;

			case 'minimize':
				win.minimize();
				break;

			case 'maximize':
				win.setFullScreen(!win.isFullScreen());
				break;

			case 'close':
				exit(false);
				break;
		};
	});

	storage.get(CONFIG_NAME, (error, data) => {
		config = data || {};
		config.channel = String(config.channel || defaultChannel);

		if (error) {
			console.error(error);
		};

		Util.log('info', 'Config: ' + JSON.stringify(config, null, 3));

		autoUpdaterInit();
		menuInit();
	});
};

function menuInit () {
	let menuParam = [
		{
			label: 'Anytype',
			submenu: [
				{
					label: 'About Anytype',
					click: () => {
						openAboutWindow({
							icon_path: path.join(__dirname, '/electron/icon.png'),
							css_path: path.join(__dirname, '/electron/about.css'),
							product_name: 'Anytype',
							description: 'Anytype is a next generation software that breaks down barriers between applications, gives back privacy and data ownership to users.',
							copyright: `Copyright (c) ${new Date().getFullYear()} Anytype Inc.`,
							homepage: 'https://anytype.io',
							package_json_dir: __dirname,
							use_version_info: false,
							show_close_button: 'Close',
							adjust_window_size: true,
						});
					}
				},
				{ type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{
					label: 'Check for updates',
					click: () => { checkUpdate(false); }
				},
				{ type: 'separator' },
				{
					label: 'Quit', accelerator: 'CmdOrCtrl+Q',
					click: () => { 
						if (win) {
							win.hide();
						};
						exit(false); 
					}
				},
			]
		},
		{
			role: 'fileMenu',
			submenu: [
				{ label: 'Show work directory', click: () => { shell.openPath(app.getPath('userData')); } },
				{
					label: 'Import',
					click: () => { send('popup', 'settings', { data: { page: 'importIndex' } }); }
				},
				{
					label: 'Export',
					click: () => { send('popup', 'settings', { data: { page: 'exportMarkdown' } }); }
				},
				{ label: 'Save as file', click: () => { send('command', 'save'); } },

				{ type: 'separator' },

				{ label: 'Object diagnostics', click: () => { send('debugSync'); } },
				{ label: 'Tree diagnostics', click: () => { win.show(); send('debugTree'); } },

				{ type: 'separator' },

				{ role: 'close' },
			]
		},
		{
			role: 'editMenu',
			submenu: [
				{
					label: 'Undo', accelerator: 'CmdOrCtrl+Z',
					click: () => {
						win.webContents.undo();
						send('command', 'undo');
					}
				},
				{
					label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z',
					click: () => {
						win.webContents.redo();
						send('command', 'redo');
					}
				},

				{ type: 'separator' },

				{ label: 'Copy', role: 'copy' },
				{ label: 'Cut', role: 'cut' },
				{ label: 'Paste', role: 'paste' },

				{ type: 'separator' },

				{
					label: 'Select all', accelerator: 'CmdOrCtrl+A',
					click: () => {
						win.webContents.selectAll();
						send('commandEditor', 'selectAll');
					}
				},
				{
					label: 'Search', accelerator: 'CmdOrCtrl+F',
					click: () => { send('commandGlobal', 'search'); }
				},
				{ type: 'separator' },
				{
					label: 'Print', accelerator: 'CmdOrCtrl+P',
					click: () => { send('commandGlobal', 'print'); }
				},
			]
		},
		{
			role: 'windowMenu',
		},
		{
			label: 'Help',
			submenu: [
				{
					label: 'Anytype ID',
					click: () => { send('commandGlobal', 'id'); }
				},
				{
					label: 'Shortcuts',
					click: () => { send('popup', 'shortcut'); }
				},
				{
					label: 'What\'s new',
					click: () => { send('popup', 'help', { data: { document: 'whatsNew' } }); }
				},
				{
					label: 'Introduction',
					click: () => { send('popup', 'help', { data: { document: 'intro' } }); }
				},
			]
		},
	];

	if (config.allowDebug) {
		config.debug = config.debug || {};

		const flags = { 
			ui: 'Interface', 
			ho: 'Hidden objects', 
			mw: 'Middleware', 
			th: 'Threads', 
			an: 'Analytics', 
			dm: 'Dark Mode',
			js: 'JSON',
		};
		const flagMenu = [];

		for (let i in flags) {
			flagMenu.push({
				label: flags[i], type: 'checkbox', checked: config.debug[i],
				click: () => {
					config.debug[i] = !config.debug[i];
					setConfig({ debug: config.debug });
					
					if ([ 'ui', 'ho', 'dm' ].indexOf(i) >= 0) {
						win.reload();
					};
				}
			});
		};

		/*
		flagMenu.push({
			label: 'Dark mode', type: 'checkbox', checked: nativeTheme.shouldUseDarkColors,
			click: () => {
				nativeTheme.themeSource = !nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
			}
		});
		*/

		menuParam.push({
			label: 'Debug',
			submenu: [
				{
					label: 'Version',
					submenu: [
						{
							label: 'Alpha', type: 'radio', checked: (config.channel == 'alpha'),
							click: () => { setChannel('alpha'); }
						},
						{
							label: 'Public', type: 'radio', checked: (config.channel == 'latest'),
							click: () => { setChannel('latest'); }
						},
					]
				},
				{ label: 'Flags', submenu: flagMenu },
				{
					label: 'Refresh', accelerator: 'CmdOrCtrl+R',
					click: () => { win.reload(); }
				},
				{
					label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I',
					click: () => { win.webContents.openDevTools(); }
				},
				{
					label: 'Export templates',
					click: () => { send('command', 'exportTemplates'); }
				}
			]
		});
	};

	if (config.sudo) {
		menuParam.push({
			label: 'Sudo',
			submenu: [
				{
					label: 'Experimental', type: 'checkbox', checked: config.experimental,
					click: () => { 
						setConfig({ experimental: !config.experimental });
						win.reload();
					}
				}
			]
		});
	};

	menu = Menu.buildFromTemplate(menuParam);
	Menu.setApplicationMenu(menu);
};

function setChannel (channel) {
	if (isUpdating) {
		return;
	};
	setConfig({ channel: channel }, (error) => {
		autoUpdater.channel = channel;
		checkUpdate(false);
	});
};

function setConfig (obj, callBack) {
	config = Object.assign(config, obj);
	storage.set(CONFIG_NAME, config, (error) => {
		send('config', config);
		if (callBack) {
			callBack(error);
		};
	});
};

function checkUpdate (auto) {
	Util.log('info', 'isUpdating: ' + isUpdating);
	if (isUpdating) {
		return;
	};

	autoUpdater.checkForUpdatesAndNotify().catch((err) => {
		Util.log('info', 'checkForUpdatesAndNotify error: ' + err);
	});

	clearTimeout(timeoutUpdate);
	timeoutUpdate = setTimeout(() => { checkUpdate(true); }, TIMEOUT_UPDATE);
	autoUpdate = auto;
};

function autoUpdaterInit () {
	console.log('Channel: ', config.channel);

	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'debug';
	autoUpdater.autoDownload = false;
	autoUpdater.autoInstallOnAppQuit = false;
	autoUpdater.channel = config.channel;

	clearTimeout(timeoutUpdate);
	timeoutUpdate = setTimeout(() => { checkUpdate(true); }, TIMEOUT_UPDATE);

	autoUpdater.on('checking-for-update', () => {
		Util.log('info', 'Checking for update');
		send('checking-for-update', autoUpdate);
	});

	autoUpdater.on('update-available', (info) => {
		Util.log('info', 'Update available: ' + JSON.stringify(info, null, 3));
		isUpdating = true;
		clearTimeout(timeoutUpdate);
		send('update-available', autoUpdate);

		if (autoUpdate) {
			autoUpdater.downloadUpdate();
		};
	});

	autoUpdater.on('update-not-available', (info) => {
		isUpdating = false;
		Util.log('info', 'Update not available: ' +  JSON.stringify(info, null, 3));
		send('update-not-available', autoUpdate);
	});
	
	autoUpdater.on('error', (err) => { 
		isUpdating = false;
		Util.log('Error: ' + err);
		send('update-error', err, autoUpdate);
	});
	
	autoUpdater.on('download-progress', (progress) => {
		isUpdating = true;

		let msg = [
			'Download speed: ' + progress.bytesPerSecond,
			'-',
			'Downloaded: ' + progress.percent + '%',
			'(' + progress.transferred + '/' + progress.total + ')'
		];
		Util.log('info', msg.join(' '));

		send('download-progress', progress);
	});

	autoUpdater.on('update-downloaded', (info) => {
		isUpdating = false;
		Util.log('info', 'Update downloaded: ' +  JSON.stringify(info, null, 3));
		send('update-downloaded');

		if (!autoUpdate) {
			exit(true);
		} else {
			send('update-confirm');
		};
	});
};

app.on('ready', waitForLibraryAndCreateWindows);

app.on('second-instance', (event, argv, cwd) => {
	Util.log('info', 'second-instance');

	if (win) {
		if (win.isMinimized()) {
			win.restore();
		};
		win.focus();
	};
});

app.on('window-all-closed', (e) => {
	Util.log('info', 'window-all-closed');

	if (process.platform == 'linux') {
		e.preventDefault();
		exit(false);
	};
});

app.on('before-quit', (e) => {
	Util.log('info', 'before-quit');

	if (app.isQuiting) {
		exit(0);
	} else {
		e.preventDefault();
		exit(false);
	};
});

app.on('activate', () => {
	win ? win.show() : createWindow();
});

app.on('open-url', (e, url) => {
	if (process.platform == 'win32') {
		url = process.argv.slice(1);
	};
	send('route', url.replace(`${protocol}://`, ''));
});

function send () {
	if (win) {
		win.webContents.send.apply(win.webContents, arguments);
	};
};

function shutdown (relaunch) {
	Util.log('info', 'Shutdown, relaunch: ' + relaunch);

	setTimeout(() => {
		if (relaunch) {
			Util.log('info', 'Relaunch');
			app.isQuiting = true;
			autoUpdater.quitAndInstall();
		} else {
			app.exit(0);
		};
	}, 3000);
};

function exit (relaunch) {
	if (app.isQuiting) {
		return;
	};

	Util.log('info', 'MW shutdown is starting, relaunch: ' + relaunch);

	send('shutdownStart');

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
		send('shutdown', relaunch);
	};
};
