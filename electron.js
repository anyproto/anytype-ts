const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

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
	
	win.loadURL('http://localhost:8080');
	//win.loadFile('dist/index.html');
	win.toggleDevTools();
	
	ipcMain.on('appLoaded', () => {
		console.log('appLoaded');
	});
	
	ipcMain.on('appClose', () => {
		app.quit();
	});
	
	ipcMain.on('urlOpen', async (event, url) => {
		shell.openExternal(url);
	});
};

app.on('ready', createWindow);