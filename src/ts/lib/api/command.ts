import Commands from 'dist/lib/pb/protos/commands_pb';
import Model from 'dist/lib/pkg/lib/pb/model/protos/models_pb';
import { I, S, U, J, Mark, Storage, dispatcher, Encode, Mapper, keyboard } from 'Lib';

const { Rpc, Empty } = Commands;

export const InitialSetParameters = (platform: I.Platform, version: string, workDir: string, logLevel: string, doNotSendLogs: boolean, doNotSaveLogs: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Initial.SetParameters.Request();

	request.setPlatform(platform);
	request.setVersion(version);
	request.setWorkdir(workDir);
	request.setLoglevel(logLevel);
	request.setDonotsendlogs(doNotSendLogs);
	request.setDonotsavelogs(doNotSaveLogs);

	dispatcher.request(InitialSetParameters.name, request, callBack);
};

export const ProcessCancel = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Process.Cancel.Request();

	request.setId(id);

	dispatcher.request(ProcessCancel.name, request, callBack);
};

export const LinkPreview = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.LinkPreview.Request();

	request.setUrl(url);

	dispatcher.request(LinkPreview.name, request, callBack);
};

// ---------------------- GALLERY ---------------------- //

export const GalleryDownloadIndex = (callBack?: (message: any) => void) => {
	dispatcher.request(GalleryDownloadIndex.name, new Empty(), callBack);
};

export const GalleryDownloadManifest = (url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Gallery.DownloadManifest.Request();

	request.setUrl(url);

	dispatcher.request(GalleryDownloadManifest.name, request, callBack);
};

// ---------------------- APP ---------------------- //

export const AppShutdown = (callBack?: (message: any) => void) => {
	dispatcher.request(AppShutdown.name, new Empty(), callBack);
};

export const AppGetVersion = (callBack?: (message: any) => void) => {
	dispatcher.request(AppGetVersion.name, new Empty(), callBack);
};

// ---------------------- WALLET ---------------------- //

export const WalletCreate = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Create.Request();

	request.setRootpath(path);

	dispatcher.request(WalletCreate.name, request, callBack);
};

export const WalletRecover = (path: string, mnemonic: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Recover.Request();

	request.setRootpath(path);
	request.setMnemonic(mnemonic);

	dispatcher.request(WalletRecover.name, request, callBack);
};

export const WalletConvert = (mnemonic: string, entropy: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.Convert.Request();

	request.setMnemonic(mnemonic);
	request.setEntropy(entropy);

	dispatcher.request(WalletConvert.name, request, callBack);
};

export const WalletCreateSession = (mnemonic: string, appKey: string, token: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.CreateSession.Request();

	if (mnemonic) {
		request.setMnemonic(mnemonic);
	} else 
	if (appKey) {
		request.setAppkey(appKey);
	} else 
	if (token) {
		request.setToken(token);
	};

	dispatcher.request(WalletCreateSession.name, request, callBack);
};

export const WalletCloseSession = (token: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Wallet.CloseSession.Request();

	request.setToken(token);

	dispatcher.request(WalletCloseSession.name, request, callBack);
};

// ---------------------- WORKSPACE ---------------------- //

export const WorkspaceCreate = (details: any, usecase: I.Usecase, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Create.Request();

	request.setDetails(Encode.struct(details));
	request.setUsecase(usecase as number);

	dispatcher.request(WorkspaceCreate.name, request, callBack);
};

export const WorkspaceOpen = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Open.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(WorkspaceOpen.name, request, callBack);
};

export const WorkspaceObjectAdd = (spaceId:string, objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Object.Add.Request();

	request.setSpaceid(spaceId);
	request.setObjectid(objectId);

	dispatcher.request(WorkspaceObjectAdd.name, request, callBack);
};

export const WorkspaceObjectListRemove = (objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.Object.ListRemove.Request();

	request.setObjectidsList(objectIds);

	dispatcher.request(WorkspaceObjectListRemove.name, request, callBack);
};

export const WorkspaceSetInfo = (spaceId:string, details: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Workspace.SetInfo.Request();

	request.setSpaceid(spaceId);
	request.setDetails(Encode.struct(details));

	dispatcher.request(WorkspaceSetInfo.name, request, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceDelete = (spaceId:string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.Delete.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceDelete.name, request, callBack);
};

export const SpaceSetOrder = (id: string, spaceViewOrder: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Space.SetOrder.Request();

	request.setSpaceviewid(id);
	request.setSpacevieworderList(spaceViewOrder);

	dispatcher.request(SpaceSetOrder.name, request, callBack);
};

export const SpaceUnsetOrder = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.UnsetOrder.Request();

	request.setSpaceviewid(id);

	dispatcher.request(SpaceUnsetOrder.name, request, callBack);
};

// ---------------------- ACCOUNT ---------------------- //

export const AccountCreate = (name: string, avatarPath: string, storePath: string, icon: number, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Create.Request();

	request.setName(name);
	request.setAvatarlocalpath(avatarPath);
	request.setStorepath(storePath);
	request.setIcon(icon);
	request.setNetworkmode(mode as number);
	request.setNetworkcustomconfigfilepath(networkConfigPath);
	request.setJsonapilistenaddr(J.Url.api);

	dispatcher.request(AccountCreate.name, request, callBack);
};

export const AccountRecover = (callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Recover.Request();

	dispatcher.request(AccountRecover.name, request, callBack);
};

export const AccountSelect = (id: string, path: string, mode: I.NetworkMode, networkConfigPath: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Select.Request();

	request.setId(id);
	request.setRootpath(path);
	request.setNetworkmode(mode as number);
	request.setNetworkcustomconfigfilepath(networkConfigPath);
	request.setJsonapilistenaddr(J.Url.api);

	dispatcher.request(AccountSelect.name, request, callBack);
};

export const AccountMigrate = (id: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Migrate.Request();

	request.setId(id);
	request.setRootpath(path);

	dispatcher.request(AccountMigrate.name, request, callBack);
};

export const AccountMigrateCancel = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.MigrateCancel.Request();

	request.setId(id);

	dispatcher.request(AccountMigrateCancel.name, request, callBack);
};

export const AccountStop = (removeData: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.Stop.Request();

	request.setRemovedata(removeData);

	dispatcher.request(AccountStop.name, request, callBack);
};

export const AccountDelete = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountDelete.name, new Empty(), callBack);
};

export const AccountRevertDeletion = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountRevertDeletion.name, new Empty(), callBack);
};

export const AccountRecoverFromLegacyExport = (path: string, rootPath: string, icon: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.RecoverFromLegacyExport.Request();

	request.setPath(path);
	request.setRootpath(rootPath);
	request.setIcon(icon);

	dispatcher.request(AccountRecoverFromLegacyExport.name, request, callBack);
};

export const AccountLocalLinkNewChallenge = (name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.LocalLink.NewChallenge.Request();

	request.setAppname(name);

	dispatcher.request(AccountLocalLinkNewChallenge.name, request, callBack);
};

export const AccountLocalLinkSolveChallenge = (id: string, answer: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.LocalLink.SolveChallenge.Request();

	request.setChallengeid(id);
	request.setAnswer(answer);

	dispatcher.request(AccountLocalLinkSolveChallenge.name, request, callBack);
};

export const AccountLocalLinkListApps = (callBack?: (message: any) => void) => {
	dispatcher.request(AccountLocalLinkListApps.name, new Empty(), callBack);
};

export const AccountLocalLinkCreateApp = (app: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.LocalLink.CreateApp.Request();

	request.setApp(Mapper.To.AppInfo(app));

	dispatcher.request(AccountLocalLinkCreateApp.name, request, callBack);
};

