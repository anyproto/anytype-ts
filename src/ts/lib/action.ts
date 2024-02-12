import { I, C, focus, analytics, Renderer, Preview, UtilCommon, UtilObject, Storage, UtilData, UtilRouter, UtilMenu, translate, Mapper } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, dbStore, popupStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

class Action {

	pageClose (rootId: string, close: boolean) {
		const { root, widgets } = blockStore;
		const { space } = commonStore;

		// Prevent closing of system objects
		if ([ root, widgets ].includes(rootId)) {
			return;
		};

		const onClose = () => {
			const blocks = blockStore.getBlocks(rootId, it => it.isDataview());

			for (const block of blocks) {
				this.dbClearBlock(rootId, block.id);
			};

			this.dbClearRoot(rootId);

			blockStore.clear(rootId);
			authStore.threadRemove(rootId);
		};

		if (close) {
			C.ObjectClose(rootId, space, onClose);
		} else {
			onClose();
		};
	};

	dbClearRoot (rootId: string) {
		if (!rootId) {
			return;
		};

		dbStore.metaClear(rootId, '');
		dbStore.recordsClear(rootId, '');
		detailStore.clear(rootId);

		C.ObjectSearchUnsubscribe([ rootId ]);
	};

	dbClearBlock (rootId: string, blockId: string) {
		if (!rootId || !blockId) {
			return;
		};

		const subId = dbStore.getSubId(rootId, blockId);

		dbStore.metaClear(subId, '');
		dbStore.recordsClear(subId, '');
		dbStore.recordsClear(subId + '/dep', '');
		dbStore.viewsClear(rootId, blockId);

		detailStore.clear(subId);

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
	
	download (block: I.Block, route: string) {
		if (!block) {
			return;
		};

		const { content } = block;
		const { type, targetObjectId } = content;

		if (!targetObjectId) {
			return;
		};
		
		const url = block.isFileImage() ? commonStore.imageUrl(targetObjectId, 1000000) : commonStore.fileUrl(targetObjectId);

		Renderer.send('download', url);
		analytics.event('DownloadMedia', { type, route });
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
		const next = blockStore.getNextBlock(rootId, blockId, -1, (it: any) => {
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
		const { widgets } = blockStore;
		const block = blockStore.getLeaf(widgets, id);

		if (!block) {
			return;
		};

		C.BlockListDelete(widgets, [ id ]);
		Storage.setToggle('widget', id, false);
		Storage.deleteToggle(`widget${id}`);

		const childrenIds = blockStore.getChildrenIds(widgets, id);
		if (childrenIds.length) {
			Storage.deleteToggle(`widget${childrenIds[0]}`);
		};

		analytics.event('DeleteWidget', { target });
	};

	focusToEnd (rootId: string, id: string) {
		const block = blockStore.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

	openFile (extensions: string[], callBack?: (paths: string[]) => void) {
		const options: any = { 
			properties: [ 'openFile' ], 
		};

		if (extensions && extensions.length) {
			options.filters = [ 
				{ name: 'Filtered extensions', extensions },
			];
		};
		
		UtilCommon.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((typeof filePaths === 'undefined') || !filePaths.length) {
				return;
			};
			
			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	openDir (param: any, callBack?: (paths: string[]) => void) {
		param = Object.assign({}, param);

		const options = Object.assign(param, { 
			properties: [ 'openDirectory' ],
		});

		UtilCommon.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((filePaths == undefined) || !filePaths.length) {
				return;
			};

			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	install (object: any, showToast: boolean, callBack?: (message: any) => void) {
		C.WorkspaceObjectAdd(commonStore.space, object.id, (message: any) => {
			if (message.error.code) {
				return;
			};

			const { details } = message;
			const eventParam: any = { layout: object.layout };

			let toast = '';
			let subId = '';

			switch (object.layout) {
				case I.ObjectLayout.Type: {
					toast = UtilCommon.sprintf(translate('toastObjectTypeAdded'), object.name);
					subId = Constant.subId.type;

					eventParam.objectType = object.id;
					break;
				};

				case I.ObjectLayout.Relation: {
					toast = UtilCommon.sprintf(translate('toastRelationAdded'), object.name);
					subId = Constant.subId.relation;

					eventParam.relationKey = object.relationKey;
					break;
				};
			};

			if (showToast) {
				Preview.toastShow({ text: toast });
			};

			detailStore.update(subId, { id: details.id, details }, false);
			analytics.event('ObjectInstall', eventParam);

			if (callBack) {
				callBack(message);
			};
		});
	};

	uninstall (object: any, showToast: boolean, callBack?: (message: any) => void) {
		const eventParam: any = { layout: object.layout };

		let title = '';
		let text = '';
		let toast = '';
		
		switch (object.layout) {
			case I.ObjectLayout.Type: {
				title = UtilCommon.sprintf(translate('libActionUninstallTypeTitle'), object.name);
				text = translate('libActionUninstallTypeText');
				toast = UtilCommon.sprintf(translate('toastObjectTypeRemoved'), object.name);

				eventParam.objectType = object.id;
				break;
			};

			case I.ObjectLayout.Relation: {
				title = UtilCommon.sprintf(translate('libActionUninstallRelationTitle'), object.name);
				text = translate('libActionUninstallRelationText');
				toast = UtilCommon.sprintf(translate('toastRelationRemoved'), object.name);

				eventParam.relationKey = object.relationKey;
				break;
			};
		};

		popupStore.open('confirm', {
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

		analytics.event('ShowDeletionWarning');

		popupStore.open('confirm', {
			data: {
				title: UtilCommon.sprintf(translate('commonDeletionWarningTitle'), count, UtilCommon.plural(count, translate('pluralObject'))),
				text: translate('commonDeletionWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => { 
					C.ObjectListDelete(ids); 
					
					if (callBack) {
						callBack();
					};

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
		const { walletPath, networkConfig } = authStore;
		const { mode, path } = networkConfig;

		this.openFile([ 'zip' ], paths => {
			C.AccountRecoverFromLegacyExport(paths[0], walletPath, UtilCommon.rand(1, Constant.iconCnt), (message: any) => {
				if (onError(message.error)) {
					return;
				};

				const { accountId, spaceId } = message;

				C.ObjectImport(spaceId, { paths, noCollection: true }, [], false, I.ImportType.Protobuf, I.ImportMode.AllOrNothing, false, true, false, false, (message: any) => {
					if (onError(message.error)) {
						return;
					};

					C.AccountSelect(accountId, walletPath, mode, path, (message: any) => {
						if (onError(message.error) || !message.account) {
							return;
						};

						authStore.accountSet(message.account);
						commonStore.configSet(message.account.config, false);

						UtilData.onInfo(message.account.info);
						UtilData.onAuth({ routeParam: { animate: true } }, () => {
							window.setTimeout(() => { popupStore.open('migration', { data: { type: 'import' } }); }, Constant.delay.popup);
							blockStore.closeRecentWidgets();
						});
					});
				});
			});
		});
	};

	archive (ids: string[], callBack?: () => void) {
		C.ObjectListSetIsArchived(ids, true, (message: any) => {
			if (message.error.code) {
				return;
			};

			Preview.toastShow({ action: I.ToastAction.Archive, ids });
			analytics.event('MoveToBin', { count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	restore (ids: string[], callBack?: () => void) {
		C.ObjectListSetIsArchived(ids, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			analytics.event('RestoreFromBin', { count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	import (type: I.ImportType, extensions: string[], options?: any, callBack?: (message: any) => void) {
		const fileOptions: any = { 
			properties: [ 'openFile' ],
			filters: [ 
				{ name: 'Filtered extensions', extensions },
			],
		};

		if (UtilCommon.isPlatformMac()) {
			fileOptions.properties.push('openDirectory');
		};

		analytics.event('ClickImport', { type });

		UtilCommon.getElectron().showOpenDialog(fileOptions).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			analytics.event('ClickImportFile', { type });

			C.ObjectImport(commonStore.space, Object.assign(options || {}, { paths }), [], true, type, I.ImportMode.IgnoreErrors, false, false, false, false, (message: any) => {
				if (!message.error.code) {
					if (message.collectionId) {
						window.setTimeout(() => {
							popupStore.open('objectManager', { 
								data: { 
									collectionId: message.collectionId, 
									type: I.ObjectManagerPopup.Favorites,
								} 
							});
						}, Constant.delay.popup + 10);
					};

					analytics.event('Import', { middleTime: message.middleTime, type });
				};

				if (callBack) {	
					callBack(message);
				};
			});
		});
	};

	export (ids: string[], type: I.ExportType, param: any, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		const { zip, nested, files, archived, json, route } = param;

		this.openDir({ buttonLabel: translate('commonExport') }, paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(commonStore.space, paths[0], ids, type, zip, nested, files, archived, json, (message: any) => {
				if (message.error.code) {
					return;
				};

				Renderer.send('pathOpen', paths[0]);
				analytics.event('Export', { type, middleTime: message.middleTime, route });

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	copyBlocks (rootId: string, ids: string[], isCut: boolean) {
		const root = blockStore.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		const { focused } = focus.state;

		if (root.isLocked() && !ids.length) {
			return;
		};

		const range = UtilCommon.objectCopy(focus.state.range);
		const cmd = isCut ? 'BlockCut' : 'BlockCopy';
		const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));

		let blocks = blockStore.unwrapTree(tree).filter(it => ids.includes(it.id));

		ids.forEach((id: string) => {
			const block = blockStore.getLeaf(rootId, id);
			if (block && block.isTable()) {
				blocks = blocks.concat(blockStore.unwrapTree([ blockStore.wrapTree(rootId, block.id) ]));
			};
		});

		blocks = UtilCommon.arrayUniqueObjects(blocks, 'id');
		blocks = blocks.map((it: I.Block) => {
			const element = blockStore.getMapElement(rootId, it.id);

			if (it.type == I.BlockType.Dataview) {
				it.content.views = dbStore.getViews(rootId, it.id);
			};

			it.childrenIds = element.childrenIds;
			return it;
		});

		C[cmd](rootId, blocks, range, (message: any) => {
			UtilCommon.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range,
					blocks: (message.anySlot || []).map(Mapper.From.Block),
				},
			});

			if (isCut) {
				menuStore.closeAll([ 'blockContext', 'blockAction' ]);

				focus.set(focused, { from: range.from, to: range.from });
				focus.apply();
			};
		});

		analytics.event(isCut ? 'CutBlock' : 'CopyBlock');
	};

	removeSpace (id: string, route: string, callBack?: (message: any) => void) {
		const { accountSpaceId } = authStore;
		const space = UtilObject.getSpaceview();
		const deleted = UtilObject.getSpaceviewBySpaceId(id);

		if (!deleted) {
			return;
		};

		analytics.event('ClickDeleteSpace', { route });

		popupStore.open('confirm', {
			data: {
				title: UtilCommon.sprintf(translate('spaceDeleteWarningTitle'), deleted.name),
				text: translate('spaceDeleteWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => {
					analytics.event('ClickDeleteSpaceWarning', { type: 'Delete' });

					const cb = () => {
						C.SpaceDelete(id, (message: any) => {
							if (callBack) {
								callBack(message);
							};

							if (!message.error.code) {
								Preview.toastShow({ text: UtilCommon.sprintf(translate('spaceDeleteToast'), deleted.name) });
								analytics.event('DeleteSpace', { type: deleted.spaceAccessType });
							};
						});
					};

					if (space.id == deleted.id) {
						UtilRouter.switchSpace(accountSpaceId, '', cb);
					} else {
						cb();
					};
				},
				onCancel: () => {
					analytics.event('ClickDeleteSpaceWarning', { type: 'Cancel' });
				}
			},
		});
	};

	setInterfaceLang (id: string) {
		Renderer.send('setInterfaceLang', id);
		analytics.event('SwitchInterfaceLanguage', { type: id });
	};

	setSpellingLang (id: string) {
		Renderer.send('setSpellingLang', id);
		analytics.event('AddSpellcheckLanguage', { type: id });
	};

	importUsecase (spaceId: string, id: I.Usecase, callBack?: () => void) {
		C.ObjectImportUseCase(spaceId, id, (message: any) => {
			blockStore.closeRecentWidgets();

			if (callBack) {
				callBack();
			};
		});
	};

	setIsFavorite (objectIds: string[], v: boolean, route: string) {
		C.ObjectListSetIsFavorite(objectIds, v, () => {
			analytics.event(v ? 'AddToFavorites' : 'RemoveFromFavorites', { count: objectIds.length, route });
		});
	};

	createWidgetFromObject (rootId: string, objectId: string, targetId: string, position: I.BlockPosition) {
		const object = detailStore.get(rootId, objectId);

		let layout = I.WidgetLayout.Link;

		if (object && !object._empty_) {
			if (UtilObject.isFileOrSystemLayout(object.layout)) {
				layout = I.WidgetLayout.Link;
			} else 
			if (UtilObject.isSetLayout(object.layout)) {
				layout = I.WidgetLayout.Compact;
			} else
			if (UtilObject.isPageLayout(object.layout)) {
				layout = I.WidgetLayout.Tree;
			};
		};

		const limit = Number(UtilMenu.getWidgetLimits(layout)[0]?.id) || 0;
		const newBlock = { 
			type: I.BlockType.Link,
			content: { 
				targetBlockId: objectId, 
			},
		};

		C.BlockCreateWidget(blockStore.widgets, targetId, newBlock, position, layout, limit, () => {
			analytics.event('AddWidget', { type: layout });
		});
	};

};

export default new Action();
