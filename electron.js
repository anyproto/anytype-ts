const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session } = require('electron');
const { is, appMenu } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const storage = require('electron-json-storage');
const com = require('./dist/commands.js');
const bindings = require('bindings')('addon');

com.anytype.ClientCommands.prototype.rpcCall = napiCall;
const service = com.anytype.ClientCommands.create(function () {}, false, false);

let userPath = app.getPath('userData');
let config = {};
let win = null;
let csp = [
	"default-src 'self' 'unsafe-eval'",
	"img-src 'self' http://*:* https://*:* data: blob:",
	"media-src 'self' http://*:* https://*:* data: blob:",
	"style-src 'unsafe-inline'",
	"font-src data:",
	"connect-src http://localhost:8080 ws://localhost:8080 https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data:",
	"script-src-elem http://localhost:8080 https://sentry.io devtools://devtools 'unsafe-inline'",
	"frame-src chrome-extension://react-developer-tools"
];

storage.setDataPath(userPath);

let dataPath = [ userPath ];
if (!app.isPackaged) {
	dataPath.push('dev');
};
dataPath.push('data');

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
					label: 'Undo', accelerator: 'CommandOrControl+Z',
					click: function () { win.webContents.send('command', 'undo'); }
				},
				{
					label: 'Redo', accelerator: 'CommandOrControl+Shift+Z',
					click: function () { win.webContents.send('command', 'redo'); }
				},
				{ type: 'separator' },
				{ label: 'Copy', role: 'copy' },
				{ label: 'Cut', role: 'cut' },
				{ label: 'Paste', role: 'paste' },
				{ 
					label: 'Select all', accelerator: 'CommandOrControl+A',
					click: function () { win.webContents.send('commandEditor', 'selectAll'); }
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

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	console.log('window-all-closed');
	app.quit();
});

app.on('before-quit', (e) => {
	e.preventDefault();
	console.log('before-quit');

	service.shutdown({}, function (message) { 
		console.log('Shutdown complete, exiting');
		app.exit();
	});
});

function napiCall (method, inputObj, outputObj, request, callBack) {
    const buffer = inputObj.encode(request).finish();
    const handler = function (item) {
        let message = null;
        try {
            message = outputObj.decode(item.data);
            if (message) {
                callBack(message);
            };
        } catch (err) {
            console.error(err);
        };
    };
    
    bindings.sendCommand(method.name, buffer, handler);
};