import * as I from 'Interface';

export const InitialSetParameters = (platform: I.Platform, version: string, workDir: string, logLevel: string, doNotSendLogs: boolean, doNotSaveLogs: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('InitialSetParameters', {
		platform,
		version,
		workdir: workDir,
		logLevel,
		doNotSendLogs,
		doNotSaveLogs,
	}, callBack);
};

export const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request('ProcessCancel', { id }, callBack);
};

export const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	dispatcher.request('LinkPreview', { url }, callBack);
};

// ---------------------- GALLERY ---------------------- //

export const GalleryDownloadIndex = (callBack?: (message: any) => void) => {
	dispatcher.request('GalleryDownloadIndex', {}, callBack);
};

export const GalleryDownloadManifest = (url: string, callBack?: (message: any) => void) => {
	dispatcher.request('GalleryDownloadManifest', { url }, callBack);
};

// ---------------------- APP ---------------------- //

export const AppShutdown = (callBack?: (message: any) => void) => {
	dispatcher.request('AppShutdown', {}, callBack);
};

export const AppGetVersion = (callBack?: (message: any) => void) => {
	dispatcher.request('AppGetVersion', {}, callBack);
};

export const AppSetDeviceState = (state: I.AppDeviceState, callBack?: (message: any) => void) => {
	dispatcher.request('AppSetDeviceState', {
		deviceState: state as number,
	}, callBack);
};

// ---------------------- WALLET ---------------------- //

export const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request('WalletCreate', { rootPath: path }, callBack);
};

export const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	dispatcher.request('WalletRecover', {
		rootPath: path,
		mnemonic,
	}, callBack);
};

export const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	dispatcher.request('WalletConvert', {
		mnemonic,
		entropy,
	}, callBack);
};

export const WalletCreateSession = (mnemonic: string, appKey: string, token: string, callBack?: (message: any) => void) => {
	dispatcher.request('WalletCreateSession', {
		...(mnemonic ? { mnemonic } : {}),
		...(appKey ? { appKey } : {}),
		...(token ? { token } : {}),
	}, callBack);
};

export const WalletCloseSession = (token: string, callBack?: (message: any) => void) => {
	dispatcher.request('WalletCloseSession', { token }, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

export const WorkspaceCreate = (details: any, usecase: I.Usecase, callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceCreate', {
		details: Encode.struct(details),
		useCase: usecase as number,
	}, callBack);
};

export const WorkspaceOpen = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceOpen', { spaceId }, callBack);
};

export const WorkspaceObjectAdd = (spaceId:string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceObjectAdd', {
		spaceId,
		objectId,
	}, callBack);
};

export const WorkspaceObjectListRemove = (objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceObjectListRemove', { objectIds }, callBack);
};

export const WorkspaceSetInfo = (spaceId:string, details: any, callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceSetInfo', {
		spaceId,
		details: Encode.struct(details),
	}, callBack);
};

export const WorkspaceSetHomepage = (spaceId: string, id: string, callBack?: (message: any) => void) => {
	dispatcher.request('WorkspaceSetHomepage', {
		spaceId,
		homepage: id,
	}, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceDelete = (spaceId:string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceDelete', { spaceId }, callBack);
};

export const SpaceSetOrder = (id: string, spaceViewOrder: string[], callBack?: (message: any) => void) => {
	dispatcher.request('SpaceSetOrder', {
		spaceViewId: id,
		spaceViewOrder,
	}, callBack);
};

export const SpaceUnsetOrder = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceUnsetOrder', { spaceViewId: id }, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

export const AccountCreate = (name: string, avatarPath: string, storePath: string, icon: number, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountCreate', {
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
	dispatcher.request('AccountRecover', {}, callBack);
};

export const AccountSelect = (id: string, path: string, mode: I.NetworkMode, networkConfigPath: string, preferredSpaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountSelect', {
		id,
		rootPath: path,
		networkMode: mode as number,
		networkCustomConfigFilePath: networkConfigPath,
		jsonApiListenAddr: J.Url.api,
		enableMembershipV2: true,
		preferredSpaceId,
	}, callBack);
};

export const AccountPreloadRemainingSpaces = (callBack?: (message: any) => void) => {
	dispatcher.request('AccountPreloadRemainingSpaces', {}, callBack);
};

export const AccountMigrate = (id: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountMigrate', {
		id,
		rootPath: path,
	}, callBack);
};

export const AccountMigrateCancel = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountMigrateCancel', { id }, callBack);
};

export const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('AccountStop', { removeData }, callBack);
};

export const AccountDelete = (callBack?: (message: any) => void) => {
	dispatcher.request('AccountDelete', {}, callBack);
};

export const AccountRevertDeletion = (callBack?: (message: any) => void) => {
	dispatcher.request('AccountRevertDeletion', {}, callBack);
};

export const AccountRecoverFromLegacyExport = (path: string, rootPath: string, icon: number, callBack?: (message: any) => void) => {
	dispatcher.request('AccountRecoverFromLegacyExport', {
		path,
		rootPath,
		icon,
	}, callBack);
};

