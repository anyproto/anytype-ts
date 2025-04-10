import { Rpc } from 'dist/lib/pb/protos/commands_pb';
import { S, Decode, Mapper } from 'Lib';

const details = (o: any) => {
	return o ? S.Detail.mapper(Decode.struct(o.getDetails())) : {};
};

export const AppGetVersion = (response: Rpc.App.GetVersion.Response) => {
	return {
		details: response.getDetails(),
		version: response.getVersion(),
	};
};

export const AccountCreate = (response: Rpc.Account.Create.Response) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

export const AccountSelect = (response: Rpc.Account.Select.Response) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

export const AccountDelete = (response: Rpc.Account.Delete.Response) => {
	return {
		status: response.hasStatus() ? Mapper.From.AccountStatus(response.getStatus()) : null,
	};
};

export const AccountRecoverFromLegacyExport = (response: Rpc.Account.RecoverFromLegacyExport.Response) => {
	return {
		accountId: response.getAccountid(),
		spaceId: response.getPersonalspaceid(),
	};
};

export const AccountLocalLinkNewChallenge = (response: Rpc.Account.LocalLink.NewChallenge.Response) => {
	return {
		challengeId: response.getChallengeid(),
	};
};

export const AccountLocalLinkSolveChallenge = (response: Rpc.Account.LocalLink.SolveChallenge.Response) => {
	return {
		token: response.getSessiontoken(),
		appKey: response.getAppkey(),
	};
};

export const AccountMigrate = (response: Rpc.Account.Migrate.Response) => {
	return {
		requiredSpace: response.getError().getRequiredspace()
	};
};

export const DebugSpaceSummary = (response: Rpc.Debug.SpaceSummary.Response) => {
	return response.toObject();
};

export const DebugStat = (response: Rpc.Debug.Stat.Response) => {
	let res = {};
	try { res = JSON.parse(response.getJsonstat()); } catch (e) { /**/ };
	return res;
};

export const DebugNetCheck = (response: Rpc.Debug.NetCheck.Response) => {
	return {
		result: response.getResult(),
	};
};

export const DebugRunProfiler = (response: Rpc.Debug.RunProfiler.Response) => {
	return {
		path: response.getPath(),
	};
};

export const Export = (response: any) => {
	return {
		path: response.getPath(),
	};
};

export const LinkPreview = (response: Rpc.LinkPreview.Response) => {
	return {
		previewLink: response.hasLinkpreview() ? Mapper.From.PreviewLink(response.getLinkpreview()) : {},
	};
};

export const FileListOffload = (response: Rpc.File.ListOffload.Response) => {
	return {
		files: response.getFilesoffloaded(),
		bytes: response.getBytesoffloaded(),
	};
};

export const FileNodeUsage = (response: Rpc.File.NodeUsage.Response) => {
	const usage = response.getUsage();
	
	let res = {};

	if (usage) {
		res = Object.assign(res, {
			bytesLimit: usage.getByteslimit(),
			localUsage: usage.getLocalbytesusage(),
		});
	};

	return {
		...res,
		spaces: (response.getSpacesList() || []).map(it => ({
			spaceId: it.getSpaceid(),
			bytesUsage: it.getBytesusage(),
		})),
	};
};

