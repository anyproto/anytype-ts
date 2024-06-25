import { I, S, U, Mark, Storage, dispatcher, Mapper } from 'Lib';
import { Commands, Model, Encode } from 'Lib/api/pb';

export const MetricsSetParameters = (platform: I.Platform, version: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Metrics_SetParameters.create({
		platform,
		version,
	});

	dispatcher.request(MetricsSetParameters.name, request, callBack);
};

export const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Process_Cancel.create({ id });

	dispatcher.request(ProcessCancel.name, request, callBack);
};

export const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_LinkPreview_Request.create({ url });

	dispatcher.request(LinkPreview.name, request, callBack);
};

// ---------------------- GALLERY ---------------------- //

export const GalleryDownloadIndex = (callBack?: (message: any) => void) => {
	dispatcher.request(GalleryDownloadIndex.name, Commands.Empty.create(), callBack);
};

export const GalleryDownloadManifest = (url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Gallery_DownloadManifest.create({ url });

	dispatcher.request(GalleryDownloadManifest.name, request, callBack);
};

// ---------------------- APP ---------------------- //

export const AppShutdown = (callBack?: (message: any) => void) => {
	dispatcher.request(AppShutdown.name, Commands.Empty.create(), callBack);
};

export const AppGetVersion = (callBack?: (message: any) => void) => {
	dispatcher.request(AppGetVersion.name, Commands.Empty.create(), callBack);
};

// ---------------------- WALLET ---------------------- //

export const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Wallet_Create.create({ path });

	dispatcher.request(WalletCreate.name, request, callBack);
};

export const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Wallet_Recover.create({ 
		path, 
		mnemonic,
	});

	dispatcher.request(WalletRecover.name, request, callBack);
};

export const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Wallet_Convert.create({
		mnemonic,
		entropy,
	});

	dispatcher.request(WalletConvert.name, request, callBack);
};

export const WalletCreateSession = (mnemonic: string, appKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Wallet_CreateSession.create({
		mnemonic,
		appKey,
	});

	dispatcher.request(WalletCreateSession.name, request, callBack);
};

export const WalletCloseSession = (token: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Wallet_CloseSession.create({ token });

	dispatcher.request(WalletCloseSession.name, request, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

export const WorkspaceCreate = (details: any, usecase: I.Usecase, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Workspace_Create.create({
		details: Encode.struct(details),
		usecase,
	});

	dispatcher.request(WorkspaceCreate.name, request, callBack);
};

export const WorkspaceOpen = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Workspace_Open.create({ spaceId });

	dispatcher.request(WorkspaceOpen.name, request, callBack);
};

export const WorkspaceObjectAdd = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Workspace_Object_Add.create({
		spaceId,
		objectId,
	});

	dispatcher.request(WorkspaceObjectAdd.name, request, callBack);
};

export const WorkspaceObjectListRemove = (objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Workspace_Object_ListRemove.create({ objectIds });

	dispatcher.request(WorkspaceObjectListRemove.name, request, callBack);
};

export const WorkspaceSetInfo = (spaceId:string, details: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Workspace_SetInfo.create({
		spaceId,
		details: Encode.struct(details),
	});

	dispatcher.request(WorkspaceSetInfo.name, request, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceDelete = (spaceId:string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_Delete.create({ spaceId });

	dispatcher.request(SpaceDelete.name, request, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

export const AccountCreate = (name: string, avatarPath: string, storePath: string, icon: number, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_Create.create({
		name,
		avatarLocalPath: avatarPath,
		storePath,
		icon,
		networkMode: mode,
		networkCustomConfigFilePath: networkConfigPath,
	});

	dispatcher.request(AccountCreate.name, request, callBack);
};

export const AccountRecover = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountRecover.name, Commands.Empty.create(), callBack);
};

export const AccountSelect = (id: string, path: string, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_Select.create({
		id,
		rootPath: path,
		networkMode: mode,
		networkCustomConfigFilePath: networkConfigPath,
	});

	dispatcher.request(AccountSelect.name, request, callBack);
};

export const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_Stop.create({ removeData });

	dispatcher.request(AccountStop.name, request, callBack);
};

export const AccountDelete = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountDelete.name, Commands.Empty.create(), callBack);
};

export const AccountRevertDeletion = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountRevertDeletion.name, Commands.Empty.create(), callBack);
};

export const AccountRecoverFromLegacyExport = (path: string, rootPath: string, icon: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_RecoverFromLegacyExport.create({
		path,
		rootPath,
		icon,
	});

	dispatcher.request(AccountRecoverFromLegacyExport.name, request, callBack);
};

export const AccountLocalLinkNewChallenge = (name: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_LocalLink_NewChallenge.create({ name });

	dispatcher.request(AccountLocalLinkNewChallenge.name, request, callBack);
};

export const AccountLocalLinkSolveChallenge = (challengeId: string, answer: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Account_LocalLink_SolveChallenge.create({
		challengeId,
		answer,
	});

	dispatcher.request(AccountLocalLinkSolveChallenge.name, request, callBack);
};

// ---------------------- FILE ---------------------- //

export const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_File_Drop.create({
		contextId,
		targetId,
		position,
		paths,
	});

	dispatcher.request(FileDrop.name, request, callBack);
};

export const FileUpload = (spaceId: string, url: string, localPath: string, type: I.FileType, details: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_File_Upload.create({
		spaceId,
		url,
		localPath,
		type,
		details: Encode.struct(details),
	});

	dispatcher.request(FileUpload.name, request, callBack);
};

export const FileDownload = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_File_Download.create({
		objectId,
		path,
	});

	dispatcher.request(FileDownload.name, request, callBack);
};

