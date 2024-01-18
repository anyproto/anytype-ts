const { ipcRenderer, contextBridge } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog, BrowserWindow } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
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
	isFocused: () => getCurrentWindow().isFocused(),
	focus: () => getCurrentWindow().focus(),
	getGlobal: (key) => getGlobal(key),
	showOpenDialog: dialog.showOpenDialog,

	fileWrite: (name, data, options) => {
		name = String(name || 'temp');
		options = options || {};

		const fn = path.parse(name).base;
		const fp = path.join(tmpPath, fn);

		options.mode = 0o666;

		fs.writeFileSync(fp, data, options);
		return fp;
	},

	filePath (...args) {
		return path.join(...args);
	},

	dirname: fp => path.dirname(fp),

	on: (event, callBack) => ipcRenderer.on(event, callBack),
	removeAllListeners: (event) => ipcRenderer.removeAllListeners(event),
	Api: (id, cmd, args) => {
		id = Number(id) || 0;
		cmd = String(cmd || '');
		args = args || [];

		ipcRenderer.invoke('Api', id, cmd, args);
	},
});