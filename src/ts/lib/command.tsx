import { I, Util, Mark, dispatcher, Encode, Mapper } from 'Lib';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;

const MetricsSetParameters = (platform: I.Platform, callBack?: (message: any) => void) => {
	const request = new Rpc.Metrics.SetParameters.Request();

	request.setPlatform(platform);

	dispatcher.request(MetricsSetParameters.name, request, callBack);
};

const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Process.Cancel.Request();
	
	request.setId(id);

	dispatcher.request(ProcessCancel.name, request, callBack);
};

const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request();

	request.setUrl(url);

	dispatcher.request(LinkPreview.name, request, callBack);
};

// ---------------------- APP ---------------------- //

const AppShutdown = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request(AppShutdown.name, request, callBack);
};

const AppGetVersion = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();
	dispatcher.request(AppGetVersion.name, request, callBack);
};

// ---------------------- WALLET ---------------------- //

const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Create.Request();
	
	request.setRootpath(path);

	dispatcher.request(WalletCreate.name, request, callBack);
};

const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Recover.Request();
	
	request.setRootpath(path);
	request.setMnemonic(mnemonic);

	dispatcher.request(WalletRecover.name, request, callBack);
};

const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Convert.Request();

	request.setMnemonic(mnemonic);
	request.setEntropy(entropy);

	dispatcher.request(WalletConvert.name, request, callBack);
};

const WalletCreateSession = (mnemonic: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.CreateSession.Request();

	request.setMnemonic(mnemonic);

	dispatcher.request(WalletCreateSession.name, request, callBack);
};

const WalletCloseSession = (token: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.CloseSession.Request();

	request.setToken(token);

	dispatcher.request(WalletCloseSession.name, request, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

const WorkspaceCreate = (name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Create.Request();

	request.setName(name);

	dispatcher.request(WorkspaceCreate.name, request, callBack);
};

const WorkspaceSelect = (workspaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Select.Request();
	
	request.setWorkspaceid(workspaceId);

	dispatcher.request(WorkspaceSelect.name, request, callBack);
};

const WorkspaceSetIsHighlighted = (objectId: string, isHightlighted: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.SetIsHighlighted.Request();
	
	request.setObjectid(objectId);
	request.setIshighlighted(isHightlighted);

	dispatcher.request(WorkspaceSetIsHighlighted.name, request, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

const AccountCreate = (name: string, avatarPath: string, storePath: string, code: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Create.Request();
	
	request.setName(name);
	request.setAvatarlocalpath(avatarPath);
	request.setStorepath(storePath);
	request.setAlphainvitecode(code);

	dispatcher.request(AccountCreate.name, request, callBack);
};

const AccountRecover = (callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Recover.Request();

	dispatcher.request(AccountRecover.name, request, callBack);
};

const AccountSelect = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Select.Request();
	
	request.setId(id);
	request.setRootpath(path);

	dispatcher.request(AccountSelect.name, request, callBack);
};

const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Stop.Request();
	
	request.setRemovedata(removeData);

	dispatcher.request(AccountStop.name, request, callBack);
};

const AccountDelete = (revert: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Delete.Request();
	
	request.setRevert(revert);

	dispatcher.request(AccountDelete.name, request, callBack);
};

const AccountMove = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Move.Request();
	
	request.setNewpath(path);

	dispatcher.request(AccountMove.name, request, callBack);
};

// ---------------------- FILE ---------------------- //

const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.File.Drop.Request();
	
	request.setContextid(contextId);
	request.setDroptargetid(targetId);
	request.setPosition(position);
	request.setLocalfilepathsList(paths);

	dispatcher.request(FileDrop.name, request, callBack);
};

const FileUpload = (url: string, path: string, type: I.FileType, callBack?: (message: any) => void) => {
	if (!url && !path) {
		return;
	};

	const request = new Rpc.File.Upload.Request();
	
	request.setUrl(url);
	request.setLocalpath(path);
	request.setType(type);

	dispatcher.request(FileUpload.name, request, callBack);
};

const FileDownload = (hash: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.File.Download.Request();
	
	request.setHash(hash);
	request.setPath(path);

	dispatcher.request(FileDownload.name, request, callBack);
};

const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.File.ListOffload.Request();

	request.setOnlyidsList(ids);
	request.setIncludenotpinned(notPinned);

	dispatcher.request(FileListOffload.name, request, callBack);
};

