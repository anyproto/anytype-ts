import * as Sentry from '@sentry/browser';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observable, set } from 'mobx';
import Commands from 'dist/lib/pb/protos/commands_pb';
import Events from 'dist/lib/pb/protos/events_pb';
import Service from 'dist/lib/pb/protos/service/service_grpc_web_pb';
import { authStore, commonStore, blockStore, detailStore, dbStore, notificationStore } from 'Store';
import { 
	UtilCommon, UtilObject, I, M, translate, analytics, Renderer, Action, Dataview, Preview, Mapper, Decode, UtilRouter, Storage, UtilSpace, UtilData 
} from 'Lib';
import * as Response from './response';
import { ClientReadableStream } from 'grpc-web';
const Constant = require('json/constant.json');

const SORT_IDS = [ 
	'blockAdd', 
	'blockDelete', 
	'blockSetChildrenIds', 
	'objectDetailsSet', 
	'objectDetailsAmend', 
	'objectDetailsUnset', 
	'subscriptionCounters',
	'blockDataviewViewSet',
	'blockDataviewViewDelete',
];
const SKIP_IDS = [ 'BlockSetCarriage' ];
const SKIP_SENTRY_ERRORS = [ 'LinkPreview', 'BlockTextSetText', 'FileSpaceUsage', 'SpaceInviteGetCurrent' ];

class Dispatcher {

	service: Service.ClientCommandsClient = null;
	stream: ClientReadableStream<Events.Event> = null;
	timeoutStream = 0;
	timeoutEvent: any = {};
	reconnects = 0;

	init (address: string) {
		this.service = new Service.ClientCommandsClient(address, null, null);
	};

	listenEvents () {
		if (!authStore.token) {
			return;
		};

		window.clearTimeout(this.timeoutStream);

		const request = new Commands.StreamRequest();
		request.setToken(authStore.token);

		this.stream = this.service.listenSessionEvents(request, null);

		this.stream.on('data', (event) => {
			try {
				this.event(event, false);
			} catch (e) {
				console.error(e);
			};
		});

		this.stream.on('status', (status) => {
			if (status.code) {
				console.error('[Dispatcher.stream] Restarting', status);
				this.reconnect();
			};
		});

		this.stream.on('end', () => {
			console.error('[Dispatcher.stream] end, restarting');
			this.reconnect();
		});
	};

	reconnect () {
		let t = 3;
		if (this.reconnects == 20) {
			t = 5;
		};
		if (this.reconnects == 40) {
			t = 60;
			this.reconnects = 0;
		};

		window.clearTimeout(this.timeoutStream);
		this.timeoutStream = window.setTimeout(() => { 
			this.listenEvents(); 
			this.reconnects++;
		}, t * 1000);
	};

