const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session, Tray, nativeImage } = require('electron');
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

const TIMEOUT_UPDATE = 600 * 1000;
const MIN_WIDTH = 900;
const MIN_HEIGHT = 640;

let isUpdating = false;
let userPath = app.getPath('userData');
let waitLibraryPromise;
let useGRPC = !process.env.ANYTYPE_USE_ADDON && (process.env.ANYTYPE_USE_GRPC || (process.platform == "win32") || is.development);
let defaultChannel = version.match('alpha') ? 'alpha' : 'latest';
let timeoutUpdate = 0;
let service, server;
let dataPath = [];
let config = {};
let win = null;
let tray = null;
let menu = null;
let csp = [
	"default-src 'self' 'unsafe-eval'",
	"img-src 'self' http://*:* https://*:* data: blob:",
	"media-src 'self' http://*:* https://*:* data: blob:",
	"style-src 'unsafe-inline' http://localhost:*",
	"font-src data:",
	"connect-src http://localhost:* http://127.0.0.1:* ws://localhost:* https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data:",
	"script-src-elem http://localhost:* https://sentry.io devtools://devtools 'unsafe-inline'",
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
	try {
		fs.mkdirSync(process.env.DATA_PATH);
	} catch (err) {};

	dataPath.push(process.env.DATA_PATH);
} else {
	dataPath.push(userPath);
	if (!app.isPackaged) {
		dataPath.push('dev');
	};
	dataPath.push('data');
};