export const AccountLocalLinkNewChallenge = (name: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountLocalLinkNewChallenge', { appName: name }, callBack);
};

export const AccountLocalLinkSolveChallenge = (id: string, answer: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountLocalLinkSolveChallenge', {
		challengeId: id,
		answer,
	}, callBack);
};

export const AccountLocalLinkListApps = (callBack?: (message: any) => void) => {
	dispatcher.request('AccountLocalLinkListApps', {}, callBack);
};

export const AccountLocalLinkCreateApp = (app: any, callBack?: (message: any) => void) => {
	dispatcher.request('AccountLocalLinkCreateApp', {
		app: Mapper.To.AppInfo(app),
	}, callBack);
};

export const AccountLocalLinkRevokeApp = (hash: string, callBack?: (message: any) => void) => {
	dispatcher.request('AccountLocalLinkRevokeApp', { appHash: hash }, callBack);
};

// ---------------------- FILE ---------------------- //

export const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	dispatcher.request('FileDrop', {
		contextId,
		dropTargetId: targetId,
		position: position as number,
		localFilePaths: paths,
		style: S.Common.fileStyle as number,
		spaceId: S.Common.space,
	}, callBack);
};

export const FileUpload = (spaceId: string, url: string, path: string, type: I.FileType, details: any, preloadOnly: boolean, preloadFileId: string, imageKind: I.ImageKind, createdInContext: string, createdInContextRef: string, callBack?: (message: any) => void) => {
	if (!url && !path && !preloadFileId) {
		return;
	};

	dispatcher.request('FileUpload', {
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
	dispatcher.request('FileDownload', {
		objectId,
		path,
	}, callBack);
};

export const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('FileListOffload', {
		onlyIds: ids,
		includeNotPinned: notPinned,
	}, callBack);
};


export const FileNodeUsage = (callBack?: (message: any) => void) => {
	dispatcher.request('FileNodeUsage', {}, callBack);
};

export const FileReconcile = (callBack?: (message: any) => void) => {
	dispatcher.request('FileReconcile', {}, callBack);
};

export const FileDiscardPreload = (fileId: string, callBack?: (message: any) => void) => {
	dispatcher.request('FileDiscardPreload', { fileId }, callBack);
};

export const FileSetAutoDownload = (enabled: boolean, wifiOnly: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('FileSetAutoDownload', {
		enabled,
		wifiOnly,
	}, callBack);
};

export const FileAutoDownloadSetLimit = (sizeLimitMib: number, callBack?: (message: any) => void) => {
	dispatcher.request('FileAutoDownloadSetLimit', {
		sizeLimitMebibytes: sizeLimitMib,
	}, callBack);
};

// ---------------------- NAVIGATION ---------------------- //

export const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	dispatcher.request('NavigationGetObjectInfoWithLinks', { objectId: pageId }, callBack);
};

// ---------------------- BLOCK ---------------------- //

export const BlockCreate = (contextId: string, targetId: string, position: I.BlockPosition, block: any, callBack?: (message: any) => void) => {
	dispatcher.request('BlockCreate', {
		contextId,
		targetId,
		position: position as number,
		block: Mapper.To.Block(block),
	}, callBack);
};

export const BlockDataviewCreateFromExistingObject = (contextId: string, blockId: string, targetObjectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewCreateFromExistingObject', {
		contextId,
		blockId,
		targetObjectId,
	}, callBack);
};

export const BlockSetCarriage = (contextId: string, blockId: string, range: I.TextRange, callBack?: (message: any) => void) => {
	dispatcher.request('BlockSetCarriage', {
		contextId,
		blockId,
		range: Mapper.To.Range(range),
	}, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockWidgetSetTargetId = (contextId: string, blockId: string, targetId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockWidgetSetTargetId', {
		contextId,
		blockId,
		targetId,
	}, callBack);
};

export const BlockWidgetSetLayout = (contextId: string, blockId: string, layout: I.WidgetLayout, callBack?: (message: any) => void) => {
	dispatcher.request('BlockWidgetSetLayout', {
		contextId,
		blockId,
		layout: layout as number,
	}, callBack);
};

export const BlockWidgetSetLimit = (contextId: string, blockId: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('BlockWidgetSetLimit', {
		contextId,
		blockId,
		limit,
	}, callBack);
};

export const BlockWidgetSetViewId = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockWidgetSetViewId', {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockPreview = (html: string, url: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockPreview', {
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
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark) as I.Mark[];

	dispatcher.request('BlockTextSetText', {
		contextId,
		blockId,
		text,
		marks: { marks },
		selectedTextRange: Mapper.To.Range(range),
	}, callBack);
};

export const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextSetChecked', {
		contextId,
		blockId,
		checked,
	}, callBack);
};

export const BlockTextSetIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextSetIcon', {
		contextId,
		blockId,
		iconEmoji,
		iconImage,
	}, callBack);
};


export const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	dispatcher.request('BlockSetFields', {
		contextId,
		blockId,
		fields: Encode.struct(fields || {}),
	}, callBack);
};

