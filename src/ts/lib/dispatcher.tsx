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
		
		for (let message of event.messages) {
			let blocks: any = [];
			let block: any = null;
			let type = message.value;
			let data = message[type];
			
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
					blockStore.blocksSet(data.rootId, blocks);
					break;
				
				case 'blockAdd':
					blocks = Util.objectCopy(blockStore.blocks[contextId] || []);
					if (!blocks.length) {
						break;
					};
					
					for (let block of data.blocks) {
						let item = blockStore.prepareBlockFromProto(block);
						blocks.push(item);
					};
					
					blockStore.blocksSet(contextId, blocks);
					break;
					
				case 'blockSetChildrenIds':
					blocks = blockStore.blocks[contextId];
					if (!blocks.length) {
						break;
					};
				
					block = blocks.find((it: any) => { return it.id == data.id; });
					block.childrenIds = data.childrenIds;
					break;
					
				case 'blockSetIcon':
					blocks = blockStore.blocks[contextId];
					if (!blocks.length) {
						break;
					};
				
					block = blocks.find((it: any) => { return it.id == data.id; });
					block.content.name = data.name.value;
					break;
					
				case 'blockSetText':
					blocks = blockStore.blocks[contextId];
					if (!blocks.length) {
						break;
					};
					
					block = blocks.find((it: any) => { return it.id == data.id; });
					
					let param: any = {
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
					blockStore.blockDelete(contextId, data.blockId);
					break;
			};
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
		
		console.log('[Dispatcher.call]', type, JSON.stringify(data, null, 5));
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
				if (message) {
					callBack(message);
				};
			} catch (err) {
				console.error(err);
			};
		});
	};
	
};

export let dispatcher = new Dispatcher();