global.btoa = require('btoa');
global.atob = require('atob');

const electron = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron');
const spawn = require('child_process').spawn;
const Pipe = require('./electron/pipe');

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
	let pipe = null;
	
	win.loadURL('http://localhost:8080');
	
	ipcMain.on('appLoaded', () => {
		console.log('appLoaded');
		
		pipe = new Pipe((event) => {
			console.log('EVENT', event);
			win.webContents.send('pipeEvent', event);
		});
		pipe.start();
	});
	
	ipcMain.on('pipeCmd', (e, type, data) => {
		if (pipe) {
			pipe.write(type, data);
		};
	});
	
	ipcMain.on('appClose', () => {
		app.quit();
	});
};

app.on('ready', createWindow);