if (useGRPC) {
	console.log('Connect via gRPC');

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
	const Service = require('./dist/lib/pb/protos/service/service_grpc_web_pb.js');

	service = new Service.ClientCommandsClient('', null, null);

	console.log('Connect via native addon');

	waitLibraryPromise = Promise.resolve();

	const bindings = require('bindings')({
		bindings: 'addon.node',
		module_root: path.join(__dirname, 'build'),
	});

	let napiCall = (method, inputObj, outputObj, request, callBack) => {
		const a = method.split('/');
		method = a[a.length - 1];

		const buffer = inputObj.serializeBinary();
		const handler = (item) => {
			try {
				let message = request.b(item.data.buffer);
				if (message && callBack) {
					callBack(null, message);
				};
			} catch (err) {
				console.error(err);
			};
		};
		bindings.sendCommand(method, buffer, handler);
	};

	service.client_.rpcCall = napiCall;
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

function createWindow () {
	const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
	const image = nativeImage.createFromPath(path.join(__dirname, '/electron/icon512x512.png'));

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		})
	});

	tray = new Tray (path.join(__dirname, '/electron/icon16x16.png'));
	tray.setToolTip('Anytype');
	tray.setContextMenu(Menu.buildFromTemplate([
		{
            label: 'Show window',
			click: () => { win.show(); }
		},
	]));

	let state = windowStateKeeper({
		defaultWidth: width,
		defaultHeight: height
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
			nodeIntegration: true
		},
	};

	if (process.platform == 'linux') {
		param.icon = image;
	};

	if (process.platform == 'darwin') {
		app.dock.setIcon(image);
		param.icon = path.join(__dirname, '/electron/icon.icns');
	};

	if (process.platform == 'win32') {
		param.icon = path.join(__dirname, '/electron/icon.ico');
	};

	if (process.platform != 'linux') {
		param.frame = false;
		param.titleBarStyle = 'hiddenInset';
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
			win.hide();
		} else {
			exit(false);
		};
		return false;
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

	ipcMain.on('exit', (e, relaunch) => {
		exit(relaunch);
	});

	ipcMain.on('updateDownload', (e) => {
		checkUpdate(false);
	});

	ipcMain.on('updateCancel', (e) => {
		clearTimeout(timeoutUpdate);
	});

	ipcMain.on('urlOpen', async (e, url) => {
		shell.openExternal(url).catch((error) => {
			console.log(error);
		});
	});

	ipcMain.on('pathOpen', async (e, path) => {
		shell.openItem(path).catch((error) => {
			console.log(error);
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

	storage.get('config', (error, data) => {
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
							icon_path: __dirname + '/electron/icon.png',
							css_path: __dirname + '/electron/about.css',
							product_name: 'Anytype',
							description: 'Anytype is a next generation software that breaks down barriers between applications, gives back privacy and data ownership to users.',
							copyright: 'Copyright (c) 2020 Anytype',
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
					click: () => { exit(false); }
				},
			]
		},
		{
			role: 'fileMenu',
			submenu: [
				{
					label: 'Show work directory',
					click: () => { shell.openItem(app.getPath('userData')); }
				},
				{
					label: 'Import',
					click: () => { send('import'); }
				},
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
					click: () => { send('commandEditor', 'search'); }
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
					label: 'Status',
					click: () => { send('popup', 'help', { document: 'status' }); }
				},
				{
					label: 'Shortcuts',
					click: () => { send('popup', 'shortcut'); }
				},
				{
					label: 'What\'s new',
					click: () => { send('popup', 'help', { document: 'whatsNew' }); }
				},
			]
		},
	];

	if (config.allowDebug) {
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
				{
					label: 'Flags',
					submenu: [
						{
							label: 'Interface', type: 'checkbox', checked: config.debugUI,
							click: () => {
								setConfig({ debugUI: !config.debugUI }, () => {
									send('toggleDebug', 'ui', config.debugUI);
								});
							}
						},
						{
							label: 'Middleware', type: 'checkbox', checked: config.debugMW,
							click: () => {
								setConfig({ debugMW: !config.debugMW }, () => {
									send('toggleDebug', 'mw', config.debugMW);
								});
							}
						},
						{
							label: 'Analytics', type: 'checkbox', checked: config.debugAN,
							click: () => {
								setConfig({ debugAN: !config.debugAN }, () => {
									send('toggleDebug', 'an', config.debugAN);
								});
							}
						},
					]
				},
				{
					label: 'Refresh', accelerator: 'CmdOrCtrl+R',
					click: () => { win.reload(); }
				},
				{
					label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I',
					click: () => {
						win.webContents.openDevTools();
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
	storage.set('config', config, (error) => {
		if (callBack) {
			callBack(error);
		};
	});
};

function checkUpdate (auto) {
	if (isUpdating) {
		return;
	};

	autoUpdater.checkForUpdatesAndNotify();
	clearTimeout(timeoutUpdate);
	timeoutUpdate = setTimeout(() => { checkUpdate(true); }, TIMEOUT_UPDATE);
	autoUpdate = auto;
};

function autoUpdaterInit () {
	console.log('Channel: ', config.channel);

	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'debug';
	autoUpdater.autoDownload = false;
	autoUpdater.channel = config.channel;

	setTimeout(() => { checkUpdate(true); }, TIMEOUT_UPDATE);

	autoUpdater.on('checking-for-update', () => {
		Util.log('info', 'Checking for update');
		send('checking-for-update', autoUpdate);
	});

	autoUpdater.on('update-available', (info) => {
		Util.log('info', 'Update available: ' + JSON.stringify(info, null, 3));
		isUpdating = true;
		clearTimeout(timeoutUpdate);
		send('update-available', autoUpdate);

		if (!autoUpdate) {
			autoUpdater.downloadUpdate();
		};
	});

	autoUpdater.on('update-not-available', (info) => {
		isUpdating = false;
		Util.log('info', 'Update not available: ' +  JSON.stringify(info, null, 3));
		send('update-not-available', autoUpdate);
	});
	
	autoUpdater.on('error', (err) => { 
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
		Util.log('info', 'Update downloaded: ' +  JSON.stringify(info, null, 3));
		send('update-downloaded');
		app.isQuiting = true;
		autoUpdater.quitAndInstall();
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
	e.preventDefault();
	Util.log('info', 'before-quit');

	exit(false);
});

function send () {
	if (win) {
		win.webContents.send.apply(win.webContents, arguments);
	};
};

function exit (relaunch) {
	if (win) {
		win.hide();
	};

	let cb = () => {
		setTimeout(() => {
			if (relaunch) {
				Util.log('info', 'Relaunch');
				app.relaunch();
			};
			app.exit(0);
		}, 2000);
	};

	Util.log('info', 'MW shutdown is starting');

	if (useGRPC) {
		if (server) {
			server.stop().then(()=>{
				Util.log('info', 'MW shutdown complete');
				cb();
			});
		} else {
			Util.log('warn', 'MW server not set');
			cb();
		}
	} else {
		const Commands = require('./dist/lib/pb/protos/commands_pb');

		if (service) {
			service.shutdown(new Commands.Empty(), {}, () => {
				Util.log('info', 'MW shutdown complete');
				cb();
			});
		} else {
			Util.log('warn', 'MW service not set');
			cb();
		};
	};
};