const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.GetObjectInfoWithLinks.Request();
	
	request.setObjectid(pageId);

	dispatcher.request(NavigationGetObjectInfoWithLinks.name, request, callBack);
};

const BlockCreate = (contextId: string, targetId: string, position: I.BlockPosition, block: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setBlock(Mapper.To.Block(block));

	dispatcher.request(BlockCreate.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

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

	dispatcher.request(BlockTextSetText.name, request, callBack);
};

const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.SetChecked.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setChecked(checked);

	dispatcher.request(BlockTextSetChecked.name, request, callBack);
};

const BlockTextSetIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.SetIcon.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setIconemoji(iconEmoji);
	request.setIconimage(iconImage);

	dispatcher.request(BlockTextSetIcon.name, request, callBack);
};


const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetFields.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setFields(Encode.encodeStruct(fields || {}));

	dispatcher.request(BlockSetFields.name, request, callBack);
};

const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Merge.Request();
	
	request.setContextid(contextId);
	request.setFirstblockid(blockId1);
	request.setSecondblockid(blockId2);

	dispatcher.request(BlockMerge.name, request, callBack);
};

const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Split.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRange(Mapper.To.Range(range));
	request.setStyle(style);
	request.setMode(mode);

	dispatcher.request(BlockSplit.name, request, callBack);
};

const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockBookmark.Fetch.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);

	dispatcher.request(BlockBookmarkFetch.name, request, callBack);
};

const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockBookmark.CreateAndFetch.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setUrl(url);

	dispatcher.request(BlockBookmarkCreateAndFetch.name, request, callBack);
};

const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Upload.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);
	request.setFilepath(path);

	dispatcher.request(BlockUpload.name, request, callBack);
};

const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);

	const request = new Rpc.Block.Copy.Request();
	
	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCopy.name, request, callBack);
};

const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = Util.objectCopy(blocks);

	const request = new Rpc.Block.Cut.Request();
	
	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCut.name, request, callBack);
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

	dispatcher.request(BlockPaste.name, request, callBack);
};

const BlockListMoveToExistingObject = (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListMoveToExistingObject.Request();
	
	request.setContextid(contextId);
    request.setTargetcontextid(targetContextId);
    request.setBlockidsList(blockIds);
    request.setDroptargetid(targetId);
    request.setPosition(position);

	dispatcher.request(BlockListMoveToExistingObject.name, request, callBack);
};

const BlockListConvertToObjects = (contextId: string, blockIds: string[], type: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListConvertToObjects.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
	request.setObjecttype(type);

	dispatcher.request(BlockListConvertToObjects.name, request, callBack);
};

const BlockListDuplicate = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListDuplicate.Request();
	
	request.setContextid(contextId);
	request.setTargetcontextid(targetContextId);
    request.setBlockidsList(blockIds);
    request.setTargetid(targetId);
    request.setPosition(position);

	dispatcher.request(BlockListDuplicate.name, request, callBack);
};

const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListTurnInto.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request(BlockListTurnInto.name, request, callBack);
};

const BlockListDelete = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListDelete.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockListDelete.name, request, callBack);
};

// ---------------------- BLOCK DIV ---------------------- //

const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDiv.ListSetStyle.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request(BlockDivListSetStyle.name, request, callBack);
};

// ---------------------- BLOCK LATEX ---------------------- //

const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockLatex.SetText.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);

	dispatcher.request(BlockLatexSetText.name, request, callBack);
};

// ---------------------- BLOCK LINK ---------------------- //

const BlockLinkCreateWithObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, fields: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.BlockLink.CreateWithObject.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setDetails(Encode.encodeStruct(details));
	request.setTemplateid(templateId);
	request.setFields(Encode.encodeStruct(fields || {}));
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));

	dispatcher.request(BlockLinkCreateWithObject.name, request, callBack);
};

const BlockLinkListSetAppearance = (contextId: string, blockIds: any[], iconSize: I.LinkIconSize, cardStyle: I.LinkCardStyle, description: I.LinkDescription, relations: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockLink.ListSetAppearance.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setIconsize(iconSize);
	request.setCardstyle(cardStyle);
	request.setDescription(description);
	request.setRelationsList(relations);

	dispatcher.request(BlockLinkListSetAppearance.name, request, callBack);
};

