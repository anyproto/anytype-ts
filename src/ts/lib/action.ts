import { I, C, focus, analytics, Renderer, Preview, UtilCommon, Storage, UtilData, translate } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, dbStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

class Action {

	pageClose (rootId: string, close: boolean) {
		const { profile } = blockStore;

		if (rootId == profile) {
			return;
		};

		const onClose = () => {
			const blocks = blockStore.getBlocks(rootId, it => it.isDataview());

			for (let block of blocks) {
				this.dbClearBlock(rootId, block.id);
			};

			this.dbClearRoot(rootId);

			blockStore.clear(rootId);
			authStore.threadRemove(rootId);
		};

		if (close) {
			C.ObjectClose(rootId, onClose);
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
		const { type, hash } = content;

		if (!hash) {
			return;
		};
		
		const url = block.isFileImage() ? commonStore.imageUrl(hash, 1000000) : commonStore.fileUrl(hash);
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
		let next = blockStore.getNextBlock(rootId, blockId, -1, (it: any) => {
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
		Storage.deleteToggleId('widget', id);
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
		
		window.Electron.showOpenDialog(options).then(({ filePaths }) => {
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

		window.Electron.showOpenDialog(options).then(({ filePaths }) => {
			if ((filePaths == undefined) || !filePaths.length) {
				return;
			};

			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	export (ids: string[], format: I.ExportType, zip: boolean, nested: boolean, files: boolean, archived: boolean, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		this.openDir({ buttonLabel: translate('commonExport') }, paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(paths[0], ids, format, zip, nested, files, archived, (message: any) => {
				if (message.error.code) {
					return;
				};

				Renderer.send('pathOpen', paths[0]);
				analytics.event('Export', { type: format, middleTime: message.middleTime });

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	install (object: any, showToast: boolean, callBack?: (message: any) => void) {
		C.WorkspaceObjectAdd(object.id, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			let { details } = message;
			let toast = '';
			let subId = '';

			switch (object.type) {
				case Constant.storeTypeId.type:
					toast = UtilCommon.sprintf(translate('toastObjectTypeAdded'), object.name);
					subId = Constant.subId.type;
					break;

				case Constant.storeTypeId.relation:
					toast = UtilCommon.sprintf(translate('toastRelationAdded'), object.name);
					subId = Constant.subId.relation;
					break;
			};

			if (showToast) {
				Preview.toastShow({ text: toast });
			};

			detailStore.update(subId, { id: details.id, details }, false);
			analytics.event('ObjectInstall', { objectType: object.type, relationKey: object.relationKey });
		});
	};

	uninstall (object: any, showToast: boolean, callBack?: (message: any) => void) {
		let title = '';
		let text = '';
		let toast = '';
		
		switch (object.type) {
			case Constant.typeId.type:
				title = translate('libActionUninstallTypeTitle');
				text = translate('libActionUninstallTypeText');
				toast = UtilCommon.sprintf(translate('toastObjectTypeRemoved'), object.name);
				break;

			case Constant.typeId.relation:
				title = translate('libActionUninstallRelationTitle');
				text = translate('libActionUninstallRelationText');
				toast = UtilCommon.sprintf(translate('toastRelationRemoved'), object.name);
				break;
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
						analytics.event('ObjectUninstall', { objectType: object.type, count: 1 });
					});
				},
			},
		});
	};

	delete (ids: string[], callBack?: () => void): void {
		const count = ids.length;

		analytics.event('ShowDeletionWarning');

		popupStore.open('confirm', {
			data: {
				title: UtilCommon.sprintf(translate('commonDeletionWarningTitle'), count, UtilCommon.plural(count, translate('pluralObject'))),
				text: translate('commonDeletionWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => { 
					C.ObjectListDelete(ids); 
					callBack();
					analytics.event('RemoveCompletely', { count });
				},
				onCancel: () => { callBack(); }
			},
		});
	};

	restoreFromBackup (onError: (error: { code: number, description: string }) => boolean) {
		const { walletPath } = authStore;

		this.openFile([ 'zip' ], paths => {
			C.AccountRecoverFromLegacyExport(paths[0], walletPath, UtilCommon.rand(1, Constant.iconCnt), (message: any) => {
				if (onError(message.error)) {
					return;
				};

				const { accountId } = message;

				C.ObjectImport({ paths, noCollection: true }, [], false, I.ImportType.Protobuf, I.ImportMode.AllOrNothing, false, true, (message: any) => {
					if (onError(message.error)) {
						return;
					};

					C.AccountSelect(accountId, walletPath, (message: any) => {
						if (onError(message.error) || !message.account) {
							return;
						};

						UtilData.onAuth(message.account, { routeParam: { animate: true } }, () => {
							window.setTimeout(() => {
								popupStore.open('migration', { data: { type: 'import' } });
							}, Constant.delay.popup);

							blockStore.closeRecentWidgets();
						});
					});
				});
			});
		});
	};

};

export default new Action();
