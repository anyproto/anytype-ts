import { authStore, commonStore, blockStore, detailStore, dbStore } from 'ts/store';
import { Util, I, M, Decode, translate, analytics, Response, Mapper } from 'ts/lib';
import * as Sentry from '@sentry/browser';
import { crumbs } from '.';
import arrayMove from 'array-move';

const Service = require('lib/pb/protos/service/service_grpc_web_pb');
const Commands = require('lib/pb/protos/commands_pb');
const Events = require('lib/pb/protos/events_pb');
const path = require('path');
const Constant = require('json/constant.json');
const { app, getGlobal } = window.require('@electron/remote');

const SORT_IDS = [ 
	'objectShow', 
	'blockAdd', 
	'blockDelete', 
	'blockSetChildrenIds', 
	'objectDetailsSet', 
	'objectDetailsAmend', 
	'objectDetailsUnset', 
	'subscriptionCounters',
	'blockDataviewSourceSet',
	'blockDataviewViewSet',
	'blockDataviewViewDelete',
];
const SKIP_IDS = [ 'blockOpenBreadcrumbs', 'blockSetBreadcrumbs' ];

/// #if USE_ADDON
const bindings = window.require('bindings')({
	bindings: 'addon.node',
	module_root: path.join(app.getAppPath(), 'build'),
});
/// #endif

class Dispatcher {

	service: any = null;
	stream: any = null;
	timeoutStream: number = 0;
	timeoutEvent: any = {};
	reconnects: number = 0;

	constructor () {
		/// #if USE_ADDON
			this.service = new Service.ClientCommandsClient('http://127.0.0.1:80', null, null);

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
			let serverAddr = getGlobal('serverAddr');
			console.log('[Dispatcher] Server address: ', serverAddr);
			this.service = new Service.ClientCommandsClient(serverAddr, null, null);

			this.listenEvents();
		/// #endif
	};

	listenEvents () {
		this.stream = this.service.listenEvents(new Commands.Empty(), null);

		this.stream.on('data', (event: any) => {
			try {
				this.event(event, false);
			} catch (e) {
				console.error(e);
			};
		});

		this.stream.on('status', (status: any) => {
			if (status.code) {
				console.error('[Dispatcher.stream] Restarting', status);
				this.listenEvents();
			};
		});

		this.stream.on('end', () => {
			console.error('[Dispatcher.stream] end, restarting');

			let t = 1000;
			if (this.reconnects == 10) {
				t = 30000;
				this.reconnects = 0;
			};

			window.clearTimeout(this.timeoutStream);
			this.timeoutStream = window.setTimeout(() => { 
				this.listenEvents(); 
				this.reconnects++;
			}, t);
		});
	};

	eventType (v: number): string {
		let t = '';
		let V = Events.Event.Message.ValueCase;

		if (v == V.ACCOUNTSHOW)					 t = 'accountShow';
		if (v == V.ACCOUNTDETAILS)				 t = 'accountDetails';
		if (v == V.ACCOUNTCONFIGUPDATE)			 t = 'accountConfigUpdate';
		if (v == V.THREADSTATUS)				 t = 'threadStatus';
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
		if (v == V.BLOCKSETDIV)					 t = 'blockSetDiv';
		if (v == V.BLOCKSETRELATION)			 t = 'blockSetRelation';
		if (v == V.BLOCKSETLATEX)				 t = 'blockSetLatex';

		if (v == V.BLOCKDATAVIEWVIEWSET)		 t = 'blockDataviewViewSet';
		if (v == V.BLOCKDATAVIEWVIEWDELETE)		 t = 'blockDataviewViewDelete';
		if (v == V.BLOCKDATAVIEWVIEWORDER)		 t = 'blockDataviewViewOrder';

		if (v == V.BLOCKDATAVIEWSOURCESET)		 t = 'blockDataviewSourceSet';

		if (v == V.BLOCKDATAVIEWRELATIONSET)	 t = 'blockDataviewRelationSet';
		if (v == V.BLOCKDATAVIEWRELATIONDELETE)	 t = 'blockDataviewRelationDelete';

		if (v == V.SUBSCRIPTIONADD)				 t = 'subscriptionAdd';
		if (v == V.SUBSCRIPTIONREMOVE)			 t = 'subscriptionRemove';
		if (v == V.SUBSCRIPTIONPOSITION)		 t = 'subscriptionPosition';
		if (v == V.SUBSCRIPTIONCOUNTERS)		 t = 'subscriptionCounters';

		if (v == V.PROCESSNEW)					 t = 'processNew';
		if (v == V.PROCESSUPDATE)				 t = 'processUpdate';
		if (v == V.PROCESSDONE)					 t = 'processDone';
		if (v == V.THREADSTATUS)				 t = 'threadStatus';

		if (v == V.OBJECTSHOW)					 t = 'objectShow';
		if (v == V.OBJECTREMOVE)				 t = 'objectRemove';
		if (v == V.OBJECTDETAILSSET)			 t = 'objectDetailsSet';
		if (v == V.OBJECTDETAILSAMEND)			 t = 'objectDetailsAmend';
		if (v == V.OBJECTDETAILSUNSET)			 t = 'objectDetailsUnset';
		if (v == V.OBJECTRELATIONSSET)			 t = 'objectRelationsSet';
		if (v == V.OBJECTRELATIONSAMEND)		 t = 'objectRelationsAmend';
		if (v == V.OBJECTRELATIONSREMOVE)		 t = 'objectRelationsRemove';

		return t;
	};