export const FileUpload = (response: Rpc.File.Upload.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const FileDownload = (response: Rpc.File.Download.Response) => {
	return {
		path: response.getLocalpath(),
	};
};

export const WalletCreate = (response: Rpc.Wallet.Create.Response) => {
	return {
		mnemonic: response.getMnemonic(),
	};
};

export const WalletConvert = (response: Rpc.Wallet.Convert.Response) => {
	return {
		mnemonic: response.getMnemonic(),
		entropy: response.getEntropy(),
	};
};

export const WalletCreateSession = (response: Rpc.Wallet.CreateSession.Response) => {
	return {
		token: response.getToken(),
		appToken: response.getApptoken(),
		accountId: response.getAccountid(),
	};
};

export const ObjectCreate = (response: Rpc.Object.Create.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectCreateSet = (response: Rpc.Object.CreateSet.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectCreateBookmark = (response: Rpc.Object.CreateBookmark.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectCreateFromUrl = (response: Rpc.Object.CreateFromUrl.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectCreateObjectType = (response: Rpc.Object.CreateObjectType.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectCreateRelation = (response: Rpc.Object.CreateRelation.Response) => {
	return {
		objectId: response.getObjectid(),
		relationKey: response.getKey(),
		details: details(response),
	};
};

export const ObjectCreateRelationOption = (response: Rpc.Object.CreateRelationOption.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const ObjectOpen = (response: Rpc.Object.Open.Response) => {
	return {
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

export const ObjectShow = (response: Rpc.Object.Show.Response) => {
	return {
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

export const ObjectSearch = (response: Rpc.Object.Search.Response) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.struct),
	};
};

export const ObjectSearchWithMeta = (response: Rpc.Object.SearchWithMeta.Response) => {
	return {
		records: (response.getResultsList() || []).map(Mapper.From.ObjectSearchWithMeta),
	};
};

export const ObjectGroupsSubscribe = (response: Rpc.Object.GroupsSubscribe.Response) => {
	return {
		subId: response.getSubid(),
		groups: (response.getGroupsList() || []).map(Mapper.From.BoardGroup),
	};
};

export const ObjectSearchSubscribe = (response: Rpc.Object.SearchSubscribe.Response) => {
	const counters = response.getCounters();
	return {
		counters: {
			total: counters.getTotal(),
			nextCount: counters.getNextcount(),
			prevCount: counters.getPrevcount(),
		},
		records: (response.getRecordsList() || []).map(Decode.struct),
		dependencies: (response.getDependenciesList() || []).map(Decode.struct),
	};
};

export const ObjectSubscribeIds = (response: Rpc.Object.SubscribeIds.Response) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.struct),
		dependencies: (response.getDependenciesList() || []).map(Decode.struct),
	};
};

export const ObjectGraph = (response: Rpc.Object.Graph.Response) => {
	const nodes = (response.getNodesList() || []).map(Decode.struct).map(it => S.Detail.mapper(it));
	const hashes: any = [];

	let edges: any[] = (response.getEdgesList() || []).map(Mapper.From.GraphEdge);

	// Deduplicate edges
	edges = edges.filter(d => { 
		const hash = [ d.source, d.target ].join('-');
		if (hashes.includes(hash)) {
			return false;
		};

		hashes.push(hash);
		return (d.source != d.target);
	});

	// Find backlinks
	for (const edge of edges) {
		const idx = edges.findIndex(d => (d.source == edge.target) && (d.target == edge.source));
		const double = edges[idx];

		if (idx >= 0) {
			edge.isDouble = true;
			edge.types = [ edge.type, double.type ];
			edges.splice(idx, 1);
		};
	};

	return { edges, nodes };
};

export const ObjectToBookmark = (response: Rpc.Object.ToBookmark.Response) => {
	return {
		objectId: response.getObjectid(),
	};
};

export const ObjectShareByLink = (response: Rpc.Object.ShareByLink.Response) => {
	return {
		link: response.getLink(),
	};
};

export const ObjectListDuplicate = (response: Rpc.Object.ListDuplicate.Response) => {
	return {
		ids: response.getIdsList(),
	};
};

export const ObjectUndo = (response: Rpc.Object.Undo.Response) => {
	return {
		blockId: response.getBlockid(),
		range: Mapper.From.Range(response.getRange()),
	};
};

export const ObjectRedo = (response: Rpc.Object.Redo.Response) => {
	return {
		blockId: response.getBlockid(),
		range: Mapper.From.Range(response.getRange()),
	};
};

export const ObjectChatAdd = (response: Rpc.Object.ChatAdd.Response) => {
	return {
		chatId: response.getChatid(),
	};
};

export const ObjectDateByTimestamp = (response: Rpc.Object.DateByTimestamp.Response) => {
	return {
		details: details(response),
	};
};

export const BlockCreate = (response: Rpc.Block.Create.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const BlockCreateWidget = (response: Rpc.Block.CreateWidget.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const BlockTableCreate = (response: Rpc.BlockTable.Create.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const BlockSplit = (response: Rpc.Block.Split.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const BlockCopy = (response: Rpc.Block.Copy.Response) => {
	return {
		textSlot: response.getTextslot(),
		htmlSlot: response.getHtmlslot(),
		anySlot: response.getAnyslotList(),
	};
};

export const BlockCut = (response: Rpc.Block.Cut.Response) => {
	return {
		textSlot: response.getTextslot(),
		htmlSlot: response.getHtmlslot(),
		anySlot: response.getAnyslotList(),
	};
};

export const BlockPaste = (response: Rpc.Block.Paste.Response) => {
	return {
		blockIds: response.getBlockidsList(),
		caretPosition: response.getCaretposition(),
		isSameBlockCaret: response.getIssameblockcaret(),
	};
};

export const BlockListDuplicate = (response: Rpc.Block.ListDuplicate.Response) => {
	return {
		blockIds: response.getBlockidsList(),
	};
};

export const BlockListConvertToObjects = (response: Rpc.Block.ListConvertToObjects.Response) => {
	return {
		linkIds: response.getLinkidsList(),
	};
};

export const BlockPreview = (response: Rpc.Block.Preview.Response) => {
	return {
		blocks: (response.getBlocksList() || []).map(Mapper.From.Block),
	};
};

export const BlockDataviewCreateFromExistingObject = (response: Rpc.BlockDataview.CreateFromExistingObject.Response) => {
	return {
		blockId: response.getBlockid(),
		targetObjectId: response.getTargetobjectid(),
		views: (response.getViewList() || []).map(Mapper.From.View),
	};
};

export const BlockDataviewViewCreate = (response: Rpc.BlockDataview.View.Create.Response) => {
	return {
		viewId: response.getViewid(),
	};
};

export const BlockLinkCreateWithObject = (response: Rpc.BlockLink.CreateWithObject.Response) => {
	return {
		blockId: response.getBlockid(),
		targetId: response.getTargetid(),
		details: details(response),
	};
};

export const BlockBookmarkCreateAndFetch = (response: Rpc.BlockBookmark.CreateAndFetch.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const BlockFileCreateAndUpload = (response: Rpc.BlockFile.CreateAndUpload.Response) => {
	return {
		blockId: response.getBlockid(),
	};
};

export const HistoryGetVersions = (response: Rpc.History.GetVersions.Response) => {
	return {
		versions: (response.getVersionsList() || []).map(Mapper.From.HistoryVersion),
	};
};

export const HistoryShowVersion = (response: Rpc.History.ShowVersion.Response) => {
	const version = response.getVersion();
	return {
		version: version ? Mapper.From.HistoryVersion(response.getVersion()) : null,
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

export const HistoryDiffVersions = (response: Rpc.History.DiffVersions.Response) => {
	return {
		events: (response.getHistoryeventsList() || []).map(it => {
			const type = Mapper.Event.Type(it.getValueCase());
			const { spaceId, data } = Mapper.Event.Data(it);
			const mapped = Mapper.Event[type] ? Mapper.Event[type](data) : null;

			return mapped ? { spaceId, type, data: mapped } : null;
		}).filter(it => it),
	};
};

export const ObjectTypeListConflictingRelations = (response: Rpc.ObjectType.ListConflictingRelations.Response) => {
	return {
		conflictRelationIds: response.getRelationidsList()
	};
};

export const NavigationGetObjectInfoWithLinks = (response: Rpc.Navigation.GetObjectInfoWithLinks.Response) => {
	const object = response.getObject();
	const links = object.getLinks();

	return {
		object: {
			id: object.getId(),
			info: Mapper.From.ObjectInfo(object.getInfo()),
			links: {
				inbound: (links.getInboundList() || []).map(Mapper.From.ObjectInfo),
				outbound: (links.getOutboundList() || []).map(Mapper.From.ObjectInfo),
			},
		},
	};
};

export const TemplateCreateFromObject = (response: Rpc.Template.CreateFromObject.Response) => {
	return {
		id: response.getId(),
	};
};

export const WorkspaceCreate = (response: Rpc.Workspace.Create.Response) => {
	return {
		objectId: response.getSpaceid(),
		startingId: response.getStartingobjectid(),
	};
};

export const WorkspaceOpen = (response: Rpc.Workspace.Open.Response) => {
	return {
		info: Mapper.From.AccountInfo(response.getInfo()),
	};
};

export const WorkspaceObjectAdd = (response: Rpc.Workspace.Object.Add.Response) => {
	return {
		objectId: response.getObjectid(),
		details: details(response),
	};
};

export const UnsplashSearch = (response: Rpc.Unsplash.Search.Response) => {
	return {
		pictures: (response.getPicturesList() || []).map(Mapper.From.UnsplashPicture),
	};
};

export const UnsplashDownload = (response: Rpc.Unsplash.Download.Response) => {
	return {
		objectId: response.getObjectid(),
	};
};

export const GalleryDownloadIndex = (response: Rpc.Gallery.DownloadIndex.Response) => {
	return {
		categories: (response.getCategoriesList() || []).map((it: Rpc.Gallery.DownloadIndex.Response.Category) => {
			return {
				id: it.getId(),
				icon: it.getIcon(),
				list: it.getExperiencesList() || [],
			};
		}),
		list: (response.getExperiencesList() || []).map(Mapper.From.Manifest),
	};
};

export const GalleryDownloadManifest = (response: Rpc.Gallery.DownloadManifest.Response) => {
	return {
		info: Mapper.From.Manifest(response.getInfo()),
	};
};

export const NotificationList = (response: Rpc.Notification.List.Response) => {
	return {
		list: (response.getNotificationsList() || []).map(Mapper.From.Notification),
	};
};

export const NameServiceResolveName = (response: Rpc.NameService.ResolveName.Response) => {
	return {
		available: response.getAvailable(),
		ownerScwEthAddress: response.getOwnerscwethaddress(),
		ownerEtherAddress: response.getOwnerethaddress(),
		ownerAnyAddress: response.getOwneranyaddress(),
		spaceId: response.getSpaceid(),
		nameExpires: response.getNameexpires(),
	};
};

export const MembershipGetStatus = (response: Rpc.Membership.GetStatus.Response) => {
	return {
		membership: Mapper.From.Membership(response.getData()),
	};
};

export const MembershipGetTiers = (response: Rpc.Membership.GetTiers.Response) => {
	return {
		tiers: (response.getTiersList() || []).map(it => Mapper.From.MembershipTierData(it)),
	};
};

export const MembershipRegisterPaymentRequest = (response: Rpc.Membership.RegisterPaymentRequest.Response) => {
	return {
		url: response.getPaymenturl(),
	};
};

export const MembershipGetPortalLinkUrl = (response: Rpc.Membership.GetPortalLinkUrl.Response) => {
	return { 
		url: response.getPortalurl(),
	};
};

export const SpaceInviteGenerate = (response: Rpc.Space.InviteGenerate.Response) => {
	return {
		inviteCid: response.getInvitecid(),
		inviteKey: response.getInvitefilekey(),
	};
};

export const SpaceInviteGetCurrent = (response: Rpc.Space.InviteGetCurrent.Response) => {
	return {
		inviteCid: response.getInvitecid(),
		inviteKey: response.getInvitefilekey(),
	};
};

export const SpaceInviteView = (response: Rpc.Space.InviteView.Response) => {
	return {
		spaceName: response.getSpacename(),
		creatorName: response.getCreatorname(),
		spaceId: response.getSpaceid(),
	};
};

export const DeviceList = (response: Rpc.Device.List.Response) => {
	return {
		devices: (response.getDevicesList() || []).map(it => Mapper.From.DeviceInfo(it))
	};
};

export const ChatGetMessages = (response: Rpc.Chat.GetMessages.Response) => {
	return {
		messages: (response.getMessagesList() || []).map(Mapper.From.ChatMessage),
		state: Mapper.From.ChatState(response.getChatstate()),
	};
};

export const ChatGetMessagesByIds = (response: Rpc.Chat.GetMessagesByIds.Response) => {
	return {
		messages: (response.getMessagesList() || []).map(Mapper.From.ChatMessage),
	};
};

export const ChatSubscribeLastMessages = (response: Rpc.Chat.SubscribeLastMessages.Response) => {
	return {
		messages: (response.getMessagesList() || []).map(Mapper.From.ChatMessage),
		state: Mapper.From.ChatState(response.getChatstate()),
	};
};

export const ChatAddMessage = (response: Rpc.Chat.AddMessage.Response) => {
	return {
		messageId: response.getMessageid(),
	};
};

export const RelationListWithValue = (response: Rpc.Relation.ListWithValue.Response) => {
	return {
		relations: (response.getListList() || []).map(it => {
			return {
				relationKey: it.getRelationkey(),
				counter: it.getCounter(),
			};
		}),
	};
};

export const PublishingCreate = (response: Rpc.Publishing.Create.Response) => {
	return { 
		url: response.getUri(),
	};
};

export const PublishingList = (response: Rpc.Publishing.List.Response) => {
	return {
		list: (response.getPublishesList() || []).map(Mapper.From.PublishState),
	};
};

export const PublishingResolveUri = (response: Rpc.Publishing.ResolveUri.Response) => {
	return {
		state: response.hasPublish() ? Mapper.From.PublishState(response.getPublish()) : null,
	};
};

export const PublishingGetStatus = (response: Rpc.Publishing.GetStatus.Response) => {
	return {
		state: response.hasPublish() ? Mapper.From.PublishState(response.getPublish()) : null,
	};
};

export const ObjectImportUseCase = (response: Rpc.Object.ImportUseCase.Response) => {
	return {
		startingId: response.getStartingobjectid(),
	};
};