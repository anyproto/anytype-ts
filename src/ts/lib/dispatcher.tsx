import { authStore, blockStore } from 'ts/store';
import { Util, I, StructDecode } from 'ts/lib';

const com = require('proto/commands.js');
const bindings = require('bindings')('addon');
const protobuf = require('protobufjs');

class Dispatcher {

	service: any = null;
	
	constructor () {
		com.anytype.ClientCommands.prototype.rpcCall = this.napiCall;
		this.service = com.anytype.ClientCommands.create(() => {}, false, false);
		
		const handler = (item: any) => {
			try {
				this.event(item);
			} catch (e) {
				console.error(e);
			};
		};
		
		bindings.setEventHandler(handler);
	};
	
	event (item: any) {
		let event = com.anytype.Event.decode(item.data);
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
					blocks = Util.objectCopy(blocks);
				
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					
					set = true;
					contextId = data.rootId;
					break;
				
				case 'blockAdd':
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
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
					
				case 'blockSetFields':
					block = blocks.find((it: any) => { return it.id == data.id; });
					block.fields = StructDecode.decodeStruct(data.fields);
					
					set = true;
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
					
					if (null !== data.color) {
						param.content.color = data.color.value;
					};
					
					if (null !== data.backgroundColor) {
						param.content.bgColor = data.backgroundColor.value;
					};
					
					blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockDelete':
					blocks = blocks.filter((item: I.Block) => { return item.id != data.blockId; });
					break;
			};
		};
		
		if (set) {
			blockStore.blocksSet(contextId, blocks);
		};
		
	};
	
	call (type: string, data: any, callBack?: (message: any) => void) {
		if (!this.service[type]) {
			console.error('[Dispatcher.call] Service not found: ', type);
			return;
		};
		
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
				
				callBack(message);
				
				let t1 = performance.now();
				console.log('[Dispatcher.call] callBack', type, message, Math.ceil(t1 - t0) + 'ms');
			});			
		} catch (e) {
			console.error(e);
		};
	};
	
	napiCall (method: any, inputObj: any, outputObj: any, request: any, callBack?: (message: any) => void) {
		const buffer = inputObj.encode(request).finish();
		const handler = (item: any) => {
			let message = null;
			try {
				message = outputObj.decode(item.data);
				if (message) {
					callBack(message);
				};
			} catch (err) {
				console.error(err);
			};
		};
		
		bindings.sendCommand(method.name, buffer, handler);
	};
	
};

export let dispatcher = new Dispatcher();