export const AccountLocalLinkRevokeApp = (hash: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Account.LocalLink.RevokeApp.Request();

	request.setApphash(hash);

	dispatcher.request(AccountLocalLinkRevokeApp.name, request, callBack);
};

// ---------------------- FILE ---------------------- //

export const FileDrop = (contextId: string, targetId: string, position: I.BlockPosition, paths: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.File.Drop.Request();

	request.setContextid(contextId);
	request.setDroptargetid(targetId);
	request.setPosition(position as number);
	request.setLocalfilepathsList(paths);

	dispatcher.request(FileDrop.name, request, callBack);
};

export const FileUpload = (spaceId: string, url: string, path: string, type: I.FileType, details: any, callBack?: (message: any) => void) => {
	if (!url && !path) {
		return;
	};

	const { config } = S.Common;
	const request = new Rpc.File.Upload.Request();

	request.setSpaceid(spaceId);
	request.setUrl(url);
	request.setLocalpath(path);
	request.setType(type as number);
	request.setDetails(Encode.struct(details));

	dispatcher.request(FileUpload.name, request, callBack);
};

export const FileDownload = (objectId: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.File.Download.Request();

	request.setObjectid(objectId);
	request.setPath(path);

	dispatcher.request(FileDownload.name, request, callBack);
};

export const FileListOffload = (ids: string[], notPinned: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.File.ListOffload.Request();

	request.setOnlyidsList(ids);
	request.setIncludenotpinned(notPinned);

	dispatcher.request(FileListOffload.name, request, callBack);
};


export const FileNodeUsage = (callBack?: (message: any) => void) => {
	dispatcher.request(FileNodeUsage.name, new Empty(), callBack);
};

export const FileReconcile = (callBack?: (message: any) => void) => {
	dispatcher.request(FileReconcile.name, new Empty(), callBack);
};

// ---------------------- NAVIGATION ---------------------- //

export const NavigationGetObjectInfoWithLinks = (pageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Navigation.GetObjectInfoWithLinks.Request();

	request.setObjectid(pageId);

	dispatcher.request(NavigationGetObjectInfoWithLinks.name, request, callBack);
};

// ---------------------- BLOCK ---------------------- //

export const BlockCreate = (contextId: string, targetId: string, position: I.BlockPosition, block: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Create.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setBlock(Mapper.To.Block(block));

	dispatcher.request(BlockCreate.name, request, callBack);
};

export const BlockDataviewCreateFromExistingObject = (contextId: string, blockId: string, targetObjectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.CreateFromExistingObject.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetobjectid(targetObjectId);

	dispatcher.request(BlockDataviewCreateFromExistingObject.name, request, callBack);
};

export const BlockSetCarriage = (contextId: string, blockId: string, range: I.TextRange, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetCarriage.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRange(Mapper.To.Range(range));

	dispatcher.request(BlockSetCarriage.name, request, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockWidgetSetTargetId = (contextId: string, blockId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetTargetId.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);

	dispatcher.request(BlockWidgetSetTargetId.name, request, callBack);
};

export const BlockWidgetSetLayout = (contextId: string, blockId: string, layout: I.WidgetLayout, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetLayout.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setLayout(layout as number);

	dispatcher.request(BlockWidgetSetLayout.name, request, callBack);
};

export const BlockWidgetSetLimit = (contextId: string, blockId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetLimit.Request();
	
	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setLimit(limit);

	dispatcher.request(BlockWidgetSetLimit.name, request, callBack);
};

export const BlockWidgetSetViewId = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockWidget.SetViewId.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request(BlockWidgetSetViewId.name, request, callBack);
};

export const BlockPreview = (html: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Preview.Request();

	request.setHtml(html);
	request.setUrl(url);

	dispatcher.request(BlockPreview.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextSetText = (contextId: string, blockId: string, text: string, marks: I.Mark[], range: I.TextRange, callBack?: (message: any) => void) => {
	text = text.replace(/&lt;/g, '<');
	text = text.replace(/&gt;/g, '>');

	marks = U.Common.objectCopy(marks);
	marks = marks.filter(it => Mark.canSave(it.type));
	marks = Mark.checkRanges(text, marks).map(Mapper.To.Mark) as any;

	const request = new Rpc.BlockText.SetText.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);
	request.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks as any));
	request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockTextSetText.name, request, callBack);
};

export const BlockTextSetChecked = (contextId: string, blockId: string, checked: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.SetChecked.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setChecked(checked);

	dispatcher.request(BlockTextSetChecked.name, request, callBack);
};

export const BlockTextSetIcon = (contextId: string, blockId: string, iconEmoji: string, iconImage: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.SetIcon.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setIconemoji(iconEmoji);
	request.setIconimage(iconImage);

	dispatcher.request(BlockTextSetIcon.name, request, callBack);
};


export const BlockSetFields = (contextId: string, blockId: string, fields: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.SetFields.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setFields(Encode.struct(fields || {}));

	dispatcher.request(BlockSetFields.name, request, callBack);
};

export const BlockMerge = (contextId: string, blockId1: string, blockId2: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Merge.Request();

	request.setContextid(contextId);
	request.setFirstblockid(blockId1);
	request.setSecondblockid(blockId2);

	dispatcher.request(BlockMerge.name, request, callBack);
};

export const BlockSplit = (contextId: string, blockId: string, range: I.TextRange, style: I.TextStyle, mode: I.BlockSplitMode, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Split.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRange(Mapper.To.Range(range));
	request.setStyle(style as number);
	request.setMode(mode as number);

	dispatcher.request(BlockSplit.name, request, callBack);
};

export const BlockBookmarkFetch = (contextId: string, blockId: string, url: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockBookmark.Fetch.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);
	request.setTemplateid(templateId);

	dispatcher.request(BlockBookmarkFetch.name, request, callBack);
};

export const BlockBookmarkCreateAndFetch = (contextId: string, targetId: string, position: I.BlockPosition, url: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockBookmark.CreateAndFetch.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setUrl(url);
	request.setTemplateid(templateId);

	dispatcher.request(BlockBookmarkCreateAndFetch.name, request, callBack);
};

export const BlockUpload = (contextId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.Upload.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setUrl(url);
	request.setFilepath(path);

	dispatcher.request(BlockUpload.name, request, callBack);
};

export const BlockCopy = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	const request = new Rpc.Block.Copy.Request();

	request.setContextid(contextId);
	request.setBlocksList(blocks.map(Mapper.To.Block));
	request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCopy.name, request, callBack);
};

export const BlockCut = (contextId: string, blocks: I.Block[], range: I.TextRange, callBack?: (message: any) => void) => {
	blocks = U.Common.objectCopy(blocks);

	const request = new Rpc.Block.Cut.Request();

	request.setContextid(contextId);
	request.setBlocksList(blocks.map(Mapper.To.Block));
	request.setSelectedtextrange(Mapper.To.Range(range));

	dispatcher.request(BlockCut.name, request, callBack);
};

export const BlockPaste = (contextId: string, focusedId: string, range: I.TextRange, blockIds: string[], isPartOfBlock: boolean, data: any, url: string, callBack?: (message: any) => void) => {
	data = U.Common.objectCopy(data);

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
	request.setUrl(url);

	dispatcher.request(BlockPaste.name, request, callBack);
};

export const BlockListMoveToExistingObject = (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListMoveToExistingObject.Request();

	request.setContextid(contextId);
	request.setTargetcontextid(targetContextId);
	request.setBlockidsList(blockIds);
	request.setDroptargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockListMoveToExistingObject.name, request, callBack);
};

export const BlockListConvertToObjects = (contextId: string, blockIds: string[], typeKey: string, templateId: string, block: Partial<I.Block>, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListConvertToObjects.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setObjecttypeuniquekey(typeKey);
	request.setTemplateid(templateId);
	request.setBlock(Mapper.To.Block(block));

	dispatcher.request(BlockListConvertToObjects.name, request, callBack);
};