// ---------------------- BLOCK TABLE ---------------------- //

const BlockTableCreate = (contextId: string, targetId: string, position: I.BlockPosition, rows: number, columns: number, withHeaderRow, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Create.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setRows(rows);
	request.setColumns(columns);
	request.setWithheaderrow(withHeaderRow);

	dispatcher.request(BlockTableCreate.name, request, callBack);
};

const BlockTableExpand = (contextId: string, targetId: string, rows: number, columns: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Expand.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setRows(rows);
	request.setColumns(columns);

	dispatcher.request(BlockTableExpand.name, request, callBack);
};

const BlockTableSort = (contextId: string, columnId: string, type: I.SortType, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Sort.Request();
	
	request.setContextid(contextId);
	request.setColumnid(columnId);
	request.setType(type);

	dispatcher.request(BlockTableSort.name, request, callBack);
};

const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowCreate.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request(BlockTableRowCreate.name, request, callBack);
};

const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowDuplicate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request(BlockTableRowDuplicate.name, request, callBack);
};

const BlockTableRowListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowListFill.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableRowListFill.name, request, callBack);
};

const BlockTableRowListClean = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowListClean.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableRowListClean.name, request, callBack);
};

const BlockTableRowSetHeader = (contextId: string, targetId: string, isHeader: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowSetHeader.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setIsheader(isHeader);

	dispatcher.request(BlockTableRowSetHeader.name, request, callBack);
};

const BlockTableColumnCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnCreate.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request(BlockTableColumnCreate.name, request, callBack);
};

const BlockTableColumnDelete = (contextId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnDelete.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);

	dispatcher.request(BlockTableColumnDelete.name, request, callBack);
};

const BlockTableColumnMove = (contextId: string, targetId: string, dropTargetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnMove.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setDroptargetid(dropTargetId);
	request.setPosition(position);

	dispatcher.request(BlockTableColumnMove.name, request, callBack);
};

const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnDuplicate.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position);

	dispatcher.request(BlockTableColumnDuplicate.name, request, callBack);
};

const BlockTableColumnListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnListFill.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableColumnListFill.name, request, callBack);
};

// ---------------------- BLOCK FILE ---------------------- //

const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockfFile.CreateAndUpload.Request();
	
	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position);
	request.setUrl(url);
	request.setFilepath(path);

	dispatcher.request(BlockFileCreateAndUpload.name, request, callBack);
};

const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.ListSetStyle.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style);

	dispatcher.request(BlockFileListSetStyle.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetColor.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request(BlockTextListSetColor.name, request, callBack);
};

const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetMark.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setMark(Mapper.To.Mark(mark));

	dispatcher.request(BlockTextListSetMark.name, request, callBack);
};

const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetStyle.Request();
	
	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setStyle(style);

	dispatcher.request(BlockTextListSetStyle.name, request, callBack);
};

const BlockTextListClearStyle = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListClearStyle.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);

	dispatcher.request(BlockTextListClearStyle.name, request, callBack);
};

const BlockTextListClearContent = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListClearContent.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);

	dispatcher.request(BlockTextListClearContent.name, request, callBack);
};

const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	const request = new Rpc.Block.ListSetFields.Request();

	request.setContextid(contextId);
    request.setBlockfieldsList(fields);

	dispatcher.request(BlockListSetFields.name, request, callBack);
};

const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetBackgroundColor.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setColor(color);

	dispatcher.request(BlockListSetBackgroundColor.name, request, callBack);
};

const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockHAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetAlign.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setAlign(align);

	dispatcher.request(BlockListSetAlign.name, request, callBack);
};

const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetVerticalAlign.Request();
	
	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setVerticalalign(align);

	dispatcher.request(BlockListSetVerticalAlign.name, request, callBack);
};

const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Create.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setView(Mapper.To.View(view));

	dispatcher.request(BlockDataviewViewCreate.name, request, callBack);
};

const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Update.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setView(Mapper.To.View(view));

	dispatcher.request(BlockDataviewViewUpdate.name, request, callBack);
};

const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Delete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request(BlockDataviewViewDelete.name, request, callBack);
};

const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.SetPosition.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setPosition(position);

	dispatcher.request(BlockDataviewViewSetPosition.name, request, callBack);
};

