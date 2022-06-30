const remote = window.require('@electron/remote');
const Api = remote.require('./electron/js/api.js');

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
		const cmd = args[0];
		if (Api[cmd]) {
			args.shift();
			args.unshift(remote.getCurrentWindow());

			console.log('[Renderer].send', args);

			Api[cmd].apply(null, args);
		} else {
			const renderer = this.get();
			renderer.send.apply(renderer, args);
		};
	};

	on (...args: any[]) {
		const renderer = this.get();
		const event = args[0];
		const callBack = args[1];

		renderer.on(event, (...args: any[]) => {
			console.log('[Renderer].on', event, args);
			callBack.apply(null, args);
		});
	};

	removeAllListeners (...args: any[]) {
		const renderer = this.get();
		renderer.removeAllListeners.apply(renderer, args);
	};

};

export default new Renderer();