export const BlockListDuplicate = (contextId: string, targetContextId: string, blockIds: string[], targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListDuplicate.Request();

	request.setContextid(contextId);
	request.setTargetcontextid(targetContextId);
	request.setBlockidsList(blockIds);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockListDuplicate.name, request, callBack);
};

export const BlockListTurnInto = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListTurnInto.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setStyle(style as number);

	dispatcher.request(BlockListTurnInto.name, request, callBack);
};

export const BlockListDelete = (contextId: string, blockIds: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListDelete.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockListDelete.name, request, callBack);
};

// ---------------------- BLOCK DIV ---------------------- //

export const BlockDivListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDiv.ListSetStyle.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setStyle(style as number);

	dispatcher.request(BlockDivListSetStyle.name, request, callBack);
};

// ---------------------- BLOCK LATEX ---------------------- //

export const BlockLatexSetText = (contextId: string, blockId: string, text: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockLatex.SetText.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setText(text);

	dispatcher.request(BlockLatexSetText.name, request, callBack);
};

// ---------------------- BLOCK LINK ---------------------- //

export const BlockLinkCreateWithObject = (contextId: string, targetId: string, details: any, position: I.BlockPosition, templateId: string, block: I.Block, flags: I.ObjectFlag[], typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	details = details || {};

	const request = new Rpc.BlockLink.CreateWithObject.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setDetails(Encode.struct(details));
	request.setTemplateid(templateId);
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));
	request.setObjecttypeuniquekey(typeKey);
	request.setSpaceid(spaceId);
	request.setBlock(Mapper.To.Block(block));

	dispatcher.request(BlockLinkCreateWithObject.name, request, callBack);
};

export const BlockLinkListSetAppearance = (contextId: string, blockIds: any[], iconSize: I.LinkIconSize, cardStyle: I.LinkCardStyle, description: I.LinkDescription, relations: string[], callBack?: (message: any) => void) => {
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

export const BlockTableCreate = (contextId: string, targetId: string, position: I.BlockPosition, rows: number, columns: number, withHeaderRow, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Create.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setRows(rows);
	request.setColumns(columns);
	request.setWithheaderrow(withHeaderRow);

	dispatcher.request(BlockTableCreate.name, request, callBack);
};

export const BlockTableExpand = (contextId: string, targetId: string, rows: number, columns: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Expand.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setRows(rows);
	request.setColumns(columns);

	dispatcher.request(BlockTableExpand.name, request, callBack);
};

export const BlockTableSort = (contextId: string, columnId: string, type: I.SortType, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.Sort.Request();

	request.setContextid(contextId);
	request.setColumnid(columnId);
	request.setType(type as number);

	dispatcher.request(BlockTableSort.name, request, callBack);
};

export const BlockTableRowCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowCreate.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableRowCreate.name, request, callBack);
};

export const BlockTableRowDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowDuplicate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableRowDuplicate.name, request, callBack);
};

export const BlockTableRowListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowListFill.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableRowListFill.name, request, callBack);
};

export const BlockTableRowListClean = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowListClean.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableRowListClean.name, request, callBack);
};

export const BlockTableRowSetHeader = (contextId: string, targetId: string, isHeader: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.RowSetHeader.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setIsheader(isHeader);

	dispatcher.request(BlockTableRowSetHeader.name, request, callBack);
};

export const BlockTableColumnCreate = (contextId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnCreate.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableColumnCreate.name, request, callBack);
};

export const BlockTableColumnDelete = (contextId: string, targetId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnDelete.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);

	dispatcher.request(BlockTableColumnDelete.name, request, callBack);
};

export const BlockTableColumnMove = (contextId: string, targetId: string, dropTargetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnMove.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setDroptargetid(dropTargetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableColumnMove.name, request, callBack);
};

export const BlockTableColumnDuplicate = (contextId: string, blockId: string, targetId: string, position: I.BlockPosition, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnDuplicate.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setTargetid(targetId);
	request.setPosition(position as number);

	dispatcher.request(BlockTableColumnDuplicate.name, request, callBack);
};

export const BlockTableColumnListFill = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockTable.ColumnListFill.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTableColumnListFill.name, request, callBack);
};

// ---------------------- BLOCK FILE ---------------------- //

export const BlockFileCreateAndUpload = (contextId: string, targetId: string, position: I.BlockPosition, url: string, path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.CreateAndUpload.Request();

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setPosition(position as number);
	request.setUrl(url);
	request.setLocalpath(path);

	dispatcher.request(BlockFileCreateAndUpload.name, request, callBack);
};

export const BlockFileListSetStyle = (contextId: string, blockIds: string[], style: I.FileStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.ListSetStyle.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setStyle(style as number);

	dispatcher.request(BlockFileListSetStyle.name, request, callBack);
};

export const BlockFileSetTargetObjectId = (contextId: string, blockId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockFile.SetTargetObjectId.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setObjectid(objectId);

	dispatcher.request(BlockFileSetTargetObjectId.name, request, callBack);
};

// ---------------------- BLOCK TEXT ---------------------- //

export const BlockTextListSetColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetColor.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setColor(color);

	dispatcher.request(BlockTextListSetColor.name, request, callBack);
};

export const BlockTextListSetMark = (contextId: string, blockIds: string[], mark: I.Mark, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetMark.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setMark(Mapper.To.Mark(mark));

	dispatcher.request(BlockTextListSetMark.name, request, callBack);
};

export const BlockTextListSetStyle = (contextId: string, blockIds: string[], style: I.TextStyle, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListSetStyle.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setStyle(style as number);

	dispatcher.request(BlockTextListSetStyle.name, request, callBack);
};

export const BlockTextListClearStyle = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListClearStyle.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTextListClearStyle.name, request, callBack);
};

export const BlockTextListClearContent = (contextId: string, blockIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockText.ListClearContent.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);

	dispatcher.request(BlockTextListClearContent.name, request, callBack);
};

export const BlockListSetFields = (contextId: string, fields: any, callBack?: (message: any) => void) => {
	fields = fields.map(Mapper.To.Fields);

	const request = new Rpc.Block.ListSetFields.Request();

	request.setContextid(contextId);
	request.setBlockfieldsList(fields);

	dispatcher.request(BlockListSetFields.name, request, callBack);
};

export const BlockListSetBackgroundColor = (contextId: string, blockIds: string[], color: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetBackgroundColor.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setColor(color);

	dispatcher.request(BlockListSetBackgroundColor.name, request, callBack);
};

export const BlockListSetAlign = (contextId: string, blockIds: string[], align: I.BlockHAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetAlign.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setAlign(align as number);

	dispatcher.request(BlockListSetAlign.name, request, callBack);
};

export const BlockListSetVerticalAlign = (contextId: string, blockIds: string[], align: I.BlockVAlign, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.ListSetVerticalAlign.Request();

	request.setContextid(contextId);
	request.setBlockidsList(blockIds);
	request.setVerticalalign(align as number);

	dispatcher.request(BlockListSetVerticalAlign.name, request, callBack);
};

export const BlockDataviewViewCreate = (contextId: string, blockId: string, view: any, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Create.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setView(Mapper.To.View(view));
	request.setSourceList(sources);

	dispatcher.request(BlockDataviewViewCreate.name, request, callBack);
};

export const BlockDataviewViewUpdate = (contextId: string, blockId: string, viewId: string, view: any, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Update.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setView(Mapper.To.View(view));

	dispatcher.request(BlockDataviewViewUpdate.name, request, callBack);
};

export const BlockDataviewViewDelete = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.Delete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request(BlockDataviewViewDelete.name, request, callBack);
};

