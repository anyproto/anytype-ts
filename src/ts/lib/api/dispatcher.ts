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
import Constant from 'json/constant.json';

const SORT_IDS = [ 
	'BlockAdd', 
	'BlockDelete', 
	'BlockSetChildrenIds', 
	'ObjectDetailsSet', 
	'ObjectDetailsAmend', 
	'ObjectDetailsUnset', 
	'SubscriptionCounters',
	'BlockDataviewViewSet',
	'BlockDataviewViewDelete',
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
		const win = $(window);
		
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

		let updateParents = false;

		messages.sort((c1: any, c2: any) => this.sort(c1, c2));

		for (const message of messages) {
			const type = Mapper.Event.Type(message.getValueCase());
			const data = Mapper.Event.Data(message);
			const mapped = Mapper.Event[type] ? Mapper.Event[type](data) : {};
			const needLog = this.checkLog(type) && !skipDebug;

			switch (type) {

				case 'AccountShow': {
					authStore.accountAdd(mapped.account);
					break;
				};

				case 'AccountUpdate': {
					authStore.accountSetStatus(mapped.status);
					break;	
				};

				case 'AccountConfigUpdate': {
					commonStore.configSet(mapped.config, true);
					Renderer.send('setConfig', UtilCommon.objectCopy(commonStore.config));
					break;
				};

				case 'AccountLinkChallenge': {
					if (!isMainWindow) {
						break;
					};

					Renderer.send('showChallenge', {
						challenge: mapped.challenge,
						theme: commonStore.getThemeClass(),
						lang: commonStore.interfaceLang,
					});
					break;
				};

				case 'ThreadStatus': {
					authStore.threadSet(rootId, mapped);
					break;
				};

				case 'ObjectRelationsAmend': {
					dbStore.relationsSet(rootId, mapped.id, mapped.relations);
					break;
				};

				case 'ObjectRelationsRemove': {
					dbStore.relationListDelete(rootId, mapped.id, mapped.relationKeys);
					break;
				};

				case 'ObjectRestrictionsSet': {
					blockStore.restrictionsSet(rootId, mapped.restrictions);
					break;
				};

				case 'FileSpaceUsage': {
					const { spaces } = commonStore.spaceStorage;
					const space = spaces.find(it => it.spaceId == mapped.spaceId);

					if (space) {
						set(space, { bytesUsage: mapped.bytesUsage });
					} else {
						spaces.push(mapped);
					};
					break;
				};

				case 'FileLimitUpdated':
				case 'FileLocalUsage': {
					commonStore.spaceStorageSet(mapped);
					break;
				};

				case 'FileLimitReached': {
					const { bytesLimit, localUsage, spaces } = commonStore.spaceStorage;
					const bytesUsed = spaces.reduce((res, current) => res += current.bytesUsage, 0);
					const percentageUsed = Math.floor(UtilCommon.getPercent(bytesUsed, bytesLimit));

					if (percentageUsed >= 99) {
						Preview.toastShow({ action: I.ToastAction.StorageFull });
					} else
					if (localUsage > bytesLimit) {
						Preview.toastShow({ text: translate('toastFileLimitReached') });
					};
					break;
				};

				case 'BlockAdd': {
					const { blocks } = mapped;

					for (const block of blocks) {
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

				case 'BlockDelete': {
					const { blockIds } = mapped;

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

				case 'BlockSetChildrenIds': {
					const { id, childrenIds } = mapped;

					blockStore.updateStructure(rootId, id, childrenIds);

					if (id == rootId) {
						blockStore.checkTypeSelect(rootId);
					};

					updateParents = true;
					break;
				};

				case 'BlockSetFields': {
					const { id, fields } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { fields });
					break;
				};

				case 'BlockSetLink': {
					const { id, cardStyle, iconSize, description, targetBlockId, relations, fields } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (cardStyle !== null) {
						content.cardStyle = cardStyle;
					};

					if (iconSize !== null) {
						content.iconSize = iconSize;
					};

					if (description !== null) {
						content.description = description;
					};

					if (targetBlockId !== null) {
						content.targetBlockId = targetBlockId;
					};

					if (relations !== null) {
						content.relations = relations;
					};

					if (fields !== null) {
						content.fields = fields;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetText': {
					const { id, text, marks, style, checked, color, iconEmoji, iconImage } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (text !== null) {
						content.text = text;
					};

					if (marks !== null) {
						content.marks = marks;
					};

					if (style !== null) {
						content.style = style;
					};

					if (checked !== null) {
						content.checked = checked;
					};

					if (color !== null) {
						content.color = color;
					};

					if (iconEmoji !== null) {
						content.iconEmoji = iconEmoji;
					};

					if (iconImage !== null) {
						content.iconImage = iconImage;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetDiv': {
					const { id, style } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					if (style !== null) {
						block.content.style = style;
					};

					blockStore.updateContent(rootId, id, block.content);
					break;
				};

				case 'BlockDataviewTargetObjectIdSet': {
					const { id, targetObjectId } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.updateContent(rootId, id, { targetObjectId });
					break;
				};

				case 'BlockDataviewIsCollectionSet': {
					const { id, isCollection } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.updateContent(rootId, id, { isCollection });
					break;
				};

				case 'BlockSetWidget': {
					const { id, layout, limit, viewId } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (layout !== null) {
						content.layout = layout;
					};

					if (limit !== null) {
						content.limit = limit;
					};

					if (viewId !== null) {
						content.viewId = viewId;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetFile': {
					const { id, targetObjectId, type, style, state } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (targetObjectId !== null) {
						content.targetObjectId = targetObjectId;
					};

					if (type !== null) {
						content.type = type;
					};

					if (style !== null) {
						content.style = style;
					};

					if (state !== null) {
						content.state = state;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetBookmark': {
					const { id, targetObjectId, state } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (targetObjectId !== null) {
						content.targetObjectId = targetObjectId;
					};

					if (state !== null) {
						content.state = state;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetBackgroundColor': {
					const { id, bgColor } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { bgColor });
					break;
				};

				case 'BlockSetAlign': {
					const { id, align } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { hAlign: align });
					break;
				};

				case 'BlockSetVerticalAlign': {
					const { id, align } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					blockStore.update(rootId, id, { vAlign: align });
					break;
				};

				case 'BlockSetRelation': {
					const { id, key } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (key !== null) {
						content.key = key;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetLatex': {
					const { id, text } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (text !== null) {
						content.key = text;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetTableRow': {
					const { id, isHeader } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (isHeader !== null) {
						content.isHeader = isHeader;
					};

					blockStore.updateContent(rootId, id, content);
					break;
				};

				case 'BlockDataviewViewSet': {
					const { id, view } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					dbStore.viewAdd(rootId, id, view);
					blockStore.updateWidgetViews(rootId);
					break;
				};

				case 'BlockDataviewViewUpdate': {
					const { id, viewId, fields } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					let view = dbStore.getView(rootId, id, viewId);
					let updateData = false;

					if (fields !== null) {
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
						const elements = mapped[key.field] || [];

						let list = view[key.field];

						elements.forEach(element => {

							if (element.add) {
								const { afterId, items } = element.add;
								const idx = afterId ? list.findIndex(it => it[key.idField] == afterId) + 1 : list.length;

								items.forEach((it, i) => list.splice(idx + i, 0, it));

								if ([ 'filter', 'sort', 'relation' ].includes(key.id)) {
									updateData = true;
								};
							};

							if (element.move) {
								const { afterId, ids } = element.move;
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

							if (element.update) {
								const { id, item } = element.update;

								if (item) {
									const idx = list.findIndex(it => it[key.idField] == id);

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

							if (element.remove) {
								const { ids } = element.remove;

								list = list.filter(it => !ids.includes(it[key.idField]));

								if ([ 'filter', 'sort' ].includes(key.id)) {
									updateData = true;
								};
							};
						});

						view[key.field] = list;
					});

					dbStore.viewUpdate(rootId, id, view);
					blockStore.updateWidgetViews(rootId);

					if (updateData) {
						win.trigger(`updateDataviewData.${id}`);
						blockStore.updateWidgetData(rootId);
					};
					break;
				};

				case 'BlockDataviewViewDelete': {
					const { id, viewId } = mapped;
					const subId = dbStore.getSubId(rootId, id);

					let current = dbStore.getMeta(subId, '').viewId;
					
					dbStore.viewDelete(rootId, id, viewId);

					if (viewId == current) {
						const views = dbStore.getViews(rootId, id);

						current = views.length ? views[views.length - 1].id : '';
						dbStore.metaSet(subId, '', { viewId: current });
					};

					blockStore.updateWidgetViews(rootId);
					break;
				};

				case 'BlockDataviewViewOrder': {
					const { id, viewIds } = mapped;

					dbStore.viewsSort(rootId, id, viewIds);
					blockStore.updateWidgetViews(rootId);
					break; 
				};

				case 'BlockDataviewRelationDelete': {
					const { id, relationKeys } = mapped;

					dbStore.relationListDelete(rootId, id, relationKeys);
					break;
				};

				case 'BlockDataviewRelationSet': {
					const { id, relations } = mapped;

					dbStore.relationsSet(rootId, id, relations);
					break;
				};

				case 'BlockDataviewGroupOrderUpdate': {
					const { id, groupOrder } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block || (groupOrder === null)) {
						break;
					};

					Dataview.groupOrderUpdate(rootId, id, groupOrder.viewId, groupOrder.groups);
					break;
				};

				case 'BlockDataviewObjectOrderUpdate': {
					const { id, viewId, groupId, changes } = mapped;
					const block = blockStore.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const cb = it => (it.viewId == viewId) && (it.groupId == groupId);
					const index = block.content.objectOrder.findIndex(cb);

					let el = block.content.objectOrder.find(cb);
					if (!el) {
						el = { viewId, groupId, objectIds: observable.array([]) };
						block.content.objectOrder.push(el);
					};

					changes.forEach(it => {
						const idx = it.afterId ? el.objectIds.indexOf(it.afterId) + 1 : 0;

						switch (it.operation) {
							case I.SliceOperation.Add:
								it.ids.forEach((id: string, i: number) => {
									idx >= 0 ? el.objectIds.splice(idx + i, 0, id) : el.objectIds.unshift(id);
								});
								break;

							case I.SliceOperation.Move:
								if (idx >= 0) {
									it.ids.forEach((id: string, i: number) => {
										const oidx = el.objectIds.indexOf(id);
										if (oidx >= 0) {
											el.objectIds = arrayMove(el.objectIds, oidx, idx + i);
										};
									});
								};
								break;

							case I.SliceOperation.Remove:
								el.objectIds = el.objectIds.filter(id => !it.ids.includes(id));
								break;

							case I.SliceOperation.Replace:
								el.objectIds = it.ids;
								break;
						};
					});

					block.content.objectOrder[index] = el;
					blockStore.updateContent(rootId, id, { objectOrder: block.content.objectOrder });
					blockStore.updateWidgetData(rootId);
					break;
				};

				case 'ObjectDetailsSet': {
					const { id, subIds, details } = mapped;

					this.detailsUpdate(details, rootId, id, subIds, true);
					break;
				};

				case 'ObjectDetailsAmend': {
					const { id, subIds, details } = mapped;

					this.detailsUpdate(details, rootId, id, subIds, false);
					break;
				};

				case 'ObjectDetailsUnset': {
					const { id, subIds, keys } = mapped;

					// Subscriptions
					this.getUniqueSubIds(subIds).forEach(subId => detailStore.delete(subId, id, keys));

					detailStore.delete(rootId, id, keys);
					blockStore.checkTypeSelect(rootId);
					break;
				};

				case 'SubscriptionAdd': {
					const { id, afterId, subId } = mapped;

					this.subscriptionPosition(subId, id, afterId, true);
					break;
				};

				case 'SubscriptionRemove': {
					const { id } = mapped;
					const [ subId, dep ] = mapped.subId.split('/');

					if (!dep) {
						dbStore.recordDelete(subId, '', id);
						detailStore.delete(subId, id);
					};
					break;
				};

				case 'SubscriptionPosition': {
					const { id, afterId, subId } = mapped;

					this.subscriptionPosition(subId, id, afterId, false);
					break;
				};

				case 'SubscriptionCounters': {
					const [ subId, dep ] = mapped.subId.split('/');
					
					if (!dep) {
						dbStore.metaSet(subId, '', { total: mapped.total });
					};
					break;
				};

				case 'SubscriptionGroups': {
					const { group, remove } = mapped;
					const [ rootId, blockId ] = mapped.subId.split('-');

					if (remove) {
						dbStore.groupsRemove(rootId, blockId, [ group.id ]);
					} else {
						dbStore.groupsAdd(rootId, blockId, [ group ]);
					};
					break;
				};

				case 'NotificationSend': {
					const item = new M.Notification(mapped.notification);

					notificationStore.add(item);

					if (isMainWindow && !electron.isFocused()) {
						new window.Notification(UtilCommon.stripTags(item.title), { body: UtilCommon.stripTags(item.text) }).onclick = () => electron.focus();
					};
					break;
				};

				case 'NotificationUpdate': {
					notificationStore.update(mapped.notification);
					break;
				};

				case 'PayloadBroadcast': {
					if (!isMainWindow) {
						break;
					};

					let payload: any = {};
					try { payload = JSON.parse(mapped.payload); } catch (e) { /**/ };

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

				case 'MembershipUpdate':
					authStore.membershipUpdate(mapped.membership);
					UtilData.getMembershipTiers(true);
					break;

				case 'ProcessNew':
				case 'ProcessUpdate':
				case 'ProcessDone': {
					const { process } = mapped;
					const { id, progress, state, type } = process;

					switch (state) {
						case I.ProgressState.Running: {
							let canCancel = true;
							let isUnlocked = true;

							if ([ I.ProgressType.Recover, I.ProgressType.Migration ].includes(type)) {
								canCancel = false;
								isUnlocked = false;
							};

							commonStore.progressSet({
								id,
								status: translate(`progress${type}`),
								current: progress.done,
								total: progress.total,
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
		const t1 = Mapper.Event.Type(c1.getValueCase());
		const t2 = Mapper.Event.Type(c2.getValueCase());
		const idx1 = SORT_IDS.findIndex(it => it == t1);
		const idx2 = SORT_IDS.findIndex(it => it == t2);

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
		const { event, thread, file } = config.flagsMw;
		const fileEvents = [ 'FileLocalUsage', 'FileSpaceUsage' ];
		const threadEvents = [ 'ThreadStatus' ];

		let check = false;
		if (event && !threadEvents.concat(fileEvents).includes(type)) {
			check = true;
		};
		if (thread && threadEvents.includes(type)) {
			check = true;
		};
		if (file && fileEvents.includes(type)) {
			check = true;
		};
		return check;
	};

};

export const dispatcher = new Dispatcher();