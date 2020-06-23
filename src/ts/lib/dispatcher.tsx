import { authStore, commonStore, blockStore } from 'ts/store';
import { set } from 'mobx';
import { Util, DataUtil, I, M, Decode, Storage, translate, analytics, Response } from 'ts/lib';
import * as Sentry from '@sentry/browser';

const Service = require('lib/pb/protos/service/service_grpc_web_pb');
const Commands = require('lib/pb/protos/commands_pb');
const Events = require('lib/pb/protos/events_pb');
const Constant = require('json/constant.json')

/// #if USE_NATIVE_ADDON
const bindings = require('bindings')('addon');
/// #endif

class Dispatcher {

	service: any = null;
	stream: any = null;

	constructor () {
		this.service = new Service.ClientCommandsClient('http://localhost:31008', null, null);

		/// #if USE_NATIVE_ADDON
			const handler = (item: any) => {
				try {
					this.event(Service.Event.decode(item.data));
				} catch (e) {
					console.error(e);
				};
			};

			Service.anytype.ClientCommands.prototype.rpcCall = this.napiCall;
			bindings.setEventHandler(handler);
		/// #else
			this.service = new Service.ClientCommandsClient(Constant.server, null, null);
			this.stream = this.service.listenEvents(new Commands.Empty(), null);

			this.stream.on('data', (event: any) => {
				this.event(event, false);
			});

			this.stream.on('status', (status: any) => {
				console.log('[Stream] status', status);
			});

			this.stream.on('end', (end: any) => {
				console.log('[Stream] end', end);
			});
		/// #endif
	};

	eventType (v: number): string {
		let t = '';
		let V = Events.Event.Message.ValueCase;

		if (v == V.ACCOUNTSHOW)				 t = 'accountShow';
		if (v == V.BLOCKADD)				 t = 'blockAdd';
		if (v == V.BLOCKDELETE)				 t = 'blockDelete';
		if (v == V.BLOCKSETFIELDS)			 t = 'blockSetFields';
		if (v == V.BLOCKSETCHILDRENIDS)		 t = 'blockSetChildrenIds';
		if (v == V.BLOCKSETBACKGROUNDCOLOR)	 t = 'blockSetBackgroundColor';
		if (v == V.BLOCKSETTEXT)			 t = 'blockSetText';
		if (v == V.BLOCKSETFILE)			 t = 'blockSetFile';
		if (v == V.BLOCKSETLINK)			 t = 'blockSetLink';
		if (v == V.BLOCKSETBOOKMARK)		 t = 'blockSetBookmark';
		if (v == V.BLOCKSETALIGN)			 t = 'blockSetAlign';
		if (v == V.BLOCKSETDETAILS)			 t = 'blockSetDetails';
		if (v == V.BLOCKSETDIV)				 t = 'blockSetDiv';
		if (v == V.BLOCKSETDATAVIEWRECORDS)	 t = 'blockSetDataviewRecords';
		if (v == V.BLOCKSETDATAVIEWVIEW)	 t = 'blockSetDataviewView';
		if (v == V.BLOCKDELETEDATAVIEWVIEW)	 t = 'blockDeleteDataviewView';
		if (v == V.BLOCKSHOW)				 t = 'blockShow';
		if (v == V.PROCESSNEW)				 t = 'processNew';
		if (v == V.PROCESSUPDATE)			 t = 'processUpdate';
		if (v == V.PROCESSDONE)				 t = 'processDone';

		return t;
	};