	event (event: any, skipDebug?: boolean) {
		const { config } = commonStore;
		const traceId = event.getTraceid();
		const ctx: string[] = [ event.getContextid() ];
		
		if (traceId) {
			ctx.push(traceId);
		};

		const rootId = ctx.join('-');
		const messages = event.getMessagesList() || [];
		const debugCommon = config.debug.mw && !skipDebug;
		const debugThread = config.debug.th && !skipDebug;
		const log = (rootId: string, type: string, data: any, valueCase: any) => { 
			console.log(`%cEvent.${type}`, 'font-weight: bold; color: #ad139b;', rootId);
			if (!type) {
				console.error('Event not found for valueCase', valueCase);
			};

			if (data && data.toObject) {
				const d = Util.objectClear(data.toObject());
				console.log(config.debug.js ? JSON.stringify(d, null, 3) : d); 
			};
		};

		let blocks: any[] = [];
		let id: string = '';
		let self = this;
		let block: any = null;
		let details: any = null;
		let viewId: string = '';
		let keys: string[] = [];
		let ids: string[] = [];
		let subIds: string[] = [];
		let uniqueSubIds: string[] = [];
		let subId: string = '';
		let afterId: string = '';
		let records: any[] = [];
		let oldIndex: number = 0;
		let newIndex: number = 0;

		messages.sort((c1: any, c2: any) => { return self.sort(c1, c2); });

		for (let message of messages) {
			let type = this.eventType(message.getValueCase());
			let fn = 'get' + Util.ucFirst(type);
			let data = message[fn] ? message[fn]() : {};
			let needLog = (debugThread && (type == 'threadStatus')) || (debugCommon && (type != 'threadStatus'));

			// Do not log breadcrumbs details to clean up logs
			if (rootId.match('virtualBreadcrumbs')) {
				needLog = false;
			};
			
			switch (type) {

				case 'accountShow':
					authStore.accountAdd(Mapper.From.Account(data.getAccount()));
					break;

				case 'accountDetails':
					break;

				case 'accountConfigUpdate':
					commonStore.configSet(Mapper.From.AccountConfig(data.getConfig()), true);
					break;

				case 'threadStatus':
					authStore.threadSet(rootId, {
						summary: Mapper.From.ThreadSummary(data.getSummary()),
						cafe: Mapper.From.ThreadCafe(data.getCafe()),
						accounts: (data.getAccountsList() || []).map(Mapper.From.ThreadAccount),
					});
					break;

				case 'objectShow':
					this.onObjectShow(rootId, Response.ObjectShow(data));
					break;

				case 'objectRemove':
					ids = data.getIdsList();
					crumbs.removeItems(I.CrumbsType.Page, ids);
					crumbs.removeItems(I.CrumbsType.Recent, ids);
					break;

				case 'blockAdd':
					blocks = data.getBlocksList() || [];
					for (let block of blocks) {
						block = Mapper.From.Block(block);

						if (block.type == I.BlockType.Dataview) {
							dbStore.relationsSet(rootId, block.id, block.content.relations);
							dbStore.viewsSet(rootId, block.id, block.content.views);
						};

						blockStore.add(rootId, new M.Block(block));
						blockStore.updateStructure(rootId, block.id, block.childrenIds);
					};
					break;

				case 'blockDelete':
					let blockIds = data.getBlockidsList() || [];
					for (let blockId of blockIds) {
						const block = blockStore.getLeaf(rootId, blockId);
						if (!block) {
							continue;
						};

						if (block.type == I.BlockType.Dataview) {
							dbStore.relationsClear(rootId, blockId);
							dbStore.viewsClear(rootId, blockId);
							dbStore.metaClear(rootId, blockId);
							dbStore.recordsClear(rootId, blockId);
						};

						blockStore.delete(rootId, blockId);
					};
					break;

				case 'blockSetChildrenIds':
					id = data.getId();

					const childrenIds = data.getChildrenidsList();
					if ((id == rootId) && !childrenIds.includes(Constant.blockId.footer)) {
						childrenIds.push(Constant.blockId.footer);
					};

					blockStore.updateStructure(rootId, id, childrenIds);

					if (id == rootId) {
						blockStore.checkDraft(rootId);
					};
					break;

				case 'blockSetFields':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.fields = data.hasFields() ? Decode.decodeStruct(data.getFields()) : {};
					blockStore.update(rootId, block);
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

					blockStore.update(rootId, block);
					break;

				case 'blockSetText':
					id = data.getId();
					block = Util.objectCopy(blockStore.getLeaf(rootId, id));
					if (!block || !block.id) {
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

					if (data.hasIconemoji()) {
						block.content.iconEmoji = data.getIconemoji().getValue();
					};

					if (data.hasIconimage()) {
						block.content.iconImage = data.getIconimage().getValue();
					};

					blockStore.update(rootId, block);
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

					blockStore.update(rootId, block);
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

					if (data.hasStyle()) {
						block.content.style = data.getStyle().getValue();
					};

					if (data.hasState()) {
						block.content.state = data.getState().getValue();
					};

					blockStore.update(rootId, block);
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
					blockStore.update(rootId, block);
					break;

				case 'blockSetAlign':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.align = data.getAlign();
					blockStore.update(rootId, block);
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

					blockStore.update(rootId, block);
					break;

				case 'blockSetLatex':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasText()) {
						block.content.text = data.getText().getValue();
					};

					blockStore.update(rootId, block);
					break;

				case 'blockDataviewViewSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					dbStore.viewAdd(rootId, id, Mapper.From.View(data.getView()));
					break;

				case 'blockDataviewViewDelete':
					id = data.getId();
					subId = dbStore.getSubId(rootId, id);
					viewId = dbStore.getMeta(subId, '').viewId;
					
					const deleteId = data.getViewid();
					dbStore.viewDelete(rootId, id, deleteId);

					if (deleteId == viewId) {
						const views = dbStore.getViews(rootId, id);
						viewId = views.length ? views[views.length - 1].id : '';

						dbStore.metaSet(subId, '', { viewId: viewId });
					};
					break;

				case 'blockDataviewViewOrder':
					id = data.getId();
					dbStore.viewsSort(rootId, id, data.getViewidsList());
					break; 

				case 'blockDataviewSourceSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);

					if (!block || !block.id) {
						break;
					};

					block.content.sources = data.getSourceList();
					blockStore.update(rootId, block);
					break;

				case 'blockDataviewRelationSet':
					id = data.getId();

					const relation = Mapper.From.Relation(data.getRelation());
					const item = dbStore.getRelation(rootId, id, relation.relationKey);

					item ? dbStore.relationUpdate(rootId, id, relation) : dbStore.relationAdd(rootId, id, relation);
					break;

				case 'blockDataviewRelationDelete':
					id = data.getId();
					dbStore.relationDelete(rootId, id, data.getRelationkey());
					break;

				case 'objectDetailsSet':
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);
					details = Decode.decodeStruct(data.getDetails());
					
					// Subscriptions
					if (subIds.length) {
						uniqueSubIds = subIds.map((it: string) => { return it.split('/')[0]; });
						Util.arrayUnique(uniqueSubIds).forEach((subId: string) => {
							detailStore.update(subId, { id: id, details: details }, true);
						});
					} else {
						detailStore.update(rootId, { id: id, details: details }, true);

						if ((id == rootId) && block && (undefined !== details.layout) && (block.layout != details.layout)) {
							blockStore.update(rootId, { id: rootId, layout: details.layout });
						};
					};
					break;

				case 'objectDetailsAmend':
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);

					details = {};
					for (let item of (data.getDetailsList() || [])) {
						details[item.getKey()] = Decode.decodeValue(item.getValue());
					};

					// Subscriptions

					if (subIds.length) {
						uniqueSubIds = subIds.map((it: string) => { return it.split('/')[0]; });
						Util.arrayUnique(uniqueSubIds).forEach((subId: string) => {
							detailStore.update(subId, { id: id, details: details }, false);
						});
					} else {
						detailStore.update(rootId, { id: id, details: details }, false);

						if ((id == rootId) && block) {
							if ((undefined !== details.layout) && (block.layout != details.layout)) {
								blockStore.update(rootId, { id: rootId, layout: details.layout });
							};
	
							blockStore.checkDraft(rootId);
						};
					};
					break;

				case 'objectDetailsUnset':
					id = data.getId();
					subIds = data.getSubidsList() || [];
					keys = data.getKeysList() || [];

					// Subscriptions

					if (subIds.length) {
						uniqueSubIds = subIds.map((it: string) => { return it.split('/')[0]; });
						Util.arrayUnique(uniqueSubIds).forEach((subId: string) => {
							detailStore.delete(subId, id, keys);
						});
					} else {
						detailStore.delete(rootId, id, keys);
						blockStore.checkDraft(rootId);
					};
					break;

				case 'objectRelationsSet':
				case 'objectRelationsAmend':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (type == 'objectRelationsSet') {
						dbStore.relationsClear(rootId, rootId);
					};

					dbStore.relationsSet(rootId, rootId, (data.getRelationsList() || []).map(Mapper.From.Relation));
					break;

				case 'objectRelationsRemove':
					id = data.getId();
					keys = data.getKeysList() || [];

					for (let key of keys) {
						dbStore.relationDelete(rootId, id, key);
					};
					break;

				case 'subscriptionAdd':
					id = data.getId();
					afterId = data.getAfterid();
					subId = data.getSubid();

					this.subscriptionPosition(subId, id, afterId);
					break;

				case 'subscriptionRemove':
					id = data.getId();

					(() => {
						const [ subId, dep ] = data.getSubid().split('/');
						if (!dep) {
							dbStore.recordDelete(subId, '', id);
						};
					})();
					break;

				case 'subscriptionPosition':
					id = data.getId();
					afterId = data.getAfterid();
					subId = data.getSubid();

					this.subscriptionPosition(subId, id, afterId);
					break;

				case 'subscriptionCounters':
					const total = data.getTotal();

					(() => {
						const [ subId, dep ] = data.getSubid().split('/');
						if (!dep) {
							dbStore.metaSet(subId, '', { total: total });
						};
					})();
					break;

				case 'processNew':
				case 'processUpdate':
				case 'processDone':
					const process = data.getProcess();
					const progress = process.getProgress();
					const state = process.getState();
					const pt = process.getType();

					switch (state) {
						case I.ProgressState.Running:
							commonStore.progressSet({
								id: process.getId(),
								status: translate('progress' + pt),
								current: progress.getDone(),
								total: progress.getTotal(),
								isUnlocked: true,
								canCancel: pt != I.ProgressType.Recover,
							});
							break;

						case I.ProgressState.Done:
						case I.ProgressState.Canceled:
							commonStore.progressClear();
							break;
					};
					break;
			};