export const FileListOffload = (onlyIds: string[], includeNotPinned: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_File_ListOffload.create({
		onlyIds,
		includeNotPinned,
	});

	dispatcher.request(FileListOffload.name, request, callBack);
};


export const FileNodeUsage = (callBack?: (message: any) => void) => {
	dispatcher.request(FileNodeUsage.name, Commands.Empty.create(), callBack);
};

export const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Navigation_GetObjectInfoWithLinks.create({ pageId });

	dispatcher.request(NavigationGetObjectInfoWithLinks.name, request, callBack);
};

// ---------------------- BLOCK ---------------------- //

export const BlockCreate = (contextId: string, targetId: string, position: I.BlockPosition, block: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Create.create({
		contextId,
		targetId,
		position,
		block: Mapper.To.Block(block),
	});

	dispatcher.request(BlockCreate.name, request, callBack);
};

export const BlockSetCarriage = (contextId: string, blockId: string, range: I.TextRange, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_SetCarriage.create({
		contextId,
		blockId,
		range: Mapper.To.Range(range),
	});

	dispatcher.request(BlockSetCarriage.name, request, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockWidgetSetTargetId = (contextId: string, blockId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockWidget_SetTargetId.create({
		contextId,
		blockId,
		targetId,
	});
	
	dispatcher.request(BlockWidgetSetTargetId.name, request, callBack);
};

export const BlockWidgetSetLayout = (contextId: string, blockId: string, layout: I.WidgetLayout, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockWidget_SetLayout.create({
		contextId,
		blockId,
		layout,
	});
	
	dispatcher.request(BlockWidgetSetLayout.name, request, callBack);
};

export const BlockWidgetSetLimit = (contextId: string, blockId: string, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockWidget_SetLimit.create({
		contextId,
		blockId,
		limit,
	});
	
	dispatcher.request(BlockWidgetSetLimit.name, request, callBack);
};

export const BlockWidgetSetViewId = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockWidget_SetViewId.create({
		contextId,
		blockId,
		viewId,
	});

	dispatcher.request(BlockWidgetSetViewId.name, request, callBack);
};

export const BlockPreview = (html: string, url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Preview.create({
		html,
		url,
	});

	dispatcher.request(BlockPreview.name, request, callBack);
};

export const BlockCreateWidget = (contextId: string, targetId: string, block: any, position: I.BlockPosition, layout: I.WidgetLayout, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_CreateWidget.create({
		contextId,
		targetId,
		block: Mapper.To.Block(block),
		position,
		widgetLayout: layout,
		objectLimit: limit,
	});

	dispatcher.request(BlockCreateWidget.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextSetText = (contextId: string, blockId: string, text: string, marks: I.Mark[], range: I.TextRange, callBack?: (message: any) => void) => {
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

	marks = U.Common.objectCopy(marks);
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark) as any;

	const request = Commands.Rpc_BlockText_SetText.create({
		contextId,
		blockId,
		text,
		marks: Model.Block_Content_Text_Marks.create({ marks: marks as any[] }),
		range: Mapper.To.Range(range),
	});

	dispatcher.request(BlockTextSetText.name, request, callBack);
};

export const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_SetChecked.create({
		contextId,
		blockId,
		checked,
	});

	dispatcher.request(BlockTextSetChecked.name, request, callBack);
};

export const BlockTextSetIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_SetIcon.create({
		contextId,
		blockId,
		iconEmoji,
		iconImage,
	});

	dispatcher.request(BlockTextSetIcon.name, request, callBack);
};

export const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_SetFields.create({
		contextId,
		blockId,
		fields: Encode.struct(fields),
	});

	dispatcher.request(BlockSetFields.name, request, callBack);
};

export const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Merge.create({
		contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	});

	dispatcher.request(BlockMerge.name, request, callBack);
};

export const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Split.create({
		contextId,
		blockId,
		range: Mapper.To.Range(range),
		style,
		mode,
	});

	dispatcher.request(BlockSplit.name, request, callBack);
};

export const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockBookmark_Fetch.create({
		contextId,
		blockId,
		url,
	});

	dispatcher.request(BlockBookmarkFetch.name, request, callBack);
};

export const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockBookmark_CreateAndFetch.create({
		contextId,
		targetId,
		position,
		url,
	});

	dispatcher.request(BlockBookmarkCreateAndFetch.name, request, callBack);
};

export const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Upload.create({
		contextId,
		blockId,
		url,
		path,
	});

	dispatcher.request(BlockUpload.name, request, callBack);
};

export const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Copy.create({
		contextId,
		blocks: U.Common.objectCopy(blocks).map(Mapper.To.Block),
		range: Mapper.To.Range(range),
	});

	dispatcher.request(BlockCopy.name, request, callBack);
};

export const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_Cut.create({
		contextId,
		blocks: U.Common.objectCopy(blocks).map(Mapper.To.Block),
		range: Mapper.To.Range(range),
	});

	dispatcher.request(BlockCut.name, request, callBack);
};

export const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, url: string, callBack?: (message: any) => void) => {
	data = U.Common.objectCopy(data);

	const request = Commands.Rpc_Block_Paste.create({
		contextId,
		focusedBlockId: focusedId,
		selectedTextRange: Mapper.To.Range(range),
		isPartOfBlock,
		selectedBlockIds: blockIds,
		textSlot: data.text,
		htmlSlot: data.html,
		anySlot: (data.anytype || []).map(Mapper.To.Block),
		fileSlot: (data.files || []).map(Mapper.To.PasteFile),
		url,
	});

	dispatcher.request(BlockPaste.name, request, callBack);
};

export const BlockListMoveToExistingObject = (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListMoveToExistingObject.create({
		contextId,
		targetContextId,
		targetId,
		blockIds,
		position,
	});

	dispatcher.request(BlockListMoveToExistingObject.name, request, callBack);
};

