const { ipcRenderer, contextBridge, webUtils } = require('electron');
const { app, getCurrentWindow, getGlobal, dialog } = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const tmpPath = () => app.getPath('temp');

contextBridge.exposeInMainWorld('Electron', {
	version: {
		app: app.getVersion(),
		os: [ os.platform(), process.arch, process.getSystemVersion() ].join(' '),
		system: process.getSystemVersion(),
		device: os.hostname(),
	},
	platform: os.platform(),
	arch: process.arch,

	storeGet: key => ipcRenderer.sendSync('storeGet', key),
	storeSet: (key, value) => ipcRenderer.sendSync('storeSet', key, value),
	storeDelete: key => ipcRenderer.sendSync('storeDelete', key),

	isPackaged: app.isPackaged,
	userPath: () => app.getPath('userData'),
	tmpPath,
	downloadPath: () => app.getPath('downloads'),
	logPath: () => path.join(app.getPath('userData'), 'logs'),
	dirName: fp => path.dirname(fp),
	filePath: (...args) => path.join(...args),
	fileName: fp => path.basename(fp),
	fileMime: fp => mime.lookup(fp),
	fileExt: fp => path.extname(fp).replace(/^./, ''),
	fileSize: fp => fs.statSync(fp).size,
	isDirectory: fp => {
		let ret = false;
		try { ret = fs.lstatSync(fp).isDirectory(); } catch (e) {};
		return ret;
	},
	defaultPath: () => path.join(app.getPath('appData'), app.getName()),
	getTheme: () => ipcRenderer.sendSync('getTheme'),
	getBgColor: () => ipcRenderer.sendSync('getBgColor'),
	getConfig: () => ipcRenderer.sendSync('getConfig'),
	tabId: () => {
		const arg = process.argv.find(arg => arg.startsWith('--tab-id='));
		return arg ? arg.split('=')[1] : null;
	},
	winId: () => {
		const arg = process.argv.find(arg => arg.startsWith('--win-id='));
		return arg ? Number(arg.split('=')[1]) : null;
	},

	currentWindow: () => getCurrentWindow(),
	isFocused: () => getCurrentWindow().isFocused(),
	isFullScreen: () => getCurrentWindow().isFullScreen(),
	focus: () => {
		getCurrentWindow().focus();
		app.focus({ steal: true });
	},
	getGlobal: key => getGlobal(key),
	showOpenDialog: dialog.showOpenDialog,

	webFilePath: file => webUtils && webUtils.getPathForFile(file),

	fileWrite: (name, data, options) => {
		name = String(name || 'temp');
		options = options || {};

		const fn = path.parse(name).base;
		const fp = path.join(tmpPath(), fn);

		options.mode = 0o666;

		fs.writeFileSync(fp, data, options);
		return fp;
	},

	on: (event, callBack) => ipcRenderer.on(event, callBack),
	removeAllListeners: (event) => ipcRenderer.removeAllListeners(event),
	send: (event, ...args) => ipcRenderer.send(event, ...args),

	Api: (id, cmd, args) => {
		id = Number(id) || 0;
		cmd = String(cmd || '');
		args = args || [];

		let ret = new Promise(() => {});

		try { 
			ret = ipcRenderer.invoke('Api', id, cmd, args).catch((error) => {
				console.log(error);
			}); 
		} catch (e) {};

		return ret;
	},
});
