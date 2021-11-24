import { I, Util, Mark, dispatcher, Encode, Mapper } from 'ts/lib';
import { dbStore, detailStore } from 'ts/store';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;

const VersionGet = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('versionGet', request, callBack);
};

const DebugSync = (limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Sync.Request();

	request.setRecordstraverselimit(limit);

	dispatcher.request('debugSync', request, callBack);
};

const DebugTree = (blockId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Tree.Request();

	request.setBlockid(blockId);
	request.setPath(path);

	dispatcher.request('debugTree', request, callBack);
};

const ConfigGet = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('configGet', request, callBack);
};

const Shutdown = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('shutdown', request, callBack);
};

const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.FileList.Offload.Request();

	request.setOnlyidsList(ids);
	request.setIncludenotpinned(notPinned);

	dispatcher.request('fileListOffload', request, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request();

	request.setUrl(url);

	dispatcher.request('linkPreview', request, callBack);
};

const Export = (path: string, ids: string[], format: I.ExportFormat, zip: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Export.Request();

	request.setPath(path);
	request.setDocidsList(ids);
	request.setFormat(format);
	request.setZip(zip);

	dispatcher.request('export', request, callBack);
};

const ExportTemplates = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ExportTemplates.Request();

	request.setPath(path);

	dispatcher.request('exportTemplates', request, callBack);
};

const ExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ExportLocalstore.Request();

	request.setPath(path);
	request.setDocidsList(ids);

	dispatcher.request('exportLocalstore', request, callBack);
};

const UploadFile = (url: string, path: string, type: I.FileType, enc: boolean, callBack?: (message: any) => void) => {
	if (!url && !path) {
		return;
	};

	const request = new Rpc.UploadFile.Request();
	
	request.setUrl(url);
	request.setLocalpath(path);
	request.setType(type);
	request.setDisableencryption(enc);

	dispatcher.request('uploadFile', request, callBack);
};

const DownloadFile = (hash: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.DownloadFile.Request();
	
	request.setHash(hash);
	request.setPath(path);

	dispatcher.request('downloadFile', request, callBack);
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

const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Convert.Request();

	request.setMnemonic(mnemonic);
	request.setEntropy(entropy);

	dispatcher.request('walletConvert', request, callBack);
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

const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.GetObjectInfoWithLinks.Request();
	
	request.setObjectid(pageId);

	dispatcher.request('navigationGetObjectInfoWithLinks', request, callBack);
};

const BlockGetPublicWebURL = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.GetPublicWebURL.Request();
	
	request.setBlockid(contextId);

	dispatcher.request('blockGetPublicWebURL', request, callBack);
};

const BlockOpen = (blockId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Open.Request();
	
	request.setBlockid(blockId);
	request.setTraceid(traceId);

	dispatcher.request('blockOpen', request, callBack);
};

const BlockShow = (blockId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Open.Request();
	
	request.setBlockid(blockId);
	request.setTraceid(traceId);

	dispatcher.request('blockShow', request, callBack);
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

const BlockUpdateContent = (block: any, contextId: string, blockId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.UpdateContent.Request();
	
	request.setBlock(Mapper.To.Block(block));
	request.setContextid(contextId);
	request.setBlockid(blockId);

	dispatcher.request('blockUpdateContent', request, callBack);
};

const BlockCreatePage = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.Block.CreatePage.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setDetails(Encode.encodeStruct(details));
	request.setTemplateid(templateId);
	request.setFields(Encode.encodeStruct(fields || {}));

	dispatcher.request('blockCreatePage', request, callBack);
};

const BlockCreateSet = (contextId: string, targetId: string, sources: string[], details: any, position: I.BlockPosition, callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.Block.CreateSet.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setSourceList(sources);
	request.setPosition(position);
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request('blockCreateSet', request, callBack);
};

const BlockUnlink = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Unlink.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request('blockUnlink', request, callBack);
};

const BlockSetTextText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

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

const BlockSetLatexText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Latex.Text.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);

	dispatcher.request('blockSetLatexText', request, callBack);
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

const BlockListConvertChildrenToPages = (contextId: string, blockIds: string[], type: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.ConvertChildrenToPages.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
	request.setObjecttype(type);

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

const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockList.TurnInto.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockListTurnInto', request, callBack);
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

const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.ViewCreate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setView(Mapper.To.View(view));

	dispatcher.request('blockDataviewViewCreate', request, callBack);
};

const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.ViewUpdate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setView(Mapper.To.View(view));

	dispatcher.request('blockDataviewViewUpdate', request, callBack);
};

const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.ViewDelete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request('blockDataviewViewDelete', request, callBack);
};

const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.ViewSetPosition.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setPosition(position);

	dispatcher.request('blockDataviewViewSetPosition', request, callBack);
};

