import { I, S, U, J, Mark, Storage, dispatcher, Encode, Mapper, keyboard } from 'Lib';

export const InitialSetParameters = (platform: I.Platform, version: string, workDir: string, logLevel: string, doNotSendLogs: boolean, doNotSaveLogs: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(InitialSetParameters.name, {
		platform,
		version,
		workDir,
		logLevel,
		doNotSendLogs,
		doNotSaveLogs,
	}, callBack);
};

export const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request(ProcessCancel.name, { id }, callBack);
};

export const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	dispatcher.request(LinkPreview.name, { url }, callBack);
};

// ---------------------- GALLERY ---------------------- //

export const GalleryDownloadIndex = (callBack?: (message: any) => void) => {
	dispatcher.request(GalleryDownloadIndex.name, {}, callBack);
};

export const GalleryDownloadManifest = (url: string, callBack?: (message: any) => void) => {
	dispatcher.request(GalleryDownloadManifest.name, { url }, callBack);
};

// ---------------------- APP ---------------------- //

export const AppShutdown = (callBack?: (message: any) => void) => {
	dispatcher.request(AppShutdown.name, {}, callBack);
};

export const AppGetVersion = (callBack?: (message: any) => void) => {
	dispatcher.request(AppGetVersion.name, {}, callBack);
};

export const AppSetDeviceState = (state: I.AppDeviceState, callBack?: (message: any) => void) => {
	dispatcher.request(AppSetDeviceState.name, {
		deviceState: state as number,
	}, callBack);
};

// ---------------------- WALLET ---------------------- //

export const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request(WalletCreate.name, { rootPath: path }, callBack);
};

export const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	dispatcher.request(WalletRecover.name, {
		rootPath: path,
		mnemonic,
	}, callBack);
};

export const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	dispatcher.request(WalletConvert.name, {
		mnemonic,
		entropy,
	}, callBack);
};

export const WalletCreateSession = (mnemonic: string, appKey: string, token: string, callBack?: (message: any) => void) => {
	dispatcher.request(WalletCreateSession.name, {
		...(mnemonic ? { mnemonic } : {}),
		...(appKey ? { appKey } : {}),
		...(token ? { token } : {}),
	}, callBack);
};

export const WalletCloseSession = (token: string, callBack?: (message: any) => void) => {
	dispatcher.request(WalletCloseSession.name, { token }, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

export const WorkspaceCreate = (details: any, usecase: I.Usecase, callBack?: (message: any) => void) => {
	dispatcher.request(WorkspaceCreate.name, {
		details: Encode.struct(details),
		usecase: usecase as number,
	}, callBack);
};

export const WorkspaceOpen = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(WorkspaceOpen.name, { spaceId }, callBack);
};

export const WorkspaceObjectAdd = (spaceId:string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(WorkspaceObjectAdd.name, {
		spaceId,
		objectId,
	}, callBack);
};

export const WorkspaceObjectListRemove = (objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(WorkspaceObjectListRemove.name, { objectIds }, callBack);
};

export const WorkspaceSetInfo = (spaceId:string, details: any, callBack?: (message: any) => void) => {
	dispatcher.request(WorkspaceSetInfo.name, {
		spaceId,
		details: Encode.struct(details),
	}, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceDelete = (spaceId:string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceDelete.name, { spaceId }, callBack);
};

export const SpaceSetOrder = (id: string, spaceViewOrder: string[], callBack?: (message: any) => void) => {
	dispatcher.request(SpaceSetOrder.name, {
		spaceViewId: id,
		spaceViewOrder,
	}, callBack);
};

export const SpaceUnsetOrder = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceUnsetOrder.name, { spaceViewId: id }, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

export const AccountCreate = (name: string, avatarPath: string, storePath: string, icon: number, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountCreate.name, {
		name,
		avatarLocalPath: avatarPath,
		storePath,
		icon,
		networkMode: mode as number,
		networkCustomConfigFilePath: networkConfigPath,
		jsonApiListenAddr: J.Url.api,
		enableMembershipV2: true,
	}, callBack);
};

export const AccountRecover = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountRecover.name, {}, callBack);
};

export const AccountSelect = (id: string, path: string, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountSelect.name, {
		id,
		rootPath: path,
		networkMode: mode as number,
		networkCustomConfigFilePath: networkConfigPath,
		jsonApiListenAddr: J.Url.api,
		enableMembershipV2: true,
	}, callBack);
};

export const AccountMigrate = (id: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountMigrate.name, {
		id,
		rootPath: path,
	}, callBack);
};

export const AccountMigrateCancel = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountMigrateCancel.name, { id }, callBack);
};

export const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(AccountStop.name, { removeData }, callBack);
};

export const AccountDelete = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountDelete.name, {}, callBack);
};

export const AccountRevertDeletion = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountRevertDeletion.name, {}, callBack);
};

export const AccountRecoverFromLegacyExport = (path: string, rootPath: string, icon: number, callBack?: (message: any) => void) => {
	dispatcher.request(AccountRecoverFromLegacyExport.name, {
		path,
		rootPath,
		icon,
	}, callBack);
};

export const AccountLocalLinkNewChallenge = (name: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkNewChallenge.name, { appName: name }, callBack);
};

export const AccountLocalLinkSolveChallenge = (id: string, answer: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkSolveChallenge.name, {
		challengeId: id,
		answer,
	}, callBack);
};

export const AccountLocalLinkListApps = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkListApps.name, {}, callBack);
};

export const AccountLocalLinkCreateApp = (app: any, callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkCreateApp.name, {
		app: Mapper.To.AppInfo(app),
	}, callBack);
};