export const BlockDataviewViewSetPosition = (contextId: string, blockId: string, viewId: string, position: number, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.SetPosition.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setPosition(position);

	dispatcher.request(BlockDataviewViewSetPosition.name, request, callBack);
};

export const BlockDataviewFilterAdd = (contextId: string, blockId: string, viewId: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setFilter(Mapper.To.Filter(filter));

	dispatcher.request(BlockDataviewFilterAdd.name, request, callBack);
};

export const BlockDataviewFilterRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewFilterRemove.name, request, callBack);
};

export const BlockDataviewFilterReplace = (contextId: string, blockId: string, viewId: string, id: string, filter: I.Filter, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setId(id);
	request.setFilter(Mapper.To.Filter(filter));

	dispatcher.request(BlockDataviewFilterReplace.name, request, callBack);
};

export const BlockDataviewFilterSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Filter.Sort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewFilterSort.name, request, callBack);
};

export const BlockDataviewSortAdd = (contextId: string, blockId: string, viewId: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setSort(Mapper.To.Sort(sort));

	dispatcher.request(BlockDataviewSortAdd.name, request, callBack);
};

export const BlockDataviewSortRemove = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewSortRemove.name, request, callBack);
};

export const BlockDataviewSortReplace = (contextId: string, blockId: string, viewId: string, id: string, sort: I.Sort, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setId(id);
	request.setSort(Mapper.To.Sort(sort));

	dispatcher.request(BlockDataviewSortReplace.name, request, callBack);
};

export const BlockDataviewSortSort = (contextId: string, blockId: string, viewId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Sort.SSort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setIdsList(ids);

	dispatcher.request(BlockDataviewSortSort.name, request, callBack);
};

export const BlockDataviewViewRelationRemove = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Remove.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewViewRelationRemove.name, request, callBack);
};

export const BlockDataviewViewRelationReplace = (contextId: string, blockId: string, viewId: string, relationKey: string, relation: I.ViewRelation, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Replace.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkey(relationKey);
	request.setRelation(Mapper.To.ViewRelation(relation));

	dispatcher.request(BlockDataviewViewRelationReplace.name, request, callBack);
};

export const BlockDataviewViewRelationSort = (contextId: string, blockId: string, viewId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ViewRelation.Sort.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewViewRelationSort.name, request, callBack);
};

export const BlockDataviewViewSetActive = (contextId: string, blockId: string, viewId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.View.SetActive.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setViewid(viewId);

	dispatcher.request(BlockDataviewViewSetActive.name, request, callBack);
};

export const BlockDataviewGroupOrderUpdate = (contextId: string, blockId: string, order: any, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.GroupOrder.Update.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setGrouporder(Mapper.To.GroupOrder(order));

	dispatcher.request(BlockDataviewGroupOrderUpdate.name, request, callBack);
};

export const BlockDataviewObjectOrderUpdate = (contextId: string, blockId: string, orders: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.ObjectOrder.Update.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setObjectordersList(orders.map(Mapper.To.ObjectOrder));

	dispatcher.request(BlockDataviewObjectOrderUpdate.name, request, callBack);
};

export const BlockRelationSetKey = (contextId: string, blockId: string, relationKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.BlockRelation.SetKey.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setKey(relationKey);

	dispatcher.request(BlockRelationSetKey.name, request, callBack);
};

export const BlockDataviewRelationSet = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Set.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewRelationSet.name, request, callBack);
};

export const BlockDataviewRelationAdd = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Add.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewRelationAdd.name, request, callBack);
};

export const BlockDataviewRelationDelete = (contextId: string, blockId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.Relation.Delete.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(BlockDataviewRelationDelete.name, request, callBack);
};

export const BlockDataviewSetSource = (contextId: string, blockId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.BlockDataview.SetSource.Request();

	request.setContextid(contextId);
	request.setBlockid(blockId);
	request.setSourceList(sources);

	dispatcher.request(BlockDataviewSetSource.name, request, callBack);
};

// ---------------------- BLOCK WIDGET ---------------------- //

export const BlockCreateWidget = (contextId: string, targetId: string, block: any, position: I.BlockPosition, layout: I.WidgetLayout, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Block.CreateWidget.Request();
	const target = block.content.targetBlockId;

	if (!block.id && [ J.Constant.widgetId.bin, J.Constant.widgetId.chat ].includes(target)) {
		block.id = target;
	};

	request.setContextid(contextId);
	request.setTargetid(targetId);
	request.setBlock(Mapper.To.Block(block));
	request.setPosition(position as number);
	request.setWidgetlayout(layout as number);
	request.setObjectlimit(limit);

	dispatcher.request(BlockCreateWidget.name, request, callBack);
};

// ---------------------- HISTORY ---------------------- //

export const HistoryShowVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.ShowVersion.Request();

	request.setObjectid(objectId);
	request.setVersionid(versionId);

	dispatcher.request(HistoryShowVersion.name, request, (message: any) => {
		if (callBack) {
			callBack(message);
		};
	});
};

export const HistorySetVersion = (objectId: string, versionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.SetVersion.Request();

	request.setObjectid(objectId);
	request.setVersionid(versionId);

	dispatcher.request(HistorySetVersion.name, request, callBack);
};

export const HistoryGetVersions = (objectId: string, lastVersionId: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.History.GetVersions.Request();

	request.setObjectid(objectId);
	request.setLastversionid(lastVersionId);
	request.setLimit(limit);

	dispatcher.request(HistoryGetVersions.name, request, callBack);
};

export const HistoryDiffVersions = (objectId: string, spaceId: string, current: string, previous: string, callBack?: (message: any) => void) => {
	const request = new Rpc.History.DiffVersions.Request();

	request.setObjectid(objectId);
	request.setSpaceid(spaceId);
	request.setCurrentversion(current);
	request.setPreviousversion(previous);

	dispatcher.request(HistoryDiffVersions.name, request, callBack);
};

// ---------------------- OBJECT TYPE ---------------------- //

export const ObjectTypeRelationAdd = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Add.Request();

	request.setObjecttypeurl(objectTypeId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectTypeRelationAdd.name, request, callBack);
};

export const ObjectTypeRelationRemove = (objectTypeId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.Relation.Remove.Request();

	request.setObjecttypeurl(objectTypeId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectTypeRelationRemove.name, request, callBack);
};

export const ObjectTypeListConflictingRelations = (id: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.ListConflictingRelations.Request();

	request.setSpaceid(spaceId);
	request.setTypeobjectid(id);

	dispatcher.request(ObjectTypeListConflictingRelations.name, request, callBack);
};

export const ObjectTypeResolveLayoutConflicts = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectType.ResolveLayoutConflicts.Request();

	request.setTypeobjectid(id);

	dispatcher.request(ObjectTypeResolveLayoutConflicts.name, request, callBack);
};

// ---------------------- OBJECT ---------------------- //

export const ObjectCreate = (details: any, flags: I.ObjectFlag[], templateId: string, typeKey: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Create.Request();

	request.setDetails(Encode.struct(details));
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));
	request.setTemplateid(templateId);
	request.setSpaceid(spaceId);
	request.setObjecttypeuniquekey(typeKey || J.Constant.default.typeKey);

	dispatcher.request(ObjectCreate.name, request, callBack);
};

export const ObjectCreateSet = (sources: string[], details: any, templateId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateSet.Request();

	request.setSourceList(sources);
	request.setDetails(Encode.struct(details));
	request.setTemplateid(templateId);
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectCreateSet.name, request, callBack);
};

export const ObjectCreateBookmark = (details: any, spaceId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateBookmark.Request();

	request.setDetails(Encode.struct(details));
	request.setSpaceid(spaceId);
	request.setTemplateid(templateId);

	dispatcher.request(ObjectCreateBookmark.name, request, callBack);
};