export const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockMerge', {
		contextId,
		firstBlockId: blockId1,
		secondBlockId: blockId2,
	}, callBack);
};

export const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	dispatcher.request('BlockSplit', {
		contextId,
		blockId,
		range: Mapper.To.Range(range),
		style: style as number,
		mode: mode as number,
	}, callBack);
};

export const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockBookmarkFetch', {
		contextId,
		blockId,
		url,
		templateId,
	}, callBack);
};

export const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockBookmarkCreateAndFetch', {
		contextId,
		targetId,
		position: position as number,
		url,
		templateId,
	}, callBack);
};

export const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockUpload', {
		contextId,
		blockId,
		url,
		filePath: path,
	}, callBack);
};

export const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, rangeLastBlock?: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	dispatcher.request('BlockCopy', {
		contextId,
		blocks: blocks.map(Mapper.To.Block),
		selectedTextRange: Mapper.To.Range(range),
		selectedTextRangeLastBlock: rangeLastBlock ? Mapper.To.Range(rangeLastBlock) : undefined,
	}, callBack);
};

export const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, rangeLastBlock?: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	dispatcher.request('BlockCut', {
		contextId,
		blocks: blocks.map(Mapper.To.Block),
		selectedTextRange: Mapper.To.Range(range),
		selectedTextRangeLastBlock: rangeLastBlock ? Mapper.To.Range(rangeLastBlock) : undefined,
	}, callBack);
};

export const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, url: string, callBack?: (message: any) => void) => {
	data = U.Common.objectCopy(data);

	dispatcher.request('BlockPaste', {
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
	dispatcher.request('BlockListMoveToExistingObject', {
		contextId,
		targetContextId,
		blockIds,
		dropTargetId: targetId,
		position: position as number,
	}, callBack);
};

export const BlockListConvertToObjects = (contextId: string, blockIds: string[], typeKey: string, templateId: string, block: Partial<I.Block>, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListConvertToObjects', {
		contextId,
		blockIds,
		objectTypeUniqueKey: typeKey,
		templateId,
		block: Mapper.To.Block(block),
	}, callBack);
};

export const BlockListDuplicate = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListDuplicate', {
		contextId,
		targetContextId,
		blockIds,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListTurnInto', {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockListDelete = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockListDelete', {
		contextId,
		blockIds,
	}, callBack);
};

// ---------------------- BLOCK DIV ---------------------- //

export const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDivListSetStyle', {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

// ---------------------- BLOCK LATEX ---------------------- //

export const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockLatexSetText', {
		contextId,
		blockId,
		text,
	}, callBack);
};

// ---------------------- BLOCK LINK ---------------------- //

export const BlockLinkCreateWithObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, block: I.Block, flags: I.ObjectFlag[], typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	details = details || {};

	dispatcher.request('BlockLinkCreateWithObject', {
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
	dispatcher.request('BlockLinkListSetAppearance', {
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
	dispatcher.request('BlockTableCreate', {
		contextId,
		targetId,
		position: position as number,
		rows,
		columns,
		withHeaderRow,
	}, callBack);
};

export const BlockTableExpand = (contextId: string, targetId: string, rows: number, columns: number, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableExpand', {
		contextId,
		targetId,
		rows,
		columns,
	}, callBack);
};

export const BlockTableSort = (contextId: string, columnId: string, type: I.SortType, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableSort', {
		contextId,
		columnId,
		type: type as number,
	}, callBack);
};

export const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableRowCreate', {
		contextId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableRowDuplicate', {
		contextId,
		blockId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableRowListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableRowListFill', {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTableRowListClean = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableRowListClean', {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTableRowSetHeader = (contextId: string, targetId: string, isHeader: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableRowSetHeader', {
		contextId,
		targetId,
		isHeader,
	}, callBack);
};

export const BlockTableColumnCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableColumnCreate', {
		contextId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnDelete = (contextId: string, targetId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableColumnDelete', {
		contextId,
		targetId,
	}, callBack);
};

export const BlockTableColumnMove = (contextId: string, targetId: string, dropTargetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableColumnMove', {
		contextId,
		targetId,
		dropTargetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableColumnDuplicate', {
		contextId,
		blockId,
		targetId,
		position: position as number,
	}, callBack);
};

export const BlockTableColumnListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockTableColumnListFill', {
		contextId,
		blockIds,
	}, callBack);
};

// ---------------------- BLOCK FILE ---------------------- //

export const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockFileCreateAndUpload', {
		contextId,
		targetId,
		position: position as number,
		url,
		localPath: path,
	}, callBack);
};

export const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	dispatcher.request('BlockFileListSetStyle', {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockFileSetTargetObjectId = (contextId: string, blockId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockFileSetTargetObjectId', {
		contextId,
		blockId,
		objectId,
	}, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextListSetColor', {
		contextId,
		blockIds,
		color,
	}, callBack);
};

export const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextListSetMark', {
		contextId,
		blockIds,
		mark: Mapper.To.Mark(mark),
	}, callBack);
};

