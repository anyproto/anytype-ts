import Commands from 'protobuf/pb/protos/commands_pb';
import Model from 'protobuf/pkg/lib/pb/model/protos/models_pb';
import { detailStore } from 'Store';
import { I, UtilCommon, Mark, Storage, dispatcher, Encode, Mapper } from 'Lib';

const Rpc = Commands.Rpc;

const MetricsSetParameters = (platform: I.Platform, version: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Metrics.SetParameters.Request();

	request.setPlatform(platform);
	request.setVersion(version);

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

const WorkspaceObjectAdd = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Object.Add.Request();

	request.setObjectid(objectId);

	dispatcher.request(WorkspaceObjectAdd.name, request, callBack);
};

const WorkspaceObjectListRemove = (objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Object.ListRemove.Request();

	request.setObjectidsList(objectIds);

	dispatcher.request(WorkspaceObjectListRemove.name, request, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

const AccountCreate = (name: string, avatarPath: string, storePath: string, icon: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Create.Request();

	request.setName(name);
	request.setAvatarlocalpath(avatarPath);
	request.setStorepath(storePath);
	request.setIcon(icon);

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

const AccountRecoverFromLegacyExport = (path: string, rootPath: string, icon: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.RecoverFromLegacyExport.Request();

	request.setPath(path);
	request.setRootpath(rootPath);
	request.setIcon(icon);

	dispatcher.request(AccountRecoverFromLegacyExport.name, request, callBack);
};

// ---------------------- FILE ---------------------- //

const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.File.Drop.Request();

	request.setContextid(contextId);
	request.setDroptargetid(targetId);
	request.setPosition(position as number);
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
	request.setType(type as number);

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

const FileSpaceUsage = (callBack?: (message: any) => void) => {
	const request = new Rpc.File.SpaceUsage.Request();
	dispatcher.request(FileSpaceUsage.name, request, callBack);
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
	request.setPosition(position as number);
	request.setBlock(Mapper.To.Block(block));

	dispatcher.request(BlockCreate.name, request, callBack);
};

const BlockDataviewCreateFromExistingObject = (contextId: string, blockId: string, targetObjectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.CreateFromExistingObject.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetobjectid(targetObjectId);

	dispatcher.request(BlockDataviewCreateFromExistingObject.name, request, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

const BlockWidgetSetTargetId = (contextId: string, blockId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetTargetId.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);

	dispatcher.request(BlockWidgetSetTargetId.name, request, callBack);
};

const BlockWidgetSetLayout = (contextId: string, blockId: string, layout: I.WidgetLayout, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetLayout.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setLayout(layout as number);

	dispatcher.request(BlockWidgetSetLayout.name, request, callBack);
};

const BlockWidgetSetLimit = (contextId: string, blockId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetLimit.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setLimit(limit);

	dispatcher.request(BlockWidgetSetLimit.name, request, callBack);
};

const BlockWidgetSetViewId = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetViewId.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request(BlockWidgetSetViewId.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

const BlockTextSetText = (contextId: string, blockId: string, text: string, marks: I.Mark[], callBack?: (message: any) => void) => {
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

	marks = UtilCommon.objectCopy(marks);
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark) as any;

	const request = new Rpc.BlockText.SetText.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);
	request.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks as any));

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
	request.setStyle(style as number);
	request.setMode(mode as number);

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
	request.setPosition(position as number);
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
	blocks = UtilCommon.objectCopy(blocks);

	const request = new Rpc.Block.Copy.Request();

	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCopy.name, request, callBack);
};

const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = UtilCommon.objectCopy(blocks);

	const request = new Rpc.Block.Cut.Request();

	request.setContextid(contextId);
    request.setBlocksList(blocks.map(Mapper.To.Block));
    request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCut.name, request, callBack);
};

const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, callBack?: (message: any) => void) => {
	data = UtilCommon.objectCopy(data);

	const request = new Rpc.Block.Paste.Request();

	request.setContextid(contextId);
    request.setFocusedblockid(focusedId);
    request.setSelectedtextrange(Mapper.To.Range(range));
    request.setIspartofblock(isPartOfBlock);
    request.setSelectedblockidsList(blockIds);
    request.setTextslot(data.text);
	request.setHtmlslot(data.html);
	request.setAnyslotList((data.anytype || []).map(Mapper.To.Block));
	request.setFileslotList((data.files || []).map(Mapper.To.PasteFile));

	dispatcher.request(BlockPaste.name, request, callBack);
};