export const ObjectCreateFromUrl = (details: any, spaceId: string, typeKey: string, url: string, withContent: boolean, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateFromUrl.Request();

	request.setDetails(Encode.struct(details));
	request.setSpaceid(spaceId);
	request.setObjecttypeuniquekey(typeKey);
	request.setUrl(url);
	request.setAddpagecontent(withContent);
	request.setTemplateid(templateId);

	dispatcher.request(ObjectCreateFromUrl.name, request, callBack);
};

export const ObjectCreateObjectType = (details: any, flags: I.ObjectFlag[], spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateObjectType.Request();

	request.setDetails(Encode.struct(details));
	request.setInternalflagsList(flags.map(Mapper.To.InternalFlag));
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectCreateObjectType.name, request, callBack);
};

export const ObjectCreateRelation = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	details.relationFormat = Number(details.relationFormat) || I.RelationType.LongText;

	const request = new Rpc.Object.CreateRelation.Request();

	request.setDetails(Encode.struct(details));
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectCreateRelation.name, request, callBack);
};

export const ObjectCreateRelationOption = (details: any, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.CreateRelation.Request();

	request.setDetails(Encode.struct(details));
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectCreateRelationOption.name, request, callBack);
};

export const RelationListRemoveOption = (optionIds: string[], checkInObjects: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Relation.ListRemoveOption.Request();

	request.setOptionidsList(optionIds);
	request.setCheckinobjects(checkInObjects);

	dispatcher.request(RelationListRemoveOption.name, request, callBack);
};

export const ObjectBookmarkFetch = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.BookmarkFetch.Request();

	request.setContextid(contextId);
	request.setUrl(url);

	dispatcher.request(ObjectBookmarkFetch.name, request, callBack);
};

export const ObjectOpen = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Open.Request();

	request.setObjectid(objectId);
	request.setTraceid(traceId);
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectOpen.name, request, (message: any) => {
		if (!message.error.code) {
			dispatcher.onObjectView(objectId, traceId, message.objectView);
		};

		// Save last opened object
		const object = S.Detail.get(objectId, objectId, []);

		if (!object._empty_ && ![ I.ObjectLayout.Dashboard ].includes(object.layout) && !keyboard.isPopup()) {
			Storage.setLastOpened(S.Common.windowId, { id: object.id, layout: object.layout });
		};

		if (callBack) {
			callBack(message);
		};
	});
};

export const ObjectShow = (objectId: string, traceId: string, spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Show.Request();

	request.setObjectid(objectId);
	request.setTraceid(traceId);
	request.setSpaceid(spaceId);

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
	const request = new Rpc.Object.Close.Request();

	request.setObjectid(objectId);
	request.setSpaceid(spaceId);

	dispatcher.request(ObjectClose.name, request, callBack);
};

export const ObjectUndo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Undo.Request();

	request.setContextid(contextId);

	dispatcher.request(ObjectUndo.name, request, callBack);
};

export const ObjectRedo = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Redo.Request();

	request.setContextid(contextId);

	dispatcher.request(ObjectRedo.name, request, callBack);
};

export const ObjectImport = (spaceId: string, options: any, snapshots: any[], existing: boolean, type: I.ImportType, mode: I.ImportMode, noProgress: boolean, isMigration: boolean, updateExisting: boolean, isNewSpace: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Import.Request();

	let params = null;

	switch (type) {
		case I.ImportType.Notion: {
			params = new Rpc.Object.Import.Request.NotionParams();
			params.setApikey(options.apiKey);

			request.setNotionparams(params);
			break;
		};

		case I.ImportType.Markdown: {
			params = new Rpc.Object.Import.Request.MarkdownParams();
			params.setPathList(options.paths);
			params.setCreatedirectorypages(true);

			request.setMarkdownparams(params);
			break;
		};

		case I.ImportType.Obsidian: {
			params = new Rpc.Object.Import.Request.MarkdownParams();
			params.setPathList(options.paths);
			params.setCreatedirectorypages(true);
			params.setIncludepropertiesasblock(true);

			request.setMarkdownparams(params);
			break;
		};

		case I.ImportType.Html: {
			params = new Rpc.Object.Import.Request.HtmlParams();
			params.setPathList(options.paths);

			request.setHtmlparams(params);
			break;
		};

		case I.ImportType.Text: {
			params = new Rpc.Object.Import.Request.TxtParams();
			params.setPathList(options.paths);

			request.setTxtparams(params);
			break;
		};

		case I.ImportType.Csv: {
			params = new Rpc.Object.Import.Request.CsvParams();
			params.setPathList(options.paths);
			params.setMode(options.mode);
			params.setUsefirstrowforrelations(options.firstRow);
			params.setTransposerowsandcolumns(options.transpose);
			params.setDelimiter(options.delimiter);

			request.setCsvparams(params);
			break;
		};

		case I.ImportType.Protobuf: {
			params = new Rpc.Object.Import.Request.PbParams();
			params.setPathList(options.paths);
			params.setNocollection(options.noCollection);
			params.setCollectiontitle(options.title);
			params.setImporttype(options.importType);

			request.setPbparams(params);
			break;
		};

	};

	request.setSpaceid(spaceId);
	request.setSnapshotsList((snapshots || []).map(Mapper.To.Snapshot));
	request.setUpdateexistingobjects(existing);
	request.setType(type as number);
	request.setMode(mode as number);
	request.setNoprogress(noProgress);
	request.setIsmigration(isMigration);
	request.setUpdateexistingobjects(updateExisting);
	request.setIsnewspace(isNewSpace);
	
	dispatcher.request(ObjectImport.name, request, callBack);
};

export const ObjectImportNotionValidateToken = (token: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Import.Notion.ValidateToken.Request();

	request.setToken(token);

	dispatcher.request(ObjectImportNotionValidateToken.name, request, callBack);
};

export const ObjectImportUseCase = (spaceId: string, usecase: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ImportUseCase.Request();

	request.setSpaceid(spaceId);
	request.setUsecase(usecase);

	dispatcher.request(ObjectImportUseCase.name, request, callBack);
};

export const ObjectImportExperience = (spaceId: string, url: string, title: string, isNewSpace: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ImportExperience.Request();

	request.setSpaceid(spaceId);
	request.setUrl(url);
	request.setTitle(title);
	request.setIsnewspace(isNewSpace);

	dispatcher.request(ObjectImportExperience.name, request, callBack);
};

export const ObjectSetObjectType = (contextId: string, typeKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetObjectType.Request();

	request.setContextid(contextId);
	request.setObjecttypeuniquekey(typeKey);

	dispatcher.request(ObjectSetObjectType.name, request, callBack);
};

export const ObjectSetSource = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetSource.Request();

	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request(ObjectSetSource.name, request, callBack);
};

export const ObjectListSetDetails = (objectIds: string[], details: any[], callBack?: (message: any) => void) => {
	details = details.map(Mapper.To.Details);

	const request = new Rpc.Object.ListSetDetails.Request();

	request.setObjectidsList(objectIds);
	request.setDetailsList(details);

	dispatcher.request(ObjectListSetDetails.name, request, callBack);
};

export const ObjectListModifyDetailValues = (objectIds: string[], operations: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListModifyDetailValues.Request();

	request.setObjectidsList(objectIds);
	request.setOperationsList(operations.map(it => {
		const op = new Rpc.Object.ListModifyDetailValues.Request.Operation();

		op.setRelationkey(it.relationKey);

		if (it.add) {
			op.setAdd(Encode.value(it.add));
		};
		if (it.set || (it.set === null)) {
			op.setSet(Encode.value(it.set));
		};
		if (it.remove) {
			op.setRemove(Encode.value(it.remove));
		};

		return op;
	}));

	dispatcher.request(ObjectListModifyDetailValues.name, request, callBack);
};

