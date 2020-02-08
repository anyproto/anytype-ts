import { authStore, blockStore } from 'ts/store';
import { Util, I, StructDecode, focus, keyboard, Storage } from 'ts/lib';

const com = require('proto/commands.js');
const bindings = require('bindings')('addon');
const protobuf = require('protobufjs');
const Constant = require('json/constant.json');

const DEBUG = true;
const PROFILE = false;

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
		let { focused } = focus;
		let event = com.anytype.Event.decode(item.data);
		let contextId = event.contextId;
		let blocks = Util.objectCopy(blockStore.blocks[contextId] || []);
		let types = [];
		let debug = Storage.get('debugMW'); 
		
		if (PROFILE) {
			for (let message of event.messages) {
				let type = message.value;
				types.push(message.value);
			};
			console.profile(types.join(', '));
		};
		
		for (let message of event.messages) {
			let block: any = null;
			let type = message.value;
			let data = message[type] || {};
			let param: any = {};
			let update = false;
			
			if (data.error && data.error.code) {
				continue;
			};
			
			if (debug) {
				console.log('[Dispatcher.event] contextId', contextId, 'type', type, 'data', JSON.stringify(data, null, 5));
			};
		
			switch (type) {
				
				case 'accountShow':
					authStore.accountAdd(data.account);
					break;
					
				case 'blockShow':
					blocks = [];
				
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					
					//blockStore.blocksSet(contextId, blocks);
					break;
				
				case 'blockAdd':
					//blocks = Util.objectCopy(blocks);
				
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					
					//blockStore.blocksSet(contextId, blocks);
					break;
					
				case 'blockSetChildrenIds':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						childrenIds: data.childrenIds || [],
					};
					
					block.childrenIds = param.childrenIds;
					//blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockSetIcon':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					param.content.name = data.name.value;
					
					//blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockSetFields':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						fields: StructDecode.decodeStruct(data.fields),
					};
					
					block.fields = param.fields;
					//blockStore.blockUpdate(contextId, param);
					break;
					
				case 'blockSetLink':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					
					if (null !== data.fields) {
						param.content.fields = StructDecode.decodeStruct(data.fields.value);
						
						param.content.fields.name = String(param.content.fields.name || Constant.default.name);
						param.content.fields.icon = String(param.content.fields.icon || Constant.default.icon);
						
						block.content.fields = param.content.fields;
						update = true;
					};
					
					if (update) {
						//blockStore.blockUpdate(contextId, param);
					};
					break;
					
				case 'blockSetText':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					
					if (null !== data.text) {
						param.content.text = String(data.text.value || '');
						update = true;
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
						update = true;
					};
					
					if (null !== data.style) {
						param.content.style = Number(data.style.value) || 0;
						update = true;
					};
					
					if (null !== data.checked) {
						param.content.checked = Boolean(data.checked.value);
						update = true;
					};
					
					if (null !== data.color) {
						param.content.color = String(data.color.value || '');
						update = true;
					};
					
					if (null !== data.backgroundColor) {
						param.content.bgColor = String(data.backgroundColor.value || '');
						update = true;
					};
					
					if (update) {
						block.content = Object.assign(block.content, param.content);
						//blockStore.blockUpdate(contextId, param);
					};
					break;
					
				case 'blockSetFile':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					param = {
						id: block.id,
						content: Util.objectCopy(block.content),
					};
					
					if (null !== data.name) {
						param.content.name = String(data.name.value || '');
						update = true;
					};
					
					if (null !== data.hash) {
						param.content.hash = String(data.hash.value || '');
						update = true;
					};
					
					if (null !== data.mime) {
						param.content.mime = String(data.mime.value || '');
						update = true;
					};
					
					if (null !== data.size) {
						param.content.size = Number(data.size.value) || 0;
						update = true;
					};
					
					if (null !== data.type) {
						param.content.type = Number(data.type.value) || 0;
						update = true;
					};
					
					if (null !== data.state) {
						param.content.state = Number(data.state.value) || 0;
						update = true;
					};
					
					if (update) {
						block.content = Object.assign(block.content, param.content);
						//blockStore.blockUpdate(contextId, param);
					};
					break;
					
				case 'blockDelete':
					//blocks = Util.objectCopy(blocks);
					
					for (let blockId of data.blockIds) {
						blocks = blocks.filter((item: I.Block) => { return item.id != blockId; });
						
						// Remove focus if block is deleted
						if (focused == blockId) {
							focus.clear();
							keyboard.setFocus(false);
						};
					};
					
					//blockStore.blocksSet(contextId, blocks);
					break;
			};
		};
		
		blockStore.blocksSet(contextId, blocks);
		
		if (PROFILE) {
			console.profileEnd(types.join(', '));
		};
	};
	
	call (type: string, data: any, callBack?: (message: any) => void) {
		if (!this.service[type]) {
			console.error('[Dispatcher.call] Service not found: ', type);
			return;
		};
		
		let debug = Storage.get('debugMW');
		let t0 = 0;
		let t1 = 0;
		
		if (debug) {
			t0 = performance.now();
			console.log('[Dispatcher.call]', type, JSON.stringify(data, null, 5));
		};
		
		try {
			this.service[type](data, (message: any) => {
				message.error = message.error || {};
				message.error.code = Number(message.error.code) || 0;
				message.error.description = String(message.error.description || '');
				
				if (message.error.code) {
					console.error('[Dispatcher.call]', type, 'code:', message.error.code, 'description:', message.error.description);
				};
				
				if (callBack) {
					callBack(message);
				};
				
				if (debug) {
					t1 = performance.now();
					console.log('[Dispatcher.call] callBack', type, message, Math.ceil(t1 - t0) + 'ms');					
				};
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