export const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextListSetStyle', {
		contextId,
		blockIds,
		style: style as number,
	}, callBack);
};

export const BlockTextListClearStyle = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextListClearStyle', {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockTextListClearContent = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockTextListClearContent', {
		contextId,
		blockIds,
	}, callBack);
};

export const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	dispatcher.request('BlockListSetFields', {
		contextId,
		blockFields: fields,
	}, callBack);
};

export const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListSetBackgroundColor', {
		contextId,
		blockIds,
		color,
	}, callBack);
};

export const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockHAlign, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListSetAlign', {
		contextId,
		blockIds,
		align: align as number,
	}, callBack);
};

export const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	dispatcher.request('BlockListSetVerticalAlign', {
		contextId,
		blockIds,
		verticalAlign: align as number,
	}, callBack);
};

export const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewCreate', {
		contextId,
		blockId,
		view: Mapper.To.View(view),
		source: sources,
	}, callBack);
};

export const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewUpdate', {
		contextId,
		blockId,
		viewId,
		view: Mapper.To.View(view),
	}, callBack);
};

export const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewDelete', {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewSetPosition', {
		contextId,
		blockId,
		viewId,
		position,
	}, callBack);
};

export const BlockDataviewFilterAdd = (contextId: string, blockId: string, viewId: string, filter: I.Filter, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewFilterAdd', {
		contextId,
		blockId,
		viewId,
		filter: Mapper.To.Filter(filter),
	}, callBack);
};

export const BlockDataviewFilterRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewFilterRemove', {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewFilterReplace = (contextId: string, blockId: string, viewId: string, id: string, filter: I.Filter, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewFilterReplace', {
		contextId,
		blockId,
		viewId,
		id,
		filter: Mapper.To.Filter(filter),
	}, callBack);
};

export const BlockDataviewFilterSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewFilterSort', {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewSortAdd = (contextId: string, blockId: string, viewId: string, sort: I.Sort, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewSortAdd', {
		contextId,
		blockId,
		viewId,
		sort: Mapper.To.Sort(sort),
	}, callBack);
};

export const BlockDataviewSortRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewSortRemove', {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewSortReplace = (contextId: string, blockId: string, viewId: string, id: string, sort: I.Sort, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewSortReplace', {
		contextId,
		blockId,
		viewId,
		id,
		sort: Mapper.To.Sort(sort),
	}, callBack);
};

export const BlockDataviewSortSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewSortSort', {
		contextId,
		blockId,
		viewId,
		ids,
	}, callBack);
};

export const BlockDataviewViewRelationRemove = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewRelationRemove', {
		contextId,
		blockId,
		viewId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewViewRelationReplace = (contextId: string, blockId: string, viewId: string, relationKey: string, relation: I.ViewRelation, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewRelationReplace', {
		contextId,
		blockId,
		viewId,
		relationKey,
		relation: Mapper.To.ViewRelation(relation),
	}, callBack);
};

export const BlockDataviewViewRelationSort = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewRelationSort', {
		contextId,
		blockId,
		viewId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewViewSetActive', {
		contextId,
		blockId,
		viewId,
	}, callBack);
};

export const BlockDataviewGroupOrderUpdate = (contextId: string, blockId: string, order: any, callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewGroupOrderUpdate', {
		contextId,
		blockId,
		groupOrder: Mapper.To.GroupOrder(order),
	}, callBack);
};

export const BlockDataviewObjectOrderUpdate = (contextId: string, blockId: string, orders: any[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewObjectOrderUpdate', {
		contextId,
		blockId,
		objectOrders: orders.map(Mapper.To.ObjectOrder),
	}, callBack);
};

export const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	dispatcher.request('BlockRelationSetKey', {
		contextId,
		blockId,
		key: relationKey,
	}, callBack);
};

export const BlockDataviewRelationSet = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewRelationSet', {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewRelationAdd', {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewRelationDelete', {
		contextId,
		blockId,
		relationKeys,
	}, callBack);
};

export const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request('BlockDataviewSetSource', {
		contextId,
		blockId,
		source: sources,
	}, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockCreateWidget = (contextId: string, targetId: string, block: any, position: I.BlockPosition, layout: I.WidgetLayout, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('BlockCreateWidget', {
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
	dispatcher.request('HistoryShowVersion', {
		objectId,
		versionId,
	}, callBack);
};

export const HistorySetVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	dispatcher.request('HistorySetVersion', {
		objectId,
		versionId,
	}, callBack);
};

export const HistoryGetVersions = (objectId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('HistoryGetVersions', {
		objectId,
		lastVersionId,
		limit,
	}, callBack);
};

export const HistoryDiffVersions = (objectId: string, spaceId: string, current: string, previous: string, callBack?: (message: any) => void) => {
	dispatcher.request('HistoryDiffVersions', {
		objectId,
		spaceId,
		currentVersion: current,
		previousVersion: previous,
	}, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

export const ObjectTypeRelationAdd = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectTypeRelationAdd', {
		objectTypeUrl: objectTypeId,
		relationKeys,
	}, callBack);
};

export const ObjectTypeRelationRemove = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectTypeRelationRemove', {
		objectTypeUrl: objectTypeId,
		relationKeys,
	}, callBack);
};

