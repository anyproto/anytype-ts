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
		
		let blocks: any = [];
		
		switch (event.message) {
			
			case 'accountShow':
				authStore.accountAdd(data.account);
				break;
				
			case 'blockShow':
				for (let block of data.blocks) {
					blocks.push(blockStore.prepareBlockFromProto(block));
				};
				blockStore.blocksSet(data.rootId, blocks);
				break;
			
			case 'blockAdd':
				blocks = Util.objectCopy(blockStore.blocks)[data.contextId];
				for (let block of data.blocks) {
					blocks.push(data.contextId, blockStore.prepareBlockFromProto(block));
				};
				blockStore.blocksSet(data.contextId, blocks);
				break;
				
			case 'blockUpdate':
				blocks = Util.objectCopy(blockStore.blocks)[data.contextId];
				
				for (let item of data.changes.changes) {
					let change: any = item.change;
					let ids = item.id;
					
					for (let id of ids) {
						let idx = blocks.findIndex((it: any) => { return it.id == id; });
						if (idx >= 0) {
							blocks[idx][change] = item[change][change];	
						};
					};
				};

				blockStore.blocksSet(data.contextId, blocks);
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
		
		//const errorCode = com.anytype[Util.toUpperCamelCase(type)].Response.Error.Code;
		const errorCode = {};
		const tc = '[Dispatcher.call] ' + type + ' time';
		
		console.log('[Dispatcher.call]', type, data);
		let t0 = performance.now();
		
		try {
			this.service[type](data, (message: any) => {
				if (!callBack) {
					return;
				};
				
				message.error = message.error || {};
				message.error.code = Number(message.error.code) || 0;
				message.error.description = String(message.error.description || '');
				
				if (message.error.code) {
					console.error('[Dispatcher.call] code:', message.error.code, 'description:', message.error.description);
				};
				
				callBack(errorCode, message);
				
				let t1 = performance.now();
				console.log('[Dispatcher.call] callBack', type, message, Math.ceil(t1 - t0) + 'ms');
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