import { authStore } from 'ts/store';

const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Dispatcher {
	
	typeMiddle: any = null;
	typeClient: any = null;
	id: number = 0;
	
	constructor () {
		protobuf.load('./electron/proto/protocol.proto', (err: string, root: any) => {
			if (err) {
				throw err;
			};
			
			this.typeMiddle = root.lookupType('anytype.Middle');
			this.typeClient = root.lookupType('anytype.Client');
		});
	};
	
	init () {
		bindings.setCallback((item: any) => {
			if (!this.typeMiddle) {
				console.error('[Dispatcher.event] Protocol not loaded');
				return;
			};
				
			let event = null;
			try {
				event = this.typeMiddle.decode(item.data);
			} catch (err) {
				console.error(err);
			};
				
			if (event) {
				console.log('[Dispatcher.event]', event);
			};
		});
	};
	
	call (type: string, data: any) {
		if (!this.typeClient) {
			console.error('[Dispatcher.call] Protocol not loaded');
			return;
		};
		
		let event: any = { id: (++this.id).toString() };
		event[type] = data;
		
		let buffer = null;
		try {
			buffer = this.typeClient.encode(event).finish();
		} catch (err) {
			console.error(err);
		};
		
		if (buffer) {
			console.log('[Dispatcher.call]', event);
			bindings.callMethod(type, buffer);		
		};
	};
	
};

export default new Dispatcher();