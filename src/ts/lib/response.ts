import { Mapper, Decode } from 'Lib';

const DebugSync = (response: any) => {
	return response.toObject();
};

const Export = (response: any) => {
	return {
		path: response.getPath(),
	};
};

const FileListOffload = (response: any) => {
	return {
		files: response.getFilesoffloaded(),
		bytes: response.getBytesoffloaded(),
	};
};

const LinkPreview = (response: any) => {
	return {
		previewLink: response.hasLinkpreview() ? Mapper.From.PreviewLink(response.getLinkpreview()) : {},
	};
};

const FileUpload = (response: any) => {
	return {
		hash: response.getHash(),
	};
};

const FileDownload = (response: any) => {
	return {
		path: response.getLocalpath(),
	};
};

const WalletCreate = (response: any) => {
	return {
		mnemonic: response.getMnemonic(),
	};
};

const WalletConvert = (response: any) => {
	return {
		mnemonic: response.getMnemonic(),
		entropy: response.getEntropy(),
	};
};

const WalletCreateSession = (response: any) => {
	return {
		token: response.getToken(),
	};
};

const AccountCreate = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

const AccountSelect = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

const AccountDelete = (response: any) => {
	return {
		status: response.hasStatus() ? Mapper.From.AccountStatus(response.getStatus()) : null,
	};
};

const AccountRecoverFromLegacyExport = (response: any) => {
	return {
		address: response.getAddress(),
	};
};

