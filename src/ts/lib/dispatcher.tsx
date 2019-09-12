import { authStore } from 'ts/store';

const { ipcRenderer } = window.require('electron');

class Dispatcher {
	
	constructor () {
	};
	
	init () {
		ipcRenderer.on('pipeEvent', (e: any, data: any) => {
			console.log('PipeEvent', e, data);
			
			authStore.setCode(JSON.stringify(data));
		});
	};
	
};

export default new Dispatcher();