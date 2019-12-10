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
		
		bindings.setEventHandler((item: any) => {
			try {
				this.event(item);
			} catch (e) {
				console.error(e);
			};
		});
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
		
		let contextId = event.contextId;
		let blocks = blockStore.blocks[contextId] || [];
		let set = false;
		
		for (let message of event.messages) {
			let block: any = null;
			let type = message.value;
			let data = message[type];
			let param: any = {};
			
			if (data.error && data.error.code) {
				continue;
			};
			
			console.log('[Dispatcher.event]', type, data);
		
			switch (type) {
				
				case 'accountShow':
					authStore.accountAdd(data.account);
					break;
					
				case 'blockShow':
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					
					contextId = data.rootId;
					set = true;
					break;
				
				case 'blockAdd':
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					
					set = true;
					break;
					
				case 'blockSetChildrenIds':
					block = blocks.find((it: any) => { return it.id == data.id; });
					
					param = {
						id: block.id,
						childrenIds: data.childrenIds,
					};
					
					blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockSetIcon':
					block = blocks.find((it: any) => { return it.id == data.id; });
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					param.content.name = data.name.value;
					
					blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockSetText':
					blocks = blockStore.blocks[contextId];
					if (!blocks.length) {
						break;
					};
					
					block = blocks.find((it: any) => { return it.id == data.id; });
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					
					if (null !== data.text) {
						param.content.text = data.text.value;
					};
					
					if (null !== data.marks) {
						let marks: any = [];
						for (let mark of data.marks.value.marks) {
							marks.push({
								type: Number(mark.type) || 0,
								param: String(mark.param || ''),
								range: {
									from: Number(mark.range.from) || 0,
									to: Number(mark.range.to) || 0,
								}
							});
						};
						param.content.marks = marks;
					};
					
					if (null !== data.style) {
						param.content.style = data.style.value;
					};
					
					if (null !== data.checked) {
						param.content.checked = data.checked.value;
					};
					
					blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockDelete':
					blocks = blocks.filter((item: I.Block) => { return item.id != data.blockId; });
					set = true;
					break;
			};
		};
		
		if (set) {
			blockStore.blocksSet(contextId, blocks);
		};
		
	};
	
	call (type: string, data: any, callback?: (errorCode: any, message: any) => void) {
		if (!this.service[type]) {
			console.error('[Dispatcher.call] Service not found: ', type);
			return;
		};
		
		//const errorCode = com.anytype[Util.toUpperCamelCase(type)].Response.Error.Code;
		const errorCode = {};
		const tc = '[Dispatcher.call] ' + type + ' time';
		
		console.log('[Dispatcher.call]', type, JSON.stringify(data, null, 5));
		let t0 = performance.now();
		
		try {
			this.service[type](data, (message: any) => {
				if (!callback) {
					return;
				};
				
				message.error = message.error || {};
				message.error.code = Number(message.error.code) || 0;
				message.error.description = String(message.error.description || '');
				
				if (message.error.code) {
					console.error('[Dispatcher.call] code:', message.error.code, 'description:', message.error.description);
				};
				
				callback(errorCode, message);
				
				let t1 = performance.now();
				console.log('[Dispatcher.call] callback', type, message, Math.ceil(t1 - t0) + 'ms');
			});			
		} catch (e) {
			console.error(e);
		};
	};
	
	napiCall (method: any, inputObj: any, outputObj: any, request: any, callback?: (message: any) => void) {
		let buffer = inputObj.encode(request).finish();
		
		bindings.sendCommand(method.name, buffer, (item: any) => {
			let message = null;
			try {
				message = outputObj.decode(item.data);
				if (message) {
					callback(message);
				};
			} catch (err) {
				console.error(err);
			};
		});
	};
	
};

export let dispatcher = new Dispatcher();