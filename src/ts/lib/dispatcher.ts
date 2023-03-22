import { authStore, commonStore, blockStore, detailStore, dbStore } from 'Store';
import { Util, I, M, Decode, translate, analytics, Response, Mapper, Renderer, Action, Dataview, Preview } from 'Lib';
import { observable } from 'mobx';
import * as Sentry from '@sentry/browser';
import arrayMove from 'array-move';
import Constant from 'json/constant.json';

const Service = require('lib/pb/protos/service/service_grpc_web_pb');
const Commands = require('lib/pb/protos/commands_pb');
const Events = require('lib/pb/protos/events_pb');

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
const SKIP_IDS = [];
const SKIP_SENTRY_ERRORS = [ 'LinkPreview' ];

class Dispatcher {

	service: any = null;
	stream: any = null;
	timeoutStream = 0;
	timeoutEvent: any = {};
	reconnects = 0;

	init (address: string) {
		this.service = new Service.ClientCommandsClient(address, null, null);
		this.listenEvents();

		console.log('[Dispatcher].init Server address: ', address);
	};

	listenEvents () {
		if (!authStore.token) {
			return;
		};

		const request = new Commands.StreamRequest();
		request.setToken(authStore.token);

		this.stream = this.service.listenSessionEvents(request, null);

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
			if (this.reconnects == 20) {
				t = 5000;
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
		const V = Events.Event.Message.ValueCase;

		let t = '';
		if (v == V.ACCOUNTSHOW)					 t = 'accountShow';
		if (v == V.ACCOUNTDETAILS)				 t = 'accountDetails';
		if (v == V.ACCOUNTUPDATE)				 t = 'accountUpdate';
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
		if (v == V.BLOCKSETVERTICALALIGN)		 t = 'blockSetVerticalAlign';
		if (v == V.BLOCKSETDIV)					 t = 'blockSetDiv';
		if (v == V.BLOCKSETRELATION)			 t = 'blockSetRelation';
		if (v == V.BLOCKSETLATEX)				 t = 'blockSetLatex';
		if (v == V.BLOCKSETTABLEROW)			 t = 'blockSetTableRow';

		if (v == V.BLOCKDATAVIEWVIEWSET)		 t = 'blockDataviewViewSet';
		if (v == V.BLOCKDATAVIEWVIEWUPDATE)		 t = 'blockDataviewViewUpdate';
		if (v == V.BLOCKDATAVIEWVIEWDELETE)		 t = 'blockDataviewViewDelete';
		if (v == V.BLOCKDATAVIEWVIEWORDER)		 t = 'blockDataviewViewOrder';

		if (v == V.BLOCKDATAVIEWSOURCESET)		 t = 'blockDataviewSourceSet';
		if (v == V.BLOCKDATAVIEWTARGETOBJECTIDSET)	 t = 'blockDataviewTargetObjectIdSet';

		if (v == V.BLOCKDATAVIEWRELATIONSET)	 t = 'blockDataviewRelationSet';
		if (v == V.BLOCKDATAVIEWRELATIONDELETE)	 t = 'blockDataviewRelationDelete';
		if (v == V.BLOCKDATAVIEWGROUPORDERUPDATE)	 t = 'blockDataviewGroupOrderUpdate';
		if (v == V.BLOCKDATAVIEWOBJECTORDERUPDATE)	 t = 'blockDataviewObjectOrderUpdate';

		if (v == V.BLOCKSETWIDGET)	 		t = 'blockSetWidget';

		if (v == V.SUBSCRIPTIONADD)				 t = 'subscriptionAdd';
		if (v == V.SUBSCRIPTIONREMOVE)			 t = 'subscriptionRemove';
		if (v == V.SUBSCRIPTIONPOSITION)		 t = 'subscriptionPosition';
		if (v == V.SUBSCRIPTIONCOUNTERS)		 t = 'subscriptionCounters';
		if (v == V.SUBSCRIPTIONGROUPS)			 t = 'subscriptionGroups';

		if (v == V.PROCESSNEW)					 t = 'processNew';
		if (v == V.PROCESSUPDATE)				 t = 'processUpdate';
		if (v == V.PROCESSDONE)					 t = 'processDone';

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
		let id = '';
		let block: any = null;
		let details: any = null;
		let viewId = '';
		let keys: string[] = [];
		let ids: string[] = [];
		let subIds: string[] = [];
		let uniqueSubIds: string[] = [];
		let subId = '';
		let afterId = '';
		let content: any = {};

		messages.sort((c1: any, c2: any) => { return this.sort(c1, c2); });

		for (const message of messages) {
			const type = this.eventType(message.getValueCase());
			const fn = 'get' + Util.ucFirst(type);
			const data = message[fn] ? message[fn]() : {};
			const needLog = (debugThread && (type == 'threadStatus')) || (debugCommon && (type != 'threadStatus'));

			switch (type) {

				case 'accountShow': {
					authStore.accountAdd(Mapper.From.Account(data.getAccount()));
					break;
				};

				case 'accountUpdate': {
					authStore.accountSet({ status: Mapper.From.AccountStatus(data.getStatus()) });
					commonStore.configSet(Mapper.From.AccountConfig(data.getConfig()), true);

					Renderer.send('setConfig', Util.objectCopy(commonStore.config));
					break;	
				};

				case 'accountConfigUpdate': {
					commonStore.configSet(Mapper.From.AccountConfig(data.getConfig()), true);
					break;
				};

				case 'threadStatus': {
					authStore.threadSet(rootId, {
						summary: Mapper.From.ThreadSummary(data.getSummary()),
						cafe: Mapper.From.ThreadCafe(data.getCafe()),
						accounts: (data.getAccountsList() || []).map(Mapper.From.ThreadAccount),
					});
					break;
				};

				case 'objectRemove': {
					ids = data.getIdsList();
					break;
				};

				case 'objectRelationsAmend': {
					id = data.getId();
					dbStore.relationsSet(rootId, id, (data.getRelationlinksList() || []).map(Mapper.From.RelationLink));
					break;
				};

				case 'objectRelationsRemove': {
					id = data.getId();
					dbStore.relationListDelete(rootId, id, data.getRelationkeysList() || []);
					break;
				};

				case 'blockAdd': {
					blocks = data.getBlocksList() || [];
					for (let block of blocks) {
						block = Mapper.From.Block(block);

						if (block.type == I.BlockType.Dataview) {
							dbStore.relationsSet(rootId, block.id, block.content.relationLinks);
							dbStore.viewsSet(rootId, block.id, block.content.views);
						};

						blockStore.add(rootId, new M.Block(block));
						blockStore.updateStructure(rootId, block.id, block.childrenIds);
					};
					break;
				};

				case 'blockDelete': {
					const blockIds = data.getBlockidsList() || [];
					
					for (const blockId of blockIds) {
						const block = blockStore.getLeaf(rootId, blockId);
						if (!block) {
							continue;
						};

						if (block.type == I.BlockType.Dataview) {
							Action.dbClearBlock(rootId, blockId);
						};

						blockStore.delete(rootId, blockId);
					};
					break;
				};

				case 'blockSetChildrenIds': {
					id = data.getId();

					blockStore.updateStructure(rootId, id, data.getChildrenidsList());

					if (id == rootId) {
						blockStore.checkTypeSelect(rootId);
					};
					break;
				};

				case 'blockSetFields': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { fields: data.hasFields() ? Decode.decodeStruct(data.getFields()) : {} });
					break;
				};

				case 'blockSetLink': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasCardstyle()) {
						block.content.cardStyle = data.getCardstyle().getValue();
					};

					if (data.hasIconsize()) {
						block.content.iconSize = data.getIconsize().getValue();
					};

					if (data.hasDescription()) {
						block.content.description = data.getDescription().getValue();
					};

					if (data.hasRelations()) {
						block.content.relations = data.getRelations().getValueList() || [];
					};

					if (data.hasFields()) {
						block.content.fields = Decode.decodeStruct(data.getFields());
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetText': {
					id = data.getId();
					content = {};

					if (data.hasText()) {
						content.text = data.getText().getValue();
					};

					if (data.hasMarks()) {
						content.marks = (data.getMarks().getValue().getMarksList() || []).map(Mapper.From.Mark);
					};

					if (data.hasStyle()) {
						content.style = data.getStyle().getValue();
					};

					if (data.hasChecked()) {
						content.checked = data.getChecked().getValue();
					};

					if (data.hasColor()) {
						content.color = data.getColor().getValue();
					};

					if (data.hasIconemoji()) {
						content.iconEmoji = data.getIconemoji().getValue();
					};

					if (data.hasIconimage()) {
						content.iconImage = data.getIconimage().getValue();
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'blockSetDiv': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasStyle()) {
						block.content.style = data.getStyle().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockDataviewTargetObjectIdSet': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.content.targetObjectId = data.getTargetobjectid();
					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetFile': {
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

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetBookmark': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasTargetobjectid()) {
						block.content.targetObjectId = data.getTargetobjectid().getValue();
					};

					if (data.hasState()) {
						block.content.state = data.getState().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetBackgroundColor': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { bgColor: data.getBackgroundcolor() });
					break;
				};

				case 'blockSetAlign': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { hAlign: data.getAlign() });
					break;
				};

