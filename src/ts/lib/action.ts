import { I, C, S, U, J, focus, analytics, Onboarding, Renderer, Preview, Storage, translate, Mapper, keyboard } from 'Lib';

class Action {

	pageClose (rootId: string, withCommand: boolean) {
		const { root, widgets } = S.Block;
		const { space } = S.Common;

		// Prevent closing of system objects
		if ([ root, widgets ].includes(rootId)) {
			return;
		};

		const onClose = () => {
			const blocks = S.Block.getBlocks(rootId, it => it.isDataview());

			for (const block of blocks) {
				this.dbClearBlock(rootId, block.id);
			};

			this.dbClearRoot(rootId);

			S.Block.clear(rootId);
		};

		onClose();

		if (withCommand) {
			C.ObjectClose(rootId, space);
		};
	};

	dbClearRoot (rootId: string) {
		if (!rootId) {
			return;
		};

		const object = S.Detail.get(rootId, rootId);

		if (U.Object.isChatLayout(object.layout)) {
			C.ChatUnsubscribe(object.chatId);
			S.Chat.clear(object.id);
		};

		S.Record.metaClear(rootId, '');
		S.Record.recordsClear(rootId, '');
		S.Detail.clear(rootId);

		C.ObjectSearchUnsubscribe([ rootId ]);
	};

	dbClearBlock (rootId: string, blockId: string) {
		if (!rootId || !blockId) {
			return;
		};

		const subId = S.Record.getSubId(rootId, blockId);

		S.Record.metaClear(subId, '');
		S.Record.recordsClear(subId, '');
		S.Record.recordsClear(`${subId}/dep`, '');
		S.Record.viewsClear(rootId, blockId);

		S.Detail.clear(subId);

		C.ObjectSearchUnsubscribe([ subId ]);
	};

