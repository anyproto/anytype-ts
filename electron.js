const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const { is, appMenu } = require('electron-util');
const path = require('path');
const os = require('os');
const dataPath = app.getPath('userData');

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
	
	let win = new BrowserWindow(param);
	
	/*
	BrowserWindow.addDevToolsExtension(
		path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions//fmkadmapgofadopljbjfkapdkoienihi/4.2.1_0')
	);
	*/
	
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
	
	ipcMain.on('urlOpen', async (event, url) => {
		shell.openExternal(url);
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
						win.webContents.send('toggleDebug');
					}
				},
			]
		},
	
	]);
	Menu.setApplicationMenu(menu);
};

app.on('ready', createWindow);