export const BlockListConvertToObjects = (contextId: string, blockIds: string[], typeKey: string, templateId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListConvertToObjects.create({
		contextId,
		blockIds,
		objectTypeUniqueKey: typeKey,
		templateId,
	});

	dispatcher.request(BlockListConvertToObjects.name, request, callBack);
};

export const BlockListDuplicate = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListDuplicate.create({
		contextId,
		targetContextId,
		blockIds,
		targetId,
		position,
	});

	dispatcher.request(BlockListDuplicate.name, request, callBack);
};

export const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListTurnInto.create({
		contextId,
		blockIds,
		style,
	});

	dispatcher.request(BlockListTurnInto.name, request, callBack);
};

export const BlockListDelete = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListDelete.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockListDelete.name, request, callBack);
};

// ---------------------- BLOCK DIV ---------------------- //

export const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDiv_ListSetStyle.create({
		contextId,
		blockIds,
		style,
	});

	dispatcher.request(BlockDivListSetStyle.name, request, callBack);
};

// ---------------------- BLOCK LATEX ---------------------- //

export const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockLatex_SetText.create({
		contextId,
		blockId,
		text,
	});

	dispatcher.request(BlockLatexSetText.name, request, callBack);
};

// ---------------------- BLOCK LINK ---------------------- //

export const BlockLinkCreateWithObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, block: I.Block, flags: I.ObjectFlag[], typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockLink_CreateWithObject.create({
		contextId,
		targetId,
		position,
		details: Encode.struct(details || {}),
		templateId,
		internalFlags: flags.map(Mapper.To.InternalFlag),
		objectTypeUniqueKey: typeKey,
		spaceId,
		block: Mapper.To.Block(block),
	});

	dispatcher.request(BlockLinkCreateWithObject.name, request, callBack);
};

export const BlockLinkListSetAppearance = (contextId: string, blockIds: any[], iconSize: I.LinkIconSize, cardStyle: I.LinkCardStyle, description: I.LinkDescription, relations: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockLink_ListSetAppearance.create({
		contextId,
		blockIds,
		iconSize,
		cardStyle,
		description,
		relations,
	});

	dispatcher.request(BlockLinkListSetAppearance.name, request, callBack);
};

// ---------------------- BLOCK TABLE ---------------------- //

export const BlockTableCreate = (contextId: string, targetId: string, position: I.BlockPosition, rows: number, columns: number, withHeaderRow, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_Create.create({
		contextId,
		targetId,
		position,
		rows,
		columns,
		withHeaderRow,
	});

	dispatcher.request(BlockTableCreate.name, request, callBack);
};

export const BlockTableExpand = (contextId: string, targetId: string, rows: number, columns: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_Expand.create({
		contextId,
		targetId,
		rows,
		columns,
	});

	dispatcher.request(BlockTableExpand.name, request, callBack);
};

export const BlockTableSort = (contextId: string, columnId: string, type: I.SortType, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_Sort.create({
		contextId,
		columnId,
		type,
	});

	dispatcher.request(BlockTableSort.name, request, callBack);
};

export const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_RowCreate.create({
		contextId,
		targetId,
		position,
	});

	dispatcher.request(BlockTableRowCreate.name, request, callBack);
};

export const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_RowDuplicate.create({
		contextId,
		blockId,
		targetId,
		position,
	});

	dispatcher.request(BlockTableRowDuplicate.name, request, callBack);
};

export const BlockTableRowListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_RowListFill.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockTableRowListFill.name, request, callBack);
};

export const BlockTableRowListClean = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_RowListClean.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockTableRowListClean.name, request, callBack);
};

export const BlockTableRowSetHeader = (contextId: string, targetId: string, isHeader: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_RowSetHeader.create({
		contextId,
		targetId,
		isHeader,
	});

	dispatcher.request(BlockTableRowSetHeader.name, request, callBack);
};

export const BlockTableColumnCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_ColumnCreate.create({
		contextId,
		targetId,
		position,
	});

	dispatcher.request(BlockTableColumnCreate.name, request, callBack);
};

export const BlockTableColumnDelete = (contextId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_ColumnDelete.create({
		contextId,
		targetId,
	});

	dispatcher.request(BlockTableColumnDelete.name, request, callBack);
};

export const BlockTableColumnMove = (contextId: string, targetId: string, dropTargetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_ColumnMove.create({
		contextId,
		targetId,
		dropTargetId,
		position,
	});

	dispatcher.request(BlockTableColumnMove.name, request, callBack);
};

export const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_ColumnDuplicate.create({
		contextId,
		blockId,
		targetId,
		position,
	});

	dispatcher.request(BlockTableColumnDuplicate.name, request, callBack);
};

export const BlockTableColumnListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockTable_ColumnListFill.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockTableColumnListFill.name, request, callBack);
};

// ---------------------- BLOCK FILE ---------------------- //

export const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, localPath: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockFile_CreateAndUpload.create({
		contextId,
		targetId,
		position,
		url,
		localPath,
	});

	dispatcher.request(BlockFileCreateAndUpload.name, request, callBack);
};

export const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockFile_ListSetStyle.create({
		contextId,
		blockIds,
		style,
	});

	dispatcher.request(BlockFileListSetStyle.name, request, callBack);
};

export const BlockFileSetTargetObjectId = (contextId: string, blockId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockFile_SetTargetObjectId.create({
		contextId,
		blockId,
		objectId,
	});

	dispatcher.request(BlockFileSetTargetObjectId.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_ListSetColor.create({
		contextId,
		blockIds,
		color,
	});

	dispatcher.request(BlockTextListSetColor.name, request, callBack);
};

export const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_ListSetMark.create({
		contextId,
		blockIds,
		mark: Mapper.To.Mark(mark),
	});

	dispatcher.request(BlockTextListSetMark.name, request, callBack);
};