const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.ViewSetActive.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setOffset(offset);
	request.setLimit(limit);

	dispatcher.request('blockDataviewViewSetActive', request, callBack);
};

const BlockDataviewRecordCreate = (contextId: string, blockId: string, record: any, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordCreate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecord(Encode.encodeStruct(record));
	request.setTemplateid(templateId);

	dispatcher.request('blockDataviewRecordCreate', request, callBack);
};

const BlockDataviewRecordUpdate = (contextId: string, blockId: string, recordId: string, record: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordUpdate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecordid(recordId);
	request.setRecord(Encode.encodeStruct(record));

	dispatcher.request('blockDataviewRecordUpdate', request, callBack);
};

const BlockDataviewRecordDelete = (contextId: string, blockId: string, recordId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordDelete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecordid(recordId);

	dispatcher.request('blockDataviewRecordDelete', request, callBack);
};

const BlockDataviewRelationListAvailable = (contextId: string, blockId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RelationListAvailable.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);

	dispatcher.request('blockDataviewRelationListAvailable', request, callBack);
};

const BlockRelationList = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Relation.List.Request();
	
	request.setContextid(contextId);

	dispatcher.request('blockRelationList', request, callBack);
};

const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Relation.SetKey.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setKey(relationKey);

	dispatcher.request('blockRelationSetKey', request, callBack);
};


const BlockRelationRemove = (contextId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Relation.Remove.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);

	dispatcher.request('blockRelationRemove', request, callBack);
};

const BlockRelationUpdate = (contextId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Relation.Update.Request();
	
	request.setContextid(contextId);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('blockRelationUpdate', request, callBack);
};

const HistoryVersions = (pageId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Versions.Request();
	
	request.setPageid(pageId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request('historyVersions', request, callBack);
};

const BlockDataviewRelationAdd = (contextId: string, blockId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RelationAdd.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('blockDataviewRelationAdd', request, callBack);
};

const BlockDataviewRelationUpdate = (contextId: string, blockId: string, relationKey: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RelationUpdate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('blockDataviewRelationUpdate', request, callBack);
};

const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RelationDelete.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);

	dispatcher.request('blockDataviewRelationDelete', request, callBack);
};

const BlockDataviewRecordRelationOptionAdd = (contextId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordRelationOptionAdd.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);
	request.setRecordid(recordId);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('blockDataviewRecordRelationOptionAdd', request, callBack);
};

const BlockDataviewRecordRelationOptionUpdate = (contextId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordRelationOptionUpdate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);
	request.setRecordid(recordId);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('blockDataviewRecordRelationOptionUpdate', request, callBack);
};

const BlockDataviewRecordRelationOptionDelete = (contextId: string, blockId: string, relationKey: string, recordId: string, optionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.RecordRelationOptionDelete.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);
	request.setRecordid(recordId);
	request.setOptionid(optionId);

	dispatcher.request('blockDataviewRecordRelationOptionDelete', request, callBack);
};

const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Dataview.SetSource.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setSourceList(sources);

	dispatcher.request('blockDataviewSetSource', request, callBack);
};

const BlockObjectTypeSet = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ObjectType.Set.Request();
	
	request.setContextid(contextId);
	request.setObjecttypeurl(url);

	dispatcher.request('blockObjectTypeSet', request, callBack);
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

const ObjectTypeCreate = (objectType: any, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Create.Request();
	
	request.setObjecttype(Mapper.To.ObjectType(objectType));

	dispatcher.request('objectTypeCreate', request, callBack);
};

const ObjectTypeRelationList = (objectTypeId: string, otherTypes: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.List.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setAppendrelationsfromothertypes(otherTypes);

	dispatcher.request('objectTypeRelationList', request, callBack);
};

const ObjectTypeRelationAdd = (objectTypeId: string, relations: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Add.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setRelationsList(relations.map(Mapper.To.Relation));

	dispatcher.request('objectTypeRelationAdd', request, callBack);
};

const ObjectTypeRelationUpdate = (objectTypeId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Update.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('objectTypeRelationUpdate', request, callBack);
};

const ObjectTypeRelationRemove = (objectTypeId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Remove.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setRelationkey(relationKey);

	dispatcher.request('objectTypeRelationRemove', request, callBack);
};

const SetCreate = (sources: string[], details: any, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Set.Create.Request();
	
	request.setSourceList(sources);
	request.setDetails(Encode.encodeStruct(details));
	request.setTemplateid(templateId);

	dispatcher.request('setCreate', request, callBack);
};

