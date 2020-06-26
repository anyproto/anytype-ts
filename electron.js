const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session, globalShortcut } = require('electron');
const { is, appMenu, fixPathForAsarUnpack } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const storage = require('electron-json-storage');
const Service = require('./dist/lib/pb/protos/service/service_grpc_web_pb.js');
const Commands = require('./dist/lib/pb/protos/commands_pb');

const SERVER = 'http://localhost:31008';
const service = new Service.ClientCommandsClient(SERVER, null, null);

let userPath = app.getPath('userData');
let waitLibraryPromise;
let useGRPC = true;

if (process.env.ANYTYPE_USE_ADDON === "1") {
	useGRPC = false;
} else 
if (process.env.ANYTYPE_USE_GRPC === "1") {
	useGRPC = true;
} else if (process.platform === "win32" || is.development) {
	// use grpc on windows by default, because addon is not supported
	// also use grpc on development environment by default
	useGRPC = true;
} else {
	useGRPC = false;
};

if (useGRPC) {
	console.log('Connect via gRPC');

	const server = require('./electron/server.js');
	
	let binPath = path.join( __dirname, 'dist', `anytypeHelper${is.windows ? '.exe' : ''}` );
	binPath = fixPathForAsarUnpack(binPath);
	waitLibraryPromise = server.start(binPath, userPath);
} else {
	console.log('Connect via native addon');

	waitLibraryPromise = Promise.resolve();
	
	const bindings = require('bindings')({
		bindings: 'addon.node', 
		module_root: path.join(__dirname, 'build'),
	});
	
	let napiCall = function (method, inputObj, outputObj, request, callBack){
		const buffer = inputObj.encode( request ).finish();
		const handler = function (item){
			let message = null;
			try {
				message = outputObj.decode( item.data );
				if (message) {
					callBack( message );
				};
			} catch (err) {
				console.error( err );
			};
		};
		bindings.sendCommand(method.name, buffer, handler);
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

storage.setDataPath(userPath);

let dataPath = [ userPath ];
if (!app.isPackaged) {
	dataPath.push('dev');
};
dataPath.push('data');

function waitForLibraryAndCreateWindows () {
	waitLibraryPromise.then(function(result) {
		createWindow();
	}, function(err) {
		console.log(err);
		electron.dialog.showErrorBox( 'Error: failed to run server', err.toString() );
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
	
	let param = {
		backgroundColor: '#fff',
		show: false,
		width: width,
		height: height,
		minWidth: 800,
		minHeight: 640,
		icon: path.join(__dirname, '/electron/icon512x512.png'),
		webPreferences: {
			nodeIntegration: true
		}
	};
	
	if (process.platform === 'darwin') {
		param.titleBarStyle = 'hiddenInset';
		param.frame = false;
	};
	
	win = new BrowserWindow(param);
	
	win.once('ready-to-show', () => {
		win.show()
	});
	
	win.on('closed', () => {
		win = null;
	});
	
	if (process.env.ELECTRON_DEV_EXTENSIONS) {
		BrowserWindow.addDevToolsExtension(
			path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.6.0_0')
		);
	};
	
	if (is.development) {
		win.loadURL('http://localhost:8080');
		win.toggleDevTools();
	} else {
		win.loadFile('./dist/index.html');
	};
	
	ipcMain.on('appLoaded', () => {
		win.webContents.send('dataPath', dataPath.join('/'));
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
		config.channel = String(config.channel || 'latest');
		
		if (error) {
			console.error(error);
		};
		
		console.log('Config: ', config);
		win.webContents.send('toggleDebug', 'ui', Boolean(config.debugUI));
		win.webContents.send('toggleDebug', 'mw', Boolean(config.debugMW));
		win.webContents.send('toggleDebug', 'an', Boolean(config.debugAN));
		
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
				{ label: 'Select all', role: 'selectAll' }
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
			]
		},
	];
	
	//if (!app.isPackaged) {
	menu.push({
		label: 'Debug',
		submenu: [
			{
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
			},
			{
				label: 'Flags',
				submenu: [
					{
						label: 'Interface', type: 'checkbox', checked: config.debugUI,
						click: function () {
							configSet({ debugUI: !config.debugUI }, function () {
								win.webContents.send('toggleDebug', 'ui', config.debugUI);
							});
						}
					},
					{
						label: 'Middleware', type: 'checkbox', checked: config.debugMW,
						click: function () {
							configSet({ debugMW: !config.debugMW }, function () {
								win.webContents.send('toggleDebug', 'mw', config.debugMW);
							});
						}
					},
					{
						label: 'Analytics', type: 'checkbox', checked: config.debugAN,
						click: function () {
							configSet({ debugAN: !config.debugAN }, function () {
								win.webContents.send('toggleDebug', 'an', config.debugAN);
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
	});
	//};
	
	Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};

function setChannel (channel) {
	configSet({ channel: channel }, function (error) {
		autoUpdater.channel = channel;
		autoUpdater.checkForUpdatesAndNotify();
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

function autoUpdaterInit () {
	console.log('Channel: ', config.channel);
	
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	autoUpdater.channel = config.channel;
	autoUpdater.checkForUpdatesAndNotify();
	
	autoUpdater.on('checking-for-update', () => {
		setStatus('Checking for update');
	});
	
	autoUpdater.on('update-available', (info) => {
		setStatus('Update available');
		win.webContents.send('update');
	});
	
	autoUpdater.on('update-not-available', (info) => {
		setStatus('Update not available');
	});
	
	autoUpdater.on('error', (err) => { setStatus('Error: ' + err); });
	
	autoUpdater.on('download-progress', (progress) => {
		let msg = [
			'Download speed: ' + progress.bytesPerSecond,
			'-',
			'Downloaded: ' + progress.percent + '%',
			'(' + progress.transferred + '/' + progress.total + ')'
		];
		setStatus(msg.join(' '));
		
		win.webContents.send('progress', progress);
	});
	
	autoUpdater.on('update-downloaded', (info) => {
		setTimeout(function () {
			setStatus('Update downloaded... Restarting App in 5 seconds');
			win.webContents.send('updateReady');
			autoUpdater.quitAndInstall();
		}, 2000);
	});
	
};

function setStatus (text) {
	log.info(text);
	win.webContents.send('message', text);
};

app.on('ready', waitForLibraryAndCreateWindows);

app.on('window-all-closed', () => {
	console.log('window-all-closed');
	app.quit();
});

app.on('before-quit', (e) => {
	e.preventDefault();
	console.log('before-quit');
	
	service.shutdown(new Commands.Empty(), function (message) {
		console.log('Shutdown complete, exiting');
		app.exit();
	});
});

