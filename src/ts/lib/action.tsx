import { I, C, focus, analytics, Renderer } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, dbStore } from 'Store';

const Constant = require('json/constant.json');

class Action {

	pageClose (rootId: string, close: boolean) {
		const { profile } = blockStore;
		if (rootId == profile) {
			return;
		};

		const onClose = () => {
			const blocks = blockStore.getBlocks(rootId, (it: I.Block) => { return it.isDataview(); });

			for (let block of blocks) {
				dbStore.relationsClear(rootId, block.id);
				dbStore.viewsClear(rootId, block.id);

				this.dbClear(dbStore.getSubId(rootId, block.id));
			};

			blockStore.clear(rootId);
			detailStore.clear(rootId);
			dbStore.relationsClear(rootId, rootId);
			authStore.threadRemove(rootId);
		};

		if (close) {
			C.ObjectClose(rootId, onClose);
		} else {
			onClose();
		};
	};

	dbClear (subId: string) {
		dbStore.metaClear(subId, '');
		dbStore.recordsClear(subId, '');
		dbStore.recordsClear(subId + '/dep', '');

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
	
	download (block: I.Block) {
		const { content } = block;
		const { type, hash } = content;

		if (!hash) {
			return;
		};
		
		const url = block.isFileImage() ? commonStore.imageUrl(hash, Constant.size.image) : commonStore.fileUrl(hash);
		Renderer.send('download', url);

		analytics.event('DownloadMedia', { type });
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

};

export default new Action();