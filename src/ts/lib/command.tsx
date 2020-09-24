import { I, Util, Mark, dispatcher, Encode, Mapper } from 'ts/lib';
import { commonStore } from 'ts/store';

const Errors = require('json/error.json');
const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const { ipcRenderer } = window.require('electron');
const Rpc = Commands.Rpc;

const VersionGet = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('versionGet', request, callBack);
};

const ImageGetBlob = (hash: string, size: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Ipfs.Image.Get.Blob.Request();
	
	request.setHash(hash);
    request.setSize(size);

	dispatcher.request('imageGetBlob', request, callBack);
};

const ConfigGet = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('configGet', request, callBack);
};

const Shutdown = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('shutdown', request, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request();

	request.setUrl(url);

	dispatcher.request('linkPreview', request, callBack);
};

const UploadFile = (url: string, localPath: string, type: I.FileType, enc: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.UploadFile.Request();
	
	request.setUrl(url);
	request.setLocalpath(localPath);
	request.setType(type);
	request.setDisableencryption(enc);

	dispatcher.request('uploadFile', request, callBack);
};

const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Process.Cancel.Request();
	
	request.setId(id);

	dispatcher.request('processCancel', request, callBack);
};

const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Create.Request();
	
	request.setRootpath(path);

	dispatcher.request('walletCreate', request, callBack);
};

const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Recover.Request();
	
	request.setRootpath(path);
	request.setMnemonic(mnemonic);

	dispatcher.request('walletRecover', request, callBack);
};

const AccountCreate = (name: string, path: string, code: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Create.Request();
	
	request.setName(name);
	request.setAvatarlocalpath(path);
	request.setAlphainvitecode(code);

	dispatcher.request('accountCreate', request, callBack);
};

const AccountRecover = (callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Recover.Request();

	dispatcher.request('accountRecover', request, callBack);
};

const AccountSelect = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Select.Request();
	
	request.setId(id);
	request.setRootpath(path);

	dispatcher.request('accountSelect', request, callBack);
};

const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Stop.Request();
	
	request.setRemovedata(removeData);

	dispatcher.request('accountStop', request, callBack);
};

const ExternalDropFiles = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ExternalDrop.Files.Request();
	
	request.setContextid(contextId);
	request.setDroptargetid(targetId);
	request.setPosition(position);
	request.setLocalfilepathsList(paths);

	dispatcher.request('externalDropFiles', request, callBack);
};

const PageCreate = (details: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Page.Create.Request();
	
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request('pageCreate', request, callBack);
};

const NavigationListPages = (callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.ListPages.Request();
	dispatcher.request('navigationListPages', request, callBack);
};

const NavigationGetPageInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.GetPageInfoWithLinks.Request();
	
	request.setPageid(pageId);

	dispatcher.request('navigationGetPageInfoWithLinks', request, callBack);
};

const BlockGetPublicWebURL = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.GetPublicWebURL.Request();
	
	request.setBlockid(contextId);

	dispatcher.request('blockGetPublicWebURL', request, callBack);
};

const BlockOpen = (blockId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Open.Request();
	
	request.setBlockid(blockId);

	dispatcher.request('blockOpen', request, callBack);
};

const BlockOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = new Rpc.Block.OpenBreadcrumbs.Request();
	dispatcher.request('blockOpenBreadcrumbs', request, callBack);
};

const BlockSetBreadcrumbs = (contextId: string, pageIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetBreadcrumbs.Request();
	
	request.setBreadcrumbsid(contextId);
	request.setIdsList(pageIds);

	dispatcher.request('blockSetBreadcrumbs', request, callBack);
};

const BlockClose = (blockId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Close.Request();
	
	request.setBlockid(blockId);

	dispatcher.request('blockClose', request, callBack);
};

const BlockUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Undo.Request();
	
	request.setContextid(contextId);

	dispatcher.request('blockUndo', request, callBack);
};

const BlockRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Redo.Request();
	
	request.setContextid(contextId);

	dispatcher.request('blockRedo', request, callBack);
};

const BlockCreate = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Request();
	
	request.setBlock(Mapper.To.Block(block));
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request('blockCreate', request, callBack);
};

const BlockCreatePage = (contextId: string, targetId: string, details: any, position: I.BlockPosition, callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.Block.CreatePage.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request('blockCreatePage', request, callBack);
};

const BlockUnlink = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Unlink.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request('blockUnlink', request, callBack);
};

const BlockSetTextText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	marks = Util.objectCopy(marks);
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark);

	const request = new Rpc.Block.Set.Text.Text.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);
	request.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));

	dispatcher.request('blockSetTextText', request, callBack);
};

const BlockSetTextChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Text.Checked.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setChecked(checked);

	dispatcher.request('blockSetTextChecked', request, callBack);
};

const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Fields.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setFields(Encode.encodeStruct(fields || {}));

	dispatcher.request('blockSetFields', request, callBack);
};

const BlockSetDetails = (contextId: string, details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	const request = new Rpc.Block.Set.Details.Request();

	request.setContextid(contextId);
	request.setDetailsList(details);

	dispatcher.request('blockSetDetails', request, callBack);
};

const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Merge.Request();
	
	request.setContextid(contextId);
	request.setFirstblockid(blockId1);
	request.setSecondblockid(blockId2);

	dispatcher.request('blockMerge', request, callBack);
};

const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Split.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRange(Mapper.To.Range(range));
	request.setStyle(style);
	request.setMode(mode);

	dispatcher.request('blockSplit', request, callBack);
};

const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Bookmark.Fetch.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);

	dispatcher.request('blockBookmarkFetch', request, callBack);
};

const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Bookmark.CreateAndFetch.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setUrl(url);

	dispatcher.request('blockBookmarkCreateAndFetch', request, callBack);
};

const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Upload.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);
	request.setFilepath(path);

	dispatcher.request('blockUpload', request, callBack);
};

const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.File.CreateAndUpload.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setUrl(url);
	request.setFilepath(path);

	dispatcher.request('blockFileCreateAndUpload', request, callBack);
};

const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);

	const request = new Rpc.Block.Copy.Request();
	
	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request('blockCopy', request, callBack);
};

const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);

	const request = new Rpc.Block.Cut.Request();
	
	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request('blockCut', request, callBack);
};

const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, callBack?: (message: any) => void) => {
	data = Util.objectCopy(data);

	const request = new Rpc.Block.Paste.Request();
	
	request.setContextid(contextId);
    request.setFocusedblockid(focusedId);
    request.setSelectedtextrange(Mapper.To.Range(range));
    request.setIspartofblock(isPartOfBlock);
    request.setSelectedblockidsList(blockIds);
    request.setTextslot(data.text);
	request.setHtmlslot(data.html);
	request.setAnyslotList((data.anytype || []).map(Mapper.To.Block));
	request.setFileslotList(data.files.map(Mapper.To.PasteFile));

	dispatcher.request('blockPaste', request, callBack);
};

const BlockImportMarkdown = (contextId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ImportMarkdown.Request();
	
	request.setContextid(contextId);
    request.setImportpath(path);

	dispatcher.request('blockImportMarkdown', request, callBack);
};

const BlockListMove = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Move.Request();
	
	request.setContextid(contextId);
    request.setTargetcontextid(targetContextId);
    request.setBlockidsList(blockIds);
    request.setDroptargetid(targetId);
    request.setPosition(position);

	dispatcher.request('blockListMove', request, callBack);
};

const BlockListMoveToNewPage = (contextId: string, blockIds: string[], details: any, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.MoveToNewPage.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setDetails(Encode.encodeStruct(details || {}));
    request.setDroptargetid(targetId);
    request.setPosition(position);

	dispatcher.request('blockListMoveToNewPage', request, callBack);
};