export const AccountLocalLinkRevokeApp = (hash: string, callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkRevokeApp.name, { appHash: hash }, callBack);
};

// ---------------------- FILE ---------------------- //

export const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	dispatcher.request(FileDrop.name, {
		contextId,
		dropTargetId: targetId,
		position: position as number,
		localFilePaths: paths,
		style: S.Common.fileStyle as number,
	}, callBack);
};

export const FileUpload = (spaceId: string, url: string, path: string, type: I.FileType, details: any, preloadOnly: boolean, preloadFileId: string, imageKind: I.ImageKind, createdInContext: string, createdInContextRef: string, callBack?: (message: any) => void) => {
	if (!url && !path && !preloadFileId) {
		return;
	};

	dispatcher.request(FileUpload.name, {
		spaceId,
		url,
		localPath: path,
		type: type as number,
		details: Encode.struct(details),
		preloadFileId,
		preloadOnly,
		imageKind: imageKind as number,
		createdInContext,
		createdInContextRef,
	}, callBack);
};

export const FileDownload = (objectId: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request(FileDownload.name, {
		objectId,
		path,
	}, callBack);
};

export const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(FileListOffload.name, {
		onlyIds: ids,
		includeNotPinned: notPinned,
	}, callBack);
};


export const FileNodeUsage = (callBack?: (message: any) => void) => {
	dispatcher.request(FileNodeUsage.name, {}, callBack);
};

export const FileReconcile = (callBack?: (message: any) => void) => {
	dispatcher.request(FileReconcile.name, {}, callBack);
};

export const FileDiscardPreload = (fileId: string, callBack?: (message: any) => void) => {
	dispatcher.request(FileDiscardPreload.name, { fileId }, callBack);
};

export const FileSetAutoDownload = (enabled: boolean, wifiOnly: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(FileSetAutoDownload.name, {
		enabled,
		wifiOnly,
	}, callBack);
};

export const FileAutoDownloadSetLimit = (sizeLimitMib: number, callBack?: (message: any) => void) => {
	dispatcher.request(FileAutoDownloadSetLimit.name, {
		sizeLimitMebibytes: sizeLimitMib,
	}, callBack);
};

// ---------------------- NAVIGATION ---------------------- //

export const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	dispatcher.request(NavigationGetObjectInfoWithLinks.name, { objectId: pageId }, callBack);
};

// ---------------------- BLOCK ---------------------- //

export const BlockCreate = (contextId: string, targetId: string, position: I.BlockPosition, block: any, callBack?: (message: any) => void) => {
	dispatcher.request(BlockCreate.name, {
		contextId,
		targetId,
		position: position as number,
		block: Mapper.To.Block(block),
	}, callBack);
};

export const BlockDataviewCreateFromExistingObject = (contextId: string, blockId: string, targetObjectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewCreateFromExistingObject.name, {
		contextId,
		blockId,
		targetObjectId,
	}, callBack);
};

export const BlockSetCarriage = (contextId: string, blockId: string, range: I.TextRange, callBack?: (message: any) => void) => {
	dispatcher.request(BlockSetCarriage.name, {
		contextId,
		blockId,
		range: Mapper.To.Range(range),
	}, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockWidgetSetTargetId = (contextId: string, blockId: string, targetId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockWidgetSetTargetId.name, {
		contextId,
		blockId,
		targetId,
	}, callBack);
};

export const BlockWidgetSetLayout = (contextId: string, blockId: string, layout: I.WidgetLayout, callBack?: (message: any) => void) => {
	dispatcher.request(BlockWidgetSetLayout.name, {
		contextId,
		blockId,
		layout: layout as number,
	}, callBack);
};

export const BlockWidgetSetLimit = (contextId: string, blockId: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request(BlockWidgetSetLimit.name, {
		contextId,
		blockId,
		limit,
	}, callBack);
};

export const BlockWidgetSetViewId = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockWidgetSetViewId.name, {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockPreview = (html: string, url: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockPreview.name, {
		html,
		url,
	}, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextSetText = (contextId: string, blockId: string, text: string, marks: I.Mark[], range: I.TextRange, callBack?: (message: any) => void) => {
	text = text.replace(/&amp;/g, '&');
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

	marks = U.Common.objectCopy(marks);
	marks = marks.filter(it => Mark.canSave(it.type));
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark) as any;

	dispatcher.request(BlockTextSetText.name, {
		contextId,
		blockId,
		text,
		marks: { marks },
		selectedTextRange: Mapper.To.Range(range),
	}, callBack);
};

export const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextSetChecked.name, {
		contextId,
		blockId,
		checked,
	}, callBack);
};

export const BlockTextSetIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextSetIcon.name, {
		contextId,
		blockId,
		iconEmoji,
		iconImage,
	}, callBack);
};


export const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	dispatcher.request(BlockSetFields.name, {
		contextId,
		blockId,
		fields: Encode.struct(fields || {}),
	}, callBack);
};

export const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockMerge.name, {
		contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	}, callBack);
};

export const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	dispatcher.request(BlockSplit.name, {
		contextId,
		blockId,
		range: Mapper.To.Range(range),
		style: style as number,
		mode: mode as number,
	}, callBack);
};

export const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockBookmarkFetch.name, {
		contextId,
		blockId,
		url,
		templateId,
	}, callBack);
};

export const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockBookmarkCreateAndFetch.name, {
		contextId,
		targetId,
		position: position as number,
		url,
		templateId,
	}, callBack);
};

export const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockUpload.name, {
		contextId,
		blockId,
		url,
		filePath: path,
	}, callBack);
};