export const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_ListSetStyle.create({
		contextId,
		blockIds,
		style,
	});

	dispatcher.request(BlockTextListSetStyle.name, request, callBack);
};

export const BlockTextListClearStyle = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_ListClearStyle.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockTextListClearStyle.name, request, callBack);
};

export const BlockTextListClearContent = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockText_ListClearContent.create({
		contextId,
		blockIds,
	});

	dispatcher.request(BlockTextListClearContent.name, request, callBack);
};

export const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListSetFields.create({
		contextId,
		fields: fields.map(Mapper.To.Fields),
	});

	dispatcher.request(BlockListSetFields.name, request, callBack);
};

// ---------------------- BLOCK LIST ---------------------- //

export const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListSetBackgroundColor.create({
		contextId,
		blockIds,
		color,
	});

	dispatcher.request(BlockListSetBackgroundColor.name, request, callBack);
};

export const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockHAlign, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListSetAlign.create({
		contextId,
		blockIds,
		align,
	});

	dispatcher.request(BlockListSetAlign.name, request, callBack);
};

export const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Block_ListSetVerticalAlign.create({
		contextId,
		blockIds,
		align,
	});

	dispatcher.request(BlockListSetVerticalAlign.name, request, callBack);
};

// ---------------------- BLOCK DATAVIEW ---------------------- //

export const BlockDataviewCreateFromExistingObject = (contextId: string, blockId: string, targetObjectId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_CreateFromExistingObject.create({
		contextId,
		blockId,
		targetObjectId,
	});

	dispatcher.request(BlockDataviewCreateFromExistingObject.name, request, callBack);
};

export const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, sources: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_View_Create.create({
		contextId,
		blockId,
		view: Mapper.To.View(view),
		source: sources,
	});

	dispatcher.request(BlockDataviewViewCreate.name, request, callBack);
};

export const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_View_Update.create({
		contextId,
		blockId,
		viewId,
		view: Mapper.To.View(view),
	});

	dispatcher.request(BlockDataviewViewUpdate.name, request, callBack);
};

export const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_View_Delete.create({
		contextId,
		blockId,
		viewId,
	});

	dispatcher.request(BlockDataviewViewDelete.name, request, callBack);
};

export const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_View_SetPosition.create({
		contextId,
		blockId,
		viewId,
		position,
	});

	dispatcher.request(BlockDataviewViewSetPosition.name, request, callBack);
};

export const BlockDataviewFilterAdd = (contextId: string, blockId: string, viewId: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Filter_Add.create({
		contextId,
		blockId,
		viewId,
		filter: Mapper.To.Filter(filter),
	});

	dispatcher.request(BlockDataviewFilterAdd.name, request, callBack);
};

export const BlockDataviewFilterRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Filter_Remove.create({
		contextId,
		blockId,
		viewId,
		ids,
	});

	dispatcher.request(BlockDataviewFilterRemove.name, request, callBack);
};

export const BlockDataviewFilterReplace = (contextId: string, blockId: string, viewId: string, id: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Filter_Replace.create({
		contextId,
		blockId,
		viewId,
		id,
		filter: Mapper.To.Filter(filter),
	});

	dispatcher.request(BlockDataviewFilterReplace.name, request, callBack);
};

export const BlockDataviewFilterSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Filter_Sort.create({
		contextId,
		blockId,
		viewId,
		ids,
	});

	dispatcher.request(BlockDataviewFilterSort.name, request, callBack);
};

export const BlockDataviewSortAdd = (contextId: string, blockId: string, viewId: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Sort_Add.create({
		contextId,
		blockId,
		viewId,
		sort: Mapper.To.Sort(sort),
	});

	dispatcher.request(BlockDataviewSortAdd.name, request, callBack);
};

export const BlockDataviewSortRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Sort_Remove.create({
		contextId,
		blockId,
		viewId,
		ids,
	});

	dispatcher.request(BlockDataviewSortRemove.name, request, callBack);
};

export const BlockDataviewSortReplace = (contextId: string, blockId: string, viewId: string, id: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Sort_Replace.create({
		contextId,
		blockId,
		viewId,
		id,
		sort: Mapper.To.Sort(sort),
	});

	dispatcher.request(BlockDataviewSortReplace.name, request, callBack);
};

export const BlockDataviewSortSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Sort_SSort.create({
		contextId,
		blockId,
		viewId,
		ids,
	});

	dispatcher.request(BlockDataviewSortSort.name, request, callBack);
};

export const BlockDataviewViewRelationRemove = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_ViewRelation_Remove.create({
		contextId,
		blockId,
		viewId,
		relationKeys,
	});

	dispatcher.request(BlockDataviewViewRelationRemove.name, request, callBack);
};

export const BlockDataviewViewRelationReplace = (contextId: string, blockId: string, viewId: string, relationKey: string, relation: I.ViewRelation, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_ViewRelation_Replace.create({
		contextId,
		blockId,
		viewId,
		relationKey,
		relation: Mapper.To.ViewRelation(relation),
	});

	dispatcher.request(BlockDataviewViewRelationReplace.name, request, callBack);
};

export const BlockDataviewViewRelationSort = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_ViewRelation_Sort.create({
		contextId,
		blockId,
		viewId,
		relationKeys,
	});

	dispatcher.request(BlockDataviewViewRelationSort.name, request, callBack);
};

export const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_View_SetActive.create({
		contextId,
		blockId,
		viewId,
	});

	dispatcher.request(BlockDataviewViewSetActive.name, request, callBack);
};