const ObjectSearch = (filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Search.Request();

	filters = filters.concat([
		{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
	]);
	
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setFulltext(fullText);
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(keys);

	dispatcher.request('objectSearch', request, callBack);
};

const ObjectSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], fullText: string, limit: number, ignoreWorkspace: boolean, afterId: string, beforeId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchSubscribe.Request();

	filters = filters.concat([
		{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
	]);

	request.setSubid(subId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setFulltext(fullText);
	request.setLimit(limit);
	request.setKeysList(keys);
	request.setSourceList(sources);
	request.setIgnoreworkspace(ignoreWorkspace);
	request.setAfterid(afterId);
	request.setBeforeid(beforeId);

	const cb = (message: any) => {
		dbStore.metaSet(subId, '', { 
			total: message.counters.total,
			offset: message.counters.prevCount,
		});

		if (message.records.length) {
			detailStore.set(subId, message.records.map((it: any) => { 
				return { id: it.id, details: it }; 
			}));
			dbStore.recordsSet(subId, '', message.records.map((it: any) => { 
				return { id: it.id }; 
			}));
		};

		if (callBack) {
			callBack(message);
		};
	};

	dispatcher.request('objectSearchSubscribe', request, cb);
};

const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchUnsubscribe.Request();

	request.setSubidsList(subIds);

	const cb = (message: any) => {
		subIds.forEach((id: string) => {
			dbStore.recordsClear(id, '');
			detailStore.clear(id);
		});

		if (callBack) {
			callBack(message);
		};
	};

	dispatcher.request('objectSearchUnsubscribe', request, cb);
};

const ObjectRelationOptionAdd = (contextId: string, relationKey: string, option: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationOptionAdd.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('objectRelationOptionAdd', request, callBack);
};

const ObjectRelationOptionUpdate = (contextId: string, relationKey: string, option: I.SelectOption, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationOptionUpdate.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('objectRelationOptionUpdate', request, callBack);
};

const ObjectRelationOptionDelete = (contextId: string, relationKey: string, optionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationOptionDelete.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOptionid(optionId);

	dispatcher.request('objectRelationOptionDelete', request, callBack);
};

const ObjectRelationAdd = (contextId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationAdd.Request();
	
	request.setContextid(contextId);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('objectRelationAdd', request, callBack);
};

const ObjectRelationUpdate = (contextId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationUpdate.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relation.relationKey);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('objectRelationUpdate', request, callBack);
};

const ObjectRelationDelete = (contextId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationDelete.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);

	dispatcher.request('objectRelationDelete', request, callBack);
};

const ObjectRelationListAvailable = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationListAvailable.Request();
	
	request.setContextid(contextId);

	dispatcher.request('objectRelationListAvailable', request, callBack);
};

const ObjectFeaturedRelationAdd = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.FeaturedRelation.Add.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request('objectFeaturedRelationAdd', request, callBack);
};

const ObjectFeaturedRelationRemove = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.FeaturedRelation.Remove.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request('objectFeaturedRelationRemove', request, callBack);
};

const ObjectSetLayout = (contextId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetLayout.Request();
	
	request.setContextid(contextId);
    request.setLayout(layout);

	dispatcher.request('objectSetLayout', request, callBack);
};

const ObjectSetIsFavorite = (contextId: string, isFavorite: boolean, callBack?: (message: any) => void) =>  {
	const request = new Rpc.Object.SetIsFavorite.Request();
	
	request.setContextid(contextId);
    request.setIsfavorite(isFavorite);

	dispatcher.request('objectSetIsFavorite', request, callBack);
};

const ObjectSetIsArchived = (contextId: string, isArchived: boolean, callBack?: (message: any) => void) =>  {
	const request = new Rpc.Object.SetIsArchived.Request();
	
	request.setContextid(contextId);
    request.setIsarchived(isArchived);

	dispatcher.request('objectSetIsArchived', request, callBack);
};

const ObjectGraph = (filters: any[], limit: number, types: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Graph.Request();
	
	request.setFiltersList(filters.map(Mapper.To.Filter));
    request.setLimit(limit);
	request.setObjecttypefilterList(types);

	dispatcher.request('objectGraph', request, callBack);
};

const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToSet.Request();
	
	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request('objectToSet', request, callBack);
};

const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectList.Delete.Request();
	
	request.setObjectidsList(ids);

	dispatcher.request('objectListDelete', request, callBack);
};

const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectList.Set.IsArchived.Request();
	
	request.setObjectidsList(ids);
	request.setIsarchived(isArchived);

	dispatcher.request('objectListSetIsArchived', request, callBack);
};

const ObjectListSetIsFavorite = (ids: string[], isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectList.Set.IsFavorite.Request();
	
	request.setObjectidsList(ids);
	request.setIsfavorite(isFavorite);

	dispatcher.request('objectListSetIsFavorite', request, callBack);
};

const ObjectAddWithObjectId = (objectId: string, payload: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.AddWithObjectId.Request();

	request.setObjectid(objectId);
	request.setPayload(payload);

	dispatcher.request('objectAddWithObjectId', request, callBack);
};