export const ObjectSearch = (spaceId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	const request = new Rpc.Object.Search.Request();

	request.setSpaceid(spaceId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setFulltext(fullText);
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(keys);

	dispatcher.request(ObjectSearch.name, request, callBack);
};

export const ObjectSearchWithMeta = (spaceId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], fullText: string, offset: number, limit: number, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	const request = new Rpc.Object.SearchWithMeta.Request();

	request.setSpaceid(spaceId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setFulltext(fullText);
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(keys);

	dispatcher.request(ObjectSearchWithMeta.name, request, callBack);
};

export const ObjectSearchSubscribe = (spaceId: string, subId: string, filters: I.Filter[], sorts: I.Sort[], keys: string[], sources: string[], offset: number, limit: number, afterId: string, beforeId: string, noDeps: boolean, collectionId: string, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	const request = new Rpc.Object.SearchSubscribe.Request();

	request.setSpaceid(spaceId);
	request.setSubid(subId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSortsList(sorts.map(Mapper.To.Sort));
	request.setOffset(offset);
	request.setLimit(limit);
	request.setKeysList(U.Common.arrayUnique(keys));
	request.setSourceList(sources);
	request.setAfterid(afterId);
	request.setBeforeid(beforeId);
	request.setNodepsubscription(noDeps);
	request.setCollectionid(collectionId);

	dispatcher.request(ObjectSearchSubscribe.name, request, callBack);
};

export const ObjectGroupsSubscribe = (spaceId: string, subId: string, relationKey: string, filters: I.Filter[], sources: string[], collectionId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.GroupsSubscribe.Request();

	request.setSpaceid(spaceId);
	request.setSubid(subId);
	request.setRelationkey(relationKey);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setSourceList(sources);
	request.setCollectionid(collectionId);

	dispatcher.request(ObjectGroupsSubscribe.name, request, callBack);
};

export const ObjectSubscribeIds = (spaceId: string, subId: string, ids: string[], keys: string[], noDeps: boolean, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	const request = new Rpc.Object.SubscribeIds.Request();

	request.setSpaceid(spaceId);
	request.setSubid(subId);
	request.setIdsList(ids);
	request.setKeysList(keys);
	request.setNodepsubscription(noDeps);

	dispatcher.request(ObjectSubscribeIds.name, request, callBack);
};

export const ObjectSearchUnsubscribe = (subIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SearchUnsubscribe.Request();

	request.setSubidsList(subIds);

	dispatcher.request(ObjectSearchUnsubscribe.name, request, callBack);
};

export const ObjectRelationAdd = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Add.Request();

	request.setContextid(contextId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectRelationAdd.name, request, callBack);
};

export const ObjectRelationDelete = (contextId: string, relationKeys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.Delete.Request();

	request.setContextid(contextId);
	request.setRelationkeysList(relationKeys);

	dispatcher.request(ObjectRelationDelete.name, request, callBack);
};

export const ObjectRelationAddFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.AddFeatured.Request();

	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request(ObjectRelationAddFeatured.name, request, callBack);
};

export const ObjectRelationRemoveFeatured = (contextId: string, keys: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectRelation.RemoveFeatured.Request();

	request.setContextid(contextId);
	request.setRelationsList(keys);

	dispatcher.request(ObjectRelationRemoveFeatured.name, request, callBack);
};

export const ObjectSetIsFavorite = (contextId: string, isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.SetIsFavorite.Request();

	request.setContextid(contextId);
	request.setIsfavorite(isFavorite);

	dispatcher.request(ObjectSetIsFavorite.name, request, callBack);
};

export const ObjectGraph = (spaceId: string, filters: any[], limit: number, types: string[], keys: string[], collectionId: string, sources: string[], typeEdges: boolean = true, callBack?: (message: any) => void) => {
	keys = (keys || []).filter(it => it);

	const request = new Rpc.Object.Graph.Request();

	request.setSpaceid(spaceId);
	request.setFiltersList(filters.map(Mapper.To.Filter));
	request.setLimit(limit);
	request.setObjecttypefilterList(types);
	request.setKeysList(keys);
	request.setCollectionid(collectionId);
	request.setSetsourceList(sources);
	request.setIncludetypeedges(typeEdges);

	dispatcher.request(ObjectGraph.name, request, callBack);
};

export const ObjectToSet = (contextId: string, sources: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToSet.Request();

	request.setContextid(contextId);
	request.setSourceList(sources);

	dispatcher.request(ObjectToSet.name, request, callBack);
};

export const ObjectToCollection = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToCollection.Request();

	request.setContextid(contextId);

	dispatcher.request(ObjectToCollection.name, request, callBack);
};

export const ObjectToBookmark = (contextId: string, url: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ToBookmark.Request();

	request.setContextid(contextId);
	request.setUrl(url);

	dispatcher.request(ObjectToBookmark.name, request, callBack);
};

export const ObjectDuplicate = (id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.Duplicate.Request();

	request.setContextid(id);

	dispatcher.request(ObjectDuplicate.name, request, callBack);
};

export const ObjectApplyTemplate = (contextId: string, templateId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ApplyTemplate.Request();

	request.setContextid(contextId);
	request.setTemplateid(templateId);

	dispatcher.request(ObjectApplyTemplate.name, request, callBack);
};

export const ObjectShareByLink = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ShareByLink.Request();

	request.setObjectid(objectId);

	dispatcher.request(ObjectShareByLink.name, request, callBack);
};

export const ObjectCollectionAdd = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Add.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionAdd.name, request, callBack);
};

export const ObjectCollectionRemove = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Remove.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionRemove.name, request, callBack);
};

export const ObjectCollectionSort = (contextId: string, objectIds: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.ObjectCollection.Sort.Request();

	request.setContextid(contextId);
	request.setObjectidsList(objectIds);

	dispatcher.request(ObjectCollectionSort.name, request, callBack);
};

export const ObjectChatAdd = (objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ChatAdd.Request();

	request.setObjectid(objectId);

	dispatcher.request(ObjectChatAdd.name, request, callBack);
};

export const ObjectDateByTimestamp = (spaceId: string, timestamp: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.DateByTimestamp.Request();

	request.setSpaceid(spaceId);
	request.setTimestamp(timestamp);

	dispatcher.request(ObjectDateByTimestamp.name, request, callBack);
};

// ---------------------- OBJECT LIST ---------------------- //

export const ObjectListDuplicate = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListDuplicate.Request();

	request.setObjectidsList(ids);

	dispatcher.request(ObjectListDuplicate.name, request, callBack);
};

export const ObjectListDelete = (ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListDelete.Request();

	request.setObjectidsList(ids);

	dispatcher.request(ObjectListDelete.name, request, callBack);
};

export const ObjectListSetIsArchived = (ids: string[], isArchived: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsArchived.Request();

	request.setObjectidsList(ids);
	request.setIsarchived(isArchived);

	dispatcher.request(ObjectListSetIsArchived.name, request, callBack);
};

export const ObjectListSetIsFavorite = (ids: string[], isFavorite: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetIsFavorite.Request();

	request.setObjectidsList(ids);
	request.setIsfavorite(isFavorite);

	dispatcher.request(ObjectListSetIsFavorite.name, request, callBack);
};

export const ObjectListSetObjectType = (ids: string[], typeKey: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListSetObjectType.Request();

	request.setObjectidsList(ids);
	request.setObjecttypeuniquekey(typeKey);

	dispatcher.request(ObjectListSetObjectType.name, request, callBack);
};

