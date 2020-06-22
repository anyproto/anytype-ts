import { I, M, Util, Mark, dispatcher, Encode } from 'ts/lib';
import { blockStore } from 'ts/store';
import { PassThrough } from 'stream';

const Constant = require('json/constant.json');
const Commands = require('lib/pb/protos/commands_pb');
const Rpc = Commands.Rpc;

console.log(Commands);

const VersionGet = (callBack?: (message: any) => void) => {
	const request = new Rpc.Version.Get.Request({});
	dispatcher.request('versionGet', request, callBack);
};

const ImageGetBlob = (hash: string, size: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Ipfs.Image.Get.Blob.Request({
		hash: hash,
		size: size
	});
	dispatcher.request('imageGetBlob', request, callBack);
};

const ConfigGet = (callBack?: (message: any) => void) => {
	const request = new Rpc.Config.Get.Request({});
	dispatcher.request('configGet', request, callBack);
};

const Shutdown = (callBack?: (message: any) => void) => {
	const request = new Rpc.Shutdown.Request({});
	dispatcher.request('shutdown', {}, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request({
		url: url,
	});
	dispatcher.request('linkPreview', request, callBack);
};

const UploadFile = (url: string, localPath: string, type: I.FileType, enc: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.UploadFile.Request({
		url: url,
		localPath: localPath,
		type: type,
		disableEncryption: enc,
	});
	dispatcher.request('uploadFile', request, callBack);
};

const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Process.Cancel.Request({
		id: id,
	});
	dispatcher.request('processCancel', request, callBack);
};

const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Create.Request({
		rootPath: path,
	});
	dispatcher.request('walletCreate', request, callBack);
};

const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Recover.Request({
		rootPath: path,
		mnemonic: mnemonic,
	});
	dispatcher.request('walletRecover', request, callBack);
};

const AccountCreate = (name: string, path: string, code: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Create.Request({
		name: name, 
		avatarLocalPath: path,
		alphaInviteCode: code,
	});
	dispatcher.request('accountCreate', request, callBack);
};

const AccountRecover = (callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Recover.Request({});
	dispatcher.request('accountRecover', request, callBack);
};

const AccountSelect = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Select.Request({
		id: id,
		rootPath: path,
	});
	dispatcher.request('accountSelect', request, callBack);
};

const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Stop.Request({
		removeData: removeData,
	});
	dispatcher.request('accountStop', request, callBack);
};

const ExternalDropFiles = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ExternalDrop.Files.Request({
		contextId: contextId,
		dropTargetId: targetId,
		position: position,
		localFilePaths: paths,
	});
	dispatcher.request('externalDropFiles', request, callBack);
};

const NavigationListPages = (callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.ListPages.Request({});
	dispatcher.request('navigationListPages', request, callBack);
};

const NavigationGetPageInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.GetPageInfoWithLinks.Request({
		pageId: pageId,
	});
	dispatcher.request('navigationGetPageInfoWithLinks', request, callBack);
};

const BlockGetPublicWebURL = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.GetPublicWebURL.Request({
		blockId: contextId,
	});
	dispatcher.request('blockGetPublicWebURL', request, callBack);
};

const BlockOpen = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Open.Request({
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	});
	dispatcher.request('blockOpen', request, callBack);
};

const BlockOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = new Rpc.Block.OpenBreadcrumbs.Request({});
	dispatcher.request('blockOpenBreadcrumbs', request, callBack);
};

const BlockSetBreadcrumbs = (contextId: string, pageIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetBreadcrumbs.Request({
		breadcrumbsId: contextId,
		ids: pageIds,
	});
	dispatcher.request('blockSetBreadcrumbs', request, callBack);
};

const BlockClose = (blockId: string, breadcrumbsIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Close.Request({
		blockId: blockId,
		breadcrumbsIds: breadcrumbsIds,
	});
	dispatcher.request('blockClose', request, callBack);
};

const BlockUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Undo.Request({
		contextId: contextId,
	});
	dispatcher.request('blockUndo', request, callBack);
};

const BlockRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Redo.Request({
		contextId: contextId,
	});
	dispatcher.request('blockRedo', request, callBack);
};

const BlockCreate = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Request({
		block: blockStore.prepareBlockToProto(block),
		contextId: contextId,
		targetId: targetId,
		position: position,
	});
	dispatcher.request('blockCreate', request, callBack);
};

const BlockCreatePage = (contextId: string, targetId: string, details: any, position: I.BlockPosition, callBack?: (message: any) => void) => {
	details = details || {};
	details.name = String(details.name || Constant.default.name);
	
	const request = new Rpc.Block.CreatePage.Request({
		contextId: contextId,
		targetId: targetId,
		position: position,
		details: Encode.encodeStruct(details),
	});
	dispatcher.request('blockCreatePage', request, callBack);
};

const BlockUnlink = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Unlink.Request({
		contextId: contextId,
		blockIds: blockIds,
	});
	dispatcher.request('blockUnlink', request, callBack);
};

const BlockSetTextText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Text.Text.Request({
		contextId: contextId,
		blockId: blockId,
		text: text,
		marks: { marks: Mark.checkRanges(text, marks) },
	});
	dispatcher.request('blockSetTextText', request, callBack);
};

const BlockSetTextChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Text.Checked.Request({
		contextId: contextId,
		blockId: blockId,
		checked: checked,
	});
	dispatcher.request('blockSetTextChecked', request, callBack);
};

const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Fields.Request({
		contextId: contextId,
		blockId: blockId,
		fields: Encode.encodeStruct(fields || {}),
	});
	dispatcher.request('blockSetFields', request, callBack);
};

