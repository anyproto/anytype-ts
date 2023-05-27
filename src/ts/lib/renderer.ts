import { Util } from 'Lib';

class Renderer {

	send (...args: any[]) {
		args = args || [];

		const cmd = args[0];
		args.shift();

		window.Electron.Api(Number(window.Electron.currentWindow().windowId) || 0, cmd, Util.objectCopy(args));
	};

	on (event: string, callBack: any) {
		this.remove(event);
		window.Electron.on(event, (...args: any[]) => {
			callBack.apply(this, args);
		});
	};

	remove (event: string) {
		window.Electron.removeAllListeners(event);
	};

};

export default new Renderer();