export const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	dispatcher.request(BlockCopy.name, {
		contextId,
		blocks: blocks.map(Mapper.To.Block),
		selectedTextRange: Mapper.To.Range(range),
	}, callBack);
};

export const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	dispatcher.request(BlockCut.name, {
		contextId,
		blocks: blocks.map(Mapper.To.Block),
		selectedTextRange: Mapper.To.Range(range),
	}, callBack);
};

export const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, url: string, callBack?: (message: any) => void) => {
	data = U.Common.objectCopy(data);

	dispatcher.request(BlockPaste.name, {
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
	}, callBack);
};

export const BlockListMoveToExistingObject = (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListMoveToExistingObject.name, {
		contextId,
		targetContextId,
		blockIds,
		dropTargetId: targetId,
		position: position as number,
	}, callBack);
};

export const BlockListConvertToObjects = (contextId: string, blockIds: string[], typeKey: string, templateId: string, block: Partial<I.Block>, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListConvertToObjects.name, {
		contextId,
		blockIds,
		objectTypeUniqueKey: typeKey,
		templateId,
		block: Mapper.To.Block(block),
	}, callBack);
};

export const BlockListDuplicate = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListDuplicate.name, {
		contextId,
		targetContextId,
		blockIds,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListTurnInto.name, {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockListDelete = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockListDelete.name, {
		contextId,
		blockIds,
	}, callBack);
};

// ---------------------- BLOCK DIV ---------------------- //

export const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDivListSetStyle.name, {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

// ---------------------- BLOCK LATEX ---------------------- //

export const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockLatexSetText.name, {
		contextId,
		blockId,
		text,
	}, callBack);
};

// ---------------------- BLOCK LINK ---------------------- //

export const BlockLinkCreateWithObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, block: I.Block, flags: I.ObjectFlag[], typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	details = details || {};

	dispatcher.request(BlockLinkCreateWithObject.name, {
		contextId,
		targetId,
		position: position as number,
		details: Encode.struct(details),
		templateId,
		internalFlags: flags.map(Mapper.To.InternalFlag),
		objectTypeUniqueKey: typeKey,
		spaceId,
		block: Mapper.To.Block(block),
	}, callBack);
};

export const BlockLinkListSetAppearance = (contextId: string, blockIds: any[], iconSize: I.LinkIconSize, cardStyle: I.LinkCardStyle, description: I.LinkDescription, relations: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockLinkListSetAppearance.name, {
		contextId,
		blockIds,
		iconSize: iconSize as number,
		cardStyle: cardStyle as number,
		description: description as number,
		relations,
	}, callBack);
};

// ---------------------- BLOCK TABLE ---------------------- //

export const BlockTableCreate = (contextId: string, targetId: string, position: I.BlockPosition, rows: number, columns: number, withHeaderRow, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableCreate.name, {
		contextId,
		targetId,
		position: position as number,
		rows,
		columns,
		withHeaderRow,
	}, callBack);
};

export const BlockTableExpand = (contextId: string, targetId: string, rows: number, columns: number, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableExpand.name, {
		contextId,
		targetId,
		rows,
		columns,
	}, callBack);
};

export const BlockTableSort = (contextId: string, columnId: string, type: I.SortType, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableSort.name, {
		contextId,
		columnId,
		type: type as number,
	}, callBack);
};

export const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableRowCreate.name, {
		contextId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableRowDuplicate.name, {
		contextId,
		blockId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableRowListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableRowListFill.name, {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTableRowListClean = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableRowListClean.name, {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTableRowSetHeader = (contextId: string, targetId: string, isHeader: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableRowSetHeader.name, {
		contextId,
		targetId,
		isHeader,
	}, callBack);
};

export const BlockTableColumnCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableColumnCreate.name, {
		contextId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnDelete = (contextId: string, targetId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableColumnDelete.name, {
		contextId,
		targetId,
	}, callBack);
};

export const BlockTableColumnMove = (contextId: string, targetId: string, dropTargetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableColumnMove.name, {
		contextId,
		targetId,
		dropTargetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableColumnDuplicate.name, {
		contextId,
		blockId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockTableColumnListFill.name, {
		contextId,
		blockIds,
	}, callBack);
};

// ---------------------- BLOCK FILE ---------------------- //

export const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockFileCreateAndUpload.name, {
		contextId,
		targetId,
		position: position as number,
		url,
		localPath: path,
	}, callBack);
};

export const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	dispatcher.request(BlockFileListSetStyle.name, {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockFileSetTargetObjectId = (contextId: string, blockId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockFileSetTargetObjectId.name, {
		contextId,
		blockId,
		objectId,
	}, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextListSetColor.name, {
		contextId,
		blockIds,
		color,
	}, callBack);
};

export const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextListSetMark.name, {
		contextId,
		blockIds,
		mark: Mapper.To.Mark(mark),
	}, callBack);
};

export const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextListSetStyle.name, {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockTextListClearStyle = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextListClearStyle.name, {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTextListClearContent = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockTextListClearContent.name, {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	dispatcher.request(BlockListSetFields.name, {
		contextId,
		blockFields: fields,
	}, callBack);
};

export const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListSetBackgroundColor.name, {
		contextId,
		blockIds,
		color,
	}, callBack);
};

export const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockHAlign, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListSetAlign.name, {
		contextId,
		blockIds,
		align: align as number,
	}, callBack);
};

export const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	dispatcher.request(BlockListSetVerticalAlign.name, {
		contextId,
		blockIds,
		verticalAlign: align as number,
	}, callBack);
};