const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.SetActive.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setOffset(offset);
	request.setLimit(limit);

	dispatcher.request(BlockDataviewViewSetActive.name, request, callBack);
};

const BlockDataviewGroupOrderUpdate = (contextId: string, blockId: string, order: any, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.GroupOrder.Update.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setGrouporder(Mapper.To.GroupOrder(order));

	dispatcher.request(BlockDataviewGroupOrderUpdate.name, request, callBack);
};

const BlockDataviewObjectOrderUpdate = (contextId: string, blockId: string, orders: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ObjectOrder.Update.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setObjectordersList(orders.map(Mapper.To.ObjectOrder));

	dispatcher.request(BlockDataviewObjectOrderUpdate.name, request, callBack);
};


const BlockDataviewRelationListAvailable = (contextId: string, blockId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.ListAvailable.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);

	dispatcher.request(BlockDataviewRelationListAvailable.name, request, callBack);
};

const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockRelation.SetKey.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setKey(relationKey);

	dispatcher.request(BlockRelationSetKey.name, request, callBack);
};

const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Add.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationid(relationId);

	dispatcher.request(BlockDataviewRelationAdd.name, request, callBack);
};

const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Delete.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkey(relationKey);

	dispatcher.request(BlockDataviewRelationDelete.name, request, callBack);
};

const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.SetSource.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setSourceList(sources);

	dispatcher.request(BlockDataviewSetSource.name, request, callBack);
};

// ---------------------- HISTORY ---------------------- //

