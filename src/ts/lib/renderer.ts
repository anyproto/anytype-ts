import { UtilCommon } from 'Lib';

class Renderer {

	send (...args: any[]) {
		args = args || [];

		const cmd = args[0];
		const electron = UtilCommon.getElectron();
		const currentWindow = electron.currentWindow();
		const winId = Number(currentWindow?.windowId) || 0;

		args.shift();
		args = args.map((it: any) => {
			if (('undefined' == typeof(it)) || (it === null)) {
				it = '';
			};
			return it;
		});

		return electron.Api(winId, cmd, UtilCommon.objectCopy(args));
	};

	on (event: string, callBack: any) {
		this.remove(event);
		UtilCommon.getElectron().on(event, (...args: any[]) => callBack.apply(this, args));
	};

	remove (event: string) {
		UtilCommon.getElectron().removeAllListeners(event);
	};

};

export default new Renderer();