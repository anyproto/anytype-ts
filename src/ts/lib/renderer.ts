import { UtilCommon } from 'Lib';

class Renderer {

	send (...args: any[]) {
		args = args || [];

		const cmd = args[0];
		const winId = Number(UtilCommon.getElectron().currentWindow().windowId) || 0;

		args.shift();

		UtilCommon.getElectron().Api(winId, cmd, UtilCommon.objectCopy(args));
	};

	on (event: string, callBack: any) {
		this.remove(event);
		UtilCommon.getElectron().on(event, (...args: any[]) => {
			callBack.apply(this, args);
		});
	};

	remove (event: string) {
		UtilCommon.getElectron().removeAllListeners(event);
	};

};

export default new Renderer();