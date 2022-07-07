const { ipcRenderer, contextBridge } = require('electron');
const { app, getCurrentWindow, getGlobal } = require('@electron/remote');

contextBridge.exposeInMainWorld('Electron', {
	currentWindow: getCurrentWindow(),
	version: app.getVersion(),
	isPackaged: app.isPackaged,
	userPath: app.getPath('userData'),
	isMaximized: () => getCurrentWindow.isMaximized(),
	getGlobal: (key) => getGlobal(key),

	on: ipcRenderer.on,
	removeAllListeners: ipcRenderer.removeAllListeners,
	Api: (cmd, args) => ipcRenderer.invoke('Api', cmd, args),
});