const HistoryShowVersion = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.ShowVersion.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request(HistoryShowVersion.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(pageId, '', message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

const HistorySetVersion = (pageId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.SetVersion.Request();
	
	request.setPageid(pageId);
	request.setVersionid(versionId);

	dispatcher.request(HistorySetVersion.name, request, callBack);
};

const HistoryGetVersions = (pageId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.GetVersions.Request();
	
	request.setPageid(pageId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request(HistoryGetVersions.name, request, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

const ObjectTypeRelationAdd = (objectTypeId: string, relationIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Add.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setRelationidsList(relationIds);

	dispatcher.request(ObjectTypeRelationAdd.name, request, callBack);
};

const ObjectTypeRelationRemove = (objectTypeId: string, relationId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Remove.Request();
	
	request.setObjecttypeurl(objectTypeId);
	request.setRelationid(relationId);

	dispatcher.request(ObjectTypeRelationRemove.name, request, callBack);
};

// ---------------------- OBJECT ---------------------- //

const ObjectCreate = (details: any, flags: I.ObjectFlag[], templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Create.Request();
	
	request.setDetails(Encode.encodeStruct(details));
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));
	request.setTemplateid(templateId);

	dispatcher.request(ObjectCreate.name, request, callBack);
};

const ObjectCreateSet = (sources: string[], details: any, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateSet.Request();
	
	request.setSourceList(sources);
	request.setDetails(Encode.encodeStruct(details));
	request.setTemplateid(templateId);

	dispatcher.request(ObjectCreateSet.name, request, callBack);
};

const ObjectCreateBookmark = (details: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateBookmark.Request();
	
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request(ObjectCreateBookmark.name, request, callBack);
};

const ObjectCreateObjectType = (details: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateObjectType.Request();
	
	request.setDetails(Encode.encodeStruct(details));
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));

	dispatcher.request(ObjectCreateObjectType.name, request, callBack);
};

const ObjectCreateRelation = (details: any, flags: I.ObjectFlag[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateRelation.Request();
	
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request(ObjectCreateRelation.name, request, callBack);
};

const ObjectCreateRelationOption = (details: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateRelation.Request();
	
	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request(ObjectCreateRelationOption.name, request, callBack);
};

const ObjectBookmarkFetch = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.BookmarkFetch.Request();
	
	request.setContextid(contextId);
	request.setUrl(url);

	dispatcher.request(ObjectBookmarkFetch.name, request, callBack);
};

const ObjectOpen = (objectId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Open.Request();
	
	request.setObjectid(objectId);
	request.setTraceid(traceId);

	dispatcher.request(ObjectOpen.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

const ObjectShow = (objectId: string, traceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Show.Request();
	
	request.setObjectid(objectId);
	request.setTraceid(traceId);

	dispatcher.request(ObjectShow.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

const ObjectOpenBreadcrumbs = (callBack?: (message: any) => void) => {
	const request = new Rpc.Object.OpenBreadcrumbs.Request();

	dispatcher.request(ObjectOpenBreadcrumbs.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(message.objectId, '', message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

const ObjectSetBreadcrumbs = (contextId: string, pageIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetBreadcrumbs.Request();
	
	request.setBreadcrumbsid(contextId);
	request.setIdsList(pageIds);

	dispatcher.request(ObjectSetBreadcrumbs.name, request, callBack);
};

const ObjectClose = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Close.Request();
	
	request.setObjectid(objectId);

	dispatcher.request(ObjectClose.name, request, callBack);
};

const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Undo.Request();
	
	request.setContextid(contextId);

	dispatcher.request(ObjectUndo.name, request, callBack);
};

const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Redo.Request();
	
	request.setContextid(contextId);

	dispatcher.request(ObjectRedo.name, request, callBack);
};

const ObjectSetObjectType = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetObjectType.Request();
	
	request.setContextid(contextId);
	request.setObjecttypeurl(url);

	dispatcher.request(ObjectSetObjectType.name, request, callBack);
};

const ObjectImportMarkdown = (contextId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ImportMarkdown.Request();
	
	request.setContextid(contextId);
    request.setImportpath(path);

	dispatcher.request(ObjectImportMarkdown.name, request, callBack);
};

const ObjectSetDetails = (contextId: string, details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	const request = new Rpc.Object.SetDetails.Request();

	request.setContextid(contextId);
	request.setDetailsList(details);

	dispatcher.request(ObjectSetDetails.name, request, callBack);
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

	dispatcher.request(ObjectSearch.name, request, callBack);
};

const ObjectRelationSearchDistinct = (relationKey: string, filters: I.Filter[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.RelationSearchDistinct.Request();

	request.setRelationkey(relationKey);
	request.setFiltersList(filters.map(Mapper.To.Filter));

	dispatcher.request(ObjectRelationSearchDistinct.name, request, callBack);
};

const ObjectSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, ignoreWorkspace: boolean, afterId: string, beforeId: string, noDeps: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchSubscribe.Request();

	request.setSubid(subId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(Util.arrayUnique(keys));
	request.setSourceList(sources);
	request.setIgnoreworkspace(ignoreWorkspace);
	request.setAfterid(afterId);
	request.setBeforeid(beforeId);
	request.setNodepsubscription(noDeps);

	dispatcher.request(ObjectSearchSubscribe.name, request, callBack);
};

const ObjectSubscribeIds = (subId: string, ids: string[], keys: string[], ignoreWorkspace: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SubscribeIds.Request();

	request.setSubid(subId);
	request.setIdsList(ids);
	request.setKeysList(keys);
	request.setIgnoreworkspace(ignoreWorkspace);

	dispatcher.request(ObjectSubscribeIds.name, request, callBack);
};

const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchUnsubscribe.Request();

	request.setSubidsList(subIds);
	
	dispatcher.request(ObjectSearchUnsubscribe.name, request, callBack);
};

const ObjectRelationAdd = (contextId: string, relationIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Add.Request();
	
	request.setContextid(contextId);
	request.setRelationidsList(relationIds);

	dispatcher.request(ObjectRelationAdd.name, request, callBack);
};

const ObjectRelationDelete = (contextId: string, relationId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Delete.Request();
	
	request.setContextid(contextId);
	request.setRelationid(relationId);

	dispatcher.request(ObjectRelationDelete.name, request, callBack);
};

const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.AddFeatured.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request(ObjectRelationAddFeatured.name, request, callBack);
};

const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.RemoveFeatured.Request();
	
	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request(ObjectRelationRemoveFeatured.name, request, callBack);
};

const ObjectSetLayout = (contextId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetLayout.Request();
	
	request.setContextid(contextId);
    request.setLayout(layout);

	dispatcher.request(ObjectSetLayout.name, request, callBack);
};

const ObjectSetIsFavorite = (contextId: string, isFavorite: boolean, callBack?: (message: any) => void) =>  {
	const request = new Rpc.Object.SetIsFavorite.Request();
	
	request.setContextid(contextId);
    request.setIsfavorite(isFavorite);

	dispatcher.request(ObjectSetIsFavorite.name, request, callBack);
};

const ObjectSetIsArchived = (contextId: string, isArchived: boolean, callBack?: (message: any) => void) =>  {
	const request = new Rpc.Object.SetIsArchived.Request();
	
	request.setContextid(contextId);
    request.setIsarchived(isArchived);

	dispatcher.request(ObjectSetIsArchived.name, request, callBack);
};

const ObjectGraph = (filters: any[], limit: number, types: string[], keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Graph.Request();
	
	request.setFiltersList(filters.map(Mapper.To.Filter));
    request.setLimit(limit);
	request.setObjecttypefilterList(types);
	request.setKeysList(keys);

	dispatcher.request(ObjectGraph.name, request, callBack);
};

const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToSet.Request();
	
	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request(ObjectToSet.name, request, callBack);
};

const ObjectToBookmark = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToBookmark.Request();
	
	request.setContextid(contextId);
	request.setUrl(url);

	dispatcher.request(ObjectToBookmark.name, request, callBack);
};

