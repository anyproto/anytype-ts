global.btoa = require('btoa');
global.atob = require('atob');

const electron = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron');
const spawn = require('child_process').spawn;
const Pipe = require('./pipe');

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
	
	ipcMain.on('appLoaded', () => {
		console.log('appLoaded');
		
		let pipe = Pipe.start();
		
		pipe.reader((event) => {
			win.webContents.send('pipeEvent', event);
		});

		let i = 0;
		let sendStandardEvent = () => {
		    pipe.writer({ entity: "standard", op: "test", data: String(i) });
		};
		setInterval(sendStandardEvent, 1000);
	});
	
	ipcMain.on('appClose', () => {
		Pipe.stop();
		app.quit();
	});
};

app.on('ready', createWindow);