	upload (type: I.FileType, rootId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) {
		C.BlockUpload(rootId, blockId, url, path, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			analytics.event('UploadMedia', { type: type, middleTime: message.middleTime });
		});
	};
	
	duplicate (rootId: string, targetContextId: string, blockId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) {
		C.BlockListDuplicate(rootId, targetContextId, blockIds, blockId, position, (message: any) => {
			if (message.error.code) {
				return;
			};

			const lastId = message.blockIds && message.blockIds.length ? message.blockIds[message.blockIds.length - 1] : '';
			this.focusToEnd(rootId, lastId);

			if (callBack) {
				callBack(message);
			};

			analytics.event('DuplicateBlock', { count: message.blockIds.length });
		});
	};

	move (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) {
		C.BlockListMoveToExistingObject(contextId, targetContextId, targetId, blockIds, position, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			const count = blockIds.length;

			if (contextId != targetContextId) {
				Preview.toastShow({ action: I.ToastAction.Move, originId: contextId, targetId: targetContextId, count });
			};

			analytics.event(contextId != targetContextId ? 'MoveBlock' : 'ReorderBlock', { count });
		});
	};

	remove (rootId: string, blockId: string, blockIds: string[]) {
		const next = S.Block.getNextBlock(rootId, blockId, -1, (it: any) => {
			return it.type == I.BlockType.Text;
		});
		
		C.BlockListDelete(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (next) {
				this.focusToEnd(rootId, next.id);
			};

			analytics.event('DeleteBlock', { count: blockIds.length });
		});
	};

	removeWidget (id: string, target: any) {
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, id);

		if (!block) {
			return;
		};

		const { layout } = block.content;

		C.BlockListDelete(widgets, [ id ]);
		Storage.setToggle('widget', id, false);
		Storage.deleteToggle(`widget${id}`);

		const childrenIds = S.Block.getChildrenIds(widgets, id);
		if (childrenIds.length) {
			Storage.deleteToggle(`widget${childrenIds[0]}`);
		};

		analytics.event('DeleteWidget', { layout, params: { target } });
	};

	focusToEnd (rootId: string, id: string) {
		const block = S.Block.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

	openUrl (url: string) {
		url = U.Common.urlFix(url);

		const storageKey = 'openUrl';
		const scheme = U.Common.getScheme(url);
		const cb = () => Renderer.send('openUrl', url);

		if (!Storage.get(storageKey) && !scheme.match(new RegExp(`^(${J.Constant.allowedSchemes.join('|')})$`))) {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					bgColor: 'red',
					title: translate('popupConfirmOpenExternalLinkTitle'),
					text: translate('popupConfirmOpenExternalLinkText'),
					textConfirm: translate('commonYes'),
					storageKey,
					onConfirm: () => cb(),
				}
			});
		} else {
			cb();
		};
	};

	openFile (id: string, route: string) {
		if (!id) {
			return;
		};

		C.FileDownload(id, U.Common.getElectron().tmpPath, (message: any) => {
			if (message.path) {
				Renderer.send('openPath', message.path);
				analytics.event('OpenMedia', { route });
			};
		});
	};

	downloadFile (id: string, route: string, isImage: boolean) {
		if (!id) {
			return;
		};
		
		const url = isImage ? S.Common.imageUrl(id, 1000000) : S.Common.fileUrl(id);

		Renderer.send('download', url, { saveAs: true });
		analytics.event('DownloadMedia', { route });
	};

	openFileDialog (param: any, callBack?: (paths: string[]) => void) {
		param = Object.assign({
			extensions: [],
			properties: [],
		}, param);

		const properties = param.properties || [];
		const extensions = param.extensions || [];

		const options: any = { 
			properties: [ 'openFile' ].concat(properties), 
		};

		if (extensions.length) {
			options.filters = [ 
				{ name: 'Filtered extensions', extensions },
			];
		};
		
		U.Common.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((typeof filePaths === 'undefined') || !filePaths.length) {
				return;
			};
			
			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	openDirectoryDialog (param: any, callBack?: (paths: string[]) => void) {
		param = Object.assign({}, param);

		const options = Object.assign(param, { 
			properties: [ 'openDirectory' ],
		});

		U.Common.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((filePaths == undefined) || !filePaths.length) {
				return;
			};

			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	install (object: any, showToast: boolean, callBack?: (message: any) => void) {
		C.WorkspaceObjectAdd(S.Common.space, object.id, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			const eventParam: any = { layout: object.layout };

			let toast = '';
			let subId = '';

			switch (object.layout) {
				case I.ObjectLayout.Type: {
					toast = U.Common.sprintf(translate('toastObjectTypeAdded'), object.name);
					subId = J.Constant.subId.type;

					eventParam.objectType = object.id;
					break;
				};

				case I.ObjectLayout.Relation: {
					toast = U.Common.sprintf(translate('toastRelationAdded'), object.name);
					subId = J.Constant.subId.relation;

					eventParam.relationKey = object.relationKey;
					break;
				};
			};

			if (showToast) {
				Preview.toastShow({ text: toast });
			};

			S.Detail.update(subId, { id: details.id, details }, false);
			analytics.event('ObjectInstall', eventParam);

			if (callBack) {
				callBack(message);
			};
		});
	};

	uninstall (object: any, showToast: boolean, route?: string, callBack?: (message: any) => void) {
		const eventParam: any = { layout: object.layout };

		if (route) {
			eventParam.route = route;
		};

		let title = '';
		let text = '';
		let toast = '';
		
		switch (object.layout) {
			case I.ObjectLayout.Type: {
				title = U.Common.sprintf(translate('libActionUninstallTypeTitle'), object.name);
				text = translate('libActionUninstallTypeText');
				toast = U.Common.sprintf(translate('toastObjectTypeRemoved'), object.name);

				eventParam.objectType = object.id;
				break;
			};

			case I.ObjectLayout.Relation: {
				title = U.Common.sprintf(translate('libActionUninstallRelationTitle'), object.name);
				text = translate('libActionUninstallRelationText');
				toast = U.Common.sprintf(translate('toastRelationRemoved'), object.name);

				eventParam.relationKey = object.relationKey;
				break;
			};
		};

		S.Popup.open('confirm', {
			data: {
				title,
				text,
				textConfirm: translate('commonRemove'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.WorkspaceObjectListRemove([ object.id ], (message: any) => {
						if (message.error.code) {
							return;
						};

						if (callBack) {
							callBack(message);
						};

						if (showToast) {
							Preview.toastShow({ text: toast });
						};
						analytics.event('ObjectUninstall', eventParam);
					});
				},
			},
		});
	};

	delete (ids: string[], route: string, callBack?: () => void): void {
		const count = ids.length;

		if (!U.Space.canMyParticipantWrite()) {
			S.Popup.open('confirm', {
				data: {
					title: translate('popupConfirmActionRestrictedTitle'),
					text: translate('popupConfirmActionRestrictedText'),
					textConfirm: translate('commonOk'),
					canCancel: false
				},
			});
			return;
		};

		analytics.event('ShowDeletionWarning');

		S.Popup.open('confirm', {
			data: {
				title: U.Common.sprintf(translate('popupConfirmDeleteWarningTitle'), count, U.Common.plural(count, translate('pluralObject'))),
				text: translate('popupConfirmDeleteWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => { 
					C.ObjectListDelete(ids); 
					
					if (callBack) {
						callBack();
					};

					// Remove last opened objects in case any is deleted
					Storage.deleteLastOpenedByObjectId(ids);

					analytics.event('RemoveCompletely', { count, route });
				},
				onCancel: () => {
					if (callBack) {
						callBack();
					};
				},
			},
		});
	};

	restoreFromBackup (onError: (error: { code: number, description: string }) => boolean) {
		const { networkConfig } = S.Auth;
		const { dataPath } = S.Common;
		const { mode, path } = networkConfig;

		this.openFileDialog({ extensions: [ 'zip' ] }, paths => {
			C.AccountRecoverFromLegacyExport(paths[0], dataPath, U.Common.rand(1, J.Constant.count.icon), (message: any) => {
				if (onError(message.error)) {
					return;
				};

				const { accountId, spaceId } = message;

				C.ObjectImport(spaceId, { paths, noCollection: true }, [], false, I.ImportType.Protobuf, I.ImportMode.AllOrNothing, false, true, false, false, (message: any) => {
					if (onError(message.error)) {
						return;
					};

					C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
						const { account } = message;

						if (onError(message.error) || !account) {
							return;
						};

						S.Auth.accountSet(account);
						S.Common.configSet(account.config, false);

						const routeParam = {
							replace: true,
							animate: true,
							onFadeIn: () => {
								S.Popup.open('migration', { data: { type: 'import' } });
								S.Block.closeRecentWidgets();
							},
						};

						U.Data.onInfo(account.info);
						U.Data.onAuthWithoutSpace(routeParam);
						U.Data.onAuthOnce(true);
					});
				});
			});
		});
	};

	archive (ids: string[], route: string, callBack?: () => void) {
		C.ObjectListSetIsArchived(ids, true, (message: any) => {
			if (message.error.code) {
				return;
			};

			Preview.toastShow({ action: I.ToastAction.Archive, ids });
			analytics.event('MoveToBin', { route, count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	restore (ids: string[], route: string, callBack?: () => void) {
		C.ObjectListSetIsArchived(ids, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			analytics.event('RestoreFromBin', { route, count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	import (type: I.ImportType, extensions: string[], options?: any, callBack?: (message: any) => void) {
		const fileOptions: any = { 
			properties: [ 'openFile', 'multiSelections' ],
			filters: [
				{ name: 'Filtered extensions', extensions },
			],
		};

		if (U.Common.isPlatformMac()) {
			fileOptions.properties.push('openDirectory');
		};

		analytics.event('ClickImport', { type });

		U.Common.getElectron().showOpenDialog(fileOptions).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			analytics.event('ClickImportFile', { type });

			C.ObjectImport(S.Common.space, Object.assign(options || {}, { paths }), [], true, type, I.ImportMode.IgnoreErrors, false, false, false, false, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (callBack) {	
					callBack(message);
				};
			});
		});
	};

	export (spaceId: string, ids: string[], type: I.ExportType, param: any, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		const { zip, nested, files, archived, json, route } = param;

		this.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(spaceId, paths[0], ids, type, zip, nested, files, archived, json, (message: any) => {
				if (message.error.code) {
					return;
				};

				Renderer.send('openPath', paths[0]);
				analytics.event('Export', { type, middleTime: message.middleTime, route });

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	copyBlocks (rootId: string, ids: string[], isCut: boolean) {
		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		const { focused } = focus.state;

		if (root.isLocked() && !ids.length) {
			return;
		};

		const range = U.Common.objectCopy(focus.state.range);
		const cmd = isCut ? 'BlockCut' : 'BlockCopy';
		const tree = S.Block.getTree(rootId, S.Block.getBlocks(rootId));

		let next = null;
		let blocks = S.Block.unwrapTree(tree).filter(it => ids.includes(it.id));

		ids.forEach((id: string) => {
			const block = S.Block.getLeaf(rootId, id);
			if (block && block.isTable()) {
				blocks = blocks.concat(S.Block.unwrapTree([ S.Block.wrapTree(rootId, block.id) ]));
			};
		});

		blocks = U.Common.arrayUniqueObjects(blocks, 'id');
		blocks = blocks.map((it: I.Block) => {
			const element = S.Block.getMapElement(rootId, it.id);
			if (!element) {
				return null;
			};

			if (it.type == I.BlockType.Dataview) {
				it.content.views = S.Record.getViews(rootId, it.id);
			};

			it.childrenIds = element.childrenIds;
			return it;
		}).filter(it => it);

		if (isCut) {
			next = S.Block.getNextBlock(rootId, focused, -1, it => it.isFocusable());
		};

		C[cmd](rootId, blocks, range, (message: any) => {
			U.Common.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range,
					blocks: (message.anySlot || []).map(Mapper.From.Block),
				},
			});

			if (isCut) {
				S.Menu.closeAll([ 'blockContext', 'blockAction' ]);

				if (next) {
					const l = next.getLength();

					focus.set(next.id, { from: l, to: l });
					focus.apply();
				};
			};
		});

		analytics.event(isCut ? 'CutBlock' : 'CopyBlock', { count: blocks.length });
	};

	createSpace (route: string) {
		if (!U.Space.canCreateSpace()) {
			return;
		};

		S.Popup.closeAll(null, () => {
			S.Popup.open('spaceCreate', { data: { route } });
		});
	};

	removeSpace (id: string, route: string, callBack?: (message: any) => void) {
		const deleted = U.Space.getSpaceviewBySpaceId(id);

		if (!deleted) {
			return;
		};

		const { space } = S.Common;
		const isOwner = U.Space.isMyOwner(id);
		const name = U.Common.shorten(deleted.name, 32);
		const suffix = isOwner ? 'Delete' : 'Leave';
		const title = U.Common.sprintf(translate(`space${suffix}WarningTitle`), name);
		const text = U.Common.sprintf(translate(`space${suffix}WarningText`), name);
		const toast = U.Common.sprintf(translate(`space${suffix}Toast`), name);
		const confirm = isOwner ? translate('commonDelete') : translate('commonLeaveSpace');

		analytics.event(`Click${suffix}Space`, { route });

		S.Popup.open('confirm', {
			data: {
				title,
				text,
				textConfirm: confirm,
				onConfirm: () => {
					analytics.event(`Click${suffix}SpaceWarning`, { type: suffix, route });

					const cb = () => {
						C.SpaceDelete(id, (message: any) => {
							if (callBack) {
								callBack(message);
							};

							if (!message.error.code) {
								Preview.toastShow({ text: toast });
								analytics.event(`${suffix}Space`, { type: deleted.spaceAccessType, route });
							};
						});
					};

					if (space == id) {
						U.Space.openFirstSpaceOrVoid(it => it.targetSpaceId != id, { replace: true, onRouteChange: cb });
					} else {
						cb();
					};
				},
				onCancel: () => {
					analytics.event(`Click${suffix}SpaceWarning`, { type: 'Cancel', route });
				}
			},
		});
	};

	leaveApprove (spaceId: string, identities: string[], name: string, route: string, callBack?: (message: any) => void) {
		C.SpaceLeaveApprove(spaceId, identities, (message: any) => {
			if (!message.error.code) {
				Preview.toastShow({ text: U.Common.sprintf(translate('toastApproveLeaveRequest'), name) });
				analytics.event('ApproveLeaveRequest', { route });
			};

			if (callBack) {
				callBack(message);
			};
		});
	};

	setInterfaceLang (id: string) {
		const { config } = S.Common;
		const { languages } = config;

		Renderer.send('setInterfaceLang', id);

		if (!Storage.get('setSpellingLang') && !languages.length) {
			const check = J.Lang.interfaceToSpellingLangMap[id];
			if (check) {
				this.setSpellingLang([ check ]);
				Storage.set('setSpellingLang', true);
			};
		};

		analytics.event('SwitchInterfaceLanguage', { type: id });
	};

	setSpellingLang (langs: string[]) {
		Renderer.send('setSpellingLang', langs);
		analytics.event('AddSpellcheckLanguage');
	};

	importUsecase (spaceId: string, id: I.Usecase, callBack?: () => void) {
		C.ObjectImportUseCase(spaceId, id, (message: any) => {
			S.Block.closeRecentWidgets();

			if (callBack) {
				callBack();
			};
		});
	};

	setIsFavorite (objectIds: string[], v: boolean, route: string, callBack?: (message: any) => void) {
		C.ObjectListSetIsFavorite(objectIds, v, (message: any) => {
			if (message.error.code) {
				return;
			};

			analytics.event(v ? 'AddToFavorites' : 'RemoveFromFavorites', { count: objectIds.length, route });

			if (callBack) {
				callBack(message);
			};
		});
	};

	createWidgetFromObject (rootId: string, objectId: string, targetId: string, position: I.BlockPosition, route?: string) {
		const object = S.Detail.get(rootId, objectId);

		let layout = I.WidgetLayout.Link;

		if (object && !object._empty_) {
			if (U.Object.isInFileOrSystemLayouts(object.layout)) {
				layout = I.WidgetLayout.Link;
			} else 
			if (U.Object.isInSetLayouts(object.layout)) {
				layout = I.WidgetLayout.View;
			} else
			if (U.Object.isInPageLayouts(object.layout)) {
				layout = I.WidgetLayout.Tree;
			};
		};

		const limit = Number(U.Menu.getWidgetLimitOptions(layout)[0]?.id) || 0;
		const newBlock = { 
			type: I.BlockType.Link,
			content: { 
				targetBlockId: objectId, 
			},
		};

		C.BlockCreateWidget(S.Block.widgets, targetId, newBlock, position, layout, limit, () => {
			analytics.event('AddWidget', { type: layout, route });
		});
	};

	membershipUpgrade () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmMembershipUpgradeTitle'),
				text: translate('popupConfirmMembershipUpgradeText'),
				textConfirm: translate('popupConfirmMembershipUpgradeButton'),
				onConfirm: () => keyboard.onMembershipUpgrade(),
				canCancel: false
			}
		});
	};

	inviteRevoke (spaceId: string, callBack?: () => void) {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmRevokeLinkTitle'),
				text: translate('popupConfirmRevokeLinkText'),
				textConfirm: translate('popupConfirmRevokeLinkConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceInviteRevoke(spaceId, () => {
						if (callBack) {
							callBack();
						};

						Preview.toastShow({ text: translate('toastInviteRevoke') });
						analytics.event('RevokeShareLink');
					});
				},
			},
		});

		analytics.event('ScreenRevokeShareLink');
	};

	addToCollection (targetId: string, objectIds: string[]) {
		const collectionType = S.Record.getCollectionType();

		C.ObjectCollectionAdd(targetId, objectIds, (message: any) => {
			if (message.error.code) {
				return;
			};

			Preview.toastShow({ action: I.ToastAction.Collection, objectId: objectIds[0], targetId });
			analytics.event('LinkToObject', { objectType: collectionType?.id, linkType: 'Collection' });
		});
	};

	themeSet (id: string) {
		S.Common.themeSet(id);
		Renderer.send('setTheme', id);
		analytics.event('ThemeSet', { id });
	};

};

export default new Action();