const ObjectDuplicate = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Duplicate.Request();
	
	request.setContextid(id);

	dispatcher.request(ObjectDuplicate.name, request, callBack);
};

const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ApplyTemplate.Request();
	
	request.setContextid(contextId);
	request.setTemplateid(templateId);

	dispatcher.request(ObjectApplyTemplate.name, request, callBack);
};

const ObjectAddWithObjectId = (objectId: string, payload: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.AddWithObjectId.Request();

	request.setObjectid(objectId);
	request.setPayload(payload);

	dispatcher.request(ObjectAddWithObjectId.name, request, callBack);
};

const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ShareByLink.Request();

	request.setObjectid(objectId);

	dispatcher.request(ObjectShareByLink.name, request, callBack);
};

// ---------------------- OBJECT LIST ---------------------- //

const ObjectListDuplicate = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListDuplicate.Request();
	
	request.setObjectidsList(ids);

	dispatcher.request(ObjectListDuplicate.name, request, callBack);
};

const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListDelete.Request();
	
	request.setObjectidsList(ids);

	dispatcher.request(ObjectListDelete.name, request, callBack);
};

const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsArchived.Request();
	
	request.setObjectidsList(ids);
	request.setIsarchived(isArchived);

	dispatcher.request(ObjectListSetIsArchived.name, request, callBack);
};

const ObjectListSetIsFavorite = (ids: string[], isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsFavorite.Request();
	
	request.setObjectidsList(ids);
	request.setIsfavorite(isFavorite);

	dispatcher.request(ObjectListSetIsFavorite.name, request, callBack);
};

const ObjectListExport = (path: string, objectIds: string[], format: I.ExportFormat, zip: boolean, includeNested: boolean, includeFiles: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListExport.Request();

	request.setPath(path);
	request.setObjectidsList(objectIds);
	request.setFormat(format);
	request.setZip(zip);
	request.setIncludenested(includeNested);
	request.setIncludefiles(includeFiles);

	dispatcher.request(ObjectListExport.name, request, callBack);
};

// ---------------------- TEMPLATE ---------------------- //

const TemplateCreateFromObject = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.CreateFromObject.Request();
	
	request.setContextid(contextId);

	dispatcher.request(TemplateCreateFromObject.name, request, callBack);
};

const TemplateCreateFromObjectType = (objectTypeUrl: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.CreateFromObjectType.Request();
	
	request.setObjecttype(objectTypeUrl);

	dispatcher.request(TemplateCreateFromObjectType.name, request, callBack);
};

const TemplateClone = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.Clone.Request();
	
	request.setContextid(contextId);

	dispatcher.request(TemplateClone.name, request, callBack);
};

const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.ExportAll.Request();

	request.setPath(path);

	dispatcher.request(TemplateExportAll.name, request, callBack);
};

// ---------------------- UNSPLASH ---------------------- //

const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Search.Request();
	
	request.setQuery(query);
	request.setLimit(limit);

	dispatcher.request(UnsplashSearch.name, request, callBack);
};

const UnsplashDownload = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Download.Request();
	
	request.setPictureid(id);

	dispatcher.request(UnsplashDownload.name, request, callBack);
};

// ---------------------- DEBUG ---------------------- //

const DebugSync = (limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Sync.Request();

	request.setRecordstraverselimit(limit);

	dispatcher.request(DebugSync.name, request, callBack);
};

