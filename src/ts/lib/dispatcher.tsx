import { authStore } from 'ts/store';
import { AccountInterface } from 'ts/store/auth';
import { Util } from 'ts/lib';

const com = require('proto/commands.js');
const bindings = require('bindings')('pipe');
const protobuf = require('protobufjs');

class Dispatcher {

	service: any = null;
	
	constructor () {
		com.anytype.ClientCommands.prototype.rpcCall = this.napiCall;
		this.service = com.anytype.ClientCommands.create(() => {}, false, false);
		
		bindings.setEventHandler((item: any) => {
			let event = null;
			try {
				event = com.anytype.Event.decode(item.data);
			} catch (err) {
				console.error(err);
			};
				
			if (event) {
				console.log('[Dispatcher.event]', event);
				this.event(event);
			};
		});
	};
	
	event (event: any) {
		for (let key in event) {
			let value = event[key];
			
			switch (key) {
				case 'accountFound':
					authStore.accountAdd(value.account as AccountInterface);
					break;
			};
		};
	};
	
	call (type: string, data: any, callBack?: (errorCode: any, message: any) => void) {
		if (!this.service[type]) {
			throw '[Dispatcher.call] Service not found: ' + type;
		};
		
		const errorCode = com.anytype[Util.toUpperCamelCase(type) + 'R'].Error.Code;
		
		console.log('[Dispatcher.call]', type, data, errorCode);
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