export const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewCreate.name, {
		contextId,
		blockId,
		view: Mapper.To.View(view),
		source: sources,
	}, callBack);
};

export const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewUpdate.name, {
		contextId,
		blockId,
		viewId,
		view: Mapper.To.View(view),
	}, callBack);
};

export const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewDelete.name, {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewSetPosition.name, {
		contextId,
		blockId,
		viewId,
		position,
	}, callBack);
};

export const BlockDataviewFilterAdd = (contextId: string, blockId: string, viewId: string, filter: I.Filter, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewFilterAdd.name, {
		contextId,
		blockId,
		viewId,
		filter: Mapper.To.Filter(filter),
	}, callBack);
};

export const BlockDataviewFilterRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewFilterRemove.name, {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewFilterReplace = (contextId: string, blockId: string, viewId: string, id: string, filter: I.Filter, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewFilterReplace.name, {
		contextId,
		blockId,
		viewId,
		id,
		filter: Mapper.To.Filter(filter),
	}, callBack);
};

export const BlockDataviewFilterSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewFilterSort.name, {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewSortAdd = (contextId: string, blockId: string, viewId: string, sort: I.Sort, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewSortAdd.name, {
		contextId,
		blockId,
		viewId,
		sort: Mapper.To.Sort(sort),
	}, callBack);
};

export const BlockDataviewSortRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewSortRemove.name, {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewSortReplace = (contextId: string, blockId: string, viewId: string, id: string, sort: I.Sort, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewSortReplace.name, {
		contextId,
		blockId,
		viewId,
		id,
		sort: Mapper.To.Sort(sort),
	}, callBack);
};

export const BlockDataviewSortSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewSortSort.name, {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewViewRelationRemove = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewRelationRemove.name, {
		contextId,
		blockId,
		viewId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewViewRelationReplace = (contextId: string, blockId: string, viewId: string, relationKey: string, relation: I.ViewRelation, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewRelationReplace.name, {
		contextId,
		blockId,
		viewId,
		relationKey,
		relation: Mapper.To.ViewRelation(relation),
	}, callBack);
};

export const BlockDataviewViewRelationSort = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewRelationSort.name, {
		contextId,
		blockId,
		viewId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewViewSetActive.name, {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockDataviewGroupOrderUpdate = (contextId: string, blockId: string, order: any, callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewGroupOrderUpdate.name, {
		contextId,
		blockId,
		groupOrder: Mapper.To.GroupOrder(order),
	}, callBack);
};

export const BlockDataviewObjectOrderUpdate = (contextId: string, blockId: string, orders: any[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewObjectOrderUpdate.name, {
		contextId,
		blockId,
		objectOrders: orders.map(Mapper.To.ObjectOrder),
	}, callBack);
};

export const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	dispatcher.request(BlockRelationSetKey.name, {
		contextId,
		blockId,
		key: relationKey,
	}, callBack);
};

export const BlockDataviewRelationSet = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewRelationSet.name, {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewRelationAdd.name, {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewRelationDelete.name, {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request(BlockDataviewSetSource.name, {
		contextId,
		blockId,
		source: sources,
	}, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockCreateWidget = (contextId: string, targetId: string, block: any, position: I.BlockPosition, layout: I.WidgetLayout, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request(BlockCreateWidget.name, {
		contextId,
		targetId,
		block: Mapper.To.Block(block),
		position: position as number,
		widgetLayout: layout as number,
		objectLimit: limit,
	}, callBack);
};

// ---------------------- HISTORY ---------------------- //

export const HistoryShowVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	dispatcher.request(HistoryShowVersion.name, {
		objectId,
		versionId,
	}, callBack);
};

export const HistorySetVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	dispatcher.request(HistorySetVersion.name, {
		objectId,
		versionId,
	}, callBack);
};

export const HistoryGetVersions = (objectId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request(HistoryGetVersions.name, {
		objectId,
		lastVersionId,
		limit,
	}, callBack);
};

export const HistoryDiffVersions = (objectId: string, spaceId: string, current: string, previous: string, callBack?: (message: any) => void) => {
	dispatcher.request(HistoryDiffVersions.name, {
		objectId,
		spaceId,
		currentVersion: current,
		previousVersion: previous,
	}, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

export const ObjectTypeRelationAdd = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectTypeRelationAdd.name, {
		objectTypeUrl: objectTypeId,
		relationKeys,
	}, callBack);
};

export const ObjectTypeRelationRemove = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectTypeRelationRemove.name, {
		objectTypeUrl: objectTypeId,
		relationKeys,
	}, callBack);
};

export const ObjectTypeListConflictingRelations = (id: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectTypeListConflictingRelations.name, {
		spaceId,
		typeObjectId: id,
	}, callBack);
};

export const ObjectTypeResolveLayoutConflicts = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectTypeResolveLayoutConflicts.name, {
		typeObjectId: id,
	}, callBack);
};

export const ObjectTypeSetOrder = (spaceId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectTypeSetOrder.name, {
		spaceId,
		typeIds: ids,
	}, callBack);
};

// ---------------------- OBJECT ---------------------- //

export const ObjectCreate = (details: any, flags: I.ObjectFlag[], templateId: string, typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreate.name, {
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
		templateId,
		spaceId,
		objectTypeUniqueKey: typeKey || J.Constant.default.typeKey,
	}, callBack);
};

export const ObjectCreateSet = (sources: string[], details: any, templateId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreateSet.name, {
		source: sources,
		details: Encode.struct(details),
		templateId,
		spaceId,
	}, callBack);
};

