import { I, Util, Mark, dispatcher, Encode, Mapper } from 'ts/lib';
import { dbStore, detailStore } from 'ts/store';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;

const VersionGet = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('versionGet', request, callBack);
};

// ---------------------- DEBUG ---------------------- //

const DebugSync = (limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Sync.Request();

	request.setRecordstraverselimit(limit);

	dispatcher.request('debugSync', request, callBack);
};

const DebugTree = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Tree.Request();

	request.setObjectid(objectId);
	request.setPath(path);

	dispatcher.request('debugTree', request, callBack);
};

const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.ExportLocalstore.Request();

	request.setPath(path);
	request.setDocidsList(ids);

	dispatcher.request('debugExportLocalstore', request, callBack);
};

const MetricsSetParameters = (platform: I.Platform, callBack?: (message: any) => void) => {
	const request = new Rpc.Metrics.SetParameters.Request();

	request.setPlatform(platform);

	dispatcher.request('metricsSetParameters', request, callBack);
};

const AppShutdown = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request('shutdown', request, callBack);
};

const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.File.ListOffload.Request();

	request.setOnlyidsList(ids);
	request.setIncludenotpinned(notPinned);

	dispatcher.request('fileListOffload', request, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request();

	request.setUrl(url);

	dispatcher.request('linkPreview', request, callBack);
};

const Export = (path: string, ids: string[], format: I.ExportFormat, zip: boolean, includeNested: boolean, includeFiles: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Export.Request();

	request.setPath(path);
	request.setDocidsList(ids);
	request.setFormat(format);
	request.setZip(zip);
	request.setIncludenested(includeNested);
	request.setIncludefiles(includeFiles);

	dispatcher.request('export', request, callBack);
};

const FileUpload = (url: string, path: string, type: I.FileType, callBack?: (message: any) => void) => {
	if (!url && !path) {
		return;
	};

	const request = new Rpc.File.Upload.Request();
	
	request.setUrl(url);
	request.setLocalpath(path);
	request.setType(type);

	dispatcher.request('uploadFile', request, callBack);
};

const FileDownload = (hash: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.File.Download.Request();
	
	request.setHash(hash);
	request.setPath(path);

	dispatcher.request('fileDownload', request, callBack);
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

const AccountDelete = (revert: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Delete.Request();
	
	request.setRevert(revert);

	dispatcher.request('accountDelete', request, callBack);
};

const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.File.Drop.Request();
	
	request.setContextid(contextId);
	request.setDroptargetid(targetId);
	request.setPosition(position);
	request.setLocalfilepathsList(paths);

	dispatcher.request('fileDrop', request, callBack);
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

const BlockCreate = (block: any, contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Request();
	
	request.setBlock(Mapper.To.Block(block));
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request('blockCreate', request, callBack);
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

const BlockTextSetText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

	marks = Util.objectCopy(marks);
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark);

	const request = new Rpc.BlockText.SetText.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);
	request.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));

	dispatcher.request('blockTextSetText', request, callBack);
};

const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.SetChecked.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setChecked(checked);

	dispatcher.request('blockTextSetChecked', request, callBack);
};

const BlockSetTextIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Set.Text.Icon.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setIconemoji(iconEmoji);
	request.setIconimage(iconImage);

	dispatcher.request('blockSetTextIcon', request, callBack);
};

const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetStyle.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockTextListSetStyle', request, callBack);
};

const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockLatex.SetText.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);

	dispatcher.request('blockLatexSetText', request, callBack);
};

const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetFields.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setFields(Encode.encodeStruct(fields || {}));

	dispatcher.request('blockSetFields', request, callBack);
};

const BlockLinkCreateToTheNewObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.BlockLink.CreateToTheNewObject.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setDetails(Encode.encodeStruct(details));
	request.setTemplateid(templateId);
	request.setFields(Encode.encodeStruct(fields || {}));

	dispatcher.request('blockLinkCreateToTheNewObject', request, callBack);
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
	const request = new Rpc.BlockBookmark.Fetch.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);

	dispatcher.request('blockBookmarkFetch', request, callBack);
};

const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockBookmark.CreateAndFetch.Request();
	
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
	const request = new Rpc.BlockfFile.CreateAndUpload.Request();
	
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
	const request = new Rpc.Block.ListMoveToNewPage.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setDetails(Encode.encodeStruct(details || {}));
    request.setDroptargetid(targetId);
    request.setPosition(position);

	dispatcher.request('blockListMoveToNewPage', request, callBack);
};

