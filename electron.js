const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session, globalShortcut } = require('electron');
const { is, appMenu, fixPathForAsarUnpack } = require('electron-util');
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

let isUpdating = false;
let userPath = app.getPath('userData');
let waitLibraryPromise;
let useGRPC = !process.env.ANYTYPE_USE_ADDON && (process.env.ANYTYPE_USE_GRPC || (process.platform == "win32") || is.development);
let defaultChannel = version.match('alpha') ? 'alpha' : 'latest';
let timeoutUpdate = 0;

let service, server;

if (app.isPackaged && !app.requestSingleInstanceLock()) {
	exit(false);
	return;
};

storage.setDataPath(userPath);

let dataPath = [];
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
	
	let napiCall = function (method, inputObj, outputObj, request, callBack){
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

let config = {};
let win = null;
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

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [ csp.join('; ') ]
			}
		})
	});

	let mainWindowState = windowStateKeeper({
		defaultWidth: width,
		defaultHeight: height
	});
	
	let param = {
		backgroundColor: '#fff',
		show: false,
		x: mainWindowState.x,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 900,
		minHeight: 640,
		icon: path.join(__dirname, '/electron/icon512x512.png'),
		webPreferences: {
			nodeIntegration: true
		},
	};

	if (process.platform == 'darwin') {
		param.titleBarStyle = 'hiddenInset';
		param.frame = false;
	};

	win = new BrowserWindow(param);

	mainWindowState.manage(win);
	
	win.once('ready-to-show', () => {
		win.show();
	});
	
	win.on('closed', () => {
		win = null;
	});

	win.on('close', (e) => {
		if (!app.isQuiting) {
			e.preventDefault();
			win.minimize();
		};
		return false;
	});
	
	if (process.env.ELECTRON_DEV_EXTENSIONS) {
		BrowserWindow.addDevToolsExtension(
			path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.6.0_0')
		);
	};

	if (is.development) {
		win.loadURL('http://localhost:' + process.env.SERVER_PORT);
		win.toggleDevTools();
	} else {
		win.loadFile('./dist/index.html');
	};
	
	ipcMain.on('appLoaded', () => {
		win.webContents.send('dataPath', dataPath.join('/'));
		win.webContents.send('config', config);
	});

	ipcMain.on('exit', (e, relaunch) => {
		exit(relaunch);
	});

	ipcMain.on('update', (e) => {
		checkUpdate();
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

	storage.get('config', function (error, data) {
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
	let menu = [
		appMenu(),
		{
			role: 'fileMenu',
			submenu: [
				{
					label: 'Show work directory',
					click: function () { shell.openItem(app.getPath('userData')); }
				},
				{
					label: 'Import',
					click: function () { win.webContents.send('import'); }
				},
				{ role: 'close' },
			]
		},
		{
			role: 'editMenu',
			submenu: [
				{
					label: 'Undo', accelerator: 'CmdOrCtrl+Z',
					click: function () {
						win.webContents.undo();
						win.webContents.send('command', 'undo');
					}
				},
				{
					label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z',
					click: function () {
						win.webContents.redo();
						win.webContents.send('command', 'redo');
					}
				},
				{ type: 'separator' },
				{ label: 'Copy', role: 'copy' },
				{ label: 'Cut', role: 'cut' },
				{ label: 'Paste', role: 'paste' },
				{
					label: 'Select all', accelerator: 'CmdOrCtrl+A',
					click: function () {
						win.webContents.selectAll();
						win.webContents.send('commandEditor', 'selectAll');
					}
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
					label: 'Table of contents',
					click: function () { win.webContents.send('route', '/help/index'); }
				},
				{
					label: 'Keyboard & Shortcuts',
					click: function () { win.webContents.send('route', '/help/shortcuts'); }
				},
				{
					label: 'What\'s new',
					click: function () { win.webContents.send('route', '/help/new'); }
				},
				{
					label: 'Check for updates',
					click: function () { checkUpdate(); }
				},
			]
		},
	];

	//if (!app.isPackaged) {
	let menuDebug = {
		label: 'Debug',
		submenu: [
			{
				label: 'Flags',
				submenu: [
					{
						label: 'Interface', type: 'checkbox', checked: config.debugUI,
						click: function () {
							configSet({ debugUI: !config.debugUI }, function () {
								win.webContents.send('config', config);
							});
						}
					},
					{
						label: 'Middleware', type: 'checkbox', checked: config.debugMW,
						click: function () {
							configSet({ debugMW: !config.debugMW }, function () {
								win.webContents.send('config', config);
							});
						}
					},
					{
						label: 'Analytics', type: 'checkbox', checked: config.debugAN,
						click: function () {
							configSet({ debugAN: !config.debugAN }, function () {
								win.webContents.send('config', config);
							});
						}
					},
				]
			},
			{
				label: 'Refresh', accelerator: 'CmdOrCtrl+R',
				click: function () { win.reload(); }
			},
			{
				label: 'Dev Tools', accelerator: 'Alt+CmdOrCtrl+I',
				click: function () {
					win.webContents.openDevTools();
				}
			}
		]
	};

	if (config.allowChannels) {
		menuDebug.submenu.unshift({
			label: 'Version',
			submenu: [
				{
					label: 'Alpha', type: 'radio', checked: (config.channel == 'alpha'),
					click: function () {
						setChannel('alpha');
					}
				},
				{
					label: 'Public', type: 'radio', checked: (config.channel == 'latest'),
					click: function () {
						setChannel('latest');
					}
				},
			]
		});
	};

	menu.push(menuDebug);
	//};
	
	Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};

function setChannel (channel) {
	if (isUpdating) {
		return;
	};
	configSet({ channel: channel }, function (error) {
		autoUpdater.channel = channel;
		checkUpdate();
	});
};

function configSet (obj, callBack) {
	config = Object.assign(config, obj);
	storage.set('config', config, function (error) {
		if (callBack) {
			callBack(error);
		};
	});
};

function checkUpdate () {
	if (isUpdating) {
		return;
	};

	autoUpdater.checkForUpdatesAndNotify();
	clearTimeout(timeoutUpdate);
	timeoutUpdate = setTimeout(checkUpdate, 600 * 1000);
};

function autoUpdaterInit () {
	console.log('Channel: ', config.channel);
	
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	autoUpdater.channel = config.channel;
	
	setTimeout(checkUpdate, 5000);
	
	autoUpdater.on('checking-for-update', () => {
		Util.log('info', 'Checking for update');
	});
	
	autoUpdater.on('update-available', (info) => {
		Util.log('info', 'Update available');
		isUpdating = true;
		clearTimeout(timeoutUpdate);
		win.webContents.send('update');
	});
	
	autoUpdater.on('update-not-available', (info) => {
		isUpdating = false;
		Util.log('info', 'Update not available');
	});
	
	autoUpdater.on('error', (err) => { Util.log('Error: ' + err); });
	
	autoUpdater.on('download-progress', (progress) => {
		isUpdating = true;

		let msg = [
			'Download speed: ' + progress.bytesPerSecond,
			'-',
			'Downloaded: ' + progress.percent + '%',
			'(' + progress.transferred + '/' + progress.total + ')'
		];
		Util.log('info', msg.join(' '));
		
		win.webContents.send('progress', progress);
	});
	
	autoUpdater.on('update-downloaded', (info) => {
		Util.log('info', 'Update downloaded');
		win.webContents.send('updateReady');

		exit(true);
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

app.on('window-all-closed', () => {
	Util.log('info', 'window-all-closed');
});

app.on('before-quit', (e) => {
	e.preventDefault();
	Util.log('info', 'before-quit');

	exit(false);
});

function exit (relaunch) {
	console.log('Exit, bye!');

	let cb = () => {
		if (relaunch) {
			setTimeout(() => {
				Util.log('info', 'Relaunch');
				app.relaunch();
				app.exit(0);
			}, 2000);
		} else {
			app.exit(0);
		};
	};

	if (useGRPC) {
		if (server) {
			server.stop();
		};
		cb();
	} else {
		const Commands = require('./dist/lib/pb/protos/commands_pb');
		if (service) {
			service.shutdown(new Commands.Empty(), {}, () => {
				console.log('Shutdown complete, exiting');
				cb();
			});
		};
	};
};