export const ObjectTypeListConflictingRelations = (id: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectTypeListConflictingRelations', {
		spaceId,
		typeObjectId: id,
	}, callBack);
};

export const ObjectTypeResolveLayoutConflicts = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectTypeResolveLayoutConflicts', {
		typeObjectId: id,
	}, callBack);
};

export const ObjectTypeSetOrder = (spaceId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectTypeSetOrder', {
		spaceId,
		typeIds: ids,
	}, callBack);
};

// ---------------------- OBJECT ---------------------- //

export const ObjectCreate = (details: any, flags: I.ObjectFlag[], templateId: string, typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreate', {
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
		templateId,
		spaceId,
		objectTypeUniqueKey: typeKey || J.Constant.default.typeKey,
	}, callBack);
};

export const ObjectCreateSet = (sources: string[], details: any, templateId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreateSet', {
		source: sources,
		details: Encode.struct(details),
		templateId,
		spaceId,
	}, callBack);
};

export const ObjectCreateFromUrl = (details: any, spaceId: string, typeKey: string, url: string, withContent: boolean, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreateFromUrl', {
		details: Encode.struct(details),
		spaceId,
		objectTypeUniqueKey: typeKey,
		url,
		addPageContent: withContent,
		templateId,
	}, callBack);
};

export const ObjectCreateBookmark = (details: any, spaceId: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreateBookmark', {
		details: Encode.struct(details),
		spaceId,
		templateId,
	}, callBack);
};

export const ObjectCreateObjectType = (details: any, flags: I.ObjectFlag[], spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreateObjectType', {
		details: Encode.struct(details),
		internalFlags: flags.map(Mapper.To.InternalFlag),
		spaceId,
	}, callBack);
};

export const ObjectCreateRelation = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	details.relationFormat = Number(details.relationFormat) || I.RelationType.LongText;

	dispatcher.request('ObjectCreateRelation', {
		details: Encode.struct(details),
		spaceId,
	}, callBack);
};

export const ObjectCreateRelationOption = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCreateRelationOption', {
		details: Encode.struct(details),
		spaceId,
	}, callBack);
};

export const RelationListRemoveOption = (optionIds: string[], checkInObjects: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('RelationListRemoveOption', {
		optionIds,
		checkInObjects,
	}, callBack);
};

export const RelationOptionSetOrder = (spaceId: string, relationKey: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('RelationOptionSetOrder', {
		spaceId,
		relationKey,
		relationOptionOrder: ids,
	}, callBack);
};

export const ObjectBookmarkFetch = (contextId: string, url: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectBookmarkFetch', {
		contextId,
		url,
	}, callBack);
};

export const ObjectOpen = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectOpen', {
		objectId,
		traceId,
		spaceId,
	}, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView, true);

			// Record the last-opened object (popup / empty / dashboard guards and the
			// per-space keying that avoids polluting another space's bucket after a late
			// open all live in U.Space.setLastObject — see JS-9815).
			U.Space.setLastObject(S.Detail.get(objectId, objectId, []), spaceId);
		};

		callBack?.(message);
	});
};

export const ObjectShow = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectShow', {
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
	dispatcher.request('ObjectClose', {
		objectId,
		spaceId,
	}, callBack);
};

export const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectUndo', { contextId }, callBack);
};

export const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectRedo', { contextId }, callBack);
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

	dispatcher.request('ObjectImport', {
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
	dispatcher.request('ObjectImportNotionValidateToken', { token }, callBack);
};

export const ObjectImportUseCase = (spaceId: string, usecase: number, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectImportUseCase', {
		spaceId,
		useCase: usecase,
	}, callBack);
};

export const ObjectImportExperience = (spaceId: string, url: string, title: string, isNewSpace: boolean, isAI: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectImportExperience', {
		spaceId,
		url,
		title,
		isNewSpace,
		isAi: isAI,
	}, callBack);
};

export const ObjectSetObjectType = (contextId: string, typeKey: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectSetObjectType', {
		contextId,
		objectTypeUniqueKey: typeKey,
	}, callBack);
};

export const ObjectSetSource = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectSetSource', {
		contextId,
		source: sources,
	}, callBack);
};

export const ObjectListSetDetails = (objectIds: string[], details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	dispatcher.request('ObjectListSetDetails', {
		objectIds,
		details,
	}, callBack);
};