export const ObjectCreateFromUrl = (details: any, spaceId: string, typeKey: string, url: string, withContent: boolean, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreateFromUrl.name, {
		details: Encode.struct(details),
		spaceId,
		objectTypeUniqueKey: typeKey,
		url,
		addPageContent: withContent,
		templateId,
	}, callBack);
};

export const ObjectCreateBookmark = (details: any, spaceId: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreateBookmark.name, {
		details: Encode.struct(details),
		spaceId,
		templateId,
	}, callBack);
};

export const ObjectCreateObjectType = (details: any, flags: I.ObjectFlag[], spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreateObjectType.name, {
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
		spaceId,
	}, callBack);
};

export const ObjectCreateRelation = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	details.relationFormat = Number(details.relationFormat) || I.RelationType.LongText;

	dispatcher.request(ObjectCreateRelation.name, {
		details: Encode.struct(details),
		spaceId,
	}, callBack);
};

export const ObjectCreateRelationOption = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCreateRelationOption.name, {
		details: Encode.struct(details),
		spaceId,
	}, callBack);
};

export const RelationListRemoveOption = (optionIds: string[], checkInObjects: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(RelationListRemoveOption.name, {
		optionIds,
		checkInObjects,
	}, callBack);
};

export const RelationOptionSetOrder = (spaceId: string, relationKey: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(RelationOptionSetOrder.name, {
		spaceId,
		relationKey,
		relationOptionOrder: ids,
	}, callBack);
};

export const ObjectBookmarkFetch = (contextId: string, url: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectBookmarkFetch.name, {
		contextId,
		url,
	}, callBack);
};

export const ObjectOpen = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectOpen.name, {
		objectId,
		traceId,
		spaceId,
	}, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView, true);

			// Save last opened object
			const object = S.Detail.get(objectId, objectId, []);

			if (!object._empty_ && ![ I.ObjectLayout.Dashboard ].includes(object.layout) && !keyboard.isPopup()) {
				Storage.setLastOpened({ id: object.id, layout: object.layout });
			};
		};

		callBack?.(message);
	});
};

export const ObjectShow = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectShow.name, {
		objectId,
		traceId,
		spaceId,
	}, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView, false);
		};

		callBack?.(message);
	});
};

export const ObjectClose = (objectId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectClose.name, {
		objectId,
		spaceId,
	}, callBack);
};

export const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectUndo.name, { contextId }, callBack);
};

export const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectRedo.name, { contextId }, callBack);
};

export const ObjectImport = (spaceId: string, options: any, snapshots: any[], existing: boolean, type: I.ImportType, mode: I.ImportMode, noProgress: boolean, isMigration: boolean, updateExisting: boolean, isNewSpace: boolean, callBack?: (message: any) => void) => {
	let params: any = {};

	switch (type) {
		case I.ImportType.Notion: {
			params = { notionParams: { apiKey: options.apiKey } };
			break;
		};

		case I.ImportType.Markdown: {
			params = { markdownParams: { path: options.paths, createDirectoryPages: true } };
			break;
		};

		case I.ImportType.Obsidian: {
			params = { markdownParams: { path: options.paths, createDirectoryPages: true, includePropertiesAsBlock: true } };
			break;
		};

		case I.ImportType.Html: {
			params = { htmlParams: { path: options.paths } };
			break;
		};

		case I.ImportType.Text: {
			params = { txtParams: { path: options.paths } };
			break;
		};

		case I.ImportType.Csv: {
			params = { csvParams: { path: options.paths, mode: options.mode, useFirstRowForRelations: options.firstRow, transposeRowsAndColumns: options.transpose, delimiter: options.delimiter } };
			break;
		};

		case I.ImportType.Protobuf: {
			params = { pbParams: { path: options.paths, noCollection: options.noCollection, collectionTitle: options.title, importType: options.importType } };
			break;
		};

	};

	dispatcher.request(ObjectImport.name, {
		spaceId,
		snapshots: (snapshots || []).map(Mapper.To.Snapshot),
		updateExistingObjects: updateExisting,
		type: type as number,
		mode: mode as number,
		noProgress,
		isMigration,
		isNewSpace,
		...params,
	}, callBack);
};

export const ObjectImportNotionValidateToken = (token: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectImportNotionValidateToken.name, { token }, callBack);
};

export const ObjectImportUseCase = (spaceId: string, usecase: number, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectImportUseCase.name, {
		spaceId,
		usecase,
	}, callBack);
};

export const ObjectImportExperience = (spaceId: string, url: string, title: string, isNewSpace: boolean, isAI: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectImportExperience.name, {
		spaceId,
		url,
		title,
		isNewSpace,
		isAi: isAI,
	}, callBack);
};

export const ObjectSetObjectType = (contextId: string, typeKey: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectSetObjectType.name, {
		contextId,
		objectTypeUniqueKey: typeKey,
	}, callBack);
};

export const ObjectSetSource = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectSetSource.name, {
		contextId,
		source: sources,
	}, callBack);
};

export const ObjectListSetDetails = (objectIds: string[], details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	dispatcher.request(ObjectListSetDetails.name, {
		objectIds,
		details,
	}, callBack);
};

export const ObjectListModifyDetailValues = (objectIds: string[], operations: any[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListModifyDetailValues.name, {
		objectIds,
		operations: operations.map(it => {
			const op: any = { relationKey: it.relationKey };

			if (undefined !== it.add) {
				op.add = Encode.value(it.add);
			};
			if (undefined !== it.set) {
				op.set = Encode.value(it.set);
			};
			if (undefined !== it.remove) {
				op.remove = Encode.value(it.remove);
			};

			return op;
		}),
	}, callBack);
};

