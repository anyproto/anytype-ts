import { authStore, blockStore } from 'ts/store';
import { Util, I } from 'ts/lib';

const com = require('proto/commands.js');
const bindings = require('bindings')('addon');
const protobuf = require('protobufjs');

class Dispatcher {

	service: any = null;
	
	constructor () {
		com.anytype.ClientCommands.prototype.rpcCall = this.napiCall;
		this.service = com.anytype.ClientCommands.create(() => {}, false, false);
		
		bindings.setEventHandler((item: any) => { this.event(item); });
	};
	
	event (item: any) {
		let event = null;
		try {
			event = com.anytype.Event.decode(item.data);
		} catch (err) {
			console.error(err);
		};

		if (!event) {
			return;
		};
		
		let data = event[event.message];
		console.log('[Dispatcher.event]', event.message, data);
		
		if (data.error && data.error.code) {
			return;
		};
		
		switch (event.message) {
			
			case 'accountAdd':
				authStore.accountAdd(data.account);
				break;
				
			case 'blockShow':
				break;
		};
		
	};
	
	call (type: string, data: any, callBack?: (errorCode: any, message: any) => void) {
		if (!this.service[type]) {
			console.error('[Dispatcher.call] Service not found: ', type);
			return;
		};
		
		const errorCode = com.anytype[Util.toUpperCamelCase(type) + 'Response'].Error.Code;
		
		console.log('[Dispatcher.call]', type, data);
		console.log(errorCode);
		
		try {
			this.service[type](data, (message: any) => {
				if (!callBack) {
					return;
				};
				
				message.error = message.error || {};
				message.error.code = Number(message.error.code) || 0;
				message.error.description = String(message.error.description || ''); 
			
				console.log('[Dispatcher.call] message', message);
				callBack(errorCode, message);
			});			
		} catch (e) {
			console.error(e);
		};
	};
	
	napiCall (method: any, inputObj: any, outputObj: any, request: any, callBack?: (message: any) => void) {
		let buffer = inputObj.encode(request).finish();
		
		bindings.sendCommand(method.name, buffer, (item: any) => {
			let message = null;
			try {
				message = outputObj.decode(item.data);
			} catch (err) {
				console.log(err);
			};
			
			if (message) {
				callBack(message);
			};
		});
	};
	
};

export let dispatcher = new Dispatcher();