			if (needLog) {
				log(rootId, type, data, message.getValueCase());
			};
		};
		
		window.clearTimeout(this.timeoutEvent[rootId]);
		this.timeoutEvent[rootId] = window.setTimeout(() => { 
			blockStore.updateNumbers(rootId); 
			blockStore.updateMarkup(rootId);
		}, 10);
	};

	subscriptionPosition (subId: string, id: string, afterId: string) {
		const [ sid, dep ] = subId.split('/');

		if (dep) {
			return;
		};

		let records = dbStore.getRecords(sid, '');
		let oldIndex = records.findIndex((it: any) => { return it.id == id; });
		let newIndex = 0;

		if (afterId) {
			newIndex = records.findIndex((it: any) => { return it.id == afterId; });
		};

		if (oldIndex !== newIndex) {
			dbStore.recordsSet(sid, '', arrayMove(records, oldIndex, newIndex));
		};
	};

	sort (c1: any, c2: any) {
		let idx1 = SORT_IDS.findIndex((it: string) => { return it == this.eventType(c1.getValueCase()); });
		let idx2 = SORT_IDS.findIndex((it: string) => { return it == this.eventType(c2.getValueCase()); });

		if (idx1 > idx2) return 1;
		if (idx1 < idx2) return -1;
		return 0;
	};

	onObjectShow (rootId: string, message: any) {
		let { blocks, details, restrictions } = message;
		let root = blocks.find((it: any) => { return it.id == rootId; });

		if (root && root.fields.analyticsContext) {
			analytics.setContext(root.fields.analyticsContext, root.fields.analyticsOriginalId);
		};

		dbStore.relationsSet(rootId, rootId, message.relations);
		dbStore.objectTypesSet(message.objectTypes);

		detailStore.set(rootId, details);
		blockStore.restrictionsSet(rootId, restrictions);

		let object = detailStore.get(rootId, rootId, []);
		if (root) {
			root.type = I.BlockType.Page;
			root.layout = object.layout;
		};

		const structure: any[] = [];

		blocks = blocks.map((it: any) => {
			if (it.type == I.BlockType.Dataview) {
				dbStore.relationsSet(rootId, it.id, it.content.relations);
				dbStore.viewsSet(rootId, it.id, it.content.views);
			};

			if (it.id == rootId) {
				it.childrenIds.push(Constant.blockId.footer);
				structure.push({ id: Constant.blockId.footer, childrenIds: [] });
			};

			structure.push({ id: it.id, childrenIds: it.childrenIds });
			return new M.Block(it);
		});

		// Footer
		blocks.push(new M.Block({
			id: Constant.blockId.footer,
			parentId: rootId,
			type: I.BlockType.Layout,
			fields: {},
			childrenIds: [],
			content: {
				style: I.LayoutStyle.Footer,
			}
		}));

		// BlockType
		blocks.push(new M.Block({
			id: Constant.blockId.type,
			parentId: Constant.blockId.footer,
			type: I.BlockType.Type,
			fields: {},
			childrenIds: [],
			content: {}
		}));

		blockStore.set(rootId, blocks);
		blockStore.setStructure(rootId, structure);
		blockStore.updateNumbers(rootId); 
		blockStore.updateMarkup(rootId);
		blockStore.checkDraft(rootId);
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const upper = Util.toUpperCamelCase(type);
		const debug = config.debug.mw;

		if (!this.service[type]) {
			console.error('[Dispatcher.request] Service not found: ', type);
			return;
		};

		let t0 = performance.now();
		let t1 = 0;
		let t2 = 0;
		let d = null;

		if (debug && !SKIP_IDS.includes(type)) {
			console.log(`%cRequest.${type}`, 'font-weight: bold; color: blue;');
			d = Util.objectClear(data.toObject());
			console.log(config.debug.js ? JSON.stringify(d, null, 3) : d);
		};

		try {
			this.service[type](data, null, (error: any, response: any) => {
				if (!response) {
					return;
				};

				t1 = performance.now();

				if (error) {
					console.error('Error', error.code, error.description);
					return;
				};

				let message: any = {};
				let err = response.getError();
				let code = err ? err.getCode() : 0;
				let description = err ? err.getDescription() : '';

				if (!code && Response[upper]) {
					message = Response[upper](response);
				};

				message.event = response.getEvent ? response.getEvent() : null;
				message.error = { code: code, description: description };

				if (message.error.code) {
					console.error('Error', type, 'code:', message.error.code, 'description:', message.error.description);
					Sentry.captureMessage(type + ': ' + message.error.description);
					analytics.event('Exception', { method: type, code: message.error.code });
				};

				if (debug && !SKIP_IDS.includes(type)) {
					console.log(`%cCallback.${type}`, 'font-weight: bold; color: green;');
					d = Util.objectClear(response.toObject());
					console.log(config.debug.js ? JSON.stringify(d, null, 3) : d);
				};

				if (message.event) {
					this.event(message.event, true);
				};

				const middleTime = Math.ceil(t1 - t0);
				message.middleTime = middleTime;

				if (callBack) {
					callBack(message);
				};

				t2 = performance.now();
				
				const renderTime = Math.ceil(t2 - t1);
				const totalTime = middleTime + renderTime;

				if (debug && !SKIP_IDS.includes(type)) {
					const times = [
						'Middle time:', middleTime + 'ms',
						'Render time:', renderTime + 'ms',
						'Total time:', totalTime + 'ms',
					];
					console.log(`%cCallback.${type}`, 'font-weight: bold; color: green;', times.join('\t'));
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