export const ObjectSearch = (spaceId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectSearch.name, {
		spaceId,
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		fullText,
		offset,
		limit,
		keys,
	}, callBack);
};

export const ObjectSearchWithMeta = (spaceId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectSearchWithMeta.name, {
		spaceId,
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		fullText,
		offset,
		limit,
		keys,
	}, callBack);
};

export const ObjectSearchSubscribe = (spaceId: string, subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, afterId: string, beforeId: string, noDeps: boolean, collectionId: string, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectSearchSubscribe.name, {
		spaceId,
		subId,
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		offset,
		limit,
		keys: U.Common.arrayUnique(keys),
		source: sources,
		afterId,
		beforeId,
		noDepSubscription: noDeps,
		collectionId,
	}, callBack);
};

export const ObjectCrossSpaceSearchSubscribe = (subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], noDeps: boolean, collectionId: string, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectCrossSpaceSearchSubscribe.name, {
		subId,
		filters: filters.map(Mapper.To.Filter),
		sorts: sorts.map(Mapper.To.Sort),
		keys: U.Common.arrayUnique(keys),
		source: sources,
		noDepSubscription: noDeps,
		collectionId,
	}, callBack);
};

export const ObjectGroupsSubscribe = (spaceId: string, subId: string, relationKey: string, filters: I.Filter[], sources: string[], collectionId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectGroupsSubscribe.name, {
		spaceId,
		subId,
		relationKey,
		filters: filters.map(Mapper.To.Filter),
		source: sources,
		collectionId,
	}, callBack);
};

export const ObjectSubscribeIds = (spaceId: string, subId: string, ids: string[], keys: string[], noDeps: boolean, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectSubscribeIds.name, {
		spaceId,
		subId,
		ids,
		keys,
		noDepSubscription: noDeps,
	}, callBack);
};

export const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectSearchUnsubscribe.name, { subIds }, callBack);
};

export const ObjectRelationAdd = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectRelationAdd.name, {
		contextId,
		relationKeys,
	}, callBack);
};

export const ObjectRelationDelete = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectRelationDelete.name, {
		contextId,
		relationKeys,
	}, callBack);
};

export const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectRelationAddFeatured.name, {
		contextId,
		relations: keys,
	}, callBack);
};

export const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectRelationRemoveFeatured.name, {
		contextId,
		relations: keys,
	}, callBack);
};

export const ObjectGraph = (spaceId: string, filters: any[], limit: number, types: string[], keys: string[], collectionId: string, sources: string[], typeEdges: boolean = true, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request(ObjectGraph.name, {
		spaceId,
		filters: filters.map(Mapper.To.Filter),
		limit,
		objectTypeFilter: types,
		keys,
		collectionId,
		setSource: sources,
		includeTypeEdges: typeEdges,
	}, callBack);
};

export const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectToSet.name, {
		contextId,
		source: sources,
	}, callBack);
};

export const ObjectToCollection = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectToCollection.name, { contextId }, callBack);
};

export const ObjectDuplicate = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectDuplicate.name, { contextId: id }, callBack);
};

export const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectApplyTemplate.name, {
		contextId,
		templateId,
	}, callBack);
};

export const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectShareByLink.name, { objectId }, callBack);
};

export const ObjectCollectionAdd = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCollectionAdd.name, {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectCollectionRemove = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCollectionRemove.name, {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectCollectionSort = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectCollectionSort.name, {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectChatAdd = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectChatAdd.name, { objectId }, callBack);
};

export const ObjectAddDiscussion = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectAddDiscussion.name, { objectId }, callBack);
};

export const ObjectDateByTimestamp = (spaceId: string, timestamp: number, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectDateByTimestamp.name, {
		spaceId,
		timestamp,
	}, callBack);
};

// ---------------------- OBJECT LIST ---------------------- //

export const ObjectListDuplicate = (ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListDuplicate.name, { objectIds: ids }, callBack);
};

export const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListDelete.name, { objectIds: ids }, callBack);
};

export const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListSetIsArchived.name, {
		objectIds: ids,
		isArchived,
	}, callBack);
};


export const ObjectListSetObjectType = (ids: string[], typeKey: string, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListSetObjectType.name, {
		objectIds: ids,
		objectTypeUniqueKey: typeKey,
	}, callBack);
};

export const ObjectListExport = (spaceId: string, path: string, objectIds: string[], format: I.ExportType, zip: boolean, includeNested: boolean, includeFiles: boolean, includeArchived: boolean, isJson: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(ObjectListExport.name, {
		spaceId,
		path,
		objectIds,
		format: format as number,
		zip,
		includeNested,
		includeFiles,
		includeArchived,
		isJson,
		mdIncludePropertiesAndSchema: true,
	}, callBack);
};

// ---------------------- TEMPLATE ---------------------- //

export const TemplateCreateFromObject = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request(TemplateCreateFromObject.name, { contextId }, callBack);
};

export const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request(TemplateExportAll.name, { path }, callBack);
};

// ---------------------- UNSPLASH ---------------------- //

export const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request(UnsplashSearch.name, {
		query,
		limit,
	}, callBack);
};

export const UnsplashDownload = (spaceId: string, id: string, createdInContext: string, createdInContextRef: string, callBack?: (message: any) => void) => {
	dispatcher.request(UnsplashDownload.name, {
		spaceId,
		pictureId: id,
		createdInContext,
		createdInContextRef,
	}, callBack);
};