export const ObjectListModifyDetailValues = (objectIds: string[], operations: any[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListModifyDetailValues', {
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

	dispatcher.request('ObjectSearch', {
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

	dispatcher.request('ObjectSearchWithMeta', {
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

	dispatcher.request('ObjectSearchSubscribe', {
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

	dispatcher.request('ObjectCrossSpaceSearchSubscribe', {
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
	dispatcher.request('ObjectGroupsSubscribe', {
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

	dispatcher.request('ObjectSubscribeIds', {
		spaceId,
		subId,
		ids,
		keys,
		noDepSubscription: noDeps,
	}, callBack);
};

export const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectSearchUnsubscribe', { subIds }, callBack);
};

export const ObjectRelationAdd = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectRelationAdd', {
		contextId,
		relationKeys,
	}, callBack);
};

export const ObjectRelationDelete = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectRelationDelete', {
		contextId,
		relationKeys,
	}, callBack);
};

export const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectRelationAddFeatured', {
		contextId,
		relations: keys,
	}, callBack);
};

export const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectRelationRemoveFeatured', {
		contextId,
		relations: keys,
	}, callBack);
};

export const ObjectGraph = (spaceId: string, filters: any[], limit: number, types: string[], keys: string[], collectionId: string, sources: string[], typeEdges: boolean = true, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	dispatcher.request('ObjectGraph', {
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
	dispatcher.request('ObjectToSet', {
		contextId,
		source: sources,
	}, callBack);
};

export const ObjectToCollection = (contextId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectToCollection', { contextId }, callBack);
};

export const ObjectDuplicate = (id: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectDuplicate', { contextId: id }, callBack);
};

export const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectApplyTemplate', {
		contextId,
		templateId,
	}, callBack);
};

export const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectShareByLink', { objectId }, callBack);
};

export const ObjectCollectionAdd = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCollectionAdd', {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectCollectionRemove = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCollectionRemove', {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectCollectionSort = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectCollectionSort', {
		contextId,
		objectIds,
	}, callBack);
};

export const ObjectChatAdd = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectChatAdd', { objectId }, callBack);
};

export const ObjectAddDiscussion = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectAddDiscussion', { objectId }, callBack);
};

export const ObjectDateByTimestamp = (spaceId: string, timestamp: number, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectDateByTimestamp', {
		spaceId,
		timestamp,
	}, callBack);
};

// ---------------------- OBJECT LIST ---------------------- //

export const ObjectListDuplicate = (ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListDuplicate', { objectIds: ids }, callBack);
};

export const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListDelete', { objectIds: ids }, callBack);
};

export const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListSetIsArchived', {
		objectIds: ids,
		isArchived,
	}, callBack);
};


export const ObjectListSetObjectType = (ids: string[], typeKey: string, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListSetObjectType', {
		objectIds: ids,
		objectTypeUniqueKey: typeKey,
	}, callBack);
};

export const ObjectListExport = (spaceId: string, path: string, objectIds: string[], format: I.ExportType, zip: boolean, includeNested: boolean, includeFiles: boolean, includeArchived: boolean, isJson: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectListExport', {
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
	dispatcher.request('TemplateCreateFromObject', { contextId }, callBack);
};

export const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request('TemplateExportAll', { path }, callBack);
};

// ---------------------- UNSPLASH ---------------------- //

export const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('UnsplashSearch', {
		query,
		limit,
	}, callBack);
};

export const UnsplashDownload = (spaceId: string, id: string, createdInContext: string, createdInContextRef: string, callBack?: (message: any) => void) => {
	dispatcher.request('UnsplashDownload', {
		spaceId,
		pictureId: id,
		createdInContext,
		createdInContextRef,
	}, callBack);
};

// ---------------------- DEBUG ---------------------- //

export const DebugTree = (objectId: string, path: string, unanonymized: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('DebugTree', {
		treeId: objectId,
		path,
		unanonymized,
	}, callBack);
};

export const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('DebugExportLocalstore', {
		path,
		docIds: ids,
	}, callBack);
};

export const DebugSpaceSummary = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('DebugSpaceSummary', { spaceId }, callBack);
};

export const DebugStackGoroutines = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request('DebugStackGoroutines', { path }, callBack);
};

export const DebugStat = (callBack?: (message: any) => void) => {
	dispatcher.request('DebugStat', {}, callBack);
};

export const DebugNetCheck = (config: string, callBack?: (message: any) => void) => {
	dispatcher.request('DebugNetCheck', { clientYml: config }, callBack);
};

export const DebugExportLog = (path: string, callBack?: (message: any) => void) => {
	dispatcher.request('DebugExportLog', { dir: path }, callBack);
};

export const DebugRunProfiler = (duration: number, reason: I.ProfilerReason, reasonDesc: string, callBack?: (message: any) => void) => {
	dispatcher.request('DebugRunProfiler', { durationInSeconds: duration, reason, reasonDesc }, callBack);
};

export const DebugExportReport = (path: string, full: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('DebugExportReport', { dir: path, full }, callBack);
};

export const DebugCleanupReport = (ts: number, callBack?: (message: any) => void) => {
	dispatcher.request('DebugCleanupReport', { ts }, callBack);
};

// ---------------------- NOTIFICATION ---------------------- //

export const NotificationList = (includeRead: boolean, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('NotificationList', {
		includeRead,
		limit,
	}, callBack);
};

export const NotificationReply = (ids: string[], action: I.NotificationAction, callBack?: (message: any) => void) => {
	dispatcher.request('NotificationReply', {
		ids,
		actionType: action as number,
	}, callBack);
};

