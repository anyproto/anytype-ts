import { I, Mark, dispatcher, StructEncode } from 'ts/lib';
import { blockStore } from 'ts/store';

const Struct = new StructEncode();

const ImageGetBlob = (hash: string, size: I.ImageSize, callBack?: (message: any) => void) => {
	const request = {
		hash: hash,
		size: size
	};
	dispatcher.call('imageGetBlob', request, callBack);
};

const ConfigGet = (callBack?: (message: any) => void) => {
	dispatcher.call('configGet', {}, callBack);
};

const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = {
		rootPath: path,
	};
	dispatcher.call('walletCreate', request, callBack);
};

const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = {
		rootPath: path,
		mnemonic: mnemonic,
	};
	dispatcher.call('walletRecover', request, callBack);
};

const AccountCreate = (name: string, path: string, callBack?: (message: any) => void) => {
	const request = {
		name: name, 
		avatarLocalPath: path,
	};
	dispatcher.call('accountCreate', request, callBack);
};

const AccountRecover = (callBack?: (message: any) => void) => {
	dispatcher.call('accountRecover', {}, callBack);
};

const AccountSelect = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = {
		id: id,
		rootPath: path,
	};
	dispatcher.call('accountSelect', request, callBack);
};

const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = {
		removeData: removeData,
	};
	dispatcher.call('accountStop', request, callBack);
};

const BlockOpen = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = {
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	};
	dispatcher.call('blockOpen', request, callBack);
};

const BlockOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = {};
	dispatcher.call('blockOpenBreadcrumbs', request, callBack);
};

const BlockCutBreadcrumbs = (id: string, index: number, callBack?: (message: any) => void) => {
	const request = {
		breadcrumbsId: id,
		index: index,
	};
	dispatcher.call('blockCutBreadcrumbs', request, callBack);
};

const BlockClose = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = {
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	};
	dispatcher.call('blockClose', request, callBack);
};

const BlockUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
	};
	dispatcher.call('blockUndo', request, callBack);
};

const BlockRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
	};
	dispatcher.call('blockRedo', request, callBack);
};

const BlockCreate = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		block: blockStore.prepareBlockToProto(block),
		contextId: contextId,
		targetId: targetId,
		position: position,
	};
	dispatcher.call('blockCreate', request, callBack);
};

const BlockCreatePage = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		block: blockStore.prepareBlockToProto(block),
		contextId: contextId,
		targetId: targetId,
		position: position,
	};
	dispatcher.call('blockCreatePage', request, callBack);
};

const BlockReplace = (block: any, contextId: string, blockId: string, callBack?: (message: any) => void) => {
	const request = {
		block: blockStore.prepareBlockToProto(block),
		contextId: contextId,
		blockId: blockId,
	};
	dispatcher.call('blockReplace', request, callBack);
};

const BlockUnlink = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
	};
	dispatcher.call('blockUnlink', request, callBack);
};

const BlockSetIconName = (contextId: string, blockId: string, name: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		name: name,
	};
	dispatcher.call('blockSetIconName', request, callBack);
};

const BlockSetTextText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		text: text,
		marks: { marks: Mark.checkRanges(text, marks) },
	};
	dispatcher.call('blockSetTextText', request, callBack);
};

const BlockSetTextChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		checked: checked,
	};
	dispatcher.call('blockSetTextChecked', request, callBack);
};

const BlockListSetTextColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	};
	dispatcher.call('blockListSetTextColor', request, callBack);
};

const BlockListSetTextBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	};
	dispatcher.call('blockListSetTextBackgroundColor', request, callBack);
};

const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		fields: Struct.encodeStruct(fields || {}),
	};
	dispatcher.call('blockSetFields', request, callBack);
};

const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	};
	dispatcher.call('blockMerge', request, callBack);
};

const BlockSplit = (contextId: string, blockId: string, position: number, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		cursorPosition: position,
	};
	dispatcher.call('blockSplit', request, callBack);
};

const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request: any = {
		contextId: contextId,
		blockId: blockId,
	};
	if (url) {
		request.url = url;
	};
	if (path) {
		request.filePath = path;
	};
	dispatcher.call('blockUpload', request, callBack);	
};

const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], data: any, callBack?: (message: any) => void) => {
	const request: any = {
		contextId: contextId,
		focusedBlockId: focusedId,
		selectedTextRange: range,
		selectedBlockIds: blockIds,
		textSlot: data.text,
		htmlSlot: data.html,
		anySlot: data.anytype,
	};
	dispatcher.call('blockPaste', request, callBack);	
};

const BlockListMove = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		dropTargetId: targetId,
		position: position,
	};
	dispatcher.call('blockListMove', request, callBack);
};

const BlockListDuplicate = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		targetId: targetId,
		position: position,
	};
	dispatcher.call('blockListDuplicate', request, callBack);
};

const BlockListSetTextStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		style: style,
	};
	dispatcher.call('blockListSetTextStyle', request, callBack);
};

const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map((it: any) => {
		it.fields = Struct.encodeStruct(it.fields || {});
		return it;
	});
	
	const request: any = {
		contextId: contextId,
		blockFields: fields,
	};
	dispatcher.call('blockListSetFields', request, callBack);	
};

export {
	ImageGetBlob,
	ConfigGet,
	
	WalletCreate,
	WalletRecover,
	
	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,
	
	BlockOpen,
	BlockOpenBreadcrumbs,
	BlockCutBreadcrumbs,
	BlockClose,
	BlockUndo,
	BlockRedo,
	BlockCreate,
	BlockCreatePage,
	BlockReplace,
	BlockUnlink,
	BlockSetIconName,
	BlockListMove,
	BlockMerge,
	BlockSplit,
	BlockUpload,
	BlockPaste,
	
	BlockSetTextText,
	BlockSetTextChecked,
	BlockSetFields,
	
	BlockListDuplicate,
	BlockListSetTextColor,
	BlockListSetTextBackgroundColor,
	BlockListSetTextStyle,
	BlockListSetFields,
};