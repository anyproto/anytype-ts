const electron = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron');

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
	
	ipcMain.on('appLoaded', () => {
		console.log('appLoaded');
	});
	
	ipcMain.on('appClose', () => {
		app.quit();
	});
};

app.on('ready', createWindow);