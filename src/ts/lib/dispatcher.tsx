import { authStore, commonStore, blockStore } from 'ts/store';
import { set } from 'mobx';
import { Util, DataUtil, I, M, Decode, Storage, translate, analytics, Response, Mapper } from 'ts/lib';
import * as Sentry from '@sentry/browser';

const Service = require('lib/pb/protos/service/service_grpc_web_pb');
const Commands = require('lib/pb/protos/commands_pb');
const Events = require('lib/pb/protos/events_pb');
const Constant = require('json/constant.json');
const path = require('path');

/// #if USE_ADDON
const { app } = window.require('electron').remote;
const bindings = require('bindings')({
	bindings: 'addon.node',
	module_root: path.join(app.getAppPath(), 'build'),
});
/// #endif

class Dispatcher {

	service: any = null;
	stream: any = null;

	constructor () {

		/// #if USE_ADDON
		this.service = new Service.ClientCommandsClient("http://127.0.0.1:80", null, null);

		const handler = (item: any) => {
				try {
					this.event(Events.Event.deserializeBinary(item.data.buffer), false);
				} catch (e) {
					console.error(e);
				};
			};

			this.service.client_.rpcCall = this.napiCall;
			bindings.setEventHandler(handler);
		/// #else
			let serverAddr = window.require('electron').remote.getGlobal('serverAddr');
			console.log("serverAddr "+serverAddr);
			this.service = new Service.ClientCommandsClient(serverAddr, null, null);

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
		let self = this;

		messages.sort((c1: any, c2: any) => { return self.sort(c1, c2); });

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

		for (let message of messages) {
			let block: any = null;
			let childrenIds: string[] = [];
			let type = this.eventType(message.getValueCase());
			let fn = 'get' + Util.ucFirst(type);
			let data = message[fn] ? message[fn]() : {};

			switch (type) {

				case 'accountShow':
					authStore.accountAdd(Mapper.From.Account(data.getAccount()));
					break;

				case 'blockShow':
					blocks = data.getBlocksList() || [];
					let details = data.getDetailsList() || [];

					blocks = blocks.map((it: any) => {
						it = Mapper.From.Block(it);
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
						block = Mapper.From.Block(block);
						block.parentId = String(globalParentIds[block.id] || '');
						blockStore.blockAdd(rootId, block);
					};
					break;

				case 'blockDelete':
					let blockIds = data.getBlockidsList() || [];
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
					blockStore.detailsUpdate(rootId, {
						id: data.getId(),
						details: Decode.decodeStruct(data.getDetails()),
					});
					break;

				case 'blockSetFields':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getFields()) {
						block.fields = Decode.decodeStruct(data.getFields());
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetLink':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getFields()) {
						block.content.fields = Decode.decodeStruct(data.getFields());
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetText':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getText()) {
						block.content.text = data.getText().getValue();
					};

					if (undefined !== data.getMarks()) {
						block.content.marks = (data.getMarks().getValue().getMarksList() || []).map(Mapper.From.Mark);
					};

					if (undefined !== data.getStyle()) {
						block.content.style = data.getStyle().getValue();
					};

					if (undefined !== data.getChecked()) {
						block.content.checked = data.getChecked().getValue();
					};

					if (undefined !== data.getColor()) {
						block.content.color = data.getColor().getValue();
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetDiv':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getStyle()) {
						block.content.style = data.getStyle().getValue();
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetFile':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getName()) {
						block.content.name = data.getName().getValue();
					};

					if (undefined !== data.getHash()) {
						block.content.hash = data.getHash().getValue();
					};

					if (undefined !== data.getMime()) {
						block.content.mime = data.getMime().getValue();
					};

					if (undefined !== data.getSize()) {
						block.content.size = data.getSize().getValue();
					};

					if (undefined !== data.getType()) {
						block.content.type = data.getType().getValue();
					};

					if (undefined !== data.getState()) {
						block.content.state = data.getState().getValue();
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetBookmark':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (undefined !== data.getUrl()) {
						block.content.url = data.getUrl().getValue();
					};

					if (undefined !== data.getTitle()) {
						block.content.title = data.getTitle().getValue();
					};

					if (undefined !== data.getDescription()) {
						block.content.description = data.getDescription().getValue();
					};

					if (undefined !== data.getImagehash()) {
						block.content.imageHash = data.getImagehash().getValue();
					};

					if (undefined !== data.getFaviconhash()) {
						block.content.faviconHash = data.getFaviconhash().getValue();
					};

					if (undefined !== data.getType()) {
						block.content.type = data.getType().getValue();
					};
					break;

				case 'blockSetBackgroundColor':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.bgColor = data.getBackgroundcolor();
					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetAlign':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.align = data.getAlign();
					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockSetDataviewView':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.view = Mapper.From.View(DataUtil.schemaField(block.content.schemaURL), data.getView());

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

					data.inserted = data.getInsertedList() || [];
					data.updated = data.getUpdatedList() || [];
					data.removed = data.getRemovedList() || [];

					let list = [];
					for (let id of data.removed) {
						list = list.filter((it: any) => { return it.id != id; });
					};
					for (let item of data.inserted) {
						list.push(Decode.decodeStruct(item) || {});
					};

					block.content.viewId = data.getViewid();
					block.content.total = data.getTotal();
					block.content.data = list;

					blockStore.blockUpdate(rootId, block);
					break;

				case 'processNew':
				case 'processUpdate':
				case 'processDone':
					const process = data.getProcess();
					const state = process.getState();
					const progress = process.getProgress();

					switch (state) {
						case I.ProgressState.Running:
						case I.ProgressState.Done:
							commonStore.progressSet({
								id: process.getId(),
								status: translate('progress' + process.getType()),
								current: progress.getDone(),
								total: progress.getTotal(),
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
		let type1 = this.eventType(c1.getValueCase());
		let type2 = this.eventType(c2.getValueCase());

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

		if ((type1 == 'blockSetChildrenIds') && (type2 != 'blockSetChildrenIds')) {
			return -1;
		};
		if ((type2 == 'blockSetChildrenIds') && (type1 != 'blockSetChildrenIds')) {
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

				let message: any = {};
				let err = response.getError();
				let code = err.getCode();

				if (!code && Response[upper]) {
					message = Response[upper](response);
				};

				message.event = response.getEvent ? response.getEvent() : null;
				message.error = {
					code: code,
					description: err.getDescription(),
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

	/// #if USE_ADDON
		napiCall (method: any, inputObj: any, outputObj: any, request: any, callBack?: (err: any, res: any) => void) {
			const a = method.split('/');
			method = a[a.length - 1];

			const buffer = inputObj.serializeBinary();
			const handler = (item: any) => {
				try {
					let message = request.b(item.data.buffer);
					if (message) {
						callBack(null, message);
					};
				} catch (err) {
					console.error(err);
				};
			};

			bindings.sendCommand(method, buffer, handler);
		};
	/// #endif

};

export let dispatcher = new Dispatcher();
