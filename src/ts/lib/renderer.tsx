class Renderer {

	send (...args: any[]) {
		window.Electron.Api(args);
	};

	on (event: string, callBack: any) {
		window.Electron.on(event, callBack);
	};

	removeAllListeners (...args: any[]) {
		window.Electron.removeAllListeners.apply(null, args);
	};

};

export default new Renderer();