// ---------------------- DEBUG ---------------------- //

export const DebugTree = (objectId: string, path: string, unanonymized: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(DebugTree.name, {
		treeId: objectId,
		path,
		unanonymized,
	}, callBack);
};

export const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(DebugExportLocalstore.name, {
		path,
		docIds: ids,
	}, callBack);
};

export const DebugSpaceSummary = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(DebugSpaceSummary.name, { spaceId }, callBack);
};

export const DebugStackGoroutines = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request(DebugStackGoroutines.name, { path }, callBack);
};

export const DebugStat = (callBack?: (message: any) => void) => {
	dispatcher.request(DebugStat.name, {}, callBack);
};

export const DebugNetCheck = (config: string, callBack?: (message: any) => void) => {
	dispatcher.request(DebugNetCheck.name, { clientYml: config }, callBack);
};

export const DebugExportLog = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request(DebugExportLog.name, { dir: path }, callBack);
};

export const DebugRunProfiler = (duration: number, callBack?: (message: any) => void) => {
	dispatcher.request(DebugRunProfiler.name, { durationInSeconds: duration }, callBack);
};

// ---------------------- NOTIFICATION ---------------------- //

export const NotificationList = (includeRead: boolean, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request(NotificationList.name, {
		includeRead,
		limit,
	}, callBack);
};

export const NotificationReply = (ids: string[], action: I.NotificationAction, callBack?: (message: any) => void) => {
	dispatcher.request(NotificationReply.name, {
		ids,
		actionType: action as number,
	}, callBack);
};

// ---------------------- PAYMENTS ---------------------- //

export const MembershipCodeGetInfo = (code: string, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipCodeGetInfo.name, { code }, callBack);
};

export const MembershipCodeRedeem = (code: string, name: string, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipCodeRedeem.name, {
		code,
		nsName: name,
		nsNameType: I.NameType.Any as number,
	}, callBack);
};

// ---------------------- MEMBERSHIP V2 ---------------------- //

export const MembershipV2GetPortalLink = (callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2GetPortalLink.name, {}, callBack);
};

export const MembershipV2CartUpdate = (productIds: string[], isYearly: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2CartUpdate.name, {
		productIds,
		isYearly,
	}, callBack);
};

export const MembershipV2GetStatus = (noCache: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2GetStatus.name, { noCache }, callBack);
};

export const MembershipV2GetProducts = (noCache: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2GetProducts.name, { noCache }, callBack);
};

export const MembershipV2AnyNameIsValid = (anyName: string, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2AnyNameIsValid.name, { nsName: anyName }, callBack);
};

export const MembershipV2AnyNameAllocate = (anyName: string, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2AnyNameAllocate.name, { nsName: anyName }, callBack);
};

export const MembershipV2SubscribeToUpdates = (email: string, callBack?: (message: any) => void) => {
	dispatcher.request(MembershipV2SubscribeToUpdates.name, {
		email,
		platform: 1, // DESKTOP
		subscribe: true,
	}, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceInviteGenerate = (spaceId: string, inviteType?: I.InviteType, permissions?: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceInviteGenerate.name, {
		spaceId,
		inviteType: inviteType as number || 0,
		permissions: permissions as number || 0,
	}, callBack);
};

export const SpaceInviteChange = (spaceId: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceInviteChange.name, {
		spaceId,
		permissions: permissions as number,
	}, callBack);
};

export const SpaceInviteView = (cid: string, key: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceInviteView.name, {
		inviteCid: cid,
		inviteFileKey: key,
	}, callBack);
};

export const SpaceInviteRevoke = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceInviteRevoke.name, { spaceId }, callBack);
};

export const SpaceInviteGetCurrent = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceInviteGetCurrent.name, { spaceId }, callBack);
};

export const SpaceStopSharing = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceStopSharing.name, { spaceId }, callBack);
};

export const SpaceMakeShareable = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceMakeShareable.name, { spaceId }, callBack);
};

export const SpaceJoin = (networkId: string, spaceId: string, cid: string, key: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceJoin.name, {
		networkId,
		spaceId,
		inviteCid: cid,
		inviteFileKey: key,
	}, callBack);
};

export const SpaceJoinCancel = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceJoinCancel.name, { spaceId }, callBack);
};

export const SpaceRequestApprove = (spaceId: string, identity: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceRequestApprove.name, {
		spaceId,
		identity,
		permissions: permissions as number,
	}, callBack);
};

export const SpaceRequestDecline = (spaceId: string, identity: string, callBack?: (message: any) => void) => {
	dispatcher.request(SpaceRequestDecline.name, {
		spaceId,
		identity,
	}, callBack);
};

export const SpaceParticipantPermissionsChange = (spaceId: string, changes: any[], callBack?: (message: any) => void) => {
	dispatcher.request(SpaceParticipantPermissionsChange.name, {
		spaceId,
		changes: changes.map(Mapper.To.ParticipantPermissionChange),
	}, callBack);
};

export const SpaceParticipantRemove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	dispatcher.request(SpaceParticipantRemove.name, {
		spaceId,
		identities,
	}, callBack);
};

export const SpaceChangeOwnership = (spaceId: string, newOwnerIdentity: string, callBack?: (message: any) => void) => {
	// Note: Requires middleware branch GO-6168-change-ownership
	dispatcher.request(SpaceChangeOwnership.name, {
		spaceId,
		newOwnerIdentity,
		oldOwnerPermissions: I.ParticipantPermissions.Writer as number,
	}, callBack);
};