	eventType (v: number): string {
		const V = Events.Event.Message.ValueCase;

		let t = '';
		if (v == V.ACCOUNTSHOW)					 t = 'accountShow';
		if (v == V.ACCOUNTDETAILS)				 t = 'accountDetails';
		if (v == V.ACCOUNTUPDATE)				 t = 'accountUpdate';
		if (v == V.ACCOUNTCONFIGUPDATE)			 t = 'accountConfigUpdate';
		if (v == V.ACCOUNTLINKCHALLENGE)		 t = 'accountLinkChallenge';

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

		if (v == V.BLOCKDATAVIEWTARGETOBJECTIDSET)	 t = 'blockDataviewTargetObjectIdSet';
		if (v == V.BLOCKDATAVIEWISCOLLECTIONSET)	 t = 'blockDataviewIsCollectionSet';

		if (v == V.BLOCKDATAVIEWRELATIONSET)	 t = 'blockDataviewRelationSet';
		if (v == V.BLOCKDATAVIEWRELATIONDELETE)	 t = 'blockDataviewRelationDelete';
		if (v == V.BLOCKDATAVIEWGROUPORDERUPDATE)	 t = 'blockDataviewGroupOrderUpdate';
		if (v == V.BLOCKDATAVIEWOBJECTORDERUPDATE)	 t = 'blockDataviewObjectOrderUpdate';

		if (v == V.BLOCKSETWIDGET)				 t = 'blockSetWidget';

		if (v == V.SUBSCRIPTIONADD)				 t = 'subscriptionAdd';
		if (v == V.SUBSCRIPTIONREMOVE)			 t = 'subscriptionRemove';
		if (v == V.SUBSCRIPTIONPOSITION)		 t = 'subscriptionPosition';
		if (v == V.SUBSCRIPTIONCOUNTERS)		 t = 'subscriptionCounters';
		if (v == V.SUBSCRIPTIONGROUPS)			 t = 'subscriptionGroups';

		if (v == V.PROCESSNEW)					 t = 'processNew';
		if (v == V.PROCESSUPDATE)				 t = 'processUpdate';
		if (v == V.PROCESSDONE)					 t = 'processDone';

		if (v == V.OBJECTREMOVE)				 t = 'objectRemove';
		if (v == V.OBJECTDETAILSSET)			 t = 'objectDetailsSet';
		if (v == V.OBJECTDETAILSAMEND)			 t = 'objectDetailsAmend';
		if (v == V.OBJECTDETAILSUNSET)			 t = 'objectDetailsUnset';
		if (v == V.OBJECTRELATIONSAMEND)		 t = 'objectRelationsAmend';
		if (v == V.OBJECTRELATIONSREMOVE)		 t = 'objectRelationsRemove';
		if (v == V.OBJECTRESTRICTIONSSET)		 t = 'objectRestrictionsSet';

		if (v == V.FILESPACEUSAGE)				 t = 'fileSpaceUsage';
		if (v == V.FILELOCALUSAGE)				 t = 'fileLocalUsage';
		if (v == V.FILELIMITREACHED)			 t = 'fileLimitReached';
		if (v == V.FILELIMITUPDATED)			 t = 'fileLimitUpdated';

		if (v == V.NOTIFICATIONSEND)			 t = 'notificationSend';
		if (v == V.NOTIFICATIONUPDATE)			 t = 'notificationUpdate';
		if (v == V.PAYLOADBROADCAST)			 t = 'payloadBroadcast';
		
		if (v == V.MEMBERSHIPUPDATE)			 t = 'membershipUpdate';

		return t;
	};

