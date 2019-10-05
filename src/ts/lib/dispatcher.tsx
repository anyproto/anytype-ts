import { authStore } from 'ts/store';
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
		
		console.log('[Dispatcher.event]', event);
		
		for (let key in event) {
			let value = event[key];
			if (!value || ('object' != typeof(value))) {
				continue;
			};
			
			if (value.error && value.error.code) {
				continue;
			};
				
			switch (key) {
				case 'accountAdd':
					authStore.accountAdd(value.account);
					break;
			};
		};
	};
	
	call (type: string, data: any, callBack?: (errorCode: any, message: any) => void) {
		if (!this.service[type]) {
			throw '[Dispatcher.call] Service not found: ' + type;
		};
		
		const errorCode = com.anytype[Util.toUpperCamelCase(type) + 'Response'].Error.Code;
		
		console.log('[Dispatcher.call]', type, data);
		console.log(errorCode);
		this.service[type](data, (message: any) => {
			if (!callBack) {
				return;
			};
			
			console.log('[Dispatcher.call] message', message);
			callBack(errorCode, message);
		});
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