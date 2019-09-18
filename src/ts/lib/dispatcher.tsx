import { authStore } from 'ts/store';

const { ipcRenderer } = window.require('electron');

class Dispatcher {
	
	constructor () {
	};
	
	event (event: any) {
		console.log('Dispatcher.event', event);
	};
	
	cmd (data: any) {
		console.log('Dispatcher.cmd', data);
		ipcRenderer.send('pipeCmd', data);
	};
	
};

export default new Dispatcher();