	event (event: Events.Event, skipDebug?: boolean) {
		const { config } = commonStore;
		const traceId = event.getTraceid();
		const ctx: string[] = [ event.getContextid() ];
		const electron = UtilCommon.getElectron();
		const currentWindow = electron.currentWindow();
		const { windowId } = currentWindow;
		const isMainWindow = windowId === 1;
		const debugEvent = config.flagsMw.event;
		const debugJson = config.flagsMw.json;
		
		if (traceId) {
			ctx.push(traceId);
		};

		const rootId = ctx.join('-');
		const messages = event.getMessagesList() || [];
		const log = (rootId: string, type: string, data: any, valueCase: any) => { 
			if (!debugEvent) {
				return;
			};

			console.log(`%cEvent.${type}`, 'font-weight: bold; color: #ad139b;', rootId);
			if (!type) {
				console.error('Event not found for valueCase', valueCase);
			};

			if (data && data.toObject) {
				const d = UtilCommon.objectClear(data.toObject());
				console.log(debugJson ? JSON.stringify(d, null, 3) : d); 
			};
		};

		let blocks: any[] = [];
		let id = '';
		let block: any = null;
		let details: any = null;
		let viewId = '';
		let keys: string[] = [];
		let subIds: string[] = [];
		let subId = '';
		let afterId = '';
		let content: any = {};
		let updateParents = false;

		messages.sort((c1: any, c2: any) => this.sort(c1, c2));

		for (const message of messages) {
			const win = $(window);
			const type = this.eventType(message.getValueCase());
			const fn = `get${UtilCommon.ucFirst(type)}`;
			const data = message[fn] ? message[fn]() : {};
			const needLog = this.checkLog(type) && !skipDebug;

			switch (type) {

				case 'accountShow': {
					authStore.accountAdd(Mapper.From.Account(data.getAccount()));
					break;
				};

				case 'accountUpdate': {
					authStore.accountSetStatus(Mapper.From.AccountStatus(data.getStatus()));
					break;	
				};

				case 'accountConfigUpdate': {
					commonStore.configSet(Mapper.From.AccountConfig(data.getConfig()), true);
					Renderer.send('setConfig', UtilCommon.objectCopy(commonStore.config));
					break;
				};

				case 'accountLinkChallenge': {
					if (!isMainWindow) {
						break;
					};

					Renderer.send('showChallenge', {
						challenge: data.getChallenge(),
						theme: commonStore.getThemeClass(),
						lang: commonStore.interfaceLang,
					});
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

				case 'objectRestrictionsSet': {
					blockStore.restrictionsSet(rootId, Mapper.From.Restrictions(data.getRestrictions()));
					break;
				};

				case 'fileSpaceUsage': {
					const spaceId = data.getSpaceid();
					const { spaces } = commonStore.spaceStorage;
					const space = spaces.find(it => it.spaceId == spaceId);
					const bytesUsage = data.getBytesusage();

					if (space) {
						set(space, { bytesUsage });
					} else {
						spaces.push({ spaceId, bytesUsage });
					};
					break;
				};

				case 'fileLocalUsage': {
					commonStore.spaceStorageSet({ localUsage: data.getLocalbytesusage() });
					break;
				};

				case 'fileLimitReached': {
					const { bytesLimit, localUsage, spaces } = commonStore.spaceStorage;
					const bytesUsed = spaces.reduce((res, current) => res += current.bytesUsage, 0);
					const percentageUsed = Math.floor(UtilCommon.getPercent(bytesUsed, bytesLimit));

					if (percentageUsed >= 99) {
						Preview.toastShow({ action: I.ToastAction.StorageFull });
					} else
					if (localUsage > bytesLimit) {
						Preview.toastShow({ text: 'Your local storage exceeds syncing limit. Locally stored files won\'t be synced' });
					};
					break;
				};

				case 'fileLimitUpdated': {
					commonStore.spaceStorageSet({ bytesLimit: data.getByteslimit() });
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

					updateParents = true;
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

					updateParents = true;
					break;
				};

				case 'blockSetChildrenIds': {
					id = data.getId();

					blockStore.updateStructure(rootId, id, data.getChildrenidsList());

					if (id == rootId) {
						blockStore.checkTypeSelect(rootId);
					};

					updateParents = true;
					break;
				};

				case 'blockSetFields': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { fields: data.hasFields() ? Decode.struct(data.getFields()) : {} });
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

					if (data.hasTargetblockid()) {
						block.content.targetblockId = data.getTargetblockid().getValue();
					};

					if (data.hasRelations()) {
						block.content.relations = data.getRelations().getValueList() || [];
					};

					if (data.hasTargetblockid()) {
						block.content.targetBlockId = data.getTargetblockid().getValue();
					};

					if (data.hasFields()) {
						block.content.fields = Decode.struct(data.getFields());
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

				case 'blockDataviewIsCollectionSet':
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					block.content.isCollection = data.getValue();
					blockStore.updateContent(rootId, id, block.content);
					break;

				case 'blockSetWidget': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasLayout()) {
						block.content.layout = data.getLayout().getValue();
					};

					if (data.hasLimit()) {
						block.content.limit = data.getLimit().getValue();
					};

					if (data.hasViewid()) {
						block.content.viewId = data.getViewid().getValue();
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'blockSetFile': {
					id = data.getId();
					block = blockStore.getLeaf(rootId, id);
					if (!block) {
						break;
					};

					if (data.hasTargetobjectid()) {
						block.content.targetObjectId = data.getTargetobjectid().getValue();
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
					blockStore.updateWidgetViews(rootId);
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

						for (const f of updateKeys) {
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
						const items = data[UtilCommon.toCamelCase(`get-${key.id}-list`)]() || [];
						const mapper = Mapper.From[key.mapper];

						items.forEach(item => {
							let list = view[key.field];

							if (item.hasAdd()) {
								const op = item.getAdd();
								const afterId = op.getAfterid();
								const items = (op.getItemsList() || []).map(mapper);
								const idx = afterId ? list.findIndex(it => it[key.idField] == afterId) + 1 : list.length;

								items.forEach((it, i) => { 
									list.splice(idx + i, 0, it);
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

											for (const f of updateKeys) {
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
					blockStore.updateWidgetViews(rootId);

					if (updateData) {
						win.trigger(`updateDataviewData.${id}`);
						blockStore.updateWidgetData(rootId);
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

					blockStore.updateWidgetViews(rootId);
					break;
				};

				case 'blockDataviewViewOrder': {
					id = data.getId();

					dbStore.viewsSort(rootId, id, data.getViewidsList());
					blockStore.updateWidgetViews(rootId);
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

					Dataview.groupOrderUpdate(rootId, id, order.viewId, order.groups);
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

					changes.forEach(it => {
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
					blockStore.updateWidgetData(rootId);
					break;
				};

				case 'objectDetailsSet': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);
					details = Decode.struct(data.getDetails());

					this.detailsUpdate(details, rootId, id, subIds, true);
					break;
				};

				case 'objectDetailsAmend': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					block = blockStore.getLeaf(rootId, id);

					details = {};
					for (const item of (data.getDetailsList() || [])) {
						details[item.getKey()] = Decode.value(item.getValue());
					};

					this.detailsUpdate(details, rootId, id, subIds, false);
					break;
				};

				case 'objectDetailsUnset': {
					id = data.getId();
					subIds = data.getSubidsList() || [];
					keys = data.getKeysList() || [];

					// Subscriptions
					this.getUniqueSubIds(subIds).forEach(subId => detailStore.delete(subId, id, keys));

					detailStore.delete(rootId, id, keys);
					blockStore.checkTypeSelect(rootId);
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
					const [ rid, bid ] = data.getSubid().split('-');
					const group = Mapper.From.BoardGroup(data.getGroup());

					if (data.getRemove()) {
						dbStore.groupsRemove(rid, bid, [ group.id ]);
					} else {
						dbStore.groupsAdd(rid, bid, [ group ]);
					};
					break;
				};

				case 'notificationSend': {
					const item = new M.Notification(Mapper.From.Notification(data.getNotification()));

					notificationStore.add(item);

					if (isMainWindow && !electron.isFocused()) {
						new window.Notification(UtilCommon.stripTags(item.title), { body: UtilCommon.stripTags(item.text) }).onclick = () => electron.focus();
					};
					break;
				};

				case 'notificationUpdate': {
					notificationStore.update(Mapper.From.Notification(data.getNotification()));
					break;
				};

				case 'payloadBroadcast': {
					if (!isMainWindow) {
						break;
					};

					let payload: any = {};
					try { payload = JSON.parse(data.getPayload()); } catch (e) { /**/ };

					switch (payload.type) {
						case 'openObject': {
							const { object } = payload;

							UtilObject.openAuto(object);
							window.focus();

							if (electron.focus) {
								electron.focus();
							};

							analytics.createObject(object.type, object.layout, analytics.route.webclipper, 0);
							break;
						};
					};
					break;
				};

				case 'membershipUpdate':
					authStore.membershipUpdate(Mapper.From.Membership(data.getData()));
					UtilData.getMembershipTiers(true);
					break;

				case 'processNew':
				case 'processUpdate':
				case 'processDone': {
					const process = data.getProcess();
					const progress = process.getProgress();
					const state = process.getState();
					const type = process.getType();

					switch (state) {
						case I.ProgressState.Running: {
							let canCancel = true;
							let isUnlocked = true;

							if ([ I.ProgressType.Recover, I.ProgressType.Migration ].includes(type)) {
								canCancel = false;
								isUnlocked = false;
							};

							commonStore.progressSet({
								id: process.getId(),
								status: translate(`progress${type}`),
								current: progress.getDone(),
								total: progress.getTotal(),
								isUnlocked,
								canCancel,
							});
							break;
						};

						case I.ProgressState.Error:
						case I.ProgressState.Done:
						case I.ProgressState.Canceled: {
							commonStore.progressClear();
							break;
						};
					};
					break;
				};
			};

			if (needLog) {
				log(rootId, type, data, message.getValueCase());
			};
		};

		if (updateParents) {
			blockStore.updateStructureParents(rootId);
		};
		
		blockStore.updateNumbers(rootId); 
		blockStore.updateMarkup(rootId);
	};

	getUniqueSubIds (subIds: string[]) {
		return UtilCommon.arrayUnique((subIds || []).map(it => it.split('/')[0]));
	};

	detailsUpdate (details: any, rootId: string, id: string, subIds: string[], clear: boolean) {
		this.getUniqueSubIds(subIds).forEach(subId => detailStore.update(subId, { id, details }, clear));

		if ([ I.SpaceStatus.Deleted, I.SpaceStatus.Removing ].includes(details.spaceAccountStatus)) {
			if (id == blockStore.spaceview) {
				UtilRouter.switchSpace(authStore.accountSpaceId, '');
			};

			const spaceview = UtilSpace.getSpaceview(id);
			if (spaceview && !spaceview._empty_) {
				Storage.deleteSpace(spaceview.targetSpaceId);
			};
		};

		if (!rootId) {
			return;
		};

		detailStore.update(rootId, { id, details }, clear);

		const root = blockStore.getLeaf(rootId, id);
		if ((id == rootId) && root) {
			if ((undefined !== details.layout) && (root.layout != details.layout)) {
				blockStore.update(rootId, rootId, { layout: details.layout });
			};

			if (undefined !== details.setOf) {
				blockStore.updateWidgetData(rootId);
				$(window).trigger(`updateDataviewData.dataview`);
			};

			blockStore.checkTypeSelect(rootId);
		};
	};

	subscriptionPosition (subId: string, id: string, afterId: string, isAdding: boolean): void {
		const [ sid, dep ] = subId.split('/');

		if (dep) {
			return;
		};

		const records = dbStore.getRecordIds(sid, '');
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

		if (root) {
			const object = detailStore.get(contextId, rootId, [ 'layout' ], true);

			root.type = I.BlockType.Page;
			root.layout = object.layout;
		};

		const blocks = objectView.blocks.map(it => {
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
		blockStore.updateStructureParents(contextId);
		blockStore.updateNumbers(contextId); 
		blockStore.updateMarkup(contextId);
		blockStore.checkTypeSelect(contextId);
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		type = type.replace(/^command_/, '');

		const { config } = commonStore;
		const debugTime = config.flagsMw.time;
		const debugRequest = config.flagsMw.request;
		const debugJson = config.flagsMw.json;
		const ct = UtilCommon.toCamelCase(type);
		const t0 = performance.now();

		if (!this.service[ct]) {
			console.error('[Dispatcher.request] Service not found: ', type);
			return;
		};

		let t1 = 0;
		let t2 = 0;
		let d = null;

		if (debugRequest && !SKIP_IDS.includes(type)) {
			console.log(`%cRequest.${type}`, 'font-weight: bold; color: blue;');
			d = UtilCommon.objectClear(data.toObject());
			console.log(debugJson ? JSON.stringify(d, null, 3) : d);
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
				message.error = { code, description };

				if (message.error.code) {
					console.error('Error', type, 'code:', message.error.code, 'description:', message.error.description);

					if (!SKIP_SENTRY_ERRORS.includes(type)) {
						Sentry.captureMessage(`${type}: code: ${code} msg: ${message.error.description}`);
						analytics.event('Exception', { method: type, code: message.error.code });
					};

					message.error.description = UtilCommon.translateError(type, message.error);
				};

				if (debugRequest && !SKIP_IDS.includes(type)) {
					console.log(`%cResponse.${type}`, 'font-weight: bold; color: green;');
					d = UtilCommon.objectClear(response.toObject());
					console.log(debugJson ? JSON.stringify(d, null, 3) : d);
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

				if (debugTime && !SKIP_IDS.includes(type)) {
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

	checkLog (type: string) {
		const { config } = commonStore;
		const event = config.flagsMw.event;
		const thread = config.flagsMw.thread;
		const file = config.flagsMw.file;

		let check = false;
		if (event && ![ 'threadStatus', 'fileLocalUsage', 'fileSpaceUsage' ].includes(type)) {
			check = true;
		};
		if (thread && [ 'threadStatus' ].includes(type)) {
			check = true;
		};
		if (file && [ 'fileLocalUsage', 'fileSpaceUsage' ].includes(type)) {
			check = true;
		};
		return check;
	};

};

export const dispatcher = new Dispatcher();
