import { I, C, focus, analytics, Renderer, Util } from 'Lib';
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
		const { content } = block;
		const { type, hash } = content;

		if (!hash) {
			return;
		};
		
		const url = block.isFileImage() ? commonStore.imageUrl(hash, Constant.size.image) : commonStore.fileUrl(hash);
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

			analytics.event((contextId == targetContextId ? 'MoveBlock' : 'ReorderBlock'), { count: blockIds.length });
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

	focusToEnd (rootId: string, id: string) {
		const block = blockStore.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

	export (ids: string[], format: I.ExportFormat, zip: boolean, nested: boolean, files: boolean, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		const options = { 
			properties: [ 'openDirectory' ],
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(paths[0], ids, format, zip, nested, files, (message: any) => {
				if (message.error.code) {
					return;
				};

				Renderer.send('pathOpen', paths[0]);
				analytics.event('Export' + I.ExportFormat[format], { middleTime: message.middleTime });

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

			analytics.event('ObjectInstall', { objectType: object.type, relationKey: object.relationKey });
		});
	};

	uninstall (ids: string[], type: string, callBack?: (message: any) => void) {
		let title = '';
		let text = '';
		let subId = '';

		switch (type) {
			case Constant.typeId.type:
				title = 'Are you sure you want to remove this Type?';
				text = 'This Type and any associated Templates will be removed. If you have created any Objects with this Type, they may become more difficult to locate.';
				subId = Constant.subId.type;
				break;

			case Constant.typeId.relation:
				title = 'Are you sure you want to remove this Relation?';
				text = 'This Relation will be removed from your Library. If you have created any Objects with which use this Relation, you will no longer be able to edit the Relation value.';
				subId = Constant.subId.relation;
				break;
		};

		popupStore.open('confirm', {
			data: {
				title,
				text,
				textConfirm: 'Remove',
				colorConfirm: 'red',
				onConfirm: () => {
					C.WorkspaceObjectListRemove(ids, (message: any) => {
						if (message.error.code) {
							return;
						};

						if (callBack) {
							callBack(message);
						};

						ids.forEach(id => detailStore.delete(subId, id));

						Util.toastShow({ text: 'Object has been removed from your space' });
						analytics.event('ObjectUninstall', { objectType: type, count: ids.length });
					});
				},
			},
		});

		
	};

};

export default new Action();