const BlockListMoveToExistingObject = (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListMoveToExistingObject.Request();

	request.setContextid(contextId);
    request.setTargetcontextid(targetContextId);
    request.setBlockidsList(blockIds);
    request.setDroptargetid(targetId);
    request.setPosition(position as number);

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
    request.setPosition(position as number);

	dispatcher.request(BlockListDuplicate.name, request, callBack);
};

const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListTurnInto.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style as number);

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
    request.setStyle(style as number);

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
	request.setPosition(position as number);
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
	request.setIconsize(iconSize as number);
	request.setCardstyle(cardStyle as number);
	request.setDescription(description as number);
	request.setRelationsList(relations);

	dispatcher.request(BlockLinkListSetAppearance.name, request, callBack);
};

// ---------------------- BLOCK TABLE ---------------------- //

const BlockTableCreate = (contextId: string, targetId: string, position: I.BlockPosition, rows: number, columns: number, withHeaderRow, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Create.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
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
	request.setType(type as number);

	dispatcher.request(BlockTableSort.name, request, callBack);
};

const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowCreate.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableRowCreate.name, request, callBack);
};

const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowDuplicate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

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
	request.setPosition(position as number);

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
	request.setPosition(position as number);

	dispatcher.request(BlockTableColumnMove.name, request, callBack);
};

const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnDuplicate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

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
	const request = new Rpc.BlockFile.CreateAndUpload.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setUrl(url);
	request.setLocalpath(path);

	dispatcher.request(BlockFileCreateAndUpload.name, request, callBack);
};

const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.ListSetStyle.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setStyle(style as number);

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
	request.setStyle(style as number);

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
    request.setAlign(align as number);

	dispatcher.request(BlockListSetAlign.name, request, callBack);
};

const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetVerticalAlign.Request();

	request.setContextid(contextId);
    request.setBlockidsList(blockIds);
    request.setVerticalalign(align as number);

	dispatcher.request(BlockListSetVerticalAlign.name, request, callBack);
};

const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Create.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setView(Mapper.To.View(view));
	request.setSourceList(sources);

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

const BlockDataviewFilterAdd = (contextId: string, blockId: string, viewId: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setFilter(Mapper.To.Filter(filter));

	dispatcher.request(BlockDataviewFilterAdd.name, request, callBack);
};

const BlockDataviewFilterRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewFilterRemove.name, request, callBack);
};

const BlockDataviewFilterReplace = (contextId: string, blockId: string, viewId: string, id: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setId(id);
	request.setFilter(Mapper.To.Filter(filter));

	dispatcher.request(BlockDataviewFilterReplace.name, request, callBack);
};

const BlockDataviewFilterSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Sort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewFilterSort.name, request, callBack);
};

const BlockDataviewSortAdd = (contextId: string, blockId: string, viewId: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setSort(Mapper.To.Sort(sort));

	dispatcher.request(BlockDataviewSortAdd.name, request, callBack);
};

const BlockDataviewSortRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewSortRemove.name, request, callBack);
};

const BlockDataviewSortReplace = (contextId: string, blockId: string, viewId: string, id: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setId(id);
	request.setSort(Mapper.To.Sort(sort));

	dispatcher.request(BlockDataviewSortReplace.name, request, callBack);
};

const BlockDataviewSortSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Sort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewSortSort.name, request, callBack);
};

const BlockDataviewViewRelationRemove = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewViewRelationRemove.name, request, callBack);
};

const BlockDataviewViewRelationReplace = (contextId: string, blockId: string, viewId: string, relationKey: string, relation: I.ViewRelation, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkey(relationKey);
	request.setRelation(Mapper.To.ViewRelation(relation));

	dispatcher.request(BlockDataviewViewRelationReplace.name, request, callBack);
};

const BlockDataviewViewRelationSort = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Sort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewViewRelationSort.name, request, callBack);
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

const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockRelation.SetKey.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setKey(relationKey);

	dispatcher.request(BlockRelationSetKey.name, request, callBack);
};

const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewRelationAdd.name, request, callBack);
};