const BlockListConvertChildrenToPages = (contextId: string, blockIds: string[], type: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListConvertChildrenToPages.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
	request.setObjecttype(type);

	dispatcher.request('blockListConvertChildrenToPages', request, callBack);
};

const BlockListDuplicate = (contextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListDuplicate.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setTargetid(targetId);
    request.setPosition(position);

	dispatcher.request('blockListDuplicate', request, callBack);
};

const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListTurnInto.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockListTurnInto', request, callBack);
};

const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDiv.ListSetStyle.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockDivListSetStyle', request, callBack);
};

const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.ListSetStyle.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request('blockFileListSetStyle', request, callBack);
};

const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetColor.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request('blockTextListSetColor', request, callBack);
};

const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetMark.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setMark(Mapper.To.Mark(mark));

	dispatcher.request('blockTextListSetMark', request, callBack);
};

const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	const request = new Rpc.Block.ListSetFields.Request();

	request.setContextid(contextId);
    request.setBlockfieldsList(fields);

	dispatcher.request('blockListSetFields', request, callBack);
};

const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetBackgroundColor.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request('blockListSetBackgroundColor', request, callBack);
};

const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetAlign.Request();
	
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
	const request = new Rpc.BlockDataviewRecord.Create.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRecord(Encode.encodeStruct(record));
	request.setTemplateid(templateId);

	dispatcher.request('blockDataviewRecordCreate', request, callBack);
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
	const request = new Rpc.BlockRelation.SetKey.Request();
	
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
	const request = new Rpc.BlockDataview.SetSource.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setSourceList(sources);

	dispatcher.request('blockDataviewSetSource', request, callBack);
};

// ---------------------- HISTORY ---------------------- //

const HistoryShowVersion = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.ShowVersion.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('historyShowVersion', request, callBack);
};

const HistorySetVersion = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.Show.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request('historySetVersion', request, callBack);
};

const HistoryGetVersions = (pageId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.GetVersions.Request();
	
	request.setPageid(pageId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request('historyGetVersions', request, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

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

// ---------------------- OBJECT ---------------------- //

const ObjectOpen = (objectId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Open.Request();
	
	request.setObjectid(objectId);
	request.setTraceid(traceId);

	dispatcher.request('objectOpen', request, callBack);
};

const ObjectShow = (blockId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Show.Request();
	
	request.setBlockid(blockId);
	request.setTraceid(traceId);

	dispatcher.request('objectShow', request, callBack);
};

const ObjectOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = new Rpc.Object.OpenBreadcrumbs.Request();
	dispatcher.request('objectOpenBreadcrumbs', request, callBack);
};

const ObjectSetBreadcrumbs = (contextId: string, pageIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetBreadcrumbs.Request();
	
	request.setBreadcrumbsid(contextId);
	request.setIdsList(pageIds);

	dispatcher.request('objectSetBreadcrumbs', request, callBack);
};

const ObjectClose = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Close.Request();
	
	request.setObjectid(objectId);

	dispatcher.request('objectClose', request, callBack);
};

const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Undo.Request();
	
	request.setContextid(contextId);

	dispatcher.request('objectUndo', request, callBack);
};

const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Redo.Request();
	
	request.setContextid(contextId);

	dispatcher.request('objectRedo', request, callBack);
};

const ObjectCreateSet = (sources: string[], details: any, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateSet.Request();
	
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

const ObjectSetObjectType = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetObjectType.Request();
	
	request.setContextid(contextId);
	request.setObjecttypeurl(url);

	dispatcher.request('objectSetObjectType', request, callBack);
};

const ObjectImportMarkdown = (contextId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ImportMarkdown.Request();
	
	request.setContextid(contextId);
    request.setImportpath(path);

	dispatcher.request('objectImportMarkdown', request, callBack);
};

const ObjectSetDetails = (contextId: string, details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	const request = new Rpc.Object.SetDetails.Request();

	request.setContextid(contextId);
	request.setDetailsList(details);

	dispatcher.request('objectSetDetails', request, callBack);
};

const OnSubscribe = (subId: string, keys: string[], message: any) => {
	if (message.error.code) {
		return;
	};

	if (message.counters) {
		dbStore.metaSet(subId, '', { total: message.counters.total, keys: keys });
	};

	let details = [];
	details = details.concat(message.dependencies.map((it: any) => { return { id: it.id, details: it }; }));
	details = details.concat(message.records.map((it: any) => { 
		keys.forEach((k: string) => { it[k] = it[k] || ''; });
		return { id: it.id, details: it }; 
	}));
	detailStore.set(subId, details);
	dbStore.recordsSet(subId, '', message.records.map((it: any) => { return { id: it.id }; }));
};

const ObjectSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, ignoreWorkspace: boolean, afterId: string, beforeId: string, noDeps: boolean, callBack?: (message: any) => void) => {
	if (!subId) {
		console.error('[ObjectSearchSubscribe] subId is empty');
	};

	const request = new Rpc.Object.SearchSubscribe.Request();

	request.setSubid(subId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(keys);
	request.setSourceList(sources);
	request.setIgnoreworkspace(ignoreWorkspace);
	request.setAfterid(afterId);
	request.setBeforeid(beforeId);
	request.setNodepsubscription(noDeps);

	const cb = (message: any) => {
		OnSubscribe(subId, keys, message);

		if (callBack) {
			callBack(message);
		};
	};

	dispatcher.request('objectSearchSubscribe', request, cb);
};

const ObjectSubscribeIds = (subId: string, ids: string[], keys: string[], ignoreWorkspace: boolean, callBack?: (message: any) => void) => {
	if (!subId) {
		console.error('[ObjectSubscribeIds] subId is empty');
	};

	const request = new Rpc.Object.SubscribeIds.Request();

	request.setSubid(subId);
	request.setIdsList(ids);
	request.setKeysList(keys);
	request.setIgnoreworkspace(ignoreWorkspace);

	const cb = (message: any) => {
		message.records.sort((c1: any, c2: any) => {
			const i1 = ids.indexOf(c1.id);
			const i2 = ids.indexOf(c2.id);
			if (i1 > i2) return 1; 
			if (i1 < i2) return -1;
			return 0;
		});

		OnSubscribe(subId, keys, message);

		if (callBack) {
			callBack(message);
		};
	};

	dispatcher.request('objectSubscribeIds', request, cb);
};

const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchUnsubscribe.Request();

	request.setSubidsList(subIds);
	
	dispatcher.request('objectSearchUnsubscribe', request, callBack);
};

const ObjectRelationOptionAdd = (contextId: string, relationKey: string, option: any, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelationOption.Add.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('objectRelationOptionAdd', request, callBack);
};

const ObjectRelationOptionUpdate = (contextId: string, relationKey: string, option: I.SelectOption, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelationOption.Update.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOption(Mapper.To.SelectOption(option));

	dispatcher.request('objectRelationOptionUpdate', request, callBack);
};

const ObjectRelationOptionDelete = (contextId: string, relationKey: string, optionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelationOption.Delete.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);
	request.setOptionid(optionId);

	dispatcher.request('objectRelationOptionDelete', request, callBack);
};

const ObjectRelationAdd = (contextId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Add.Request();
	
	request.setContextid(contextId);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('objectRelationAdd', request, callBack);
};

const ObjectRelationUpdate = (contextId: string, relation: any, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Update.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relation.relationKey);
	request.setRelation(Mapper.To.Relation(relation));

	dispatcher.request('objectRelationUpdate', request, callBack);
};

const ObjectRelationDelete = (contextId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Delete.Request();
	
	request.setContextid(contextId);
	request.setRelationkey(relationKey);

	dispatcher.request('objectRelationDelete', request, callBack);
};

const ObjectRelationListAvailable = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.ListAvailable.Request();
	
	request.setContextid(contextId);

	dispatcher.request('objectRelationListAvailable', request, callBack);
};

const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.AddFeatured.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request('objectRelationAddFeatured', request, callBack);
};

const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.RemoveFeatured.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request('ojectRelationRemoveFeatured', request, callBack);
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

const ObjectDuplicate = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Duplicate.Request();
	
	request.setContextid(id);

	dispatcher.request('objectDuplicate', request, callBack);
};

const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ApplyTemplate.Request();
	
	request.setContextid(contextId);
	request.setTemplateid(templateId);

	dispatcher.request('objectApplyTemplate', request, callBack);
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

// ---------------------- OBJECT LIST ---------------------- //

const ObjectListDuplicate = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectList.Duplicate.Request();
	
	request.setObjectidsList(ids);

	dispatcher.request('objectListDuplicate', request, callBack);
};

const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListDelete.Request();
	
	request.setObjectidsList(ids);

	dispatcher.request('objectListDelete', request, callBack);
};

const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsArchived.Request();
	
	request.setObjectidsList(ids);
	request.setIsarchived(isArchived);

	dispatcher.request('objectListSetIsArchived', request, callBack);
};