	event (event: any, skipDebug?: boolean) {
		const rootId = event.getContextid();
		const messages = event.getMessagesList() || [];
		const debug = (Storage.get('debug') || {}).mw && !skipDebug;

		if (debug) {
			console.log('[Dispatcher.event] rootId', rootId, 'event', JSON.stringify(event.toObject(), null, 3));
		};

		let globalParentIds: any = {};
		let globalChildrenIds: any = {};
		let blocks: any[] = [];
		let id: string = '';

		messages.sort(this.sort);

		for (let message of messages) {
			let type = this.eventType(message.getValueCase());
			let fn = 'get' + Util.ucFirst(type);
			let data = message[fn] ? message[fn]() : {};
			let childrenIds: string[] = [];
			
			switch (type) {
				case 'blockSetChildrenIds':
					id = data.getId();
					childrenIds = data.getChildrenidsList() || [];

					for (let childId of childrenIds) {
						globalParentIds[childId] = id;
					};
					if (childrenIds.length) {
						globalChildrenIds[id] = childrenIds;
					};
					break;

				case 'blockAdd':
					blocks = data.getBlocksList() || [];
					for (let block of blocks) {
						id = block.getId();
						childrenIds = block.getChildrenidsList() || [];

						for (let childId of childrenIds) {
							globalParentIds[childId] = id;
						};
						if (childrenIds.length) {
							globalChildrenIds[id] = childrenIds;
						};
					};
					break;
			};
		};

		console.log('globalParentIds', globalParentIds);
		console.log('globalChildrenIds', globalChildrenIds);

		for (let message of messages) {
			let block: any = null;
			let childrenIds: string[] = [];
			let type = this.eventType(message.getValueCase());
			let fn = 'get' + Util.ucFirst(type);
			let data = message[fn] ? message[fn]() : {};

			switch (type) {

				case 'accountShow':
					authStore.accountAdd(data.account);
					break;

				case 'blockShow':
					blocks = data.getBlocksList() || [];
					let details = data.getDetailsList() || [];

					blocks = blocks.map((it: any) => {
						it = blockStore.prepareBlockFromProto(it);
						if (it.id == rootId) {
							it.type = I.BlockType.Page;
							it.pageType = data.getType();
						};
						return new M.Block(it);
					});

					block = blocks.find((it: I.Block) => { return it.id == rootId; });
					if (!block) {
						break;
					};

					if (block.hasTitle()) {
						block.childrenIds.unshift(rootId + '-title');
						blocks.unshift(new M.Block({ 
							id: rootId + '-title', 
							type: I.BlockType.Title, 
							childrenIds: [], 
							fields: {}, 
							content: {},
						}));
					};

					blockStore.blocksSet(rootId, blocks);
					blockStore.detailsSet(rootId, details);
					break;

				case 'blockAdd':
					blocks = data.getBlocksList() || [];
					for (let block of blocks) {
						block = blockStore.prepareBlockFromProto(block);
						block.parentId = String(globalParentIds[block.id] || '');

						blockStore.blockAdd(rootId, block);
					};
					break;

				case 'blockDelete':
					let blockIds = data.getBlocksidsList() || [];
					for (let blockId of blockIds) {
						blockStore.blockDelete(rootId, blockId);
					};
					break;

				case 'blockSetChildrenIds':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};
					
					childrenIds = data.getChildrenidsList() || [];

					if (block.hasTitle() && (childrenIds.indexOf(rootId + '-title') < 0)) {
						childrenIds.unshift(rootId + '-title');
					};

					blockStore.blockUpdateStructure(rootId, id, childrenIds);
					break;

				case 'blockSetDetails':
					let item = {
						id: data.getId(),
						details: Decode.decodeStruct(data.getDetails().getFieldsMap())
					};

					blockStore.detailsUpdate(rootId, item);
					break;

				case 'blockSetFields':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (null !== data.fields) {
						block.fields = Decode.decodeStruct(data.fields.getFieldsMap());
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetLink':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (null !== data.fields) {
						block.content.fields = Decode.decodeStruct(data.fields.getFieldsMap());
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetText':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
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

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetDiv':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (null !== data.style) {
						block.content.style = Number(data.style.value) || 0;
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetFile':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
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

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetBookmark':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
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
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.bgColor = String(data.backgroundColor || '');
					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetAlign':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.align = Number(data.align) || 0;
					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetDataviewView':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					const schemaId = DataUtil.schemaField(block.content.schemaURL);
					data.view = blockStore.prepareViewFromProto(schemaId, data.view);

					let view = block.content.views.find((it: I.View) => { return it.id == data.view.id });
					if (view) {
						set(view, data.view);
					} else {
						block.content.views.push(data.view);
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetDataviewRecords':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.inserted = data.inserted || [];
					data.updated = data.updated || [];
					data.removed = data.removed || [];

					let list = [];
					for (let id of data.removed) {
						list = list.filter((it: any) => { return it.id != id; });
					};
					for (let item of data.inserted) {
						let details = Decode.decodeStruct(item) || {};
						details.name = String(details.name || Constant.default.name);

						list.push(details);
					};

					block.content.viewId = data.viewId;
					block.content.total = Number(data.total) || 0;
					block.content.data = list;
					blockStore.blockUpdate(rootId, block);
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

		blockStore.setNumbers(rootId);
	};

	sort (c1: any, c2: any) {
		let type1 = c1.value;
		let type2 = c2.value;

		if ((type1 == 'blockSetChildrenIds') && (type2 != 'blockSetChildrenIds')) {
			return -1;
		};
		if ((type2 == 'blockSetChildrenIds') && (type1 != 'blockSetChildrenIds')) {
			return 1;
		};

		if ((type1 == 'blockAdd') && (type2 != 'blockAdd')) {
			return -1;
		};
		if ((type2 == 'blockAdd') && (type1 != 'blockAdd')) {
			return 1;
		};

		if ((type1 == 'blockDelete') && (type2 != 'blockDelete')) {
			return -1;
		};
		if ((type2 == 'blockDelete') && (type1 != 'blockDelete')) {
			return 1;
		};

		return 0;
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		const upper = Util.toUpperCamelCase(type);
		const debug = (Storage.get('debug') || {}).mw;

		if (!this.service[type]) {
			console.error('[Dispatcher.request] Service not found: ', type);
			return;
		};

		let t0 = 0;
		let t1 = 0;
		let t2 = 0;

		if (debug) {
			t0 = performance.now();
			console.log('[Dispatcher.request]', type, JSON.stringify(data.toObject(), null, 3));
		};

		analytics.event(upper, data);

		try {
			this.service[type](data, null, (error: any, response: any) => {
				if (debug) {
					t1 = performance.now();
				};

				if (error) {
					console.error('[Dispatcher.error]', error.code, error.description);
					return;
				};

				let message = Response[upper] ? Response[upper](response) : {};
				let err = response.getError();

				message.event = response.getEvent ? response.getEvent() : null;
				message.error = {
					code: String(err.getCode() || ''),
					description: String(err.getDescription() || ''),
				};

				if (message.error.code) {
					console.error('[Dispatcher.error]', type, 'code:', message.error.code, 'description:', message.error.description);
					Sentry.captureMessage(type + ': ' + message.error.description);
					analytics.event('Error', { cmd: type, code: message.error.code });
				};

				if (debug) {
					console.log('[Dispatcher.callback]', type, JSON.stringify(response.toObject(), null, 3));
				};

				if (message.event) {
					this.event(message.event, true);
				};

				if (callBack) {
					callBack(message);
				};

				if (debug) {
					t2 = performance.now();
					const mt = Math.ceil(t1 - t0);
					const rt = Math.ceil(t2 - t1);
					const tt = Math.ceil(t2 - t0);

					console.log(
						'Middle time:', mt + 'ms',
						'Render time:', rt + 'ms',
						'Total time:', tt + 'ms'
					);

					if (mt > 3000) {
						Sentry.captureMessage(`${type}: middleware time too long`);
					};
					if (rt > 1000) {
						Sentry.captureMessage(`${type}: render time too long`);
					};
				};
			});
		} catch (err) {
			console.error(err);
		};
	};

	/// #if USE_NATIVE_ADDON
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
	/// #endif

};

export let dispatcher = new Dispatcher();