const DebugTree = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Tree.Request();

	request.setObjectid(objectId);
	request.setPath(path);

	dispatcher.request(DebugTree.name, request, callBack);
};

const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.ExportLocalstore.Request();

	request.setPath(path);
	request.setDocidsList(ids);

	dispatcher.request(DebugExportLocalstore.name, request, callBack);
};

export {
	MetricsSetParameters,
	LinkPreview,
	ProcessCancel,

	AppGetVersion,
	AppShutdown,

	WalletCreate,
	WalletRecover,
	WalletConvert,
	WalletCreateSession,
	WalletCloseSession,

	WorkspaceCreate,
	WorkspaceSelect,
	WorkspaceSetIsHighlighted,

	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,
	AccountDelete,
	AccountMove,

	DebugSync,
	DebugTree,
	DebugExportLocalstore,

	FileUpload,
	FileDownload,
	FileDrop,
	FileListOffload,

	NavigationGetObjectInfoWithLinks,

	BlockListDelete,
	BlockMerge,
	BlockSplit,
	BlockUpload,
	BlockCopy,
	BlockCut,
	BlockPaste,
	BlockCreate,
	BlockSetFields,

	BlockListMoveToExistingObject,
	BlockListConvertToObjects,
	BlockListDuplicate,
	BlockListSetBackgroundColor,
	BlockListTurnInto,
	BlockListSetFields,
	BlockListSetAlign,
	BlockListSetVerticalAlign,

	BlockTextSetText,
	BlockTextSetChecked,
	BlockTextSetIcon,

	BlockTextListSetStyle,
	BlockTextListSetMark,
	BlockTextListSetColor,
	BlockTextListClearStyle,
	BlockTextListClearContent,

	BlockBookmarkFetch,
	BlockBookmarkCreateAndFetch,

	BlockFileCreateAndUpload,
	BlockFileListSetStyle,

	BlockLinkCreateWithObject,
	BlockLinkListSetAppearance,

	BlockDivListSetStyle,

	BlockLatexSetText,

	BlockRelationSetKey,

	BlockTableCreate,
	BlockTableExpand,
	BlockTableSort,

	BlockTableColumnCreate,
	BlockTableColumnDelete,
	BlockTableColumnMove,
	BlockTableColumnDuplicate,
	BlockTableColumnListFill,

	BlockTableRowCreate,
	BlockTableRowDuplicate,
	BlockTableRowListFill,
	BlockTableRowListClean,
	BlockTableRowSetHeader,

	BlockDataviewViewCreate,
	BlockDataviewViewUpdate,
	BlockDataviewViewDelete,
	BlockDataviewViewSetActive,
	BlockDataviewViewSetPosition,

	BlockDataviewGroupOrderUpdate,
	BlockDataviewObjectOrderUpdate,

	BlockDataviewRelationAdd,
	BlockDataviewRelationDelete,
	BlockDataviewRelationListAvailable,

	BlockDataviewSetSource,

	HistoryGetVersions,	
	HistoryShowVersion,
	HistorySetVersion,

	ObjectTypeRelationAdd,
	ObjectTypeRelationRemove,

	ObjectRelationAdd,
	ObjectRelationDelete,

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
	ObjectAddWithObjectId,
	ObjectShareByLink,
	ObjectSearch,
	ObjectRelationSearchDistinct,
	ObjectSearchSubscribe,
	ObjectSubscribeIds,
	ObjectSearchUnsubscribe,
	ObjectDuplicate,
	ObjectApplyTemplate,
	ObjectImportMarkdown,
	ObjectBookmarkFetch,

	ObjectCreate,
	ObjectCreateSet,
	ObjectCreateBookmark,
	ObjectCreateObjectType,
	ObjectCreateRelation,
	ObjectCreateRelationOption,

	ObjectToSet,
	ObjectToBookmark,

	ObjectSetDetails,
	ObjectSetObjectType,
	ObjectSetLayout,
	ObjectSetIsFavorite,
	ObjectSetIsArchived,

	ObjectListDuplicate,
	ObjectListDelete,
	ObjectListSetIsArchived,
	ObjectListSetIsFavorite,
	ObjectListExport,

	TemplateCreateFromObject,
	TemplateCreateFromObjectType,
	TemplateClone,
	TemplateExportAll,

	UnsplashSearch,
	UnsplashDownload,
};