const ObjectListSetIsFavorite = (ids: string[], isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsFavorite.Request();
	
	request.setObjectidsList(ids);
	request.setIsfavorite(isFavorite);

	dispatcher.request('objectListSetIsFavorite', request, callBack);
};

// ---------------------- TEMPLATE ---------------------- //

const TemplateCreateFromObject = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.CreateFromObject.Request();
	
	request.setContextid(contextId);

	dispatcher.request('templateCreateFromObject', request, callBack);
};

const TemplateCreateFromObjectType = (objectTypeUrl: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.CreateFromObjectType.Request();
	
	request.setObjecttype(objectTypeUrl);

	dispatcher.request('templateCreateFromObjectType', request, callBack);
};

const TemplateClone = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.Clone.Request();
	
	request.setContextid(contextId);

	dispatcher.request('templateClone', request, callBack);
};

const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.ExportAll.Request();

	request.setPath(path);

	dispatcher.request('templateExportAll', request, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

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

// ---------------------- UNSPLASH ---------------------- //

const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Search.Request();
	
	request.setQuery(query);
	request.setLimit(limit);

	dispatcher.request('unsplashSearch', request, callBack);
};

const UnsplashDownload = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Download.Request();
	
	request.setPictureid(id);

	dispatcher.request('unsplashDownload', request, callBack);
};

export {
	VersionGet,
	MetricsSetParameters,
	LinkPreview,
	ProcessCancel,

	AppShutdown,

	DebugSync,
	DebugTree,
	DebugExportLocalstore,

	FileUpload,
	FileDownload,
	FileDrop,
	FileListOffload,

	Export,

	WalletCreate,
	WalletRecover,
	WalletConvert,

	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,
	AccountDelete,

	PageCreate,

	NavigationGetObjectInfoWithLinks,

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

	BlockListMove,
	BlockListMoveToNewPage,
	BlockListConvertChildrenToPages,
	BlockListDuplicate,
	BlockListSetBackgroundColor,
	BlockListTurnInto,
	BlockListSetFields,
	BlockListSetAlign,

	BlockCreate,
	BlockCreateSet,

	BlockSetFields,

	BlockTextSetText,
	BlockTextSetChecked,
	BlockSetTextIcon, // TODO: Rename
	BlockTextListSetStyle,
	BlockTextListSetMark,
	BlockTextListSetColor,

	BlockFileListSetStyle,

	BlockLinkCreateToTheNewObject,

	BlockDivListSetStyle,

	BlockLatexSetText,

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
	BlockDataviewSetSource,

	BlockRelationSetKey,
	BlockRelationList,
	BlockRelationUpdate,
	BlockRelationRemove,

	HistoryGetVersions,	
	HistoryShowVersion,
	HistorySetVersion,

	ObjectTypeList,
	ObjectTypeCreate,
	ObjectTypeRelationList,
	ObjectTypeRelationAdd,
	ObjectTypeRelationUpdate,
	ObjectTypeRelationRemove,

	ObjectRelationOptionAdd,
    ObjectRelationOptionUpdate,
    ObjectRelationOptionDelete,

	ObjectRelationAdd,
	ObjectRelationUpdate,
	ObjectRelationDelete,
	ObjectRelationListAvailable,

	ObjectOpen,
	ObjectShow,
	ObjectOpenBreadcrumbs,
	ObjectSetBreadcrumbs,
	ObjectClose,
	ObjectUndo,
	ObjectRedo,
	ObjectGraph,
	ObjectRelationAddFeatured,
	ObjectRelationRemoveFeatured,
	ObjectToSet,
	ObjectAddWithObjectId,
	ObjectShareByLink,
	ObjectSearch,
	ObjectSearchSubscribe,
	ObjectSubscribeIds,
	ObjectSearchUnsubscribe,
	ObjectDuplicate,
	ObjectApplyTemplate,
	ObjectImportMarkdown,

	ObjectSetDetails,
	ObjectSetObjectType,
	ObjectSetLayout,
	ObjectSetIsFavorite,
	ObjectSetIsArchived,

	ObjectCreateSet,
	
	ObjectListDuplicate,
	ObjectListDelete,
	ObjectListSetIsArchived,
	ObjectListSetIsFavorite,

	TemplateCreateFromObject,
	TemplateCreateFromObjectType,
	TemplateClone,
	TemplateExportAll,

	WorkspaceCreate,
	WorkspaceSelect,
	WorkspaceSetIsHighlighted,

	UnsplashSearch,
	UnsplashDownload,
};
