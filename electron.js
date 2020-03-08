const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
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

function createWindow () {
	const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
	
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
		console.log('appLoaded');
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
					label: 'UI Debug',
					click: function () {
						win.webContents.send('toggleDebugUI');
					}
				},
				{
					label: 'MW Debug',
					click: function () {
						win.webContents.send('toggleDebugMW');
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
	
	// Auto updates
	autoUpdater.checkForUpdatesAndNotify();
};

app.on('ready', createWindow);

autoUpdater.on('checking-for-update', () => {
	setStatus('Checking for update...', app.getVersion());
});

autoUpdater.on('update-available', (info) => {
	setStatus('Update available.', app.getVersion());
});

autoUpdater.on('update-not-available', (info) => {
	setStatus('Update not available.', app.getVersion());
});

autoUpdater.on('error', (err) => {
	setStatus('Error in auto-updater. ' + err, app.getVersion());
});

autoUpdater.on('download-progress', (progress) => {
	let msg = [
		'Download speed: ' + progress.bytesPerSecond,
		'-',
		'Downloaded: ' + progress.percent + '%',
		'(' + progress.transferred + '/' + progress.total + ')'
	];
	setStatus(msg.join(' '), app.getVersion());
});

autoUpdater.on('update-downloaded', (info) => {
	setTimeout(function () {
		setStatus('Update downloaded... Restarting App in 5 seconds', app.getVersion());
		win.webContents.send('updateReady');
		autoUpdater.quitAndInstall();
	}, 5000);
});

function setStatus (text, ver) {
	if (win) {
		log.info(text);
		win.webContents.send('message', text, ver);
	};
};