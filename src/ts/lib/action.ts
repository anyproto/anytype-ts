import { I, C, focus, analytics, Renderer, Preview, Util, Storage } from 'Lib';
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

			analytics.event((contextId == targetContextId ? 'ReorderBlock' : 'MoveBlock'), { count: blockIds.length });
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

	removeWidget (id: string) {
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

		analytics.event('DeleteWidget');
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

	openDir (callBack?: (paths: string[]) => void) {
		const options = { 
			properties: [ 'openDirectory' ],
		};

		window.Electron.showOpenDialog(options).then(({ filePaths }) => {
			if ((filePaths == undefined) || !filePaths.length) {
				return;
			};

			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	export (ids: string[], format: I.ExportType, zip: boolean, nested: boolean, files: boolean, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		this.openDir(paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(paths[0], ids, format, zip, nested, files, (message: any) => {
				if (message.error.code) {
					return;
				};

				Renderer.send('pathOpen', paths[0]);
				analytics.event('Export' + I.ExportType[format], { middleTime: message.middleTime });

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	install (object: any, callBack?: (message: any) => void) {
		C.WorkspaceObjectAdd(object.id, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			let { details } = message;
			let toast = '';

			switch (object.type) {
				case Constant.storeTypeId.type:
					toast = `Object type <b>${object.name}</b> has been added to your library`;
					break;

				case Constant.storeTypeId.relation:
					toast = `Relation <b>${object.name}</b> has been added to your library`;

					detailStore.update(Constant.subId.relation, { id: details.id, details }, false);
					break;
			};

			Preview.toastShow({ text: toast });
			analytics.event('ObjectInstall', { objectType: object.type, relationKey: object.relationKey });
		});
	};

	uninstall (object: any, callBack?: (message: any) => void) {
		let title = '';
		let text = '';
		let toast = '';
		
		switch (object.type) {
			case Constant.typeId.type:
				title = 'Are you sure you want to remove this Type?';
				text = 'This Type and any associated Templates will be removed. If you have created any Objects with this Type, they may become more difficult to locate.';
				toast = `Object type <b>${object.name}</b> has been removed from your library`;
				break;

			case Constant.typeId.relation:
				title = 'Are you sure you want to remove this Relation?';
				text = 'This Relation will be removed from your Library. If you have created any Objects with which use this Relation, you will no longer be able to edit the Relation value.';
				toast = `Relation <b>${object.name}</b> has been removed from your library`;
				break;
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

						Preview.toastShow({ text: toast });
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
				title: `Are you sure you want to delete ${count} ${Util.cntWord(count, 'object', 'objects')}?`,
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

};

export default new Action();