const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ShareByLink.Request();

	request.setObjectid(objectId);

	dispatcher.request('objectShareByLink', request, callBack);
};

const MakeTemplate = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.MakeTemplate.Request();
	
	request.setContextid(contextId);

	dispatcher.request('makeTemplate', request, callBack);
};

const MakeTemplateByObjectType = (objectTypeUrl: string, callBack?: (message: any) => void) => {
	const request = new Rpc.MakeTemplateByObjectType.Request();
	
	request.setObjecttype(objectTypeUrl);

	dispatcher.request('makeTemplateByObjectType', request, callBack);
};

const ApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ApplyTemplate.Request();
	
	request.setContextid(contextId);
	request.setTemplateid(templateId);

	dispatcher.request('applyTemplate', request, callBack);
};

const CloneTemplate = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ApplyTemplate.Request();
	
	request.setContextid(contextId);

	dispatcher.request('cloneTemplate', request, callBack);
};

const WorkspaceCreate = (name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Create.Request();

	request.setName(name);

	dispatcher.request('workspaceCreate', request, callBack);
};

const WorkspaceSelect = (workspaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Select.Request();
	
	request.setWorkspaceid(workspaceId);

	dispatcher.request('workspaceSelect', request, callBack);
};

const WorkspaceSetIsHighlighted = (objectId: string, isHightlighted: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.SetIsHighlighted.Request();
	
	request.setObjectid(objectId);
	request.setIshighlighted(isHightlighted);

	dispatcher.request('workspaceSetIsHighlighted', request, callBack);
};

export {
	VersionGet,
	DebugSync,
	DebugTree,

	ConfigGet,
	Shutdown,
	LinkPreview,
	UploadFile,
	DownloadFile,
	ProcessCancel,
	Export,
	ExportTemplates,
	ExportLocalstore,
	FileListOffload,

	WalletCreate,
	WalletRecover,
	WalletConvert,

	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,

	PageCreate,

	ExternalDropFiles,

	NavigationGetObjectInfoWithLinks,

	BlockGetPublicWebURL,
	BlockOpen,
	BlockShow,
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
	BlockCreateSet,
	BlockUpdateContent,

	BlockSetTextText,
	BlockSetTextChecked,
	BlockSetFields,
	BlockSetDetails,
	BlockSetLatexText,

	BlockListMove,
	BlockListMoveToNewPage,
	BlockListConvertChildrenToPages,
	BlockListDuplicate,
	BlockListSetBackgroundColor,
	BlockListSetTextColor,
	BlockListSetTextStyle,
	BlockListTurnInto,
	BlockListSetTextMark,
	BlockListSetDivStyle,
	BlockListSetFields,
	BlockListSetAlign,

	BlockDataviewViewCreate,
	BlockDataviewViewUpdate,
	BlockDataviewViewDelete,
	BlockDataviewViewSetActive,
	BlockDataviewViewSetPosition,

	BlockDataviewRelationAdd,
	BlockDataviewRelationUpdate,
	BlockDataviewRelationDelete,
	BlockDataviewRelationListAvailable,

	BlockDataviewRecordRelationOptionAdd,
	BlockDataviewRecordRelationOptionUpdate,
	BlockDataviewRecordRelationOptionDelete,

	BlockDataviewRecordCreate,
	BlockDataviewRecordUpdate,
	BlockDataviewRecordDelete,

	BlockDataviewSetSource,

	BlockRelationSetKey,
	BlockRelationList,
	BlockRelationUpdate,
	BlockRelationRemove,

	BlockObjectTypeSet,

	HistoryVersions,	
	HistoryShow,
	HistorySetVersion,

	ObjectTypeList,
	ObjectTypeCreate,
	ObjectTypeRelationList,
	ObjectTypeRelationAdd,
	ObjectTypeRelationUpdate,
	ObjectTypeRelationRemove,

	SetCreate,
	ObjectRelationOptionAdd,
    ObjectRelationOptionUpdate,
    ObjectRelationOptionDelete,
	ObjectRelationAdd,
	ObjectRelationUpdate,
	ObjectRelationDelete,
	ObjectRelationListAvailable,
	ObjectSetLayout,
	ObjectSetIsFavorite,
	ObjectSetIsArchived,
	ObjectGraph,
	ObjectFeaturedRelationAdd,
	ObjectFeaturedRelationRemove,
	ObjectToSet,
	ObjectAddWithObjectId,
	ObjectShareByLink,

	ObjectSearch,
	ObjectSearchSubscribe,
	ObjectSearchUnsubscribe,
	
	ObjectListDelete,
	ObjectListSetIsArchived,
	ObjectListSetIsFavorite,

	MakeTemplate,
	MakeTemplateByObjectType,
	ApplyTemplate,
	CloneTemplate,

	WorkspaceCreate,
	WorkspaceSelect,
	WorkspaceSetIsHighlighted,
};