const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Delete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewRelationDelete.name, request, callBack);
};

const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.SetSource.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setSourceList(sources);

	dispatcher.request(BlockDataviewSetSource.name, request, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

const BlockCreateWidget = (contextId: string, targetId: string, block: any, position: I.BlockPosition, layout: I.WidgetLayout, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.CreateWidget.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setBlock(Mapper.To.Block(block));
	request.setPosition(position as number);
	request.setWidgetlayout(layout as number);
	request.setObjectlimit(limit);

	dispatcher.request(BlockCreateWidget.name, request, callBack);
};

// ---------------------- HISTORY ---------------------- //

const HistoryShowVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.ShowVersion.Request();

	request.setObjectid(objectId);
	request.setVersionid(versionId);

	dispatcher.request(HistoryShowVersion.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, '', message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

const HistorySetVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.SetVersion.Request();

	request.setObjectid(objectId);
	request.setVersionid(versionId);

	dispatcher.request(HistorySetVersion.name, request, callBack);
};

const HistoryGetVersions = (objectId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.GetVersions.Request();

	request.setObjectid(objectId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request(HistoryGetVersions.name, request, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

const ObjectTypeRelationAdd = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Add.Request();

	request.setObjecttypeurl(objectTypeId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectTypeRelationAdd.name, request, callBack);
};

const ObjectTypeRelationRemove = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Remove.Request();

	request.setObjecttypeurl(objectTypeId);
	request.setRelationkeysList(relationKeys);

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

const ObjectCreateRelation = (details: any, callBack?: (message: any) => void) => {
	details.relationFormat = Number(details.relationFormat) || I.RelationType.LongText;

	const request = new Rpc.Object.CreateRelation.Request();

	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request(ObjectCreateRelation.name, request, callBack);
};

const ObjectCreateRelationOption = (details: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateRelation.Request();

	request.setDetails(Encode.encodeStruct(details));

	dispatcher.request(ObjectCreateRelationOption.name, request, callBack);
};

const RelationListRemoveOption = (optionIds: string[], checkInObjects: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Relation.ListRemoveOption.Request();

	request.setOptionidsList(optionIds);
	request.setCheckinobjects(checkInObjects);

	dispatcher.request(RelationListRemoveOption.name, request, callBack);
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

		// Save last opened object
		const object = detailStore.get(objectId, objectId, []);
		if (!object._empty_ && ![ I.ObjectLayout.Dashboard ].includes(object.layout)) {
			Storage.set('lastOpened', { id: object.id, layout: object.layout });
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

const ObjectImportList = (callBack?: (message: any) => void) => {
	const request = new Commands.Empty();

	dispatcher.request(ObjectImportList.name, request, callBack);
};

const ObjectImport = (options: any, snapshots: any[], existing: boolean, type: I.ImportType, mode: I.ImportMode, noProgress: boolean, isMigration: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Import.Request();

	let params = null;

	switch (type) {
		case I.ImportType.Notion:
			params = new Rpc.Object.Import.Request.NotionParams();
			params.setApikey(options.apiKey);

			request.setNotionparams(params);
			break;

		case I.ImportType.Markdown:
			params = new Rpc.Object.Import.Request.MarkdownParams();
			params.setPathList(options.paths);

			request.setMarkdownparams(params);
			break;

		case I.ImportType.Html:
			params = new Rpc.Object.Import.Request.HtmlParams();
			params.setPathList(options.paths);

			request.setHtmlparams(params);
			break;

		case I.ImportType.Text:
			params = new Rpc.Object.Import.Request.TxtParams();
			params.setPathList(options.paths);

			request.setTxtparams(params);
			break;

		case I.ImportType.Csv:
			params = new Rpc.Object.Import.Request.CsvParams();
			params.setPathList(options.paths);
			params.setMode(options.mode);
			params.setUsefirstrowforrelations(options.firstRow);
			params.setTransposerowsandcolumns(options.transpose);
			params.setDelimiter(options.delimiter);

			request.setCsvparams(params);
			break;

		case I.ImportType.Protobuf:
			params = new Rpc.Object.Import.Request.PbParams();
			params.setPathList(options.paths);
			params.setNocollection(options.noCollection);

			request.setPbparams(params);
			break;

	};

	request.setSnapshotsList((snapshots || []).map(Mapper.To.Snapshot));
	request.setUpdateexistingobjects(existing);
	request.setType(type as number);
	request.setMode(mode as number);
	request.setNoprogress(noProgress);
	request.setIsmigration(isMigration);
	
	dispatcher.request(ObjectImport.name, request, callBack);
};

const ObjectImportNotionValidateToken = (token: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Import.Notion.ValidateToken.Request();

	request.setToken(token);

	dispatcher.request(ObjectImportNotionValidateToken.name, request, callBack);
};

const ObjectImportUseCase = (usecase: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ImportUseCase.Request();

	request.setUsecase(usecase);

	dispatcher.request(ObjectImportUseCase.name, request, callBack);
};

const ObjectSetObjectType = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetObjectType.Request();

	request.setContextid(contextId);
	request.setObjecttypeurl(url);

	dispatcher.request(ObjectSetObjectType.name, request, callBack);
};

const ObjectSetSource = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetSource.Request();

	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request(ObjectSetSource.name, request, callBack);
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

	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setFulltext(fullText);
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(keys);

	dispatcher.request(ObjectSearch.name, request, callBack);
};

const ObjectSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, ignoreWorkspace: boolean, afterId: string, beforeId: string, noDeps: boolean, collectionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchSubscribe.Request();

	request.setSubid(subId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(UtilCommon.arrayUnique(keys));
	request.setSourceList(sources);
	request.setIgnoreworkspace(ignoreWorkspace as any);
	request.setAfterid(afterId);
	request.setBeforeid(beforeId);
	request.setNodepsubscription(noDeps);
	request.setCollectionid(collectionId);

	dispatcher.request(ObjectSearchSubscribe.name, request, callBack);
};

const ObjectGroupsSubscribe = (subId: string, relationKey: string, filters: I.Filter[], sources: string[], collectionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.GroupsSubscribe.Request();

	request.setSubid(subId);
	request.setRelationkey(relationKey);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSourceList(sources);
	request.setCollectionid(collectionId);

	dispatcher.request(ObjectGroupsSubscribe.name, request, callBack);
};

const ObjectSubscribeIds = (subId: string, ids: string[], keys: string[], ignoreWorkspace: boolean, noDeps: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SubscribeIds.Request();

	request.setSubid(subId);
	request.setIdsList(ids);
	request.setKeysList(keys);
	request.setIgnoreworkspace(ignoreWorkspace as any);
	request.setNodepsubscription(noDeps);

	dispatcher.request(ObjectSubscribeIds.name, request, callBack);
};

const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchUnsubscribe.Request();

	request.setSubidsList(subIds);

	dispatcher.request(ObjectSearchUnsubscribe.name, request, callBack);
};

const ObjectRelationAdd = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Add.Request();

	request.setContextid(contextId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectRelationAdd.name, request, callBack);
};

const ObjectRelationDelete = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Delete.Request();

	request.setContextid(contextId);
	request.setRelationkeysList(relationKeys);

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
    request.setLayout(layout as number);

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

const ObjectWorkspaceSetDashboard = (contextId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.WorkspaceSetDashboard.Request();

	request.setContextid(contextId);
    request.setObjectid(objectId);

	dispatcher.request(ObjectWorkspaceSetDashboard.name, request, callBack);
};

const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToSet.Request();

	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request(ObjectToSet.name, request, callBack);
};

