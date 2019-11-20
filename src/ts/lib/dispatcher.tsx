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
				
			case 'blockShowFullscreen':
				for (let block of data.blocks) {
					blocks.push(blockStore.prepareBlock(block));
				};

				blockStore.rootSet(data.rootId);
				blockStore.blocksSet(blocks);
				break;
			
			case 'blockAdd':
				for (let block of data.blocks) {
					blockStore.blockAdd(blockStore.prepareBlock(block));
				};
				break;
				
			case 'blockUpdate':
				blocks = Util.objectCopy(blockStore.blocks);
				
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

				blockStore.blocksSet(blocks);
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
				
				if (message.error.code) {
					console.error('[Dispatcher.call] code:', message.error.code, 'description:', message.error.description);
					return;
				};
			
				console.log('[Dispatcher.call] callBack', message);
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