export const BlockDataviewGroupOrderUpdate = (contextId: string, blockId: string, order: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_GroupOrder_Update.create({
		contextId,
		blockId,
		groupOrder: Mapper.To.GroupOrder(order),
	});

	dispatcher.request(BlockDataviewGroupOrderUpdate.name, request, callBack);
};

export const BlockDataviewObjectOrderUpdate = (contextId: string, blockId: string, orders: any[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_ObjectOrder_Update.create({
		contextId,
		blockId,
		objectOrders: orders.map(Mapper.To.ObjectOrder),
	});

	dispatcher.request(BlockDataviewObjectOrderUpdate.name, request, callBack);
};

export const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockRelation_SetKey.create({
		contextId,
		blockId,
		key: relationKey,
	});

	dispatcher.request(BlockRelationSetKey.name, request, callBack);
};

export const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Relation_Add.create({
		contextId,
		blockId,
		relationKeys,
	});

	dispatcher.request(BlockDataviewRelationAdd.name, request, callBack);
};

export const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_Relation_Delete.create({
		contextId,
		blockId,
		relationKeys,
	});

	dispatcher.request(BlockDataviewRelationDelete.name, request, callBack);
};

export const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_BlockDataview_SetSource.create({
		contextId,
		blockId,
		source: sources,
	});

	dispatcher.request(BlockDataviewSetSource.name, request, callBack);
};

// ---------------------- HISTORY ---------------------- //

export const HistoryShowVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_History_ShowVersion.create({
		objectId,
		versionId,
	});

	dispatcher.request(HistoryShowVersion.name, request, callBack);
};

export const HistorySetVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_History_SetVersion.create({
		objectId,
		versionId,
	});

	dispatcher.request(HistorySetVersion.name, request, callBack);
};

export const HistoryGetVersions = (objectId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_History_GetVersions.create({
		objectId,
		lastVersionId,
		limit,
	});

	dispatcher.request(HistoryGetVersions.name, request, callBack);
};

export const HistoryDiffVersions = (objectId: string, spaceId: string, currentVersion: string, previousVersion: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_History_DiffVersions.create({
		objectId,
		spaceId,
		currentVersion,
		previousVersion,
	});

	dispatcher.request(HistoryDiffVersions.name, request, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

export const ObjectTypeRelationAdd = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectType_Relation_Add.create({
		objectTypeUrl: objectTypeId,
		relationKeys,
	});

	dispatcher.request(ObjectTypeRelationAdd.name, request, callBack);
};

export const ObjectTypeRelationRemove = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectType_Relation_Remove.create({
		objectTypeUrl: objectTypeId,
		relationKeys,
	});

	dispatcher.request(ObjectTypeRelationRemove.name, request, callBack);
};

// ---------------------- OBJECT ---------------------- //

export const ObjectCreate = (details: any, flags: I.ObjectFlag[], templateId: string, typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Create.create({
		spaceId,
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
		templateId,
		objectTypeUniqueKey: typeKey,
	});

	dispatcher.request(ObjectCreate.name, request, callBack);
};

export const ObjectCreateSet = (sources: string[], details: any, templateId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_CreateSet.create({
		spaceId,
		details: Encode.struct(details),
		templateId,
		source: sources,
	});

	dispatcher.request(ObjectCreateSet.name, request, callBack);
};

export const ObjectCreateBookmark = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_CreateBookmark.create({
		spaceId,
		details: Encode.struct(details),
	});

	dispatcher.request(ObjectCreateBookmark.name, request, callBack);
};

export const ObjectCreateFromUrl = (details: any, spaceId: string, typeKey: string, url: string, addPageContent: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_CreateFromUrl.create({
		details: Encode.struct(details),
		spaceId,
		objectTypeUniqueKey: typeKey,
		url,
		addPageContent,
	});

	dispatcher.request(ObjectCreateFromUrl.name, request, callBack);
};

export const ObjectCreateObjectType = (details: any, flags: I.ObjectFlag[], spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_CreateObjectType.create({
		spaceId,
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
	});

	dispatcher.request(ObjectCreateObjectType.name, request, callBack);
};

export const ObjectCreateRelation = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	details.relationFormat = Number(details.relationFormat) || I.RelationType.LongText;

	const request = Commands.Rpc_Object_CreateRelation.create({
		spaceId,
		details: Encode.struct(details),
	});

	dispatcher.request(ObjectCreateRelation.name, request, callBack);
};

export const ObjectCreateRelationOption = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_CreateRelation.create({
		spaceId,
		details: Encode.struct(details),
	});

	dispatcher.request(ObjectCreateRelationOption.name, request, callBack);
};

export const RelationListRemoveOption = (optionIds: string[], checkInObjects: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Relation_ListRemoveOption.create({
		optionIds,
		checkInObjects,
	});

	dispatcher.request(RelationListRemoveOption.name, request, callBack);
};

export const ObjectBookmarkFetch = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_BookmarkFetch.create({
		contextId,
		url,
	});

	dispatcher.request(ObjectBookmarkFetch.name, request, callBack);
};

export const ObjectOpen = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Open.create({
		objectId,
		traceId,
		spaceId,
	});

	dispatcher.request(ObjectOpen.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView);
		};

		// Save last opened object
		const object = S.Detail.get(objectId, objectId, []);
		const windowId = U.Common.getCurrentElectronWindowId();

		if (!object._empty_ && ![ I.ObjectLayout.Dashboard ].includes(object.layout)) {
			Storage.setLastOpened(windowId, { id: object.id, layout: object.layout, spaceId: object.spaceId });
		};

		if (callBack) {
			callBack(message);
		};
	});
};

export const ObjectShow = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Show.create({
		objectId,
		traceId,
		spaceId,
	});

	dispatcher.request(ObjectShow.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView);
		};

		if (callBack) {
			callBack(message);
		};
	});
};

