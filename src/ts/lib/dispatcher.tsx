import { authStore, commonStore, blockStore } from 'ts/store';
import { Util, I, M, StructDecode, focus, keyboard, Storage, translate } from 'ts/lib';

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
		
		if (debug) {
			console.log('[Dispatcher.event] contextId', contextId, 'event', JSON.stringify(event, null, 5));
		};
		
		for (let message of event.messages) {
			let block: any = null;
			let type = message.value;
			let data = message[type] || {};
			let param: any = {};
			
			if (data.error && data.error.code) {
				continue;
			};
			
			switch (type) {
				
				case 'accountShow':
					authStore.accountAdd(data.account);
					break;
					
				case 'blockShow':
					blocks = data.blocks.map((it: any) => {
						return blockStore.prepareBlockFromProto(it);
					});
					break;
				
				case 'blockAdd':
					for (let block of data.blocks) {
						blocks.push(blockStore.prepareBlockFromProto(block));
					};
					break;
					
				case 'blockSetChildrenIds':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					block.childrenIds = data.childrenIds || [];
					break;
					
				case 'blockSetIcon':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					block.content.name = data.name.value;
					break;
					
				case 'blockSetFields':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					if (null !== data.fields) {
						block.fields = StructDecode.decodeStruct(data.fields);
					};
					break;
					
				case 'blockSetLink':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					if (null !== data.fields) {
						block.content.fields = StructDecode.decodeStruct(data.fields.value);
						block.content.fields.name = String(block.content.fields.name || Constant.default.name);
					};
					break;
					
				case 'blockSetText':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					if (null !== data.text) {
						block.content.text = String(data.text.value || '');
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
						block.content.marks = marks;
					};
					
					if (null !== data.style) {
						block.content.style = Number(data.style.value) || 0;
					};
					
					if (null !== data.checked) {
						block.content.checked = Boolean(data.checked.value);
					};
					
					if (null !== data.color) {
						block.content.color = String(data.color.value || '');
					};
					break;
					
				case 'blockSetFile':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					if (null !== data.name) {
						block.content.name = String(data.name.value || '');
					};
					
					if (null !== data.hash) {
						block.content.hash = String(data.hash.value || '');
					};
					
					if (null !== data.mime) {
						block.content.mime = String(data.mime.value || '');
					};
					
					if (null !== data.size) {
						block.content.size = Number(data.size.value) || 0;
					};
					
					if (null !== data.type) {
						block.content.type = Number(data.type.value) || 0;
					};
					
					if (null !== data.state) {
						block.content.state = Number(data.state.value) || 0;
					};
					break;
					
				case 'blockSetBookmark':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					if (null !== data.url) {
						block.content.url = String(data.url.value || '');
					};
					
					if (null !== data.title) {
						block.content.title = String(data.title.value || '');
					};
					
					if (null !== data.description) {
						block.content.description = String(data.description.value || '');
					};
					
					if (null !== data.imageHash) {
						block.content.imageHash = String(data.imageHash.value || '');
					};
					
					if (null !== data.faviconHash) {
						block.content.faviconHash = String(data.faviconHash.value || '');
					};
					
					if (null !== data.type) {
						block.content.type = Number(data.type.value) || 0;
					};
					break;
					
				case 'blockSetBackgroundColor':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					block.bgColor = String(data.backgroundColor || '');
					break;
					
				case 'blockSetAlign':
					block = blocks.find((it: any) => { return it.id == data.id; });
					if (!block) {
						return;
					};
					
					block.align = Number(data.align) || 0;
					break;
					
				case 'blockDelete':
					for (let blockId of data.blockIds) {
						blocks = blocks.filter((item: I.Block) => { return item.id != blockId; });
						
						// Remove focus if block is deleted
						if (focused == blockId) {
							focus.clear(true);
							keyboard.setFocus(false);
						};
					};
					break;
				
				case 'processNew':
				case 'processUpdate':
				case 'processDone':
					const type = Number(data.process.type) || 0;
					const state = Number(data.process.state) || 0;
					const status = translate('progress' + type);
					
					switch (state) {
						case I.ProgressState.Running:
						case I.ProgressState.Done:
							commonStore.progressSet({
								id: String(data.process.id || ''),
								status: status,
								current: Number(data.process.progress.done),
								total: Number(data.process.progress.total),
								isUnlocked: true,
								canCancel: true,
							});
							break;
						
						case I.ProgressState.Canceled:
							commonStore.progressClear();
							break;
					};
					break;
			};
		};
		
		blocks = blocks.map((it: any) => { return new M.Block(it); });
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