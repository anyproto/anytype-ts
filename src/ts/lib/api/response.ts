
/**
 * Response handlers for gRPC command responses.
 *
 * Each exported function corresponds to a middleware command and transforms
 * the ts-proto response (plain JS object) into an application-specific object.
 *
 * Naming convention: Function names match the command names exactly.
 * These functions are called by the Dispatcher when processing command responses.
 */

/**
 * Helper to extract and decode details from a response object.
 */
const details = (o: any) => {
	return o ? S.Detail.mapper(Decode.struct(o.details)) : {};
};

export const AppGetVersion = (response: any) => {
	return {
		details: response.details,
		version: response.version,
	};
};

export const AccountCreate = (response: any) => {
	return {
		account: Mapper.From.Account(response.account),
	};
};

export const AccountSelect = (response: any) => {
	return {
		account: Mapper.From.Account(response.account),
	};
};

export const AccountDelete = (response: any) => {
	return {
		status: response.status ? Mapper.From.AccountStatus(response.status) : null,
	};
};

export const AccountRecoverFromLegacyExport = (response: any) => {
	return {
		accountId: response.accountId,
		spaceId: response.personalSpaceId,
	};
};

export const AccountLocalLinkNewChallenge = (response: any) => {
	return {
		challengeId: response.challengeId,
	};
};

export const AccountLocalLinkSolveChallenge = (response: any) => {
	return {
		token: response.sessionToken,
		appKey: response.appKey,
	};
};

export const AccountLocalLinkListApps = (response: any) => {
	return {
		list: (response.app || []).map(Mapper.From.AppInfo),
	};
};

export const AccountLocalLinkCreateApp = (response: any) => {
	return {
		key: response.appKey,
	};
};

export const AccountMigrate = (response: any) => {
	return {
		requiredSpace: response.error?.requiredSpace,
	};
};

export const DebugSpaceSummary = (response: any) => {
	return response;
};

export const DebugStat = (response: any) => {
	let res = {};
	try { res = JSON.parse(response.jsonStat); } catch (e) { console.warn('[Response] JSON parse failed:', e); };
	return res;
};

export const DebugNetCheck = (response: any) => {
	return {
		result: response.result,
	};
};

export const DebugRunProfiler = (response: any) => {
	return {
		path: response.path,
	};
};

export const DebugExportReport = (response: any) => {
	return {
		path: response.path,
		summary: response.summary,
		lastModifiedTs: response.lastModifiedTs,
	};
};

export const Export = (response: any) => {
	return {
		path: response.path,
	};
};

export const LinkPreview = (response: any) => {
	return {
		previewLink: response.linkPreview ? Mapper.From.PreviewLink(response.linkPreview) : {},
	};
};

export const FileListOffload = (response: any) => {
	return {
		files: response.filesOffloaded,
		bytes: response.bytesOffloaded,
	};
};

export const FileNodeUsage = (response: any) => {
	const usage = response.usage;

	let res = {};

	if (usage) {
		res = Object.assign(res, {
			bytesLimit: usage.bytesLimit,
			localUsage: usage.localBytesUsage,
		});
	};

	return {
		...res,
		spaces: (response.spaces || []).map((it: any) => ({
			spaceId: it.spaceId,
			bytesUsage: it.bytesUsage,
		})),
	};
};

export const FileUpload = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
		preloadFileId: response.preloadFileId,
	};
};

export const FileDownload = (response: any) => {
	return {
		path: response.localPath,
	};
};

export const WalletCreate = (response: any) => {
	return {
		mnemonic: response.mnemonic,
	};
};

export const WalletConvert = (response: any) => {
	return {
		mnemonic: response.mnemonic,
		entropy: response.entropy,
	};
};

export const WalletCreateSession = (response: any) => {
	return {
		token: response.token,
		appToken: response.appToken,
		accountId: response.accountId,
	};
};