export const ObjectListExport = (spaceId: string, path: string, objectIds: string[], format: I.ExportType, zip: boolean, includeNested: boolean, includeFiles: boolean, includeArchived: boolean, isJson: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Object.ListExport.Request();

	request.setSpaceid(spaceId);
	request.setPath(path);
	request.setObjectidsList(objectIds);
	request.setFormat(format as number);
	request.setZip(zip);
	request.setIncludenested(includeNested);
	request.setIncludefiles(includeFiles);
	request.setIncludearchived(includeArchived);
	request.setIsjson(isJson);
	request.setMdincludepropertiesandschema(true);

	dispatcher.request(ObjectListExport.name, request, callBack);
};

// ---------------------- TEMPLATE ---------------------- //

export const TemplateCreateFromObject = (contextId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.CreateFromObject.Request();

	request.setContextid(contextId);

	dispatcher.request(TemplateCreateFromObject.name, request, callBack);
};

export const TemplateExportAll = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Template.ExportAll.Request();

	request.setPath(path);

	dispatcher.request(TemplateExportAll.name, request, callBack);
};

// ---------------------- UNSPLASH ---------------------- //

export const UnsplashSearch = (query: string, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Search.Request();

	request.setQuery(query);
	request.setLimit(limit);

	dispatcher.request(UnsplashSearch.name, request, callBack);
};

export const UnsplashDownload = (spaceId: string, id: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Unsplash.Download.Request();

	request.setSpaceid(spaceId);
	request.setPictureid(id);

	dispatcher.request(UnsplashDownload.name, request, callBack);
};

// ---------------------- DEBUG ---------------------- //

export const DebugTree = (objectId: string, path: string, unanonymized: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Tree.Request();

	request.setTreeid(objectId);
	request.setPath(path);
	request.setUnanonymized(unanonymized);

	dispatcher.request(DebugTree.name, request, callBack);
};

export const DebugExportLocalstore = (path: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.ExportLocalstore.Request();

	request.setPath(path);
	request.setDocidsList(ids);

	dispatcher.request(DebugExportLocalstore.name, request, callBack);
};

export const DebugSpaceSummary = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.SpaceSummary.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(DebugSpaceSummary.name, request, callBack);
};

export const DebugStackGoroutines = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.StackGoroutines.Request();

	request.setPath(path);

	dispatcher.request(DebugStackGoroutines.name, request, callBack);
};

export const DebugStat = (callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.Stat.Request();

	dispatcher.request(DebugStat.name, request, callBack);
};

export const DebugNetCheck = (config: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.NetCheck.Request();

	request.setClientyml(config);

	dispatcher.request(DebugNetCheck.name, request, callBack);
};

export const DebugExportLog = (path: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.ExportLog.Request();

	request.setDir(path);

	dispatcher.request(DebugExportLog.name, request, callBack);
};

export const DebugRunProfiler = (duration: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Debug.RunProfiler.Request();

	request.setDurationinseconds(duration);

	dispatcher.request(DebugRunProfiler.name, request, callBack);
};

// ---------------------- NOTIFICATION ---------------------- //

export const NotificationList = (includeRead: boolean, limit: number, callBack?: (message: any) => void) => {
	const request = new Rpc.Notification.List.Request();

	request.setIncluderead(includeRead);
	request.setLimit(limit);

	dispatcher.request(NotificationList.name, request, callBack);
};

export const NotificationReply = (ids: string[], action: I.NotificationAction, callBack?: (message: any) => void) => {
	const request = new Rpc.Notification.Reply.Request();

	request.setIdsList(ids);
	request.setActiontype(action as number);

	dispatcher.request(NotificationReply.name, request, callBack);
};

// ---------------------- NAME SERVICE ---------------------- //

export const NameServiceResolveName = (name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.NameService.ResolveName.Request();

	request.setNsname(name);
	request.setNsnametype(I.NameType.Any as number);

	dispatcher.request(NameServiceResolveName.name, request, callBack);
};

// ---------------------- PAYMENTS ---------------------- //

export const MembershipGetStatus = (noCache: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.GetStatus.Request();
	
	request.setNocache(noCache);

	dispatcher.request(MembershipGetStatus.name, request, callBack);
};

export const MembershipGetTiers = (noCache: boolean, locale: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.GetTiers.Request();

	request.setNocache(noCache);
	request.setLocale(locale);

	dispatcher.request(MembershipGetTiers.name, request, callBack);
};

export const MembershipIsNameValid = (tier: I.TierType, name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.IsNameValid.Request();

	request.setRequestedtier(tier as number);
	request.setNsname(name);
	request.setNsnametype(I.NameType.Any as number);

	dispatcher.request(MembershipIsNameValid.name, request, callBack);
};

export const MembershipRegisterPaymentRequest = (tier: I.TierType, method: I.PaymentMethod, name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.RegisterPaymentRequest.Request();

	request.setRequestedtier(tier as number);
	request.setPaymentmethod(method as number);
	request.setNsname(name);
	request.setNsnametype(I.NameType.Any as number);

	dispatcher.request(MembershipRegisterPaymentRequest.name, request, callBack);
};

export const MembershipGetPortalLinkUrl = (callBack?: (message: any) => void) => {
	const request = new Empty();
	dispatcher.request(MembershipGetPortalLinkUrl.name, request, callBack);
};

export const MembershipGetVerificationEmail = (email: string, subscribeNews: boolean, subscribeTips: boolean, isOnboardingList: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.GetVerificationEmail.Request();
	
	request.setEmail(email);
	request.setSubscribetonewsletter(subscribeNews);
	request.setInsidertipsandtutorials(subscribeTips);
	request.setIsonboardinglist(isOnboardingList);
	
	dispatcher.request(MembershipGetVerificationEmail.name, request, callBack);
};

export const MembershipVerifyEmailCode = (code: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.VerifyEmailCode.Request();
	
	request.setCode(code);
	
	dispatcher.request(MembershipVerifyEmailCode.name, request, callBack);
};

export const MembershipFinalize = (name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.Finalize.Request();

	request.setNsname(name);
	request.setNsnametype(I.NameType.Any as number);

	dispatcher.request(MembershipFinalize.name, request, callBack);
};

export const MembershipCodeGetInfo = (code: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.CodeGetInfo.Request();

	request.setCode(code);

	dispatcher.request(MembershipCodeGetInfo.name, request, callBack);
};

export const MembershipCodeRedeem = (code: string, name: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Membership.CodeRedeem.Request();

	request.setCode(code);
	request.setNsname(name);
	request.setNsnametype(I.NameType.Any as number);

	dispatcher.request(MembershipCodeRedeem.name, request, callBack);
};

// ---------------------- SPACE ---------------------- //

export const SpaceInviteGenerate = (spaceId: string, inviteType?: I.InviteType, permissions?: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.InviteGenerate.Request();

	request.setSpaceid(spaceId);

	if (inviteType && permissions) {
		request.setInvitetype(inviteType as number);
		request.setPermissions(permissions as number);
	};

	dispatcher.request(SpaceInviteGenerate.name, request, callBack);
};

export const SpaceInviteView = (cid: string, key: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.InviteView.Request();

	request.setInvitecid(cid);
	request.setInvitefilekey(key);

	dispatcher.request(SpaceInviteView.name, request, callBack);
};

export const SpaceInviteRevoke = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.InviteRevoke.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceInviteRevoke.name, request, callBack);
};

export const SpaceInviteGetCurrent = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.InviteGetCurrent.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceInviteGetCurrent.name, request, callBack);
};

export const SpaceStopSharing = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.StopSharing.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceStopSharing.name, request, callBack);
};

export const SpaceMakeShareable = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.StopSharing.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceMakeShareable.name, request, callBack);
};

export const SpaceJoin = (networkId: string, spaceId: string, cid: string, key: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.Join.Request();

	request.setNetworkid(networkId);
	request.setSpaceid(spaceId);
	request.setInvitecid(cid);
	request.setInvitefilekey(key);

	dispatcher.request(SpaceJoin.name, request, callBack);
};

