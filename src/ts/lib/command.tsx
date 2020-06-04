import { I, Util, Mark, dispatcher, StructEncode } from 'ts/lib';
import { blockStore } from 'ts/store';

const Struct = new StructEncode();
const Constant = require('json/constant.json');

const VersionGet = (callBack?: (message: any) => void) => {
	dispatcher.request('versionGet', {}, callBack);
};

const ImageGetBlob = (hash: string, size: number, callBack?: (message: any) => void) => {
	const request = {
		hash: hash,
		size: size
	};
	dispatcher.request('imageGetBlob', request, callBack);
};

const ConfigGet = (callBack?: (message: any) => void) => {
	dispatcher.request('configGet', {}, callBack);
};

const Shutdown = (callBack?: (message: any) => void) => {
	dispatcher.request('shutdown', {}, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = {
		url: url,
	};
	dispatcher.request('linkPreview', request, callBack);
};

const UploadFile = (url: string, localPath: string, type: I.FileType, enc: boolean, callBack?: (message: any) => void) => {
	const request = {
		url: url,
		localPath: localPath,
		type: type,
		disableEncryption: enc,
	};
	dispatcher.request('uploadFile', request, callBack);
};

const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = {
		id: id,
	};
	dispatcher.request('processCancel', request, callBack);
};

const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = {
		rootPath: path,
	};
	dispatcher.request('walletCreate', request, callBack);
};

const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = {
		rootPath: path,
		mnemonic: mnemonic,
	};
	dispatcher.request('walletRecover', request, callBack);
};

const AccountCreate = (name: string, path: string, code: string, callBack?: (message: any) => void) => {
	const request = {
		name: name, 
		avatarLocalPath: path,
		alphaInviteCode: code,
	};
	dispatcher.request('accountCreate', request, callBack);
};

const AccountRecover = (callBack?: (message: any) => void) => {
	dispatcher.request('accountRecover', {}, callBack);
};

const AccountSelect = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = {
		id: id,
		rootPath: path,
	};
	dispatcher.request('accountSelect', request, callBack);
};

const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = {
		removeData: removeData,
	};
	dispatcher.request('accountStop', request, callBack);
};

const ExternalDropFiles = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		dropTargetId: targetId,
		position: position,
		localFilePaths: paths,
	};
	dispatcher.request('externalDropFiles', request, callBack);
};

const NavigationListPages = (callBack?: (message: any) => void) => {
	dispatcher.request('navigationListPages', {}, callBack);
};

const NavigationGetPageInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = {
		pageId: pageId,
	};
	dispatcher.request('navigationGetPageInfoWithLinks', request, callBack);
};

const BlockGetPublicWebURL = (contextId: string, callBack?: (message: any) => void) => {
	const request = {
		blockId: contextId,
	};
	dispatcher.request('blockGetPublicWebURL', request, callBack);
};

const BlockOpen = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = {
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	};
	dispatcher.request('blockOpen', request, callBack);
};

const BlockOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = {};
	dispatcher.request('blockOpenBreadcrumbs', request, callBack);
};

const BlockSetBreadcrumbs = (contextId: string, pageIds: string[], callBack?: (message: any) => void) => {
	const request = {
		breadcrumbsId: contextId,
		ids: pageIds,
	};
	dispatcher.request('blockSetBreadcrumbs', request, callBack);
};

const BlockClose = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = {
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	};
	dispatcher.request('blockClose', request, callBack);
};

const BlockUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
	};
	dispatcher.request('blockUndo', request, callBack);
};

const BlockRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
	};
	dispatcher.request('blockRedo', request, callBack);
};

const BlockCreate = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		block: blockStore.prepareBlockToProto(block),
		contextId: contextId,
		targetId: targetId,
		position: position,
	};
	dispatcher.request('blockCreate', request, callBack);
};

const BlockCreatePage = (contextId: string, targetId: string, details: any, position: I.BlockPosition, callBack?: (message: any) => void) => {
	details = details || {};
	details.name = String(details.name || Constant.default.name);
	
	const request = {
		contextId: contextId,
		targetId: targetId,
		position: position,
		details: Struct.encodeStruct(details),
	};
	dispatcher.request('blockCreatePage', request, callBack);
};

const BlockUnlink = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
	};
	dispatcher.request('blockUnlink', request, callBack);
};

const BlockSetTextText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		text: text,
		marks: { marks: Mark.checkRanges(text, marks) },
	};
	dispatcher.request('blockSetTextText', request, callBack);
};

const BlockSetTextChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		checked: checked,
	};
	dispatcher.request('blockSetTextChecked', request, callBack);
};

const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		fields: Struct.encodeStruct(fields || {}),
	};
	dispatcher.request('blockSetFields', request, callBack);
};

const BlockSetDetails = (contextId: string, details: any[], callBack?: (message: any) => void) => {
	details = details.map((it: any) => { 
		it.value = Struct.encodeValue(it.value);
		return it; 
	});
	
	const request = {
		contextId: contextId,
		details: details,
	};
	dispatcher.request('blockSetDetails', request, callBack);
};

const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	};
	dispatcher.request('blockMerge', request, callBack);
};

const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		range: range,
		style: style,
	};
	dispatcher.request('blockSplit', request, callBack);
};

const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, callBack?: (message: any) => void) => {
	const request: any = {
		contextId: contextId,
		blockId: blockId,
		url: url,
	};
	dispatcher.request('blockBookmarkFetch', request, callBack);	
};

const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request: any = {
		contextId: contextId,
		targetId: targetId,
		position: position,
		url: url,
	};
	dispatcher.request('blockBookmarkCreateAndFetch', request, callBack);	
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
	dispatcher.request('blockUpload', request, callBack);	
};

