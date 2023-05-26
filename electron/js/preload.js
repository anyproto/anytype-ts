const { ipcRenderer, contextBridge } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog, BrowserWindow } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const userPath = app.getPath('userData');
const tmpPath = app.getPath('temp');
const logPath = path.join(userPath, 'logs');

contextBridge.exposeInMainWorld('Electron', {
	version: {
		app: app.getVersion(),
		os: [ os.platform(), process.arch, process.getSystemVersion() ].join(' '),
		system: process.getSystemVersion(),
		device: os.hostname(),
	},
	platform: os.platform(),
	arch: process.arch,

	isPackaged: app.isPackaged,
	userPath,
	tmpPath,
	logPath,

	currentWindow: () => getCurrentWindow(),
	isMaximized: () => BrowserWindow.getFocusedWindow()?.isMaximized(),
	getGlobal: (key) => getGlobal(key),
	showOpenDialog: dialog.showOpenDialog,

	fileParam: (path) => {
		let stat = fs.statSync(path);
		let buffer = readChunk.sync(path, 0, stat.size);
		let type = fileType(buffer);

		return { buffer, type };
	},

	fileWrite: (name, data, options) => {
		name = String(name || 'temp');
		name = name.replace('..', '');

		const fp = path.join(tmpPath, name);
		fs.writeFileSync(fp, data, options);
		return fp;
	},

	on: (event, callBack) => ipcRenderer.on(event, callBack),
	removeAllListeners: (event) => ipcRenderer.removeAllListeners(event),
	Api: (id, cmd, args) => ipcRenderer.invoke('Api', id, cmd, args),
});