export const ObjectClose = (objectId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Close.create({
		objectId,
		spaceId,
	});

	dispatcher.request(ObjectClose.name, request, callBack);
};

export const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Undo.create({ contextId });

	dispatcher.request(ObjectUndo.name, request, callBack);
};

export const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Redo.create({ contextId });

	dispatcher.request(ObjectRedo.name, request, callBack);
};

export const ObjectImport = (spaceId: string, options: any, snapshots: any[], type: I.ImportType, mode: I.ImportMode, noProgress: boolean, isMigration: boolean, updateExistingObjects: boolean, isNewSpace: boolean, callBack?: (message: any) => void) => {
	let params = null;

	switch (type) {
		case I.ImportType.Notion: {
			params = Commands.Rpc_Object_Import_Request_NotionParams.create({ 
				apiKey: options.apiKey,
			});
			break;
		};

		case I.ImportType.Markdown: {
			params = Commands.Rpc_Object_Import_Request_MarkdownParams.create({
				path: options.paths,
			});
			break;
		};

		case I.ImportType.Html: {
			params = Commands.Rpc_Object_Import_Request_HtmlParams.create({
				path: options.paths,
			});
			break;
		};

		case I.ImportType.Text: {
			params = Commands.Rpc_Object_Import_Request_TxtParams.create({
				path: options.paths,
			});
			break;
		};

		case I.ImportType.Csv: {
			params = Commands.Rpc_Object_Import_Request_CsvParams.create({
				path: options.paths,
				mode: options.mode,
				useFirstRowForRelations: options.firstRow,
				transposeRowsAndColumns: options.transpose,
				delimiter: options.delimiter,
			});
			break;
		};

		case I.ImportType.Protobuf: {
			params = Commands.Rpc_Object_Import_Request_PbParams.create({
				path: options.paths,
				noCollection: options.noCollection,
				collectionTitle: options.title,
				importType: options.importType,
			});
			break;
		};

	};

	const request = Commands.Rpc_Object_Import_Request.create({
		spaceId,
		snapshots: snapshots.map(Mapper.To.Snapshot),
		type: type as number,
		mode: mode as number,
		noProgress,
		isMigration,
		updateExistingObjects,
		isNewSpace,
		params,
	});

	dispatcher.request(ObjectImport.name, request, callBack);
};

export const ObjectImportNotionValidateToken = (token: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Import_Notion_ValidateToken.create({ token });

	dispatcher.request(ObjectImportNotionValidateToken.name, request, callBack);
};

export const ObjectImportUseCase = (spaceId: string, usecase: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ImportUseCase.create({
		spaceId,
		usecase,
	});

	dispatcher.request(ObjectImportUseCase.name, request, callBack);
};

export const ObjectImportExperience = (spaceId: string, url: string, title: string, isNewSpace: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ImportExperience.create({
		spaceId,
		url,
		title,
		isNewSpace,
	});

	dispatcher.request(ObjectImportExperience.name, request, callBack);
};

export const ObjectSetObjectType = (contextId: string, typeKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SetObjectType.create({
		contextId,
		objectTypeUniqueKey: typeKey,
	});

	dispatcher.request(ObjectSetObjectType.name, request, callBack);
};

export const ObjectSetSource = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SetSource.create({
		contextId,
		source: sources,
	});

	dispatcher.request(ObjectSetSource.name, request, callBack);
};

export const ObjectListSetDetails = (objectIds: string[], details: any[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListSetDetails.create({
		objectIds,
		details: details.map(Mapper.To.Details),
	});

	dispatcher.request(ObjectListSetDetails.name, request, callBack);
};

export const ObjectSearch = (filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Search.create({
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		fullText,
		offset,
		limit,
		keys,
	});

	dispatcher.request(ObjectSearch.name, request, callBack);
};

export const ObjectSearchWithMeta = (filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SearchWithMeta.create({
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		fullText,
		offset,
		limit,
		keys,
	});

	dispatcher.request(ObjectSearchWithMeta.name, request, callBack);
};

export const ObjectSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, ignoreWorkspace: boolean, afterId: string, beforeId: string, noDeps: boolean, collectionId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SearchSubscribe.create({
		subId,
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		keys,
		source: sources,
		offset,
		limit,
		ignoreWorkspace,
		afterId,
		beforeId,
		noDepSubscription: noDeps,
		collectionId,
	});

	dispatcher.request(ObjectSearchSubscribe.name, request, callBack);
};

export const ObjectGroupsSubscribe = (spaceId: string, subId: string, relationKey: string, filters: I.Filter[], sources: string[], collectionId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_GroupsSubscribe.create({
		spaceId,
		subId,
		relationKey,
		filters: filters.map(Mapper.To.Filter),
		source: sources,
		collectionId,
	});

	dispatcher.request(ObjectGroupsSubscribe.name, request, callBack);
};

export const ObjectSubscribeIds = (subId: string, ids: string[], keys: string[], ignoreWorkspace: boolean, noDeps: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SubscribeIds.create({
		subId,
		ids,
		keys,
		ignoreWorkspace,
		noDepSubscription: noDeps,
	});

	dispatcher.request(ObjectSubscribeIds.name, request, callBack);
};

export const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SearchUnsubscribe.create({ subIds });

	dispatcher.request(ObjectSearchUnsubscribe.name, request, callBack);
};

export const ObjectRelationAdd = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectRelation_Add.create({
		contextId,
		relationKeys: keys,
	});

	dispatcher.request(ObjectRelationAdd.name, request, callBack);
};

export const ObjectRelationDelete = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectRelation_Delete.create({
		contextId,
		relationKeys: keys,
	});

	dispatcher.request(ObjectRelationDelete.name, request, callBack);
};