				case 'blockSetVerticalAlign': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { vAlign: data.getVerticalalign() });
					break;
				};

				case 'blockSetRelation': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasKey()) {
						block.content.key = data.getKey().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetLatex': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasText()) {
						block.content.text = data.getText().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetTableRow': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasIsheader()) {
						block.content.isHeader = data.getIsheader().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockDataviewViewSet': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					dbStore.viewAdd(rootId, id, Mapper.From.View(data.getView()));
					break;
				};

				case 'blockDataviewViewUpdate': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					viewId = data.getViewid();

					let view = dbStore.getView(rootId, id, viewId);
					let updateData = false;

					if (data.hasFields()) {
						const fields = Mapper.From.ViewFields(data.getFields());
						const updateKeys = [ 'type', 'groupRelationKey', 'pageLimit' ];

						for (let f of updateKeys) {
							if (fields[f] != view[f]) {
								updateData = true;
								break;
							};
						};

						view = Object.assign(view, fields);
					};

					const keys = [ 
						{ id: 'filter', field: 'filters', idField: 'id', mapper: 'Filter' },
						{ id: 'sort', field: 'sorts', idField: 'id', mapper: 'Sort' },
						{ id: 'relation', field: 'relations', idField: 'relationKey', mapper: 'ViewRelation' },
					];

					keys.forEach(key => {
						const items = data[Util.toCamelCase(`get-${key.id}-list`)]() || [];
						const mapper = Mapper.From[key.mapper];

						items.forEach((item: any) => {
							let list = view[key.field];

							if (item.hasAdd()) {
								const op = item.getAdd();
								const afterId = op.getAfterid();
								const items = (op.getItemsList() || []).map(mapper);
								const idx = afterId ? list.findIndex(it => it[key.idField] == afterId) + 1 : list.length;

								items.forEach((item: any, i: number) => { 
									list.splice(idx + i, 0, item);
								});

								if ([ 'filter', 'sort', 'relation' ].includes(key.id)) {
									updateData = true;
								};
							};

							if (item.hasMove()) {
								const op = item.getMove();
								const afterId = op.getAfterid();
								const ids = op.getIdsList() || [];
								const idx = afterId ? list.findIndex(it => it[key.idField] == afterId) + 1 : 0;

								ids.forEach((id: string, i: number) => {
									const oidx = list.findIndex(it => it[key.idField] == id);
									if (oidx >= 0) {
										list = arrayMove(list, oidx, idx + i);
									};
								});

								if ([ 'sort' ].includes(key.id)) {
									updateData = true;
								};
							};

							if (item.hasUpdate()) {
								const op = item.getUpdate();

								if (op.hasItem()) {
									const idx = list.findIndex(it => it[key.idField] == op.getId());
									const item = Mapper.From[key.mapper](op.getItem());

									if ([ 'filter', 'sort' ].includes(key.id)) {
										updateData = true;
									};

									if (idx >= 0) {
										if (key.id == 'relation') {
											const updateKeys = [ 'includeTime' ];

											for (let f of updateKeys) {
												if (list[idx][f] != item[f]) {
													updateData = true;
													break;
												};
											};
										};

										list[idx] = item;
									};
								};
							};

							if (item.hasRemove()) {
								const op = item.getRemove();
								const ids = op.getIdsList() || [];

								ids.forEach(id => { 
									list = list.filter(it => it[key.idField] != id);
								});

								if ([ 'filter', 'sort' ].includes(key.id)) {
									updateData = true;
								};
							};

							view[key.field] = list;
						});
					});

					dbStore.viewUpdate(rootId, id, view);

					if (updateData) {
						$(window).trigger(`updateDataviewData.${id}`);
					};
					break;
				};

				case 'blockDataviewViewDelete': {
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
				};

				case 'blockDataviewViewOrder': {
					id = data.getId();
					dbStore.viewsSort(rootId, id, data.getViewidsList());
					break; 
				};

				case 'blockDataviewSourceSet': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					block.content.sources = data.getSourceList();
					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockDataviewRelationDelete': {
					id = data.getId();
					dbStore.relationListDelete(rootId, id, data.getRelationkeysList() || []);
					break;
				};

				case 'blockDataviewRelationSet': {
					id = data.getId();
					dbStore.relationsSet(rootId, id, (data.getRelationlinksList() || []).map(Mapper.From.RelationLink));
					break;
				};

				case 'blockDataviewGroupOrderUpdate': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);

					if (!block || !data.hasGrouporder()) {
						break;
					};

					const order = Mapper.From.GroupOrder(data.getGrouporder());

					Dataview.groupUpdate(rootId, id, order.viewId, order.groups);
					break;
				};

				case 'blockDataviewObjectOrderUpdate': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					viewId = data.getViewid();
					
					const groupId = data.getGroupid();
					const changes = data.getSlicechangesList() || [];
					const cb = it => (it.viewId == viewId) && (it.groupId == groupId);
					const index = block.content.objectOrder.findIndex(cb);

					let el = block.content.objectOrder.find(cb);
					if (!el) {
						el = { viewId, groupId, objectIds: observable.array([]) };
						block.content.objectOrder.push(el);
					};

					changes.forEach((it: any) => {
						const op = it.getOp();
						const ids = it.getIdsList() || [];
						const afterId = it.getAfterid();
						const idx = afterId ? el.objectIds.indexOf(afterId) + 1 : 0;

						switch (op) {
							case I.SliceOperation.Add:
								ids.forEach((id: string, i: number) => {
									idx >= 0 ? el.objectIds.splice(idx + i, 0, id) : el.objectIds.unshift(id);
								});
								break;

							case I.SliceOperation.Move:
								if (idx >= 0) {
									ids.forEach((id: string, i: number) => {
										const oidx = el.objectIds.indexOf(id);
										if (oidx >= 0) {
											el.objectIds = arrayMove(el.objectIds, oidx, idx + i);
										};
									});
								};
								break;

							case I.SliceOperation.Remove:
								el.objectIds = el.objectIds.filter(id => !ids.includes(id));
								break;

							case I.SliceOperation.Replace:
								el.objectIds = ids;
								break;
						};
					});

					block.content.objectOrder[index] = el;
					blockStore.updateContent(rootId, id, { objectOrder: block.content.objectOrder });
					break;
				};

				case 'objectDetailsSet': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);
					details = Decode.decodeStruct(data.getDetails());

					// Subscriptions
					if (subIds.length) {
						uniqueSubIds = subIds.map(it => it.split('/')[0]);
						Util.arrayUnique(uniqueSubIds).forEach(subId => detailStore.update(subId, { id, details }, true));
					} else {
						detailStore.update(rootId, { id, details }, true);

						if ((id == rootId) && block && (undefined !== details.layout) && (block.layout != details.layout)) {
							blockStore.update(rootId, rootId, { layout: details.layout });
						};
					};
					break;
				};

				case 'objectDetailsAmend': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);

					details = {};
					for (const item of (data.getDetailsList() || [])) {
						details[item.getKey()] = Decode.decodeValue(item.getValue());
					};

					// Subscriptions

					if (subIds.length) {
						uniqueSubIds = subIds.map(it => it.split('/')[0]);
						Util.arrayUnique(uniqueSubIds).forEach(subId => detailStore.update(subId, { id, details }, false));
					} else {
						detailStore.update(rootId, { id, details }, false);

						if ((id == rootId) && block) {
							if ((undefined !== details.layout) && (block.layout != details.layout)) {
								blockStore.update(rootId, rootId, { layout: details.layout });
							};
	
							blockStore.checkTypeSelect(rootId);
						};
					};
					break;
				};

				case 'objectDetailsUnset': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					keys = data.getKeysList() || [];

					// Subscriptions

					if (subIds.length) {
						uniqueSubIds = subIds.map(it => it.split('/')[0]);
						Util.arrayUnique(uniqueSubIds).forEach(subId => detailStore.delete(subId, id, keys));
					} else {
						detailStore.delete(rootId, id, keys);
						blockStore.checkTypeSelect(rootId);
					};
					break;
				};

				case 'subscriptionAdd': {
					id = data.getId();
					afterId = data.getAfterid();
					subId = data.getSubid();

					this.subscriptionPosition(subId, id, afterId, true);
					break;
				};

				case 'subscriptionRemove': {
					id = data.getId();
					const [ subId, dep ] = data.getSubid().split('/');

					if (!dep) {
						dbStore.recordDelete(subId, '', id);
						detailStore.delete(subId, id);
					};
					break;
				};

				case 'subscriptionPosition': {
					id = data.getId();
					afterId = data.getAfterid();
					subId = data.getSubid();

					this.subscriptionPosition(subId, id, afterId, false);
					break;
				};

				case 'subscriptionCounters': {
					const total = data.getTotal();
					const [ subId, dep ] = data.getSubid().split('/');
					
					if (!dep) {
						dbStore.metaSet(subId, '', { total: total });
					};
					break;
				};

				case 'subscriptionGroups': {
					const [ rid, bid, key ] = data.getSubid().split('-');
					const group = Mapper.From.BoardGroup(data.getGroup());

					if (data.getRemove()) {
						dbStore.groupsRemove(rid, bid, [ group.id ]);
					} else {
						dbStore.groupsAdd(rid, bid, [ group ]);
					};
					break;
				};

				case 'processNew':
				case 'processUpdate':
				case 'processDone': {
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

							let toast = '';
							switch (pt) {
								case I.ProgressType.Import: { toast = 'Import finished'; break; };
								case I.ProgressType.Export: { toast = 'Export finished'; break; };
							};

							if (toast) {
								Preview.toastShow({ text: toast });
							};
							break;
					};
					break;
				};
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

	subscriptionPosition (subId: string, id: string, afterId: string, isAdding: boolean): void {
		const [ sid, dep ] = subId.split('/');

		if (dep) {
			return;
		};

		const records = dbStore.getRecords(sid, '');
		const newIndex = afterId ? records.indexOf(afterId) + 1 : 0;

		let oldIndex = records.indexOf(id);

		if (isAdding && (oldIndex >= 0)) {
			return;
		};

		if (oldIndex < 0) {
			records.push(id);
			oldIndex = records.indexOf(id);
		};

		if (oldIndex !== newIndex) {
			dbStore.recordsSet(sid, '', arrayMove(records, oldIndex, newIndex));
		};
	};

	sort (c1: any, c2: any) {
		const idx1 = SORT_IDS.findIndex(it => it == this.eventType(c1.getValueCase()));
		const idx2 = SORT_IDS.findIndex(it => it == this.eventType(c2.getValueCase()));

		if (idx1 > idx2) return 1;
		if (idx1 < idx2) return -1;
		return 0;
	};

	onObjectView (rootId: string, traceId: string, objectView: any) {
		const { details, restrictions, relationLinks } = objectView;
		const root = objectView.blocks.find(it => it.id == rootId);
		const structure: any[] = [];
		const contextId = [ rootId, traceId ].filter(it => it).join('-');

		if (root && root.fields.analyticsContext) {
			analytics.setContext(root.fields.analyticsContext, root.fields.analyticsOriginalId);
		} else {
			analytics.removeContext();
		};

		dbStore.relationsSet(contextId, rootId, relationLinks);
		detailStore.set(contextId, details);
		blockStore.restrictionsSet(contextId, restrictions);

		const object = detailStore.get(contextId, rootId, []);

		if (root) {
			root.type = I.BlockType.Page;
			root.layout = object.layout;
		};

		const blocks = objectView.blocks.map((it: any) => {
			if (it.type == I.BlockType.Dataview) {
				dbStore.relationsSet(contextId, it.id, it.content.relationLinks);
				dbStore.viewsSet(contextId, it.id, it.content.views);
			};

			structure.push({ id: it.id, childrenIds: it.childrenIds });
			return new M.Block(it);
		});

		// BlockType
		blocks.push(new M.Block({
			id: Constant.blockId.type,
			parentId: Constant.blockId.header,
			type: I.BlockType.Type,
			fields: {},
			childrenIds: [],
			content: {}
		}));

		blockStore.set(contextId, blocks);
		blockStore.setStructure(contextId, structure);
		blockStore.updateNumbers(contextId); 
		blockStore.updateMarkup(contextId);
		blockStore.checkTypeSelect(contextId);
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const debug = config.debug.mw;
		const ct = Util.toCamelCase(type);

		if (!this.service[ct]) {
			console.error('[Dispatcher.request] Service not found: ', type);
			return;
		};

		const t0 = performance.now();
		let t1 = 0;
		let t2 = 0;
		let d = null;

		if (debug && !SKIP_IDS.includes(type)) {
			console.log(`%cRequest.${type}`, 'font-weight: bold; color: blue;');
			d = Util.objectClear(data.toObject());
			console.log(config.debug.js ? JSON.stringify(d, null, 3) : d);
		};

		try {
			this.service[ct](data, { token: authStore.token }, (error: any, response: any) => {
				if (!response) {
					return;
				};

				t1 = performance.now();

				if (error) {
					console.error('Error', error.code, error.description);
					return;
				};

				const err = response.getError();
				const code = err ? err.getCode() : 0;
				const description = err ? err.getDescription() : '';

				let message: any = {};
				if (!code && Response[type]) {
					message = Response[type](response);
				};

				message.event = response.getEvent ? response.getEvent() : null;
				message.error = { code: code, description: description };

				if (message.error.code) {
					console.error('Error', type, 'code:', message.error.code, 'description:', message.error.description);

					if (!SKIP_SENTRY_ERRORS.includes(type)) {
						Sentry.captureMessage(`${type}: code: ${code} msg: ${message.error.description}`);
						analytics.event('Exception', { method: type, code: message.error.code });
					};
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
						'Middle:', middleTime + 'ms',
						'Render:', renderTime + 'ms',
						'Total:', totalTime + 'ms',
					];
					console.log(`%cTimes.${type}`, 'font-weight: bold; color: darkgreen;', times.join('\t'));
				};
			});
		} catch (err) {
			console.error(err);
		};
	};

};

 export const dispatcher = new Dispatcher();
