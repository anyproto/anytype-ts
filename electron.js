const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu, session } = require('electron');
const { is, appMenu } = require('electron-util');
const { autoUpdater } = require('electron-updater');
const { download } = require('electron-dl');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const dataPath = app.getPath('userData');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let win = null;
let csp = [
	"default-src 'self' https://widget.intercom.io https://js.intercomcdn.com",
	"img-src 'self' http://*:* https://*:* data: blob:",
	"media-src 'self' http://*:* https://*:* data: blob:",
	"style-src 'unsafe-inline'",
	"font-src data: https://js.intercomcdn.com",
];

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
		width: width,
		height: height,
		webPreferences: {
			nodeIntegration: true
		}
	};
	
	if (process.platform === 'darwin') {
		param.titleBarStyle = 'hiddenInset';
		param.frame = false;
	};
	
	win = new BrowserWindow(param);
	
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
		app.quit();
	});
	
	ipcMain.on('urlOpen', async (e, url) => {
		shell.openExternal(url);
	});
	
	ipcMain.on('download', async (e, url) => {
	 	const win = BrowserWindow.getFocusedWindow();
	 	await download(win, url, { saveAs: true });
	});
	
	var menu = Menu.buildFromTemplate([
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
		{
			label: 'Debug',
			submenu: [
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
					label: 'Debug interface',
					click: function () {
						win.webContents.send('toggleDebugUI');
					}
				},
				{
					label: 'Debug middleware',
					click: function () {
						win.webContents.send('toggleDebugMW');
					}
				},
				{
					label: 'Debug analytics',
					click: function () {
						win.webContents.send('toggleDebugAN');
					}
				},
				{
					label: 'Copy document',
					click: function () {
						win.webContents.send('copyDocument');
					}
				},
			]
		},
	
	]);
	
	Menu.setApplicationMenu(menu);
	
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

	function setStatus (text) {
		log.info(text);
		win.webContents.send('message', text, app.getVersion());
	};
};

app.on('ready', createWindow);