export const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectRelation_AddFeatured.create({
		contextId,
		relations: keys,
	});

	dispatcher.request(ObjectRelationAddFeatured.name, request, callBack);
};

export const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectRelation_RemoveFeatured.create({
		contextId,
		relations: keys,
	});

	dispatcher.request(ObjectRelationRemoveFeatured.name, request, callBack);
};

export const ObjectSetLayout = (contextId: string, layout: I.ObjectLayout, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SetLayout.create({
		contextId,
		layout,
	});

	dispatcher.request(ObjectSetLayout.name, request, callBack);
};

export const ObjectSetIsFavorite = (contextId: string, isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_SetIsFavorite.create({
		contextId,
		isFavorite,
	});

	dispatcher.request(ObjectSetIsFavorite.name, request, callBack);
};

export const ObjectGraph = (spaceId: string, filters: any[], limit: number, types: string[], keys: string[], collectionId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Graph.create({
		spaceId,
		filters: filters.map(Mapper.To.Filter),
		limit,
		objectTypeFilter: types,
		keys,
		collectionId,
		setSource: sources,
	});

	dispatcher.request(ObjectGraph.name, request, callBack);
};

export const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ToSet.create({
		contextId,
		sources,
	});

	dispatcher.request(ObjectToSet.name, request, callBack);
};

export const ObjectToCollection = (contextId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ToCollection.create({ contextId });

	dispatcher.request(ObjectToCollection.name, request, callBack);
};

export const ObjectToBookmark = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ToBookmark.create({
		contextId,
		url,
	});

	dispatcher.request(ObjectToBookmark.name, request, callBack);
};

export const ObjectDuplicate = (contextId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_Duplicate.create({ contextId });

	dispatcher.request(ObjectDuplicate.name, request, callBack);
};

export const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ApplyTemplate.create({
		contextId,
		templateId,
	});

	dispatcher.request(ObjectApplyTemplate.name, request, callBack);
};

export const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ShareByLink.create({ objectId });

	dispatcher.request(ObjectShareByLink.name, request, callBack);
};

export const ObjectCollectionAdd = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectCollection_Add.create({
		contextId,
		objectIds,
	});

	dispatcher.request(ObjectCollectionAdd.name, request, callBack);
};

export const ObjectCollectionRemove = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectCollection_Remove.create({
		contextId,
		objectIds,
	});

	dispatcher.request(ObjectCollectionRemove.name, request, callBack);
};

export const ObjectCollectionSort = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_ObjectCollection_Sort.create({
		contextId,
		objectIds,
	});

	dispatcher.request(ObjectCollectionSort.name, request, callBack);
};

// ---------------------- OBJECT LIST ---------------------- //

export const ObjectListDuplicate = (objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListDuplicate.create({ objectIds });

	dispatcher.request(ObjectListDuplicate.name, request, callBack);
};

export const ObjectListDelete = (objectIds: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListDelete.create({ objectIds });

	dispatcher.request(ObjectListDelete.name, request, callBack);
};

export const ObjectListSetIsArchived = (objectIds: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListSetIsArchived.create({
		objectIds,
		isArchived,
	});

	dispatcher.request(ObjectListSetIsArchived.name, request, callBack);
};

export const ObjectListSetIsFavorite = (objectIds: string[], isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListSetIsFavorite.create({
		objectIds,
		isFavorite,
	});

	dispatcher.request(ObjectListSetIsFavorite.name, request, callBack);
};

export const ObjectListSetObjectType = (objectIds: string[], typeKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListSetObjectType.create({
		objectIds,
		objectTypeUniqueKey: typeKey,
	});

	dispatcher.request(ObjectListSetObjectType.name, request, callBack);
};

export const ObjectListExport = (spaceId: string, path: string, objectIds: string[], format: I.ExportType, zip: boolean, includeNested: boolean, includeFiles: boolean, includeArchived: boolean, isJson: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Object_ListExport.create({
		spaceId,
		path,
		objectIds,
		format,
		zip,
		includeNested,
		includeFiles,
		includeArchived,
		isJson,
	});

	dispatcher.request(ObjectListExport.name, request, callBack);
};

// ---------------------- TEMPLATE ---------------------- //

export const TemplateCreateFromObject = (contextId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Template_CreateFromObject.create({ contextId });

	dispatcher.request(TemplateCreateFromObject.name, request, callBack);
};

export const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Template_ExportAll.create({ path });

	dispatcher.request(TemplateExportAll.name, request, callBack);
};

// ---------------------- UNSPLASH ---------------------- //

export const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Unsplash_Search.create({
		query,
		limit,
	});

	dispatcher.request(UnsplashSearch.name, request, callBack);
};

export const UnsplashDownload = (spaceId: string, id: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Unsplash_Download.create({
		spaceId,
		pictureId: id,
	});

	dispatcher.request(UnsplashDownload.name, request, callBack);
};

// ---------------------- DEBUG ---------------------- //

export const DebugTree = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Debug_Tree.create({
		treeId: objectId,
		path,
	});

	dispatcher.request(DebugTree.name, request, callBack);
};

export const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Debug_ExportLocalstore.create({
		path,
		docIds: ids,
	});

	dispatcher.request(DebugExportLocalstore.name, request, callBack);
};

export const DebugSpaceSummary = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Debug_SpaceSummary.create({ spaceId });

	dispatcher.request(DebugSpaceSummary.name, request, callBack);
};

export const DebugStackGoroutines = (path: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Debug_StackGoroutines.create({ path });

	dispatcher.request(DebugStackGoroutines.name, request, callBack);
};

export const DebugStat = (callBack?: (message: any) => void) => {
	dispatcher.request(DebugStat.name, Commands.Rpc_Debug_Stat.create(), callBack);
};