const BlockSetDetails = (contextId: string, details: any[], callBack?: (message: any) => void) => {
	details = details.map((it: any) => { 
		it.value = Encode.encodeValue(it.value);
		return it; 
	});
	
	const request = new Rpc.Block.Set.Details.Request({
		contextId: contextId,
		details: details,
	});
	dispatcher.request('blockSetDetails', request, callBack);
};

const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Merge.Request({
		contextId: contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	});
	dispatcher.request('blockMerge', request, callBack);
};

const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Split.Request({
		contextId: contextId,
		blockId: blockId,
		range: range,
		style: style,
	});
	dispatcher.request('blockSplit', request, callBack);
};

const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Bookmark.Fetch.Request({
		contextId: contextId,
		blockId: blockId,
		url: url,
	});
	dispatcher.request('blockBookmarkFetch', request, callBack);	
};

const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Bookmark.CreateAndFetch.Request({
		contextId: contextId,
		targetId: targetId,
		position: position,
		url: url,
	});
	dispatcher.request('blockBookmarkCreateAndFetch', request, callBack);	
};

const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Upload.Request({
		contextId: contextId,
		blockId: blockId,
		url: url,
		filePath: path,
	});
	dispatcher.request('blockUpload', request, callBack);	
};

const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.File.CreateAndUpload.Request({
		contextId: contextId,
		targetId: targetId,
		position: position,
		url: url,
		filePath: path,
	});
	dispatcher.request('blockFileCreateAndUpload', request, callBack);	
};

const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request = new Rpc.Block.Copy.Request({
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
		selectedTextRange: range,
	});
	dispatcher.request('blockCopy', request, callBack);	
};

const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request = new Rpc.Block.Cut.Request({
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
		selectedTextRange: range,
	});
	dispatcher.request('blockCut', request, callBack);	
};

const BlockExportPrint = (contextId: string, blocks: I.Block[], callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);
	
	const request = new Rpc.Block.Export.Print.Request({
		contextId: contextId,
		blocks: blocks.map((it: any) => { return blockStore.prepareBlockToProto(it); }),
	});
	dispatcher.request('blockExport', request, callBack);
};

const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, callBack?: (message: any) => void) => {
	data = Util.objectCopy(data);

	const request = new Rpc.Block.Paste.Request({
		contextId: contextId,
		focusedBlockId: focusedId,
		selectedTextRange: range,
		isPartOfBlock: isPartOfBlock,
		selectedBlockIds: blockIds,
		textSlot: data.text,
		htmlSlot: data.html,
		anySlot: (data.anytype || []).map((it: any) => { return blockStore.prepareBlockToProto(it); }),
	});
	dispatcher.request('blockPaste', request, callBack);	
};

const BlockImportMarkdown = (contextId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ImportMarkdown.Request({
		contextId: contextId,
		importPath: path,
	});
	dispatcher.request('blockImportMarkdown', request, callBack);
};

const BlockListMove = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Move.Request({
		contextId: contextId,
		targetContextId: targetContextId,
		blockIds: blockIds,
		dropTargetId: targetId,
		position: position,
	});
	dispatcher.request('blockListMove', request, callBack);
};

const BlockListMoveToNewPage = (contextId: string, blockIds: string[], details: any, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.MoveToNewPage.Request({
		contextId: contextId,
		blockIds: blockIds,
		details: Encode.encodeStruct(details || {}),
		dropTargetId: targetId,
		position: position,
	});
	dispatcher.request('blockListMoveToNewPage', request, callBack);
};

const BlockListConvertChildrenToPages = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.ConvertChildrenToPages.Request({
		contextId: contextId,
		blockIds: blockIds,
	});
	dispatcher.request('blockListConvertChildrenToPages', request, callBack);
};

const BlockListDuplicate = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Duplicate.Request({
		contextId: contextId,
		blockIds: blockIds,
		targetId: targetId,
		position: position,
	});
	dispatcher.request('blockListDuplicate', request, callBack);
};

const BlockListSetTextStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Style.Request({
		contextId: contextId,
		blockIds: blockIds,
		style: style,
	});
	dispatcher.request('blockListSetTextStyle', request, callBack);
};

const BlockListSetDivStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Div.Style.Request({
		contextId: contextId,
		blockIds: blockIds,
		style: style,
	});
	dispatcher.request('blockListSetDivStyle', request, callBack);
};

const BlockListSetTextColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Color.Request({
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	});
	dispatcher.request('blockListSetTextColor', request, callBack);
};

const BlockListSetTextMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Mark.Request({
		contextId: contextId,
		blockIds: blockIds,
		mark: mark,
	});
	dispatcher.request('blockListSetTextMark', request, callBack);
};

const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map((it: any) => {
		it.fields = Encode.encodeStruct(it.fields || {});
		return it;
	});
	
	const request = new Rpc.BlockList.Set.Fields.Request({
		contextId: contextId,
		blockFields: fields,
	});
	dispatcher.request('blockListSetFields', request, callBack);	
};

const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.BackgroundColor.Request({
		contextId: contextId,
		blockIds: blockIds,
		color: color,
	});
	dispatcher.request('blockListSetBackgroundColor', request, callBack);
};

const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Align.Request({
		contextId: contextId,
		blockIds: blockIds,
		align: align,
	});
	dispatcher.request('blockListSetAlign', request, callBack);
};

const BlockListSetPageIsArchived = (contextId: string, blockIds: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.PageIsArchived.Request({
		contextId: contextId,
		blockIds: blockIds,
		isArchived: isArchived,
	});
	dispatcher.request('blockListSetPageIsArchived', request, callBack);
};

const BlockListDeletePage = (blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Delete.Page.Request({
		blockIds: blockIds,
	});
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
		view: blockStore.prepareViewToProto(Util.objectCopy(new M.View(view))),
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