// ---------------------- PAYMENTS ---------------------- //

export const MembershipCodeGetInfo = (code: string, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipCodeGetInfo', { code }, callBack);
};

export const MembershipCodeRedeem = (code: string, name: string, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipCodeRedeem', {
		code,
		nsName: name,
		nsNameType: I.NameType.Any as number,
	}, callBack);
};

// ---------------------- MEMBERSHIP V2 ---------------------- //

export const MembershipV2GetPortalLink = (callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2GetPortalLink', {}, callBack);
};

export const MembershipV2CartUpdate = (productIds: string[], isYearly: boolean, isLifetime: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2CartUpdate', {
		productIds,
		isYearly,
		isLifetime,
	}, callBack);
};

export const MembershipV2GetStatus = (noCache: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2GetStatus', { noCache }, callBack);
};

export const MembershipV2GetProducts = (noCache: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2GetProducts', { noCache }, callBack);
};

export const MembershipV2AnyNameIsValid = (anyName: string, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2AnyNameIsValid', { nsName: anyName }, callBack);
};

export const MembershipV2AnyNameAllocate = (anyName: string, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2AnyNameAllocate', { nsName: anyName }, callBack);
};

export const MembershipV2SubscribeToUpdates = (email: string, callBack?: (message: any) => void) => {
	dispatcher.request('MembershipV2SubscribeToUpdates', {
		email,
		platform: 1, // DESKTOP
		subscribe: true,
	}, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceInviteGenerate = (spaceId: string, inviteType?: I.InviteType, permissions?: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceInviteGenerate', {
		spaceId,
		inviteType: inviteType as number || 0,
		permissions: permissions as number || 0,
	}, callBack);
};

export const SpaceInviteChange = (spaceId: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceInviteChange', {
		spaceId,
		permissions: permissions as number,
	}, callBack);
};

export const SpaceInviteView = (cid: string, key: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceInviteView', {
		inviteCid: cid,
		inviteFileKey: key,
	}, callBack);
};

export const SpaceInviteRevoke = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceInviteRevoke', { spaceId }, callBack);
};

export const SpaceInviteGetCurrent = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceInviteGetCurrent', { spaceId }, callBack);
};

export const SpaceStopSharing = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceStopSharing', { spaceId }, callBack);
};

export const SpaceMakeShareable = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceMakeShareable', { spaceId }, callBack);
};

export const SpaceJoin = (networkId: string, spaceId: string, cid: string, key: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceJoin', {
		networkId,
		spaceId,
		inviteCid: cid,
		inviteFileKey: key,
	}, callBack);
};

export const SpaceJoinCancel = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceJoinCancel', { spaceId }, callBack);
};

export const SpaceRequestApprove = (spaceId: string, identity: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceRequestApprove', {
		spaceId,
		identity,
		permissions: permissions as number,
	}, callBack);
};

export const SpaceRequestDecline = (spaceId: string, identity: string, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceRequestDecline', {
		spaceId,
		identity,
	}, callBack);
};

export const SpaceParticipantPermissionsChange = (spaceId: string, changes: any[], callBack?: (message: any) => void) => {
	dispatcher.request('SpaceParticipantPermissionsChange', {
		spaceId,
		changes: changes.map(Mapper.To.ParticipantPermissionChange),
	}, callBack);
};

export const SpaceParticipantRemove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	dispatcher.request('SpaceParticipantRemove', {
		spaceId,
		identities,
	}, callBack);
};

export const SpaceParticipantsAddList = (spaceId: string, identities: string[], permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	dispatcher.request('SpaceParticipantsAddList', {
		spaceId,
		identities,
		permissions: permissions as number,
	}, callBack);
};

export const SpaceChangeOwnership = (spaceId: string, newOwnerIdentity: string, callBack?: (message: any) => void) => {
	// Note: Requires middleware branch GO-6168-change-ownership
	dispatcher.request('SpaceChangeOwnership', {
		spaceId,
		newOwnerIdentity,
		oldOwnerPermissions: I.ParticipantPermissions.Writer as number,
	}, callBack);
};

// ---------------------- EXTENSION ---------------------- //

export const BroadcastPayloadEvent = (payload: any, callBack?: (message: any) => void) => {
	dispatcher.request('BroadcastPayloadEvent', {
		payload: JSON.stringify(payload, null, 3),
	}, callBack);
};

// ---------------------- DEVICES ---------------------- //

export const DeviceList = (callBack?: (message: any) => void) => {
	dispatcher.request('DeviceList', {}, callBack);
};

// ---------------------- CHAT ---------------------- //

export const ChatAddMessage = (objectId: string, message: any, callBack?: (message: any) => void) => {
	dispatcher.request('ChatAddMessage', {
		chatObjectId: objectId,
		message: Mapper.To.ChatMessage(message),
	}, callBack);
};