// ---------------------- NOTIFICATION ---------------------- //

export const NotificationList = (includeRead: boolean, limit: number, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Notification_List.create({
		includeRead,
		limit,
	});

	dispatcher.request(NotificationList.name, request, callBack);
};

export const NotificationReply = (ids: string[], action: I.NotificationAction, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Notification_Reply.create({
		ids,
		actiontype: action,
}	);

	dispatcher.request(NotificationReply.name, request, callBack);
};

// ---------------------- NAME SERVICE ---------------------- //

export const NameServiceResolveName = (name: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_NameService_ResolveName.create({
		nsName: name,
		nsNameType: I.NameType.Any,
	});

	dispatcher.request(NameServiceResolveName.name, request, callBack);
};

// ---------------------- PAYMENTS ---------------------- //

export const MembershipGetStatus = (noCache: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_GetStatus.create({ noCache });

	dispatcher.request(MembershipGetStatus.name, request, callBack);
};

export const MembershipGetTiers = (noCache: boolean, locale: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_GetTiers.create({
		noCache,
		locale,
	});

	dispatcher.request(MembershipGetTiers.name, request, callBack);
};

export const MembershipIsNameValid = (tier: I.TierType, name: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_IsNameValid.create({
		requestedTier: tier,
		nsName: name,
		nsNameType: I.NameType.Any,
	});

	dispatcher.request(MembershipIsNameValid.name, request, callBack);
};

export const MembershipRegisterPaymentRequest = (tier: I.TierType, method: I.PaymentMethod, name: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_RegisterPaymentRequest.create({
		requestedTier: tier,
		paymentMethod: method,
		nsName: name,
		nsNameType: I.NameType.Any,
	});

	dispatcher.request(MembershipRegisterPaymentRequest.name, request, callBack);
};

export const MembershipGetPortalLinkUrl = (callBack?: (message: any) => void) => {
	dispatcher.request(MembershipGetPortalLinkUrl.name, Commands.Empty.create(), callBack);
};

export const MembershipGetVerificationEmail = (email: string, subscribeToNewsletter: boolean, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_GetVerificationEmail.create({
		email,
		subscribeToNewsletter,
	});
	
	dispatcher.request(MembershipGetVerificationEmail.name, request, callBack);
};

export const MembershipVerifyEmailCode = (code: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_VerifyEmailCode.create({ code });
	
	dispatcher.request(MembershipVerifyEmailCode.name, request, callBack);
};

export const MembershipFinalize = (name: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Membership_Finalize.create({
		nsName: name,
		nsNameType: I.NameType.Any,
	});

	dispatcher.request(MembershipFinalize.name, request, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceInviteGenerate = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_InviteGenerate.create({ spaceId });

	dispatcher.request(SpaceInviteGenerate.name, request, callBack);
};

export const SpaceInviteView = (inviteCid: string, inviteFileKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_InviteView.create({
		inviteCid,
		inviteFileKey,
	});

	dispatcher.request(SpaceInviteView.name, request, callBack);
};

export const SpaceInviteRevoke = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_InviteRevoke.create({ spaceId });

	dispatcher.request(SpaceInviteRevoke.name, request, callBack);
};

export const SpaceInviteGetCurrent = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_InviteGetCurrent.create({ spaceId });

	dispatcher.request(SpaceInviteGetCurrent.name, request, callBack);
};

export const SpaceStopSharing = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_StopSharing.create({ spaceId });

	dispatcher.request(SpaceStopSharing.name, request, callBack);
};

export const SpaceMakeShareable = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_StopSharing.create({ spaceId });

	dispatcher.request(SpaceMakeShareable.name, request, callBack);
};

export const SpaceJoin = (networkId: string, spaceId: string, inviteCid: string, inviteFileKey: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_Join.create({
		networkId,
		spaceId,
		inviteCid,
		inviteFileKey,
	});

	dispatcher.request(SpaceJoin.name, request, callBack);
};

export const SpaceJoinCancel = (spaceId: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_JoinCancel.create({ spaceId });

	dispatcher.request(SpaceJoinCancel.name, request, callBack);
};

export const SpaceRequestApprove = (spaceId: string, identity: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_RequestApprove.create({
		spaceId,
		identity,
		permissions,
	});

	dispatcher.request(SpaceRequestApprove.name, request, callBack);
};

export const SpaceRequestDecline = (spaceId: string, identity: string, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_RequestDecline.create({
		spaceId,
		identity,
	});

	dispatcher.request(SpaceRequestDecline.name, request, callBack);
};

export const SpaceParticipantPermissionsChange = (spaceId: string, changes: any[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_ParticipantPermissionsChange.create({
		spaceId,
		changes,
	});

	dispatcher.request(SpaceParticipantPermissionsChange.name, request, callBack);
};

export const SpaceParticipantRemove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_ParticipantRemove.create({
		spaceId,
		identities,
	});

	dispatcher.request(SpaceParticipantRemove.name, request, callBack);
};

export const SpaceLeaveApprove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Space_LeaveApprove.create({
		spaceid: spaceId,
		identities,
	});

	dispatcher.request(SpaceLeaveApprove.name, request, callBack);
};

// ---------------------- EXTENSION ---------------------- //

export const BroadcastPayloadEvent = (payload: any, callBack?: (message: any) => void) => {
	const request = Commands.Rpc_Broadcast_PayloadEvent.create({
		payload: JSON.stringify(payload, null, 3),
	});

	dispatcher.request(BroadcastPayloadEvent.name, request, callBack);
};

// ---------------------- DEVICES ---------------------- //

export const DeviceList = (callBack?: (message: any) => void) => {
	dispatcher.request(DeviceList.name, Commands.Empty.create(), callBack);
};