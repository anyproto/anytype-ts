const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session, Tray, nativeImage, nativeTheme, dialog } = require('electron');
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
const keytar = require('keytar');
const bindings = require('bindings');
const envPath = path.join(__dirname, 'electron', 'env.json');
const systemVersion = process.getSystemVersion();
const protocol = 'anytype';
const remote = require('@electron/remote/main');

const TIMEOUT_UPDATE = 600 * 1000;
const MIN_WIDTH = 752;
const MIN_HEIGHT = 480;
const KEYTAR_SERVICE = 'Anytype';
const CONFIG_NAME = 'devconfig';

app.removeAsDefaultProtocolClient(protocol);

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(protocol, process.execPath, [ path.resolve(process.argv[1]) ]);
	};
} else {
	app.setAsDefaultProtocolClient(protocol);
};

try { env = JSON.parse(fs.readFileSync(envPath)); } catch (e) {};

remote.initialize();

let env = {};
let deeplinkingUrl = '';
let isUpdating = false;
let userPath = app.getPath('userData');
let tmpPath = path.join(userPath, 'tmp');
let waitLibraryPromise;
let useGRPC = !process.env.ANYTYPE_USE_ADDON && (env.USE_GRPC || process.env.ANYTYPE_USE_GRPC || is.windows || is.development);
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
	"connect-src http://localhost:* http://127.0.0.1:* ws://localhost:* https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data: https://*.wistia.com https://*.wistia.net https://embedwistia-a.akamaihd.net",
	"script-src-elem file: http://localhost:* https://sentry.io devtools://devtools 'unsafe-inline' https://*.wistia.com https://*.wistia.net",
	"frame-src chrome-extension://react-developer-tools"
];
let autoUpdate = false;

if (is.development && !port) {
	console.error('ERROR: Please define SERVER_PORT env var');
	exit(false);
};

if (!app.requestSingleInstanceLock() && app.isPackaged) {
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
		return path.join(__dirname, '/electron/icon-tray-' + (isDarkTheme() ? 'white' : 'black') + '.png');
	};
};

nativeTheme.on('updated', () => { initTheme(); });

function isDarkTheme () {
	return nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;
};

function initTheme () {
	if (tray) {
		tray.setImage(trayIcon());
	};

	send('native-theme', isDarkTheme());
};

