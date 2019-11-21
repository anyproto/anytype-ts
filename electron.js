const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { is, appMenu } = require('electron-util');
const path = require('path');
const os = require('os');
const userDataPath = app.getPath('userData');

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
		path.join(os.homedir(), '/Library/Application Support/Google/Chrome/Default/Extensions//fmkadmapgofadopljbjfkapdkoienihi/4.1.3_0')
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
		win.webContents.send('userDataPath', userDataPath);
	});
	
	ipcMain.on('appClose', () => {
		app.quit();
	});
	
	ipcMain.on('urlOpen', async (event, url) => {
		shell.openExternal(url);
	});
};

app.on('ready', createWindow);