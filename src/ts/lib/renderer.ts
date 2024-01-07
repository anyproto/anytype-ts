/** @format */

import { UtilCommon } from 'Lib';

class Renderer {
	send(...args: any[]) {
		args = args || [];

		const cmd = args[0];
		const winId = Number(window.Electron.currentWindow().windowId) || 0;

		args.shift();
		args = args.map((it: any) => {
			if ('undefined' == typeof it || it === null) {
				it = '';
			}
			return it;
		});

		window.Electron.Api(winId, cmd, UtilCommon.objectCopy(args));
	}

	on(event: string, callBack: any) {
		this.remove(event);
		window.Electron.on(event, (...args: any[]) => {
			callBack.apply(this, args);
		});
	}

	remove(event: string) {
		window.Electron.removeAllListeners(event);
	}
}

export default new Renderer();
