import { I, C, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

class Action {
	
	move (rootId: string, blockId: string, blockIds: string[]) {
		commonStore.popupOpen('navigation', { 
			preventResize: true,
			data: { 
				type: I.NavigationType.Move, 
				rootId: rootId,
				blockId: blockId,
				blockIds: blockIds,
			}, 
		});
	};

	download (block: I.Block) {
		const { content } = block;
		const { hash } = content;

		if (!hash) {
			return;
		};
		
		const url = block.isImage() ? commonStore.imageUrl(hash, Constant.size.image) : commonStore.fileUrl(hash);
		ipcRenderer.send('download', url);
	};

	duplicate (rootId: string, blockId: string, blockIds: string[]) {
		C.BlockListDuplicate(rootId, blockIds, blockId, I.BlockPosition.Bottom, (message: any) => {
			const lastId = message.blockIds && message.blockIds.length ? message.blockIds[message.blockIds.length - 1] : '';
			this.focusToEnd(rootId, lastId);
		});
	};

	remove (rootId: string, blockId: string, blockIds: string[]) {
		let next = blockStore.getNextBlock(rootId, blockId, -1, (it: any) => {
			return it.type == I.BlockType.Text;
		});
		
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (next) {
				this.focusToEnd(rootId, next.id);
			};
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
		
};

export default new Action();