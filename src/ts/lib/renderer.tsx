class Renderer {

	send (...args: any[]) {
		args = args || [];

		const cmd = args[0];
		args.shift();

		window.Electron.Api(cmd, args);
	};

	on (event: string, callBack: any) {
		this.remove(event);
		window.Electron.on(event, callBack);
	};

	remove (event: string) {
		window.Electron.removeAllListeners(event);
	};

};

export default new Renderer();