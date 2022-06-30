const { getCurrentWindow } = window.require('@electron/remote');

class Renderer {

	renderer: any = null;

	get () {
		if (!this.renderer) {
			const electron: any = window.require('electron') || {};
			this.renderer = electron.ipcRenderer || window.Renderer;
		};
		return this.renderer;
	};

	send (...args: any[]) {
		this.get().send.apply(this.renderer, args);
	};

	on (...args: any[]) {
		this.get().on.apply(this.renderer, args);
	};

	removeAllListeners (...args: any[]) {
		this.get().removeAllListeners.apply(this.renderer, args);
	};

};

export default new Renderer();