const ObjectToCollection = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToCollection.Request();

	request.setContextid(contextId);

	dispatcher.request(ObjectToCollection.name, request, callBack);
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


const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ShareByLink.Request();

	request.setObjectid(objectId);

	dispatcher.request(ObjectShareByLink.name, request, callBack);
};

const ObjectCollectionAdd = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Add.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionAdd.name, request, callBack);
};

const ObjectCollectionRemove = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Remove.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionRemove.name, request, callBack);
};

const ObjectCollectionSort = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Sort.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionSort.name, request, callBack);
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

const ObjectListSetObjectType = (ids: string[], typeId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetObjectType.Request();

	request.setObjectidsList(ids);
	request.setObjecttypeid(typeId);

	dispatcher.request(ObjectListSetObjectType.name, request, callBack);
};

const ObjectListExport = (path: string, objectIds: string[], format: I.ExportType, zip: boolean, includeNested: boolean, includeFiles: boolean, includeArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListExport.Request();

	request.setPath(path);
	request.setObjectidsList(objectIds);
	request.setFormat(format as number);
	request.setZip(zip);
	request.setIncludenested(includeNested);
	request.setIncludefiles(includeFiles);
	request.setIncludearchived(includeArchived);

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

const DebugTree = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Tree.Request();

	request.setTreeid(objectId);
	request.setPath(path);

	dispatcher.request(DebugTree.name, request, callBack);
};