function initTray () {
	tray = new Tray (trayIcon());
	
	tray.setToolTip('Anytype');

	tray.setContextMenu(Menu.buildFromTemplate([
		{ label: 'Open Anytype', click: () => { win.show(); } },

		{ type: 'separator' },

		{ label: 'Settings', click: () => { win.show(); send('popup', 'settings', {}, true); } },
		{ label: 'Check for updates', click: () => { win.show(); checkUpdate(false); } },

		{ type: 'separator' },

		{ label: 'Import', click: () => { win.show(); send('popup', 'settings', { data: { page: 'importIndex' } }, true); } },
		{ label: 'Export', click: () => { win.show(); send('popup', 'settings', { data: { page: 'exportMarkdown' } }, true); } },
		
		{ type: 'separator' },

		{ label: 'New object', click: () => { win.show(); send('command', 'create'); } },
		{ label: 'Search object', click: () => { win.show(); send('popup', 'search', { preventResize: true }, true); } },
		
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
		backgroundColor: getBgColor(),
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
		param.icon = path.join(__dirname, '/electron/icon.icns');
		param.trafficLightPosition = { x: 20, y: 18 };
	};

	if (is.windows) {
		param.icon = path.join(__dirname, '/electron/icon64x64.png');
	};

	win = new BrowserWindow(param);
	remote.enable(win.webContents);

	state.manage(win);

	win.once('ready-to-show', () => {
		win.show();

		if (deeplinkingUrl) {
			send('route', deeplinkingUrl.replace(`${protocol}://`, '/'));
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
		send('init', dataPath.join('/'), config, isDarkTheme());
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

	ipcMain.on('configSet', (e, config) => {
		setConfig(config);
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

	ipcMain.on('winCommand', (e, cmd, param) => {
		param = param || {};

		switch (cmd) {
			case 'menu':
				menu.popup({ x: 16, y: 38 });
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
						send('command', 'saveAsHTMLSuccess');
						return;
					};

					savePage(files[0], param.name);
				});
				break;
		};
	});

	autoUpdaterInit();
	menuInit();
};

function getTheme () {
	let { theme } = config;

	switch (theme) {
		default:
			return theme;

		case 'system':
			return isDarkTheme() ? 'dark' : '';
	};
};

function getBgColor () {
	let theme = getTheme();
	let bg = {
		'': '#fff',
		dark: '#2c2b27',
	};
	return bg[theme];
};

function openAboutWindow () {
    let window = new BrowserWindow({
		backgroundColor: getBgColor(),
        width: 400,
        height: 400,
        useContentSize: true,
        titleBarStyle: 'hidden-inset',
        show: true,
        icon: path.join(__dirname, 'electron', 'icon.png'),
        webPreferences: {
			nodeIntegration: true,
		},
    });

    window.loadURL('file://' + path.join(__dirname, 'electron', `about.html?version=${version}&theme=${getTheme()}`));

	window.once('closed', () => {
        window = null;
    });

    window.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    window.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

	window.once('ready-to-show', () => {
        window.show();
    });

    window.setMenu(null);
    return window;
};

function menuInit () {
	let menuParam = [
		{
			label: 'Anytype',
			submenu: [
				{ label: 'About Anytype', click: () => { openAboutWindow(); } },
				{ type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ role: 'hide', label: 'Hide Anytype' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{
					label: 'Check for updates',
					click: () => { checkUpdate(false); }
				},
				{
					label: 'Settings',
					click: () => { send('popup', 'settings', {}); }
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
			submenu: [
				{ role: 'minimize' },
      			{ role: 'zoom' },
				{
					label: 'Fullscreen', type: 'checkbox', checked: win.isFullScreen(),
					click: () => { win.setFullScreen(!win.isFullScreen()); }
				},
			]
		},
		{
			label: 'Help',
			submenu: [
				{
					label: 'Anytype ID',
					click: () => { send('commandGlobal', 'id'); }
				},
				{
					label: 'Shortcuts', accelerator: 'Ctrl+Space',
					click: () => { send('popup', 'shortcut'); }
				},
				{
					label: 'What\'s new',
					click: () => { send('popup', 'help', { data: { document: 'whatsNew' } }); }
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
			js: 'JSON',
		};
		const flagMenu = [];

		for (let i in flags) {
			flagMenu.push({
				label: flags[i], type: 'checkbox', checked: config.debug[i],
				click: () => {
					config.debug[i] = !config.debug[i];
					setConfig({ debug: config.debug });
					
					if ([ 'ho' ].includes(i)) {
						win.reload();
					};
				}
			});
		};

		menuParam.push({
			label: 'Debug',
			submenu: [
				{ label: 'Flags', submenu: flagMenu },
				{
					label: 'Refresh', accelerator: 'CmdOrCtrl+R',
					click: () => { win.reload(); }
				},
				{
					label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I',
					click: () => { win.webContents.openDevTools(); }
				},
			]
		});
	};

	if (config.sudo) {
		menuParam.push({
			label: 'Sudo',
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
				{
					label: 'Experimental', type: 'checkbox', checked: config.experimental,
					click: () => { 
						setConfig({ experimental: !config.experimental });
						win.reload();
					}
				},
				{
					label: 'Export templates',
					click: () => { send('command', 'exportTemplates'); }
				},
				{
					label: 'Export objects',
					click: () => { send('command', 'exportObjects'); }
				},
				{
					label: 'Export localstore',
					click: () => { send('command', 'exportLocalstore'); }
				},
				{
					label: 'Create workspace',
					click: () => { send('commandGlobal', 'workspace');	}
				},
				{
					label: 'Save page as HTML',
					click: () => { send('command', 'saveAsHTML');	}
				},
				{
					label: 'Relaunch',
					click: () => { exit(true); }
				},
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

app.on('ready', () => {
	storage.get(CONFIG_NAME, (error, data) => {
		config = data || {};
		config.channel = String(config.channel || defaultChannel);

		if (error) {
			console.error(error);
		};

		Util.log('info', 'Config: ' + JSON.stringify(config, null, 3));

		waitForLibraryAndCreateWindows();
	});
});

app.on('second-instance', (event, argv, cwd) => {
	Util.log('info', 'second-instance');

	if (!is.macos) {
		deeplinkingUrl = argv.find((arg) => arg.startsWith(`${protocol}://`));
		if (deeplinkingUrl) {
			const route = deeplinkingUrl.replace(`${protocol}://`, '/');
			send('route', route);
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

app.on('activate', () => {
	win ? win.show() : createWindow();
});

app.on('open-url', (e, url) => {
	e.preventDefault();
	send('route', url.replace(`${protocol}://`, '/'));
});

function send () {
	if (win) {
		win.webContents.send.apply(win.webContents, arguments);
	};
};

function shutdown (relaunch) {
	Util.log('info', 'AppShutdown, relaunch: ' + relaunch);

	if (relaunch) {
		Util.log('info', 'Relaunch');
		app.isQuiting = true;
		autoUpdater.quitAndInstall();
		//app.relaunch();
		//app.exit(0);
	} else {
		app.exit(0);
	};
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

function savePage (exportPath, name) {
	name = String(name || 'untitled').replace(/[^\w -\._]/gi, '-').toLowerCase();

	let fn = `${name}_files`;
	let filesPath = path.join(exportPath, fn);
	let exportName = path.join(exportPath, name + '.html');

	win.webContents.savePage(exportName, 'HTMLComplete').then(() => {
		let content = fs.readFileSync(exportName, 'utf8');

		// Replace files loaded by url and copy them in page folder
		try {
			content = content.replace(/"(file:\/\/[^"]+)"/g, function (s, p, o) {
				let a = p.split('app.asar/dist/');
				let name = a[1].split('/');

				name = name[name.length - 1];

				let src = p.replace('file://', '').replace(/\?.*/, '');
				let dst = path.join(filesPath, name).replace(/\?.*/, '');

				fs.copyFileSync(src, dst);
				return `./${fn}/${name}`;
			});
		} catch (e) {
			Util.log('info', e);
		};

		content = content.replace(/<script[^>]+><\/script>/g, '');

		try {
			const js = [ 'export', 'jquery' ];
			const ap = app.getAppPath();

			js.forEach((it) => {
				fs.copyFileSync(`${ap}/dist/js/${it}.js`, path.join(filesPath, it + '.js'));
			});

			content = content.replace('<!-- %REPLACE% -->', `
				<script src="./${fn}/jquery.js" type="text/javascript"></script>
				<script src="./${fn}/export.js" type="text/javascript"></script>
			`);
		} catch (e) {
			Util.log('info', e);
		};
		
		fs.writeFileSync(exportName, content);

		try {
			fs.unlinkSync(path.join(filesPath, 'main.js'));
			fs.unlinkSync(path.join(filesPath, 'run.js'));
		} catch (e) {
			Util.log('info', e);
		};

		shell.openPath(exportPath).catch(err => { 
			Util.log('info', err);
		});
		send('command', 'saveAsHTMLSuccess');
	}).catch(err => { 
		send('command', 'saveAsHTMLSuccess');
		Util.log('info', err); 
	});
};