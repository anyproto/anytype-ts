import { authStore, commonStore, blockStore, dbStore } from 'ts/store';
import { set } from 'mobx';
import { Util, DataUtil, I, M, Decode, translate, analytics, Response, Mapper } from 'ts/lib';
import * as Sentry from '@sentry/browser';

const Service = require('lib/pb/protos/service/service_grpc_web_pb');
const Commands = require('lib/pb/protos/commands_pb');
const Events = require('lib/pb/protos/events_pb');
const path = require('path');
const { remote } = window.require('electron');

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
			let serverAddr = remote.getGlobal('serverAddr');
			
			console.log('Server address: ', serverAddr);
			
			this.service = new Service.ClientCommandsClient(serverAddr, null, null);

			this.listenEvents();

		/// #endif
	};

	listenEvents () {
		this.stream = this.service.listenEvents(new Commands.Empty(), null);

		this.stream.on('data', (event: any) => {
			this.event(event, false);
		});

		this.stream.on('status', (status: any) => {
			if (status.code) {
				console.error('[Stream] Restarting', status);
				this.listenEvents();
			};
		});

		this.stream.on('end', (end: any) => {
			console.error('[Stream] end, restarting', end);
			this.listenEvents();
		});
	};

	eventType (v: number): string {
		let t = '';
		let V = Events.Event.Message.ValueCase;

		if (v == V.ACCOUNTSHOW)					 t = 'accountShow';
		if (v == V.BLOCKADD)					 t = 'blockAdd';
		if (v == V.BLOCKDELETE)					 t = 'blockDelete';
		if (v == V.BLOCKSETFIELDS)				 t = 'blockSetFields';
		if (v == V.BLOCKSETCHILDRENIDS)			 t = 'blockSetChildrenIds';
		if (v == V.BLOCKSETBACKGROUNDCOLOR)		 t = 'blockSetBackgroundColor';
		if (v == V.BLOCKSETTEXT)				 t = 'blockSetText';
		if (v == V.BLOCKSETFILE)				 t = 'blockSetFile';
		if (v == V.BLOCKSETLINK)				 t = 'blockSetLink';
		if (v == V.BLOCKSETBOOKMARK)			 t = 'blockSetBookmark';
		if (v == V.BLOCKSETALIGN)				 t = 'blockSetAlign';
		if (v == V.BLOCKSETDETAILS)				 t = 'blockSetDetails';
		if (v == V.BLOCKSETDIV)					 t = 'blockSetDiv';
		if (v == V.BLOCKSETRELATION)			 t = 'blockSetRelation';
		if (v == V.BLOCKSETRELATIONS)			 t = 'blockSetRelations';

		if (v == V.BLOCKDATAVIEWVIEWSET)		 t = 'blockDataviewViewSet';
		if (v == V.BLOCKDATAVIEWVIEWDELETE)		 t = 'blockDataviewViewDelete';

		if (v == V.BLOCKDATAVIEWRELATIONSET)	 t = 'blockDataviewRelationSet';
		if (v == V.BLOCKDATAVIEWRELATIONDELETE)	 t = 'blockDataviewRelationDelete';

		if (v == V.BLOCKDATAVIEWRECORDSSET)		 t = 'blockDataviewRecordsSet';
		if (v == V.BLOCKDATAVIEWRECORDSINSERT)	 t = 'blockDataviewRecordsInsert';
		if (v == V.BLOCKDATAVIEWRECORDSUPDATE)	 t = 'blockDataviewRecordsUpdate';
		if (v == V.BLOCKDATAVIEWRECORDSDELETE)	 t = 'blockDataviewRecordsDelete';

		if (v == V.BLOCKSHOW)					 t = 'blockShow';
		if (v == V.PROCESSNEW)					 t = 'processNew';
		if (v == V.PROCESSUPDATE)				 t = 'processUpdate';
		if (v == V.PROCESSDONE)					 t = 'processDone';
		if (v == V.THREADSTATUS)				 t = 'threadStatus';

		return t;
	};

	event (event: any, skipDebug?: boolean) {
		const { config } = commonStore;
		const rootId = event.getContextid();
		const messages = event.getMessagesList() || [];
		const debug = config.debugMW && !skipDebug;

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

			if (debug && (type != 'threadStatus')) {
				console.log('[Dispatcher.event] rootId', rootId, 'event', type, JSON.stringify(message.toObject(), null, 3));
			};

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
			let view: any = null;
			let childrenIds: string[] = [];
			let type = this.eventType(message.getValueCase());
			let fn = 'get' + Util.ucFirst(type);
			let data = message[fn] ? message[fn]() : {};

			switch (type) {

				case 'accountShow':
					authStore.accountAdd(Mapper.From.Account(data.getAccount()));
					break;

				case 'blockShow':
					dbStore.relationsSet(rootId, (data.getRelationsList() || []).map(Mapper.From.Relation));
					dbStore.objectTypesSet((data.getObjecttypesList() || []).map(Mapper.From.ObjectType));
					dbStore.objectTypesPerObjectSet((data.getObjecttypesperobjectList() || []).map(Mapper.From.ObjectTypePerObject));

					let res = Response.BlockShow(data);
					this.onBlockShow(rootId, res.type, res.blocks, res.details);
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

					if (data.hasFields()) {
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

					if (data.hasFields()) {
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

					if (data.hasText()) {
						block.content.text = data.getText().getValue();
					};

					if (data.hasMarks()) {
						block.content.marks = (data.getMarks().getValue().getMarksList() || []).map(Mapper.From.Mark);
					};

					if (data.hasStyle()) {
						block.content.style = data.getStyle().getValue();
					};

					if (data.hasChecked()) {
						block.content.checked = data.getChecked().getValue();
					};

					if (data.hasColor()) {
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

					if (data.hasStyle()) {
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

					if (data.hasName()) {
						block.content.name = data.getName().getValue();
					};

					if (data.hasHash()) {
						block.content.hash = data.getHash().getValue();
					};

					if (data.hasMime()) {
						block.content.mime = data.getMime().getValue();
					};

					if (data.hasSize()) {
						block.content.size = data.getSize().getValue();
					};

					if (data.hasType()) {
						block.content.type = data.getType().getValue();
					};

					if (data.hasState()) {
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

					if (data.hasUrl()) {
						block.content.url = data.getUrl().getValue();
					};

					if (data.hasTitle()) {
						block.content.title = data.getTitle().getValue();
					};

					if (data.hasDescription()) {
						block.content.description = data.getDescription().getValue();
					};

					if (data.hasImagehash()) {
						block.content.imageHash = data.getImagehash().getValue();
					};

					if (data.hasFaviconhash()) {
						block.content.faviconHash = data.getFaviconhash().getValue();
					};

					if (data.hasType()) {
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

				case 'blockSetRelations':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					dbStore.relationsSet(rootId, (data.getRelationsList() || []).map(Mapper.From.Relation));
					break;

				case 'blockSetRelation':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasKey()) {
						block.content.key = data.getKey().getValue();
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockDataviewViewSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.view = Mapper.From.View(data.getView());
					data.view.relations = DataUtil.viewGetRelations(block.id, data.view);

					view = block.content.views.find((it: I.View) => { return it.id == data.view.id });
					if (view) {
						set(view, data.view);
					} else {
						block.content.views.push(data.view);
					};

					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockDataviewViewDelete':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.content.views = block.content.views.filter((it: I.View) => { return it.id != data.getViewid(); });
					blockStore.blockUpdate(rootId, block);
					break;

				case 'blockDataviewRecordsSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.records = data.getRecordsList() || [];

					let list = [];
					for (let item of data.records) {
						list.push(Decode.decodeStruct(item) || {});
					};

					dbStore.setData(id, list);
					dbStore.setMeta(id, {
						viewId: data.getViewid(),
						total: data.getTotal(),
					});
					break;

				case 'blockDataviewRecordsInsert':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.records = data.getRecordsList() || [];
					for (let item of data.records) {
						item = Decode.decodeStruct(item) || {};
						dbStore.recordAdd(block.id, item);
					};
					break;

				case 'blockDataviewRecordsUpdate':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.records = data.getRecordsList() || [];
					for (let item of data.records) {
						item = Decode.decodeStruct(item) || {};
						dbStore.recordUpdate(block.id, item);
					};
					break;

				case 'blockDataviewRecordsDelete':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					data.records = data.getRecordsList() || [];
					for (let item of data.records) {
						item = Decode.decodeStruct(item) || {};
						dbStore.recordDelete(block.id, item.id);
					};
					break;

				case 'blockDataviewRelationSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					const relation = Mapper.From.Relation(data.getRelation());
					const item = dbStore.getRelation(id, relation.key);

					item ? dbStore.relationUpdate(id, relation) : dbStore.relationAdd(id, relation);
					break;

				case 'blockDataviewRelationDelete':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					dbStore.relationRemove(id, data.getRelationkey());
					break;

				case 'processNew':
				case 'processUpdate':
				case 'processDone':
					const process = data.getProcess();
					const progress = process.getProgress();
					const state = process.getState();
					const type = process.getType();

					let isUnlocked = true;
					if (type == I.ProgressType.Import) {
						isUnlocked = false;
					};

					switch (state) {
						case I.ProgressState.Running:
						case I.ProgressState.Done:
							commonStore.progressSet({
								id: process.getId(),
								status: translate('progress' + type),
								current: progress.getDone(),
								total: progress.getTotal(),
								isUnlocked: isUnlocked,
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

	onBlockShow (rootId: string, type: number, blocks: I.Block[], details: any[]) {
		blocks = blocks.map((it: any) => {
			if (it.id == rootId) {
				it.type = I.BlockType.Page;
				it.pageType = type;
			};
			if (it.type == I.BlockType.Dataview) {
				it.content.views = it.content.views.map((view: any) => {
					view.relations = DataUtil.viewGetRelations(it.id, view);
					return view;
				});
			};
			return new M.Block(it);
		});

		let root = blocks.find((it: I.Block) => { return it.id == rootId; });
		if (!root) {
			return;
		};

		blockStore.blocksSet(rootId, blocks);
		blockStore.detailsSet(rootId, details);
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const upper = Util.toUpperCamelCase(type);
		const debug = config.debugMW;

		if (!this.service[type]) {
			console.error('[Dispatcher.request] Service not found: ', type);
			return;
		};

		let t0 = performance.now();
		let t1 = 0;
		let t2 = 0;

		if (debug) {
			console.log('[Dispatcher.request]', type, JSON.stringify(data.toObject(), null, 3));
		};

		try {
			this.service[type](data, null, (error: any, response: any) => {
				if (!response) {
					return;
				};

				t1 = performance.now();

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

				t2 = performance.now();
				const middleTime = Math.ceil(t1 - t0);
				const renderTime = Math.ceil(t2 - t1);
				const totalTime = middleTime + renderTime;

				data.middleTime = middleTime;
				data.renderTime = renderTime;
				analytics.event(upper, data);

				if (debug) {
					console.log(
						'Middle time:', middleTime + 'ms',
						'Render time:', renderTime + 'ms',
						'Total time:', totalTime + 'ms'
					);
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