const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.ExportLocalstore.Request();

	request.setPath(path);
	request.setDocidsList(ids);

	dispatcher.request(DebugExportLocalstore.name, request, callBack);
};

const DebugSpaceSummary = (callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.SpaceSummary.Request();

	dispatcher.request(DebugSpaceSummary.name, request, callBack);
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

	WorkspaceObjectAdd,
	WorkspaceObjectListRemove,

	AccountCreate,
	AccountRecover,
	AccountRecoverFromLegacyExport,
	AccountSelect,
	AccountStop,
	AccountDelete,
	AccountMove,

	DebugTree,
	DebugExportLocalstore,
	DebugSpaceSummary,

	FileUpload,
	FileDownload,
	FileDrop,
	FileListOffload,
	FileSpaceUsage,

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

	BlockDataviewCreateFromExistingObject,

	BlockDataviewViewCreate,
	BlockDataviewViewUpdate,
	BlockDataviewViewDelete,
	BlockDataviewViewSetActive,
	BlockDataviewViewSetPosition,

	BlockDataviewFilterAdd,
	BlockDataviewFilterReplace,
	BlockDataviewFilterRemove,
	BlockDataviewFilterSort,

	BlockDataviewSortAdd,
	BlockDataviewSortReplace,
	BlockDataviewSortRemove,
	BlockDataviewSortSort,

	BlockDataviewViewRelationReplace,
	BlockDataviewViewRelationRemove,
	BlockDataviewViewRelationSort,

	BlockDataviewGroupOrderUpdate,
	BlockDataviewObjectOrderUpdate,

	BlockDataviewRelationAdd,
	BlockDataviewRelationDelete,

	BlockCreateWidget,
	BlockWidgetSetTargetId,
	BlockWidgetSetLayout,
	BlockWidgetSetLimit,
	BlockWidgetSetViewId,

	HistoryGetVersions,
	HistoryShowVersion,
	HistorySetVersion,

	ObjectTypeRelationAdd,
	ObjectTypeRelationRemove,

	ObjectRelationAdd,
	ObjectRelationDelete,

	ObjectOpen,
	ObjectShow,
	ObjectClose,
	ObjectUndo,
	ObjectRedo,
	ObjectGraph,
	ObjectRelationAddFeatured,
	ObjectRelationRemoveFeatured,
	ObjectShareByLink,
	ObjectSearch,
	ObjectSearchSubscribe,
	ObjectSubscribeIds,
	ObjectSearchUnsubscribe,
	ObjectGroupsSubscribe,
	ObjectDuplicate,
	ObjectApplyTemplate,
	ObjectBookmarkFetch,

	ObjectImportList,
	ObjectImport,
	ObjectImportNotionValidateToken,

	ObjectImportUseCase,

	ObjectCreate,
	ObjectCreateSet,
	ObjectCreateBookmark,
	ObjectCreateObjectType,
	ObjectCreateRelation,
	ObjectCreateRelationOption,

	ObjectWorkspaceSetDashboard,

	RelationListRemoveOption,

	ObjectToSet,
	ObjectToCollection,
	ObjectToBookmark,

	ObjectSetDetails,
	ObjectSetObjectType,
	ObjectSetLayout,
	ObjectSetIsFavorite,
	ObjectSetIsArchived,
	ObjectSetSource,

	ObjectCollectionAdd,
	ObjectCollectionRemove,
	ObjectCollectionSort,

	ObjectListDuplicate,
	ObjectListDelete,
	ObjectListSetIsArchived,
	ObjectListSetIsFavorite,
	ObjectListSetObjectType,
	ObjectListExport,

	TemplateCreateFromObject,
	TemplateCreateFromObjectType,
	TemplateClone,
	TemplateExportAll,

	UnsplashSearch,
	UnsplashDownload,
};