const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	const request: any = {
		contextId: contextId,
		targetId: targetId,
		position: position,
	};
	if (url) {
		request.url = url;
	};
	if (path) {
		request.filePath = path;
	};
	dispatcher.request('blockFileCreateAndUpload', request, callBack);	
};

const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request: any = {
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
		selectedTextRange: range,
	};
	dispatcher.request('blockCopy', request, callBack);	
};

const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request: any = {
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
		selectedTextRange: range,
	};
	dispatcher.request('blockCut', request, callBack);	
};

const BlockExportPrint = (contextId: string, blocks: I.Block[], callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request: any = {
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
	};
	dispatcher.request('blockExport', request, callBack);
};

const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, callBack?: (message: any) => void) => {
	data = Util.objectCopy(data);

	const request: any = {
		contextId: contextId,
		focusedBlockId: focusedId,
		selectedTextRange: range,
		isPartOfBlock: isPartOfBlock,
		selectedBlockIds: blockIds,
		textSlot: data.text,
		htmlSlot: data.html,
		anySlot: (data.anytype || []).map((it: any) => { return blockStore.prepareBlockToProto(it); }),
	};
	dispatcher.request('blockPaste', request, callBack);	
};

const BlockImportMarkdown = (contextId: string, path: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		importPath: path,
	};
	dispatcher.request('blockImportMarkdown', request, callBack);
};

const BlockListMove = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		targetContextId: targetContextId,
		blockIds: blockIds,
		dropTargetId: targetId,
		position: position,
	};
	dispatcher.request('blockListMove', request, callBack);
};

const BlockListMoveToNewPage = (contextId: string, blockIds: string[], details: any, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		details: Struct.encodeStruct(details || {}),
		dropTargetId: targetId,
		position: position,
	};
	dispatcher.request('blockListMoveToNewPage', request, callBack);
};

const BlockListConvertChildrenToPages = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
	};
	dispatcher.request('blockListConvertChildrenToPages', request, callBack);
};

const BlockListDuplicate = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		targetId: targetId,
		position: position,
	};
	dispatcher.request('blockListDuplicate', request, callBack);
};

const BlockListSetTextStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		style: style,
	};
	dispatcher.request('blockListSetTextStyle', request, callBack);
};

const BlockListSetDivStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		style: style,
	};
	dispatcher.request('blockListSetDivStyle', request, callBack);
};

const BlockListSetTextColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	};
	dispatcher.request('blockListSetTextColor', request, callBack);
};

const BlockListSetTextMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		mark: mark,
	};
	dispatcher.request('blockListSetTextMark', request, callBack);
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
	dispatcher.request('blockListSetFields', request, callBack);	
};

const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	};
	dispatcher.request('blockListSetBackgroundColor', request, callBack);
};

const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockAlign, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		align: align,
	};
	dispatcher.request('blockListSetAlign', request, callBack);
};

const BlockListSetPageIsArchived = (contextId: string, blockIds: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockIds: blockIds,
		isArchived: isArchived,
	};
	dispatcher.request('blockListSetPageIsArchived', request, callBack);
};

const BlockListDeletePage = (blockIds: string[], callBack?: (message: any) => void) => {
	const request = {
		blockIds: blockIds,
	};
	dispatcher.request('blockListDeletePage', request, callBack);
};

const BlockCreateDataviewView = (contextId: string, blockId: string, view: any, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		view: view,
	};
	dispatcher.request('blockCreateDataviewView', request, callBack);
};

const BlockSetDataviewView = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		viewId: viewId,
		view: view,
	};
	dispatcher.request('blockSetDataviewView', request, callBack);
};

const BlockSetDataviewActiveView = (contextId: string, blockId: string, viewId: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = {
		contextId: contextId,
		blockId: blockId,
		viewId: viewId,
		offset: offset,
		limit: limit,
	};
	dispatcher.request('blockSetDataviewActiveView', request, callBack);
};

export {
	VersionGet,
	
	ImageGetBlob,
	ConfigGet,
	Shutdown,
	LinkPreview,
	UploadFile,
	ProcessCancel,
	
	
	WalletCreate,
	WalletRecover,
	
	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,
	
	ExternalDropFiles,

	NavigationListPages,
	NavigationGetPageInfoWithLinks,
	
	BlockGetPublicWebURL,
	BlockOpen,
	BlockOpenBreadcrumbs,
	BlockSetBreadcrumbs,
	BlockClose,
	BlockUndo,
	BlockRedo,
	BlockUnlink,
	BlockMerge,
	BlockSplit,
	BlockBookmarkFetch,
	BlockBookmarkCreateAndFetch,
	BlockUpload,
	BlockFileCreateAndUpload,
	BlockCopy,
	BlockCut,
	BlockExportPrint,
	BlockPaste,
	BlockImportMarkdown,

	BlockCreate,
	BlockCreatePage,
	BlockCreateDataviewView,
	
	BlockSetTextText,
	BlockSetTextChecked,
	BlockSetFields,
	BlockSetDetails,
	BlockSetDataviewView,
	BlockSetDataviewActiveView,
	
	BlockListMove,
	BlockListMoveToNewPage,
	BlockListConvertChildrenToPages,
	BlockListDuplicate,
	BlockListSetBackgroundColor,
	BlockListSetTextColor,
	BlockListSetTextStyle,
	BlockListSetTextMark,
	BlockListSetDivStyle,
	BlockListSetFields,
	BlockListSetAlign,
	BlockListSetPageIsArchived,
	BlockListDeletePage,
};