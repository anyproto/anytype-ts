class Renderer {

	send (...args: any[]) {
		const cmd = args[0];

		args.shift();
		args.unshift(window.Electron.currentWindow);

		window.Electron.Api(cmd, args);
	};

	on (event: string, callBack: any) {
		window.Electron.on(event, callBack);
	};

	removeAllListeners (...args: any[]) {
		window.Electron.removeAllListeners.apply(null, args);
	};

};

export default new Renderer();