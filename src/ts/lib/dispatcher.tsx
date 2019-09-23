import { authStore } from 'ts/store';

const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Dispatcher {
	
	EventMessage: any = null;
	rootCmd: any = null;
	
	constructor () {
		protobuf.load('./electron/proto/events.proto', (err: string, root: any) => {
			if (err) {
				throw err;
			};
			
			this.EventMessage = root.lookupType('anytype.Event');
		});
		
		protobuf.load('./electron/proto/commands.proto', (err: string, root: any) => {
			if (err) {
				throw err;
			};
			
			this.rootCmd = root;
		});
	};
	
	init () {
		bindings.setEventHandler((item: any) => {
			if (!this.EventMessage) {
				console.error('[Dispatcher.event] Protocol not loaded');
				return;
			};
				
			let event = null;
			try {
				event = this.EventMessage.decode(item.data);
			} catch (err) {
				console.error(err);
			};
				
			if (event) {
				console.log('[Dispatcher.event]', event);
			};
		});
	};
	
	call (type: string, data: any, callBack?: (message: any) => void) {
		if (!this.rootCmd) {
			console.error('[Dispatcher.call] Protocol not loaded');
			return;
		};
		
		let cmdType = this.rootCmd.lookupType('anytype.' + type);
		let buffer = null;
		try {
			buffer = cmdType.encode(event).finish();
		} catch (err) {
			console.error(err);
		};
		
		if (buffer) {
			bindings.sendCommand(type, buffer, (item: any) => {
				let message = null;
				try {
					message = this.rootCmd.lookupType('anytype.' + type + 'Callback').decode(item.data);
				} catch (err) {
					console.log(err);
				};
				
				if (message && callBack) {
					console.log('[Dispatcher.call]', JSON.stringify(message));
					callBack(message);
				};
			});
		};
	};
	
};

export default new Dispatcher();