import * as Sentry from '@sentry/browser';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observable, set } from 'mobx';
import Commands from 'dist/lib/pb/protos/commands_pb';
import Events from 'dist/lib/pb/protos/events_pb';
import Service from 'dist/lib/pb/protos/service/service_grpc_web_pb';
import { I, M, S, U, J, analytics, Renderer, Action, Dataview, Mapper, keyboard, Preview, focus } from 'Lib';
import * as Response from './response';
import { ClientReadableStream } from 'grpc-web';

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
		address = String(address || '');

		if (!address) {
			console.error('[Dispatcher.init] No address');
			return;
		};

		this.service = new Service.ClientCommandsClient(address, null, null);
	};

	startStream () {
		if (!S.Auth.token) {
			console.error('[Dispatcher.startStream] No token');
			return;
		};

		window.clearTimeout(this.timeoutStream);

		const request = new Commands.StreamRequest();
		request.setToken(S.Auth.token);

		this.stopStream();

		this.stream = this.service.listenSessionEvents(request, null);

		this.stream.on('data', (event) => {
			try {
				this.event(event, false, false);
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

	stopStream () {
		if (this.stream) {
			this.stream.cancel();
			this.stream = null;
		};
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
			this.startStream(); 
			this.reconnects++;
		}, t * 1000);
	};

	event (event: Events.Event, isSync: boolean, skipDebug: boolean) {
		const { config, space } = S.Common;
		const { account } = S.Auth;
		const traceId = event.getTraceid();
		const ctx: string[] = [ event.getContextid() ];
		const electron = U.Common.getElectron();
		const currentWindow = electron.currentWindow();
		const { windowId } = currentWindow;
		const isMainWindow = windowId === 1;
		const debugJson = config.flagsMw.json;
		const win = $(window);
		
		if (traceId) {
			ctx.push(traceId);
		};

		const rootId = ctx.join('-');
		const messages = event.getMessagesList() || [];
		const log = (rootId: string, type: string, spaceId: string, data: any, valueCase: any) => {
			console.log(`%cEvent.${type}`, 'font-weight: bold; color: #ad139b;', rootId, spaceId);
			if (!type) {
				console.error('Event not found for valueCase', valueCase);
			};

			if (data && data.toObject) {
				const d = U.Common.objectClear(data.toObject());
				console.log(debugJson ? JSON.stringify(d, null, 3) : d); 
			};
		};

		let updateParents = false;
		let updateNumbers = false;
		let updateMarkup = false;

		messages.sort((c1: any, c2: any) => this.sort(c1, c2));

		for (const message of messages) {
			const type = Mapper.Event.Type(message.getValueCase());
			const { spaceId, data } = Mapper.Event.Data(message);
			const mapped = Mapper.Event[type] ? Mapper.Event[type](data) : null;
			const needLog = this.checkLog(type) && !skipDebug;

			if (!mapped) {
				continue;
			};

			switch (type) {

				case 'AccountShow': {
					S.Auth.accountAdd(mapped.account);
					break;
				};

				case 'AccountUpdate': {
					S.Auth.accountSetStatus(mapped.status);
					break;	
				};

				case 'AccountConfigUpdate': {
					S.Common.configSet(mapped.config, true);
					Renderer.send('setConfig', U.Common.objectCopy(S.Common.config));
					break;
				};

				case 'AccountLinkChallenge': {
					if (!isMainWindow) {
						break;
					};

					Renderer.send('showChallenge', {
						...mapped,
						theme: S.Common.getThemeClass(),
						lang: S.Common.interfaceLang,
					});
					break;
				};

				case 'AccountLinkChallengeHide': {
					if (!isMainWindow) {
						break;
					};

					Renderer.send('hideChallenge', mapped);
					break;
				};

				case 'ObjectRelationsAmend': {
					S.Record.relationsSet(rootId, mapped.id, mapped.relations);
					break;
				};

				case 'ObjectRelationsRemove': {
					S.Record.relationListDelete(rootId, mapped.id, mapped.relationKeys);
					break;
				};

				case 'ObjectRestrictionsSet': {
					S.Block.restrictionsSet(rootId, mapped.restrictions);
					break;
				};

				case 'FileSpaceUsage': {
					const { spaces } = S.Common.spaceStorage;
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
					S.Common.spaceStorageSet(mapped);
					break;
				};

				case 'BlockAdd': {
					const { blocks } = mapped;

					for (const block of blocks) {
						if (block.type == I.BlockType.Dataview) {
							S.Record.relationsSet(rootId, block.id, block.content.relationLinks);
							S.Record.viewsSet(rootId, block.id, block.content.views);
						};

						S.Block.add(rootId, new M.Block(block));
						S.Block.updateStructure(rootId, block.id, block.childrenIds);
					};

					updateParents = true;
					updateNumbers = true;
					break;
				};

				case 'BlockDelete': {
					const { blockIds } = mapped;

					for (const blockId of blockIds) {
						const block = S.Block.getLeaf(rootId, blockId);
						if (!block) {
							continue;
						};

						if (block.type == I.BlockType.Dataview) {
							Action.dbClearBlock(rootId, blockId);
						};

						S.Block.delete(rootId, blockId);
					};

					updateParents = true;
					updateNumbers = true;
					break;
				};

				case 'BlockSetChildrenIds': {
					const { id, childrenIds } = mapped;

					S.Block.updateStructure(rootId, id, childrenIds);

					if (id == rootId) {
						S.Block.checkBlockType(rootId);
					};

					updateParents = true;
					updateNumbers = true;
					break;
				};

				case 'BlockSetFields': {
					const { id, fields } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.update(rootId, id, { fields });
					break;
				};

				case 'BlockSetLink': {
					const { id, cardStyle, iconSize, description, targetBlockId, relations, fields } = mapped;
					const block = S.Block.getLeaf(rootId, id);

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

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetText': {
					const { id, text, marks, style, checked, color, iconEmoji, iconImage } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					if (!isSync && (id == focus.state.focused)) {
						console.error('[Dispatcher] BlockSetText: focus', id);
						Sentry.captureMessage('[Dispatcher] BlockSetText: focus');
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

					S.Block.updateContent(rootId, id, content);

					updateNumbers = true;
					break;
				};

				case 'BlockSetDiv': {
					const { id, style } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					if (style !== null) {
						block.content.style = style;
					};

					S.Block.updateContent(rootId, id, block.content);
					break;
				};

				case 'BlockDataviewTargetObjectIdSet': {
					const { id, targetObjectId } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.updateContent(rootId, id, { targetObjectId });
					break;
				};

				case 'BlockDataviewIsCollectionSet': {
					const { id, isCollection } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.updateContent(rootId, id, { isCollection });
					break;
				};

				case 'BlockSetWidget': {
					const { id, layout, limit, viewId } = mapped;
					const block = S.Block.getLeaf(rootId, id);

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

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetFile': {
					const { id, targetObjectId, type, style, state } = mapped;
					const block = S.Block.getLeaf(rootId, id);

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

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetBookmark': {
					const { id, targetObjectId, state } = mapped;
					const block = S.Block.getLeaf(rootId, id);

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

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetBackgroundColor': {
					const { id, bgColor } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.update(rootId, id, { bgColor });
					break;
				};

				case 'BlockSetAlign': {
					const { id, align } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.update(rootId, id, { hAlign: align });
					break;
				};

				case 'BlockSetVerticalAlign': {
					const { id, align } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Block.update(rootId, id, { vAlign: align });
					break;
				};

				case 'BlockSetRelation': {
					const { id, key } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (key !== null) {
						content.key = key;
					};

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetLatex': {
					const { id, text } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (text !== null) {
						content.text = text;
					};

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockSetTableRow': {
					const { id, isHeader } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					const content: any = {};

					if (isHeader !== null) {
						content.isHeader = isHeader;
					};

					S.Block.updateContent(rootId, id, content);
					break;
				};

				case 'BlockDataviewViewSet': {
					const { id, view } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					S.Record.viewAdd(rootId, id, view);
					S.Block.updateWidgetViews(rootId);
					break;
				};

				case 'BlockDataviewViewUpdate': {
					const { id, viewId, fields } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block) {
						break;
					};

					let view = S.Record.getView(rootId, id, viewId);
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

					S.Record.viewUpdate(rootId, id, view);
					S.Block.updateWidgetViews(rootId);

					if (updateData) {
						win.trigger(`updateDataviewData`);
						S.Block.updateWidgetData(rootId);
					};
					break;
				};

				case 'BlockDataviewViewDelete': {
					const { id, viewId } = mapped;
					const subId = S.Record.getSubId(rootId, id);

					let current = S.Record.getMeta(subId, '').viewId;
					
					S.Record.viewDelete(rootId, id, viewId);

					if (viewId == current) {
						const views = S.Record.getViews(rootId, id);

						current = views.length ? views[views.length - 1].id : '';
						S.Record.metaSet(subId, '', { viewId: current });
					};

					S.Block.updateWidgetViews(rootId);
					break;
				};

				case 'BlockDataviewViewOrder': {
					const { id, viewIds } = mapped;

					S.Record.viewsSort(rootId, id, viewIds);
					S.Block.updateWidgetViews(rootId);
					break; 
				};

				case 'BlockDataviewRelationDelete': {
					const { id, relationKeys } = mapped;

					S.Record.relationListDelete(rootId, id, relationKeys);
					break;
				};

				case 'BlockDataviewRelationSet': {
					const { id, relations } = mapped;

					S.Record.relationsSet(rootId, id, relations);
					break;
				};

				case 'BlockDataviewGroupOrderUpdate': {
					const { id, groupOrder } = mapped;
					const block = S.Block.getLeaf(rootId, id);

					if (!block || (groupOrder === null)) {
						break;
					};

					Dataview.groupOrderUpdate(rootId, id, groupOrder.viewId, groupOrder.groups);
					S.Block.updateWidgetData(rootId);
					break;
				};

				case 'BlockDataviewObjectOrderUpdate': {
					const { id, viewId, groupId, changes } = mapped;
					const block = S.Block.getLeaf(rootId, id);

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
					S.Block.updateContent(rootId, id, { objectOrder: block.content.objectOrder });
					S.Block.updateWidgetData(rootId);
					break;
				};

				case 'ObjectDetailsSet': {
					const { id, subIds, details } = mapped;

					this.detailsUpdate(details, rootId, id, subIds, true);

					updateMarkup = true;
					break;
				};

				case 'ObjectDetailsAmend': {
					const { id, subIds, details } = mapped;

					this.detailsUpdate(details, rootId, id, subIds, false);

					updateMarkup = true;
					break;
				};

				case 'ObjectDetailsUnset': {
					const { id, subIds, keys } = mapped;

					// Subscriptions
					this.getUniqueSubIds(subIds).forEach(subId => S.Detail.delete(subId, id, keys));

					S.Detail.delete(rootId, id, keys);
					S.Block.checkBlockType(rootId);

					updateMarkup = true;
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
						S.Record.recordDelete(subId, '', id);
						S.Detail.delete(subId, id, []);
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
						S.Record.metaSet(subId, '', { total: mapped.total });
					};
					break;
				};

				case 'SubscriptionGroups': {
					const { group, remove } = mapped;
					const [ rootId, blockId ] = mapped.subId.split('-');

					if (remove) {
						S.Record.groupsRemove(rootId, blockId, [ group.id ]);
					} else {
						S.Record.groupsAdd(rootId, blockId, [ group ]);
					};

					S.Block.updateWidgetData(rootId);
					break;
				};

				case 'NotificationSend': {
					const item = new M.Notification(mapped.notification);

					S.Notification.add(item);

					if (isMainWindow && !electron.isFocused()) {
						U.Common.notification(item);
					};
					break;
				};

				case 'NotificationUpdate': {
					S.Notification.update(mapped.notification);
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

							U.Object.openAuto(object);
							window.focus();

							if (electron.focus) {
								electron.focus();
							};

							analytics.createObject(object.type, object.layout, analytics.route.webclipper, 0);
							break;
						};

						case 'analyticsEvent': {
							const { code, param } = payload;

							analytics.event(code, param);
							break;
						};
					};
					break;
				};

				case 'MembershipUpdate': {
					S.Auth.membershipUpdate(mapped.membership);
					U.Data.getMembershipTiers(true);
					break;
				};

				case 'ImportFinish': {
					if (!account) {
						break;
					};

					const { collectionId, count, type } = mapped;

					/*

					if (collectionId) {
						window.setTimeout(() => {
							S.Popup.open('objectManager', { 
								data: { 
									collectionId, 
									type: I.ObjectManagerPopup.Favorites,
								} 
							});
						}, S.Popup.getTimeout() + 10);
					};
					*/

					analytics.event('Import', { type, count });
					break;
				};

				case 'ChatAdd': {
					const orderId = mapped.orderId;
					const message = new M.ChatMessage(mapped.message);
					const author = U.Space.getParticipant(U.Space.getParticipantId(space, message.creator));

					mapped.subIds.forEach(subId => {
						const list = S.Chat.getList(subId);

						let idx = list.findIndex(it => it.orderId == orderId);
						if (idx < 0) {
							idx = list.length;
						};

						S.Chat.add(subId, idx, message);
					});

					/*
					if (isMainWindow && !electron.isFocused() && (message.creator != account.id)) {
						U.Common.notification({ title: author?.name, text: message.content.text }, () => {
							const { space } = S.Common;
							const open = () => {
								U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
							};

							if (spaceId != space) {
								U.Router.switchSpace(spaceId, '', false, { onRouteChange: open }, false);
							} else {
								open();
							};
						});
					};
					*/

					$(window).trigger('messageAdd', [ message, mapped.subIds ]);
					break;
				};

				case 'ChatUpdate': {
					mapped.subIds.forEach(subId => S.Chat.update(subId, mapped.message));

					$(window).trigger('messageUpdate', [ mapped.message ]);
					break;
				};

				case 'ChatStateUpdate': {
					mapped.subIds.forEach(subId => {
						if (subId == J.Constant.subId.chatSpace) {
							subId = [ J.Constant.subId.chatSpace, spaceId, rootId ].join('-');
						};

						S.Chat.setState(subId, mapped.state);
					});

					$(window).trigger('chatStateUpdate');
					break;
				};

				case 'ChatUpdateMessageReadStatus': {
					mapped.subIds.forEach(subId => S.Chat.setReadMessageStatus(subId, mapped.ids, mapped.isRead));
					break;
				};

				case 'ChatUpdateMentionReadStatus': {
					mapped.subIds.forEach(subId => S.Chat.setReadMentionStatus(subId, mapped.ids, mapped.isRead));
					break;
				};

				case 'ChatDelete': {
					mapped.subIds.forEach(subId => S.Chat.delete(subId, mapped.id));
					break;
				};

				case 'ChatUpdateReactions': {
					mapped.subIds.forEach((subId) => {
						const message = S.Chat.getMessage(subId, mapped.id);
						if (message) {
							set(message, { reactions: mapped.reactions });
						};
					});

					$(window).trigger('reactionUpdate', [ message ]);
					break;
				};

				case 'ProcessNew': {
					const { process } = mapped;
					const { progress, type } = process;

					S.Progress.update({
						...process,
						current: progress.done,
						total: progress.total,
						canCancel: [ 
							I.ProgressType.Migrate, 
							I.ProgressType.Import, 
							I.ProgressType.Export, 
							I.ProgressType.Drop,
						].includes(type),
					});
					break;
				};

				case 'ProcessUpdate': {
					const { process } = mapped;
					const { progress } = process;

					S.Progress.update({
						...process,
						current: progress.done,
						total: progress.total,
					});
					break;
				};

				case 'ProcessDone': {
					S.Progress.delete(mapped.process.id);
					break;
				};

				case 'SpaceSyncStatusUpdate':
				case 'P2PStatusUpdate': {
					S.Auth.syncStatusUpdate(mapped);
					break;
				};

				case 'SpaceAutoWidgetAdded': {
					Preview.toastShow({ objectId: mapped.targetId, action: I.ToastAction.Widget, icon: 'check' });

					analytics.createWidget(0, '', analytics.widgetType.auto);
					break;
				};

			};

			if (needLog) {
				log(rootId, type, spaceId, data, message.getValueCase());
			};
		};

		if (updateParents) {
			S.Block.updateStructureParents(rootId);
		};

		if (updateNumbers) {
			S.Block.updateNumbers(rootId); 
		};

		if (updateMarkup) {
			S.Block.updateMarkup(rootId);
		};
	};

	getUniqueSubIds (subIds: string[]) {
		return U.Common.arrayUnique((subIds || []).map(it => it.split('/')[0]));
	};

	detailsUpdate (details: any, rootId: string, id: string, subIds: string[], clear: boolean) {
		subIds = this.getUniqueSubIds(subIds);
		subIds.forEach(subId => S.Detail.update(subId, { id, details }, clear));

		const { space } = S.Common;
		const keys = Object.keys(details);
		const check = [ 'creator', 'spaceDashboardId', 'spaceAccountStatus' ];
		const intersection = check.filter(k => keys.includes(k));

		if (subIds.length && subIds.includes(J.Constant.subId.space)) {
			const object = U.Space.getSpaceview(id);

			if (intersection.length && object.targetSpaceId) {
				U.Data.createSubSpaceSubscriptions([ object.targetSpaceId ]);
			};

			if (object.isAccountDeleted && (object.targetSpaceId == space)) {
				U.Space.openFirstSpaceOrVoid(null, { replace: true });
			};
		};

		if (!rootId) {
			return;
		};

		S.Detail.update(rootId, { id, details }, clear);

		const root = S.Block.getLeaf(rootId, id);

		if ((id == rootId) && root) {
			if ((undefined !== details.layout) && (root.layout != details.layout)) {
				S.Block.update(rootId, rootId, { layout: details.layout });
			};

			if ((undefined !== details.resolvedLayout) && (root.layout != details.resolvedLayout)) {
				S.Block.update(rootId, rootId, { layout: details.resolvedLayout });
			};

			S.Block.checkBlockType(rootId);
		};

		if (undefined !== details.setOf) {
			S.Block.updateWidgetData(rootId);
			$(window).trigger(`updateDataviewData`);
		};
	};

	subscriptionPosition (subId: string, id: string, afterId: string, isAdding: boolean): void {
		const [ sid, dep ] = subId.split('/');
		if (dep) {
			return;
		};

		const records = S.Record.getRecordIds(sid, '');
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
			S.Record.recordsSet(sid, '', arrayMove(records, oldIndex, newIndex));
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
		const { details, restrictions, participants } = objectView;
		const root = objectView.blocks.find(it => it.id == rootId);
		const structure: any[] = [];
		const contextId = [ rootId, traceId ].filter(it => it).join('-');

		if (root && root.fields.analyticsContext) {
			analytics.setContext(root.fields.analyticsContext);
		} else {
			analytics.removeContext();
		};

		S.Detail.set(contextId, details);
		S.Block.restrictionsSet(contextId, restrictions);
		S.Block.participantsSet(contextId, participants);

		if (root) {
			const object = S.Detail.get(contextId, rootId, [ 'layout' ], true);

			root.type = I.BlockType.Page;
			root.layout = object.layout;
		};

		const blocks = objectView.blocks.map(it => {
			if (it.type == I.BlockType.Dataview) {
				S.Record.relationsSet(contextId, it.id, it.content.relationLinks);
				S.Record.viewsSet(contextId, it.id, it.content.views);
			};

			structure.push({ id: it.id, childrenIds: it.childrenIds });
			return new M.Block(it);
		});

		// BlockType
		blocks.push(new M.Block({
			id: J.Constant.blockId.type,
			parentId: J.Constant.blockId.header,
			type: I.BlockType.Type,
			fields: {},
			childrenIds: [],
			content: {}
		}));

		S.Block.set(contextId, blocks);
		S.Block.setStructure(contextId, structure);
		S.Block.updateStructureParents(contextId);
		S.Block.updateNumbers(contextId); 
		S.Block.updateMarkup(contextId);
		S.Block.checkBlockType(contextId);

		keyboard.setWindowTitle();
	};

	public request (type: string, data: any, callBack?: (message: any) => void) {
		type = type.replace(/^command_/, '');

		const { config } = S.Common;
		const debugTime = config.flagsMw.time;
		const debugRequest = config.flagsMw.request;
		const debugJson = config.flagsMw.json;
		const ct = U.Common.toCamelCase(type);
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
			d = U.Common.objectClear(data.toObject());
			console.log(debugJson ? JSON.stringify(d, null, 3) : d);
		};

		try {
			this.service[ct](data, { token: S.Auth.token }, (error: any, response: any) => {
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

					message.error.description = U.Common.translateError(type, message.error);
				};

				if (debugRequest && !SKIP_IDS.includes(type)) {
					console.log(`%cResponse.${type}`, 'font-weight: bold; color: green;');
					d = U.Common.objectClear(response.toObject());
					console.log(debugJson ? JSON.stringify(d, null, 3) : d);
				};

				if (message.event) {
					this.event(message.event, true, true);
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
		const { config } = S.Common;
		const { event, sync, file } = config.flagsMw;
		const fileEvents = [ 'FileLocalUsage', 'FileSpaceUsage' ];
		const syncEvents = [ 'SpaceSyncStatusUpdate', 'P2PStatusUpdate', 'ThreadStatus' ];

		let check = false;
		if (event && !syncEvents.concat(fileEvents).includes(type)) {
			check = true;
		};
		if (sync && syncEvents.includes(type)) {
			check = true;
		};
		if (file && fileEvents.includes(type)) {
			check = true;
		};
		return check;
	};

};

export const dispatcher = new Dispatcher();