export const SpaceJoinCancel = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.JoinCancel.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(SpaceJoinCancel.name, request, callBack);
};

export const SpaceRequestApprove = (spaceId: string, identity: string, permissions: I.ParticipantPermissions, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.RequestApprove.Request();

	request.setSpaceid(spaceId);
	request.setIdentity(identity);
	request.setPermissions(permissions as number);

	dispatcher.request(SpaceRequestApprove.name, request, callBack);
};

export const SpaceRequestDecline = (spaceId: string, identity: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Space.RequestDecline.Request();

	request.setSpaceid(spaceId);
	request.setIdentity(identity);

	dispatcher.request(SpaceRequestDecline.name, request, callBack);
};

export const SpaceParticipantPermissionsChange = (spaceId: string, changes: any[], callBack?: (message: any) => void) => {
	const request = new Rpc.Space.ParticipantPermissionsChange.Request();

	request.setSpaceid(spaceId);
	request.setChangesList(changes.map(Mapper.To.ParticipantPermissionChange));

	dispatcher.request(SpaceParticipantPermissionsChange.name, request, callBack);
};

export const SpaceParticipantRemove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Space.ParticipantRemove.Request();

	request.setSpaceid(spaceId);
	request.setIdentitiesList(identities);

	dispatcher.request(SpaceParticipantRemove.name, request, callBack);
};

export const SpaceLeaveApprove = (spaceId: string, identities: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Space.LeaveApprove.Request();

	request.setSpaceid(spaceId);
	request.setIdentitiesList(identities);

	dispatcher.request(SpaceLeaveApprove.name, request, callBack);
};

// ---------------------- EXTENSION ---------------------- //

export const BroadcastPayloadEvent = (payload: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Broadcast.PayloadEvent.Request();

	request.setPayload(JSON.stringify(payload, null, 3));

	dispatcher.request(BroadcastPayloadEvent.name, request, callBack);
};

// ---------------------- DEVICES ---------------------- //

export const DeviceList = (callBack?: (message: any) => void) => {
	dispatcher.request(DeviceList.name, new Commands.Empty(), callBack);
};

// ---------------------- CHAT ---------------------- //

export const ChatAddMessage = (objectId: string, message: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.AddMessage.Request();

	request.setChatobjectid(objectId);
	request.setMessage(Mapper.To.ChatMessage(message));

	dispatcher.request(ChatAddMessage.name, request, callBack);
};

export const ChatEditMessageContent = (objectId: string, messageId: string, message: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.EditMessageContent.Request();

	request.setChatobjectid(objectId);
	request.setMessageid(messageId);
	request.setEditedmessage(Mapper.To.ChatMessage(message));

	dispatcher.request(ChatEditMessageContent.name, request, callBack);
};

export const ChatToggleMessageReaction = (objectId: string, messageId: string, emoji: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.ToggleMessageReaction.Request();

	request.setChatobjectid(objectId);
	request.setMessageid(messageId);
	request.setEmoji(emoji);

	dispatcher.request(ChatToggleMessageReaction.name, request, callBack);
};

export const ChatDeleteMessage = (objectId: string, messageId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.DeleteMessage.Request();

	request.setChatobjectid(objectId);
	request.setMessageid(messageId);

	dispatcher.request(ChatDeleteMessage.name, request, callBack);
};

export const ChatGetMessages = (objectId: string, beforeOrderId: string, afterOrderId: string, limit: number, includeBoundary: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.GetMessages.Request();

	request.setChatobjectid(objectId);
	request.setBeforeorderid(beforeOrderId);
	request.setAfterorderid(afterOrderId);
	request.setLimit(limit);
	request.setIncludeboundary(includeBoundary);

	dispatcher.request(ChatGetMessages.name, request, callBack);
};

export const ChatReadMessages = (objectId: string, afterOrderId: string, beforeOrderId: string, lastStateId: string, type: I.ChatReadType, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.ReadMessages.Request();

	request.setChatobjectid(objectId);
	request.setBeforeorderid(beforeOrderId);
	request.setAfterorderid(afterOrderId);
	request.setLaststateid(lastStateId);
	request.setType(type as number);

	dispatcher.request(ChatReadMessages.name, request, callBack);
};

export const ChatUnreadMessages = (objectId: string, afterOrderId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.Unread.Request();

	request.setChatobjectid(objectId);
	request.setAfterorderid(afterOrderId);

	dispatcher.request(ChatUnreadMessages.name, request, callBack);
};

export const ChatReadAll = (callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.ReadAll.Request();

	dispatcher.request(ChatReadAll.name, request, callBack);
};

export const ChatSubscribeLastMessages = (objectId: string, limit: number, subId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.SubscribeLastMessages.Request();

	request.setChatobjectid(objectId);
	request.setLimit(limit);
	request.setSubid(subId);

	dispatcher.request(ChatSubscribeLastMessages.name, request, callBack);
};

export const ChatSubscribeToMessagePreviews = (subId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.SubscribeToMessagePreviews.Request();

	request.setSubid(subId);

	dispatcher.request(ChatSubscribeToMessagePreviews.name, request, callBack);
};

export const ChatUnsubscribe = (objectId: string, subId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.Unsubscribe.Request();

	request.setChatobjectid(objectId);
	request.setSubid(subId);

	dispatcher.request(ChatUnsubscribe.name, request, callBack);
};

export const ChatGetMessagesByIds = (objectId: string, ids: string[], callBack?: (message: any) => void) => {
	const request = new Rpc.Chat.GetMessagesByIds.Request();

	request.setChatobjectid(objectId);
	request.setMessageidsList(ids);

	dispatcher.request(ChatGetMessagesByIds.name, request, callBack);
};

export const RelationListWithValue = (spaceId: string, value: any, callBack?: (message: any) => void) => {
	const request = new Rpc.Relation.ListWithValue.Request();

	request.setSpaceid(spaceId);
	request.setValue(Encode.value(value));

	dispatcher.request(RelationListWithValue.name, request, callBack);
};

// ---------------------- PUBLISHING ---------------------- //

export const PublishingCreate = (spaceId: string, objectId: string, uri: string, joinSpace: boolean, callBack?: (message: any) => void) => {
	const request = new Rpc.Publishing.Create.Request();

	request.setObjectid(objectId);
	request.setSpaceid(spaceId);
	request.setUri(uri);
	request.setJoinspace(joinSpace);

	dispatcher.request(PublishingCreate.name, request, callBack);
};

export const PublishingRemove = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Publishing.Remove.Request();

	request.setObjectid(objectId);
	request.setSpaceid(spaceId);

	dispatcher.request(PublishingRemove.name, request, callBack);
};

export const PublishingList = (spaceId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Publishing.List.Request();

	request.setSpaceid(spaceId);

	dispatcher.request(PublishingList.name, request, callBack);
};

export const PublishingResolveUri = (uri: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Publishing.ResolveUri.Request();

	request.setUri(uri);

	dispatcher.request(PublishingResolveUri.name, request, callBack);
};

export const PublishingGetStatus = (spaceId: string, objectId: string, callBack?: (message: any) => void) => {
	const request = new Rpc.Publishing.GetStatus.Request();

	request.setObjectid(objectId);
	request.setSpaceid(spaceId);

	dispatcher.request(PublishingGetStatus.name, request, callBack);
};

// ---------------------- PUSH ---------------------- //

export const PushNotificationSetSpaceMode = (spaceId: string, mode: I.NotificationMode, callBack?: (message: any) => void) => {
	const request = new Rpc.PushNotification.SetSpaceMode.Request();

	request.setSpaceid(spaceId);
	request.setMode(mode as number);

	dispatcher.request(PushNotificationSetSpaceMode.name, request, callBack);
};
