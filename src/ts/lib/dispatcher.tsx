import { authStore } from 'ts/store';

const { ipcRenderer } = window.require('electron');

class Dispatcher {
	
	constructor () {
	};
	
	event (event: any) {
		console.log('Dispatcher.event', event);
	};
	
	cmd (type: string, data: any) {
		console.log('Dispatcher.cmd', type, data);
		ipcRenderer.send('pipeCmd', type, data);
	};
	
};

export default new Dispatcher();