export const ChatEditMessageContent = (objectId: string, messageId: string, message: any, callBack?: (message: any) => void) => {
	dispatcher.request('ChatEditMessageContent', {
		chatObjectId: objectId,
		messageId,
		editedMessage: Mapper.To.ChatMessage(message),
	}, callBack);
};

export const ChatToggleMessageReaction = (objectId: string, messageId: string, emoji: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatToggleMessageReaction', {
		chatObjectId: objectId,
		messageId,
		emoji,
	}, callBack);
};

export const ChatDeleteMessage = (objectId: string, messageId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatDeleteMessage', {
		chatObjectId: objectId,
		messageId,
	}, callBack);
};

export const ChatGetMessages = (objectId: string, beforeOrderId: string, afterOrderId: string, limit: number, includeBoundary: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('ChatGetMessages', {
		chatObjectId: objectId,
		beforeOrderId,
		afterOrderId,
		limit,
		includeBoundary,
	}, callBack);
};

export const ChatReadMessages = (objectId: string, afterOrderId: string, beforeOrderId: string, lastStateId: string, type: I.ChatReadType, callBack?: (message: any) => void) => {
	dispatcher.request('ChatReadMessages', {
		chatObjectId: objectId,
		beforeOrderId,
		afterOrderId,
		lastStateId,
		type: type as number,
	}, callBack);
};

export const ChatUnreadMessages = (objectId: string, afterOrderId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatUnreadMessages', {
		chatObjectId: objectId,
		afterOrderId,
	}, callBack);
};

export const ChatReadReactions = (objectId: string, orderId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatReadReactions', {
		chatObjectId: objectId,
		orderId,
	}, callBack);
};

export const ChatReadAll = (callBack?: (message: any) => void) => {
	dispatcher.request('ChatReadAll', {}, callBack);
};

export const ChatSubscribeLastMessages = (objectId: string, limit: number, subId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatSubscribeLastMessages', {
		chatObjectId: objectId,
		limit,
		subId,
	}, callBack);
};

export const ChatSubscribeToMessagePreviews = (subId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatSubscribeToMessagePreviews', { subId }, callBack);
};

export const ChatUnsubscribe = (objectId: string, subId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatUnsubscribe', {
		chatObjectId: objectId,
		subId,
	}, callBack);
};

export const ChatGetMessagesByIds = (objectId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('ChatGetMessagesByIds', {
		chatObjectId: objectId,
		messageIds: ids,
	}, callBack);
};

export const ChatSearch = (spaceId: string, chatId: string, fullText: string, offset: number, limit: number, sorts: { key: I.SearchSortKey, type: I.SortType }[], callBack?: (message: any) => void) => {
	dispatcher.request('ChatSearch', {
		spaceId,
		chatId,
		fullText,
		offset,
		limit,
		sorts: sorts.map(Mapper.To.SearchSort),
	}, callBack);
};

export const ChatSetPinnedMessages = (objectId: string, messageIds: string[], pinned: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('ChatSetPinnedMessages', {
		chatObjectId: objectId,
		messageIds,
		pinned,
	}, callBack);
};

export const ChatGetPinnedMessages = (objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('ChatGetPinnedMessages', { chatObjectId: objectId }, callBack);
};

export const RelationListWithValue = (spaceId: string, value: any, callBack?: (message: any) => void) => {
	dispatcher.request('RelationListWithValue', {
		spaceId,
		value: Encode.value(value),
	}, callBack);
};

// ---------------------- PUBLISHING ---------------------- //

export const PublishingCreate = (spaceId: string, objectId: string, uri: string, joinSpace: boolean, callBack?: (message: any) => void) => {
	dispatcher.request('PublishingCreate', {
		objectId,
		spaceId,
		uri,
		joinSpace,
	}, callBack);
};

export const PublishingRemove = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('PublishingRemove', {
		objectId,
		spaceId,
	}, callBack);
};

export const PublishingList = (spaceId: string, callBack?: (message: any) => void) => {
	dispatcher.request('PublishingList', { spaceId }, callBack);
};

export const PublishingResolveUri = (uri: string, callBack?: (message: any) => void) => {
	dispatcher.request('PublishingResolveUri', { uri }, callBack);
};

export const PublishingGetStatus = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	dispatcher.request('PublishingGetStatus', {
		objectId,
		spaceId,
	}, callBack);
};

// ---------------------- PUSH ---------------------- //

export const PushNotificationSetSpaceMode = (spaceId: string, mode: I.NotificationMode, callBack?: (message: any) => void) => {
	dispatcher.request('PushNotificationSetSpaceMode', {
		spaceId,
		mode: mode as number,
	}, callBack);
};

export const PushNotificationSetForceModeIds = (spaceId: string, ids: string[], mode: I.NotificationMode, callBack?: (message: any) => void) => {
	dispatcher.request('PushNotificationSetForceModeIds', {
		spaceId,
		chatIds: ids,
		mode: mode as number,
	}, callBack);
};

export const PushNotificationResetIds = (spaceId: string, ids: string[], callBack?: (message: any) => void) => {
	dispatcher.request('PushNotificationResetIds', {
		spaceId,
		chatIds: ids,
	}, callBack);
};