const BlockListConvertChildrenToPages = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.ConvertChildrenToPages.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);

	dispatcher.request('blockListConvertChildrenToPages', request, callBack);
};

const BlockListDuplicate = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Duplicate.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setTargetid(targetId);
    request.setPosition(position);

	dispatcher.request('blockListDuplicate', request, callBack);
};

const BlockListSetTextStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Style.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockListSetTextStyle', request, callBack);
};

const BlockListSetDivStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Div.Style.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockListSetDivStyle', request, callBack);
};

const BlockListSetTextColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Color.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request('blockListSetTextColor', request, callBack);
};

const BlockListSetTextMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Text.Mark.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setMark(Mapper.To.Mark(mark));

	dispatcher.request('blockListSetTextMark', request, callBack);
};

const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	const request = new Rpc.BlockList.Set.Fields.Request();

	request.setContextid(contextId);
    request.setBlockfieldsList(fields);

	dispatcher.request('blockListSetFields', request, callBack);
};

const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.BackgroundColor.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request('blockListSetBackgroundColor', request, callBack);
};

const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Align.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setAlign(align);

	dispatcher.request('blockListSetAlign', request, callBack);
};

const BlockListSetPageIsArchived = (contextId: string, blockIds: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Set.Page.IsArchived.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setIsarchived(isArchived);

	dispatcher.request('blockListSetPageIsArchived', request, callBack);
};

const BlockListDeletePage = (blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.Delete.Page.Request();
	
	request.setBlockidsList(blockIds);

	dispatcher.request('blockListDeletePage', request, callBack);
};

const BlockCreateDataviewView = (contextId: string, blockId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Dataview.View.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setView(Mapper.To.View(view));

	dispatcher.request('blockCreateDataviewView', request, callBack);
};

const BlockSetDataviewView = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Dataview.View.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setView(Mapper.To.View(view));

	dispatcher.request('blockSetDataviewView', request, callBack);
};

const BlockDeleteDataviewView = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Delete.Dataview.View.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request('blockDeleteDataviewView', request, callBack);
};

const BlockSetDataviewActiveView = (contextId: string, blockId: string, viewId: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Dataview.ActiveView.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setOffset(offset);
	request.setLimit(limit);

	dispatcher.request('blockSetDataviewActiveView', request, callBack);
};

const BlockCreateDataviewRecord = (contextId: string, blockId: string, record: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Dataview.Record.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecord(Encode.encodeStruct(record));

	dispatcher.request('blockCreateDataviewRecord', request, callBack);
};

const BlockUpdateDataviewRecord = (contextId: string, blockId: string, recordId: string, record: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Update.Dataview.Record.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecordid(recordId);
	request.setRecord(Encode.encodeStruct(record));

	dispatcher.request('blockUpdateDataviewRecord', request, callBack);
};

const BlockDeleteDataviewRecord = (contextId: string, blockId: string, recordId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Update.Dataview.Record.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecordid(recordId);

	dispatcher.request('blockDeleteDataviewRecord', request, callBack);
};

const HistoryVersions = (pageId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Versions.Request();
	
	request.setPageid(pageId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request('historyVersions', request, callBack);
};

const HistoryShow = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('historyShow', request, callBack);
};

const HistorySetVersion = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('historySetVersion', request, callBack);
};

const ObjectTypeList = (callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.List.Request();
	
	dispatcher.request('objectTypeList', request, callBack);
};

const ObjectTypeCreate = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('objectTypeCreate', request, callBack);
};

const RelationList = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('relationList', request, callBack);
};

const RelationAdd = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('relationAdd', request, callBack);
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

	PageCreate,

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

	BlockDeleteDataviewView,

	BlockCreateDataviewRecord,
	BlockUpdateDataviewRecord,
	BlockDeleteDataviewRecord,

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

	HistoryVersions,	
	HistoryShow,
	HistorySetVersion,

	ObjectTypeList,
	ObjectTypeCreate,

	RelationList,
	RelationAdd,

};
