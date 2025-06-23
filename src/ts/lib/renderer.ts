import { U } from 'Lib';

class Renderer {

	/**
	 * Sends a command to the Electron API with arguments.
	 * @param {...any[]} args - The command and arguments to send.
	 * @returns {any} The result from Electron API.
	 */
	send (...args: any[]) {
		args = args || [];

		const cmd = args[0];
		const electron = U.Common.getElectron();
		const currentWindow = electron.currentWindow();
		const winId = Number(currentWindow?.windowId) || 0;

		args.shift();
		args = args.map((it: any) => {
			if (('undefined' == typeof(it)) || (it === null)) {
				it = '';
			};
			return it;
		});

		return electron.Api(winId, cmd, U.Common.objectCopy(args));
	};

	/**
	 * Registers an event listener for a given event.
	 * @param {string} event - The event name.
	 * @param {function} callBack - The callback function.
	 */
	on (event: string, callBack: any) {
		this.remove(event);
		U.Common.getElectron().on(event, (...args: any[]) => callBack.apply(this, args));
	};

	/**
	 * Removes all listeners for a given event.
	 * @param {string} event - The event name.
	 */
	remove (event: string) {
		U.Common.getElectron().removeAllListeners(event);
	};

};

export default new Renderer();