// ---------------------- EXTENSION ---------------------- //

export const BroadcastPayloadEvent = (payload: any, callBack?: (message: any) => void) => {
	dispatcher.request(BroadcastPayloadEvent.name, {
		payload: JSON.stringify(payload, null, 3),
	}, callBack);
};

// ---------------------- DEVICES ---------------------- //

export const DeviceList = (callBack?: (message: any) => void) => {
	dispatcher.request(DeviceList.name, {}, callBack);
};

// ---------------------- CHAT ---------------------- //

export const ChatAddMessage = (objectId: string, message: any, callBack?: (message: any) => void) => {
	dispatcher.request(ChatAddMessage.name, {
		chatObjectId: objectId,
		message: Mapper.To.ChatMessage(message),
	}, callBack);
};

export const ChatEditMessageContent = (objectId: string, messageId: string, message: any, callBack?: (message: any) => void) => {
	dispatcher.request(ChatEditMessageContent.name, {
		chatObjectId: objectId,
		messageId,
		editedMessage: Mapper.To.ChatMessage(message),
	}, callBack);
};

export const ChatToggleMessageReaction = (objectId: string, messageId: string, emoji: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatToggleMessageReaction.name, {
		chatObjectId: objectId,
		messageId,
		emoji,
	}, callBack);
};

export const ChatDeleteMessage = (objectId: string, messageId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatDeleteMessage.name, {
		chatObjectId: objectId,
		messageId,
	}, callBack);
};

export const ChatGetMessages = (objectId: string, beforeOrderId: string, afterOrderId: string, limit: number, includeBoundary: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(ChatGetMessages.name, {
		chatObjectId: objectId,
		beforeOrderId,
		afterOrderId,
		limit,
		includeBoundary,
	}, callBack);
};

export const ChatReadMessages = (objectId: string, afterOrderId: string, beforeOrderId: string, lastStateId: string, type: I.ChatReadType, callBack?: (message: any) => void) => {
	dispatcher.request(ChatReadMessages.name, {
		chatObjectId: objectId,
		beforeOrderId,
		afterOrderId,
		lastStateId,
		type: type as number,
	}, callBack);
};

export const ChatUnreadMessages = (objectId: string, afterOrderId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatUnreadMessages.name, {
		chatObjectId: objectId,
		afterOrderId,
	}, callBack);
};

export const ChatReadReactions = (objectId: string, orderId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatReadReactions.name, {
		chatObjectId: objectId,
		orderId,
	}, callBack);
};

export const ChatReadAll = (callBack?: (message: any) => void) => {
	dispatcher.request(ChatReadAll.name, {}, callBack);
};

export const ChatSubscribeLastMessages = (objectId: string, limit: number, subId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatSubscribeLastMessages.name, {
		chatObjectId: objectId,
		limit,
		subId,
	}, callBack);
};

export const ChatSubscribeToMessagePreviews = (subId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatSubscribeToMessagePreviews.name, { subId }, callBack);
};

export const ChatUnsubscribe = (objectId: string, subId: string, callBack?: (message: any) => void) => {
	dispatcher.request(ChatUnsubscribe.name, {
		chatObjectId: objectId,
		subId,
	}, callBack);
};

export const ChatGetMessagesByIds = (objectId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(ChatGetMessagesByIds.name, {
		chatObjectId: objectId,
		messageIds: ids,
	}, callBack);
};

export const ChatSearch = (spaceId: string, chatId: string, fullText: string, offset: number, limit: number, sorts: { key: I.SearchSortKey, type: I.SortType }[], callBack?: (message: any) => void) => {
	dispatcher.request(ChatSearch.name, {
		spaceId,
		chatId,
		fullText,
		offset,
		limit,
		sorts: sorts.map(Mapper.To.SearchSort),
	}, callBack);
};

export const RelationListWithValue = (spaceId: string, value: any, callBack?: (message: any) => void) => {
	dispatcher.request(RelationListWithValue.name, {
		spaceId,
		value: Encode.value(value),
	}, callBack);
};

// ---------------------- PUBLISHING ---------------------- //

export const PublishingCreate = (spaceId: string, objectId: string, uri: string, joinSpace: boolean, callBack?: (message: any) => void) => {
	dispatcher.request(PublishingCreate.name, {
		objectId,
		spaceId,
		uri,
		joinSpace,
	}, callBack);
};

export const PublishingRemove = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(PublishingRemove.name, {
		objectId,
		spaceId,
	}, callBack);
};

export const PublishingList = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request(PublishingList.name, { spaceId }, callBack);
};

export const PublishingResolveUri = (uri: string, callBack?: (message: any) => void) => {
	dispatcher.request(PublishingResolveUri.name, { uri }, callBack);
};

export const PublishingGetStatus = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request(PublishingGetStatus.name, {
		objectId,
		spaceId,
	}, callBack);
};

// ---------------------- PUSH ---------------------- //

export const PushNotificationSetSpaceMode = (spaceId: string, mode: I.NotificationMode, callBack?: (message: any) => void) => {
	dispatcher.request(PushNotificationSetSpaceMode.name, {
		spaceId,
		mode: mode as number,
	}, callBack);
};

export const PushNotificationSetForceModeIds = (spaceId: string, ids: string[], mode: I.NotificationMode, callBack?: (message: any) => void) => {
	dispatcher.request(PushNotificationSetForceModeIds.name, {
		spaceId,
		chatIds: ids,
		mode: mode as number,
	}, callBack);
};

export const PushNotificationResetIds = (spaceId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request(PushNotificationResetIds.name, {
		spaceId,
		chatIds: ids,
	}, callBack);
};