const ObjectCreate = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectCreateSet = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectCreateBookmark = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectCreateObjectType = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectCreateRelation = (response: any) => {
	return {
		objectId: response.getObjectid(),
		relationKey: response.getKey(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectCreateRelationOption = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const ObjectOpen = (response: any) => {
	return {
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

const ObjectShow = (response: any) => {
	return {
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

const NavigationGetObjectInfoWithLinks = (response: any) => {
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

const BlockCreate = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockDataviewCreateFromExistingObject = (response: any) => {
	return {
		blockId: response.getBlockid(),
		targetObjectId: response.getTargetobjectid(),
		views: (response.getViewList() || []).map(Mapper.From.View),
	};
};

const BlockLinkCreateWithObject = (response: any) => {
	return {
		blockId: response.getBlockid(),
		targetId: response.getTargetid(),
	};
};

const BlockSplit = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockBookmarkCreateAndFetch = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockFileCreateAndUpload = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockCopy = (response: any) => {
	return {
		textSlot: response.getTextslot(),
		htmlSlot: response.getHtmlslot(),
		anySlot: response.getAnyslotList(),
	};
};

const BlockCut = (response: any) => {
	return {
		textSlot: response.getTextslot(),
		htmlSlot: response.getHtmlslot(),
		anySlot: response.getAnyslotList(),
	};
};

const BlockPaste = (response: any) => {
	return {
		blockIds: response.getBlockidsList(),
		caretPosition: response.getCaretposition(),
		isSameBlockCaret: response.getIssameblockcaret(),
	};
};

const ObjectImportList = (response: any) => {
	return {
		list: (response.getResponseList() || []).map(it => { 
			return { type: it.getType() };
		}),
	};
};

const BlockListDuplicate = (response: any) => {
	return {
		blockIds: response.getBlockidsList(),
	};
};

const BlockListConvertToObjects = (response: any) => {
	return {
		linkIds: response.getLinkidsList(),
	};
};

const BlockDataviewViewCreate = (response: any) => {
	return {
		viewId: response.getViewid(),
	};
};

const HistoryGetVersions = (response: any) => {
	return {
		versions: (response.getVersionsList() || []).map(Mapper.From.HistoryVersion),
	};
};

const HistoryShowVersion = (response: any) => {
	const version = response.getVersion();
	return {
		version: version ? Mapper.From.HistoryVersion(response.getVersion()) : null,
		objectView: Mapper.From.ObjectView(response.getObjectview()),
	};
};

const ObjectSearch = (response: any) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.decodeStruct),
	};
};

const ObjectGroupsSubscribe = (response: any) => {
	return {
		subId: response.getSubid(),
		groups: (response.getGroupsList() || []).map(Mapper.From.BoardGroup),
	};
};

const ObjectSearchSubscribe = (response: any) => {
	const counters = response.getCounters();
	return {
		counters: {
			total: counters.getTotal(),
			nextCount: counters.getNextcount(),
			prevCount: counters.getPrevcount(),
		},
		records: (response.getRecordsList() || []).map(Decode.decodeStruct),
		dependencies: (response.getDependenciesList() || []).map(Decode.decodeStruct),
	};
};

const ObjectSubscribeIds = (response: any) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.decodeStruct),
		dependencies: (response.getDependenciesList() || []).map(Decode.decodeStruct),
	};
};

const ObjectGraph = (response: any) => {
	return {
		edges: (response.getEdgesList() || []).map(Mapper.From.GraphEdge),
		nodes: (response.getNodesList() || []).map(Decode.decodeStruct),
	};
};

const ObjectToSet = (response: any) => {
	return {
		objectId: response.getSetid(),
	};
};

const ObjectToCollection = (response: any) => {
	return {
		objectId: response.getCollectionid(),
	};
};

const ObjectToBookmark = (response: any) => {
	return {
		objectId: response.getObjectid(),
	};
};

const ObjectShareByLink = (response: any) => {
	return {
		link: response.getLink(),
	};
};

const ObjectListDuplicate = (response: any) => {
	return {
		ids: response.getIdsList(),
	};
};

const TemplateCreateFromObject = (response: any) => {
	return {
		id: response.getId(),
	};
};

const TemplateCreateFromObjectType = (response: any) => {
	return {
		id: response.getId(),
	};
};

const TemplateClone = (response: any) => {
	return {
		id: response.getId(),
	};
};

const WorkspaceCreate = (response: any) => {
	return {
		id: response.getWorkspaceid(),
	};
};

const WorkspaceObjectAdd = (response: any) => {
	return {
		objectId: response.getObjectid(),
		details: Decode.decodeStruct(response.getDetails()),
	};
};

const UnsplashSearch = (response: any) => {
	return {
		pictures: (response.getPicturesList() || []).map(Mapper.From.UnsplashPicture),
	};
};

const UnsplashDownload = (response: any) => {
	return {
		hash: response.getHash(),
	};
};

export {
	DebugSync,

	Export,
	FileUpload,
	FileDownload,
	LinkPreview,
	FileListOffload,

	WalletCreate,
	WalletConvert,
	WalletCreateSession,

	AccountCreate,
	AccountSelect,
	AccountDelete,
	AccountRecoverFromLegacyExport,

	ObjectCreate,
	ObjectCreateSet,
	ObjectCreateBookmark,
	ObjectCreateObjectType,
	ObjectCreateRelation,
	ObjectCreateRelationOption,

	ObjectSearch,
	ObjectSearchSubscribe,
	ObjectGroupsSubscribe,
	ObjectSubscribeIds,
	ObjectGraph,

	ObjectToSet,
	ObjectToCollection,
	ObjectShareByLink,
	ObjectToBookmark,

	ObjectListDuplicate,

	NavigationGetObjectInfoWithLinks,

	ObjectOpen,
	ObjectShow,
	ObjectImportList,
	
	BlockSplit,
	BlockCopy,
	BlockCut,
	BlockPaste,

	BlockFileCreateAndUpload,
	BlockBookmarkCreateAndFetch,
	BlockLinkCreateWithObject,
	
	BlockCreate,

	BlockDataviewCreateFromExistingObject,
	BlockDataviewViewCreate,

	BlockListDuplicate,
	BlockListConvertToObjects,

	HistoryGetVersions,
	HistoryShowVersion,

	TemplateCreateFromObject,
	TemplateCreateFromObjectType,
	TemplateClone,

	WorkspaceCreate,
	WorkspaceObjectAdd,

	UnsplashSearch,
	UnsplashDownload,
};
