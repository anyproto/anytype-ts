import { I, C, focus, analytics, Renderer, Preview, UtilCommon, Storage, UtilData } from 'Lib';
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
			options.filters = [ { name: '', extensions } ];
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
		this.openDir({ buttonLabel: 'Export' }, paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(commonStore.space, paths[0], ids, format, zip, nested, files, archived, (message: any) => {
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
		C.WorkspaceObjectAdd(commonStore.space, object.id, (message: any) => {
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
				case Constant.storeTypeKey.type:
					toast = `Object type <b>${object.name}</b> has been added to your library`;
					subId = Constant.subId.type;
					break;

				case Constant.storeTypeKey.relation:
					toast = `Relation <b>${object.name}</b> has been added to your library`;
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
		
		switch (object.layout) {
			case I.ObjectLayout.Type: {
				title = 'Are you sure you want to remove this Type?';
				text = 'This Type and any associated Templates will be removed. If you have created any Objects with this Type, they may become more difficult to locate.';
				toast = `Object type <b>${object.name}</b> has been removed from your library`;
				break;
			};

			case I.ObjectLayout.Relation: {
				title = 'Are you sure you want to remove this Relation?';
				text = 'This Relation will be removed from your Library. If you have created any Objects with which use this Relation, you will no longer be able to edit the Relation value.';
				toast = `Relation <b>${object.name}</b> has been removed from your library`;
				break;
			};
		};

		popupStore.open('confirm', {
			data: {
				title,
				text,
				textConfirm: 'Remove',
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
				title: `Are you sure you want to delete ${count} ${UtilCommon.cntWord(count, 'object', 'objects')}?`,
				text: `These objects will be deleted irrevocably. You can't undo this action.`,
				textConfirm: 'Delete',
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

				C.ObjectImport(commonStore.space, { paths, noCollection: true }, [], false, I.ImportType.Protobuf, I.ImportMode.AllOrNothing, false, true, (message: any) => {
					if (onError(message.error)) {
						return;
					};

					C.AccountSelect(accountId, walletPath, (message: any) => {
						if (onError(message.error) || !message.account) {
							return;
						};

						UtilData.onAuth(message.account, message.account.info, { routeParam: { animate: true } }, () => {
							window.setTimeout(() => {
								popupStore.open('migration', { data: { type: 'import' } });
							}, Constant.delay.popup);

							const blocks = blockStore.getBlocks(blockStore.widgets, it => it.isLink() && (it.content.targetBlockId == Constant.widgetId.recent));
							if (blocks.length) {
								Storage.setToggle('widget', blocks[0].parentId, true);
							};
						});
					});
				});
			});
		});
	};

};

export default new Action();