export const ObjectCreate = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectCreateSet = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectCreateFromUrl = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectCreateObjectType = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectCreateRelation = (response: any) => {
	return {
		objectId: response.objectId,
		relationKey: response.key,
		details: details(response),
	};
};

export const ObjectCreateRelationOption = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectCreateBookmark = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const ObjectOpen = (response: any) => {
	return {
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const ObjectShow = (response: any) => {
	return {
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const ObjectSearch = (response: any) => {
	return {
		records: (response.records || []).map(Decode.struct),
	};
};

export const ObjectSearchWithMeta = (response: any) => {
	return {
		records: (response.results || []).map(Mapper.From.ObjectSearchWithMeta),
	};
};

export const ObjectGroupsSubscribe = (response: any) => {
	return {
		subId: response.subId,
		groups: (response.groups || []).map(Mapper.From.BoardGroup),
	};
};

export const ObjectSearchSubscribe = (response: any) => {
	const counters = response.counters || {};
	return {
		counters: {
			total: counters.total,
			nextCount: counters.nextCount,
			prevCount: counters.prevCount,
		},
		records: (response.records || []).map(Decode.struct),
		dependencies: (response.dependencies || []).map(Decode.struct),
	};
};

export const ObjectCrossSpaceSearchSubscribe = (response: any) => {
	const counters = response.counters || {};
	return {
		counters: {
			total: counters.total,
			nextCount: counters.nextCount,
			prevCount: counters.prevCount,
		},
		records: (response.records || []).map(Decode.struct),
		dependencies: (response.dependencies || []).map(Decode.struct),
	};
};

export const ObjectSubscribeIds = (response: any) => {
	return {
		records: (response.records || []).map(Decode.struct),
		dependencies: (response.dependencies || []).map(Decode.struct),
	};
};

export const ObjectGraph = (response: any) => {
	const nodes = (response.nodes || []).map(Decode.struct).map((it: any) => S.Detail.mapper(it));
	const edgesRaw = response.edges || [];
	const seen = new Set<string>();
	const edgeMap = new Map<string, any>();
	const edges: any[] = [];

	for (let i = 0; i < edgesRaw.length; i++) {
		const edge = Mapper.From.GraphEdge(edgesRaw[i]);

		if (edge.source == edge.target) {
			continue;
		};

		const key = `${edge.source}-${edge.target}`;
		const reverseKey = `${edge.target}-${edge.source}`;

		// Check if reverse already added
		if (edgeMap.has(reverseKey)) {
			const reverse = edgeMap.get(reverseKey);

			reverse.isDouble = true;
			reverse.types = [reverse.type, edge.type];
			edgeMap.delete(reverseKey);
			continue;
		};

		if (!seen.has(key)) {
			seen.add(key);
			edgeMap.set(key, edge);
			edges.push(edge);
		};
	};

	return { edges, nodes };
};

export const ObjectShareByLink = (response: any) => {
	return {
		link: response.link,
	};
};

export const ObjectListDuplicate = (response: any) => {
	return {
		ids: response.ids || [],
	};
};

export const ObjectUndo = (response: any) => {
	return {
		blockId: response.blockId,
		range: Mapper.From.Range(response.range || {}),
	};
};

export const ObjectRedo = (response: any) => {
	return {
		blockId: response.blockId,
		range: Mapper.From.Range(response.range || {}),
	};
};

export const ObjectChatAdd = (response: any) => {
	return {
		chatId: response.chatId,
	};
};

export const ObjectAddDiscussion = (response: any) => {
	return {
		discussionId: response.discussionId,
	};
};

export const ObjectDateByTimestamp = (response: any) => {
	return {
		details: details(response),
	};
};

export const BlockCreate = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const BlockCreateWidget = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const BlockTableCreate = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const BlockSplit = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const BlockCopy = (response: any) => {
	return {
		textSlot: response.textSlot,
		htmlSlot: response.htmlSlot,
		anySlot: response.anySlot || [],
	};
};

export const BlockCut = (response: any) => {
	return {
		textSlot: response.textSlot,
		htmlSlot: response.htmlSlot,
		anySlot: response.anySlot || [],
	};
};

export const BlockPaste = (response: any) => {
	return {
		blockIds: response.blockIds || [],
		caretPosition: response.caretPosition,
		isSameBlockCaret: response.isSameBlockCaret,
	};
};

export const BlockListDuplicate = (response: any) => {
	return {
		blockIds: response.blockIds || [],
	};
};

export const BlockListConvertToObjects = (response: any) => {
	return {
		linkIds: response.linkIds || [],
	};
};

export const BlockPreview = (response: any) => {
	return {
		blocks: (response.blocks || []).map(Mapper.From.Block),
	};
};

export const BlockDataviewCreateFromExistingObject = (response: any) => {
	return {
		blockId: response.blockId,
		targetObjectId: response.targetObjectId,
		views: (response.view || []).map(Mapper.From.View),
	};
};

export const BlockDataviewViewCreate = (response: any) => {
	return {
		viewId: response.viewId,
	};
};

export const BlockDataviewFilterAdd = (response: any) => {
	return {
		filterId: response.filterId,
	};
};

export const BlockLinkCreateWithObject = (response: any) => {
	return {
		blockId: response.blockId,
		targetId: response.targetId,
		details: details(response),
	};
};

export const BlockBookmarkCreateAndFetch = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const BlockFileCreateAndUpload = (response: any) => {
	return {
		blockId: response.blockId,
	};
};

export const HistoryGetVersions = (response: any) => {
	return {
		versions: (response.versions || []).map(Mapper.From.HistoryVersion),
	};
};

export const HistoryShowVersion = (response: any) => {
	return {
		version: response.version ? Mapper.From.HistoryVersion(response.version) : null,
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const HistoryDiffVersions = (response: any) => {
	return {
		events: (response.historyEvents || []).map((it: any) => {
			const { type, data } = Mapper.Event.Data(it);
			const mapped = Mapper.Event[type] ? Mapper.Event[type](data) : null;

			return mapped ? { spaceId: it.spaceId, type, data: mapped } : null;
		}).filter((it: any) => it),
	};
};

export const ObjectTypeListConflictingRelations = (response: any) => {
	return {
		conflictRelationIds: response.relationIds || [],
	};
};

export const ObjectTypeSetOrder = (response: any) => {
	return {
		list: response.orderIds || [],
	};
};

export const NavigationGetObjectInfoWithLinks = (response: any) => {
	const object = response.object || {};
	const links = object.links || {};

	return {
		object: {
			id: object.id,
			info: Mapper.From.ObjectInfo(object.info || {}),
			links: {
				inbound: (links.inbound || []).map(Mapper.From.ObjectInfo),
				outbound: (links.outbound || []).map(Mapper.From.ObjectInfo),
			},
		},
	};
};

export const TemplateCreateFromObject = (response: any) => {
	return {
		id: response.id,
	};
};

export const WorkspaceCreate = (response: any) => {
	return {
		objectId: response.spaceId,
		startingId: response.startingObjectId,
	};
};

export const WorkspaceOpen = (response: any) => {
	return {
		info: Mapper.From.AccountInfo(response.info || {}),
	};
};

export const WorkspaceObjectAdd = (response: any) => {
	return {
		objectId: response.objectId,
		details: details(response),
	};
};

export const UnsplashSearch = (response: any) => {
	return {
		pictures: (response.pictures || []).map(Mapper.From.UnsplashPicture),
	};
};

export const UnsplashDownload = (response: any) => {
	return {
		objectId: response.objectId,
	};
};

export const GalleryDownloadIndex = (response: any) => {
	return {
		categories: (response.categories || []).map((it: any) => {
			return {
				id: it.id,
				icon: it.icon,
				list: it.experiences || [],
			};
		}),
		list: (response.experiences || []).map(Mapper.From.Manifest),
	};
};

export const GalleryDownloadManifest = (response: any) => {
	return {
		info: Mapper.From.Manifest(response.info || {}),
	};
};

export const NotificationList = (response: any) => {
	return {
		list: (response.notifications || []).map(Mapper.From.Notification),
	};
};

export const MembershipCodeGetInfo = (response: any) => {
	return {
		tier: response.requestedTier,
	};
};

export const MembershipV2GetPortalLink = (response: any) => {
	return {
		url: response.url,
	};
};

export const MembershipV2GetProducts = (response: any) => {
	return {
		products: (response.products || []).map(Mapper.From.MembershipProduct),
	};
};

export const MembershipV2GetStatus = (response: any) => {
	return {
		data: Mapper.From.MembershipData(response.data || {}),
	};
};

export const SpaceInviteGenerate = (response: any) => {
	return {
		inviteCid: response.inviteCid,
		inviteKey: response.inviteFileKey,
	};
};

export const SpaceInviteGetCurrent = (response: any) => {
	return {
		inviteCid: response.inviteCid,
		inviteKey: response.inviteFileKey,
		inviteType: response.inviteType,
		permissions: response.permissions,
	};
};

export const SpaceInviteView = (response: any) => {
	return {
		spaceId: response.spaceId,
		spaceName: response.spaceName,
		iconImage: response.spaceIconCid,
		creatorName: response.creatorName,
		creatorIcon: response.creatorIconCid,
		inviteType: response.inviteType,
		iconOption: response.spaceIconOption,
		spaceType: response.spaceType,
	};
};

export const SpaceSetOrder = (response: any) => {
	return {
		list: response.spaceViewOrder || [],
	};
};

export const DeviceList = (response: any) => {
	return {
		devices: (response.devices || []).map((it: any) => Mapper.From.DeviceInfo(it)),
	};
};

export const ChatGetMessages = (response: any) => {
	return {
		messages: (response.messages || []).map(Mapper.From.ChatMessage),
		state: Mapper.From.ChatState(response.chatState || {}),
	};
};

export const ChatGetMessagesByIds = (response: any) => {
	return {
		messages: (response.messages || []).map(Mapper.From.ChatMessage),
	};
};

export const ChatSubscribeLastMessages = (response: any) => {
	return {
		messages: (response.messages || []).map(Mapper.From.ChatMessage),
		state: Mapper.From.ChatState(response.chatState || {}),
	};
};

export const ChatAddMessage = (response: any) => {
	return {
		messageId: response.messageId,
	};
};

export const ChatSubscribeToMessagePreviews = (response: any) => {
	return {
		previews: (response.previews || []).map(Mapper.From.ChatPreview),
	};
};

export const ChatSearch = (response: any) => {
	return {
		list: (response.results || []).map(Mapper.From.ChatSearchResult),
	};
};

export const ChatGetPinnedMessages = (response: any) => {
	return {
		messages: (response.messages || []).map(Mapper.From.ChatMessage),
	};
};

export const RelationListWithValue = (response: any) => {
	return {
		relations: (response.list || []).map((it: any) => {
			return {
				relationKey: it.relationKey,
				counter: it.counter,
			};
		}),
	};
};

export const RelationOptionSetOrder = (response: any) => {
	return {
		list: response.relationOptionOrder || [],
	};
};

export const PublishingCreate = (response: any) => {
	return {
		url: response.uri,
	};
};

export const PublishingList = (response: any) => {
	return {
		list: (response.publishes || []).map(Mapper.From.PublishState),
	};
};

export const PublishingResolveUri = (response: any) => {
	return {
		state: response.publish ? Mapper.From.PublishState(response.publish) : null,
	};
};

export const PublishingGetStatus = (response: any) => {
	return {
		state: response.publish ? Mapper.From.PublishState(response.publish) : null,
	};
};

export const ObjectImportUseCase = (response: any) => {
	return {
		startingId: response.startingObjectId,
	};
};
