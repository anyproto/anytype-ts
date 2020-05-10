const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session } = require('electron');
const { is, appMenu } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const storage = require('electron-json-storage');

let dataPath = app.getPath('userData');
let channel = '';
let win = null;
let csp = [
	"default-src 'self' 'unsafe-eval'",
	"img-src 'self' http://*:* https://*:* data: blob:",
	"media-src 'self' http://*:* https://*:* data: blob:",
	"style-src 'unsafe-inline'",
	"font-src data:",
	"connect-src http://localhost:8080 ws://localhost:8080 https://sentry.anytype.io https://anytype.io https://api.amplitude.com/ devtools://devtools data:",
	"script-src-elem http://localhost:8080 https://sentry.io devtools://devtools 'unsafe-inline'"
];

storage.setDataPath(dataPath);

if (!app.isPackaged) {
	dataPath += '/dev';
};
dataPath += '/data';

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
			path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.5.0_0')
		);
	};
	
	if (is.development) {
		win.loadURL('http://localhost:8080');
		win.toggleDevTools();
	} else {
		win.loadFile('dist/index.html');
	};
	
	ipcMain.on('appLoaded', () => {
		win.webContents.send('dataPath', dataPath);
	});
	
	ipcMain.on('appClose', () => {
		console.log('appClose');
		app.exit();
	});
	
	ipcMain.on('urlOpen', async (e, url) => {
		shell.openExternal(url).catch((error) => {
			console.log(error);
		});
	});
	
	ipcMain.on('download', async (e, url) => {
	 	const win = BrowserWindow.getFocusedWindow();
	 	await download(win, url, { saveAs: true });
	});
	
	var menu = [
		appMenu(),
		{
			role: 'editMenu',
		},
		{
			role: 'windowMenu',
		},
		{
			label: 'Help',
			submenu: [
				{
					label: 'Table of contents',
					click: function () {
						win.webContents.send('help');
					}
				},
			]
		},
	];

	function setChannel (c) {
		channel = c;
		storage.set('config', { channel: channel }, function (error) {
			autoUpdater.channel = c;
			autoUpdater.checkForUpdatesAndNotify();
		});
	};
	
	//if (!app.isPackaged) {
		menu.push({
			label: 'Debug',
			submenu: [
				{
					label: 'Version',
					submenu: [
						{
							label: 'Alpha',
							click: function () {
								setChannel('alpha');
							}
						},
						{
							label: 'Public',
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
							label: 'Interface',
							click: function () { win.webContents.send('toggleDebug', 'ui'); }
						},
						{
							label: 'Middleware',
							click: function () { win.webContents.send('toggleDebug', 'mw'); }
						},
						{
							label: 'Analytics',
							click: function () { win.webContents.send('toggleDebug', 'an'); }
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
				},
				{
					label: 'Copy document',
					click: function () {
						win.webContents.send('copyDocument');
					}
				},
			]
		});
	//};
	
	Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
	
	storage.get('config', function (error, data) {
		data = data || {};
		console.log('Config: ', error, data);
	  
		channel = String(data.channel || 'latest');
		autoUpdaterInit();
	});
};

function autoUpdaterInit () {
	console.log('Channel: ', channel);

	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	autoUpdater.channel = channel;
	autoUpdater.checkForUpdatesAndNotify();

	autoUpdater.on('checking-for-update', () => {
		setStatus('Checking for update');
	});
	
	autoUpdater.on('update-available', (info) => {
		setStatus('Update available');
	});

	autoUpdater.on('update-not-available', (info) => {
		setStatus('Update not available');
		
		win.webContents.send('update');
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
		}, 5000);
	});
	
};

function setStatus (text) {
	log.info(text);
	win.webContents.send('message', text, app.getVersion());
};

app.on('ready', createWindow);