import { Mapper, Decode } from 'ts/lib';

const VersionGet = (response: any) => {
	return {};
};

const DebugSync = (response: any) => {
	return response.toObject();
};

const ConfigGet = (response: any) => {
	return {
		homeBlockId: response.getHomeblockid(),
		profileBlockId: response.getProfileblockid(),
		gatewayUrl: response.getGatewayurl(),
		marketplaceTypeId: response.getMarketplacetypeid(),
		marketplaceTemplateId: response.getMarketplacetemplateid(),
		marketplaceRelationId: response.getMarketplacerelationid(),
	};
};

const Shutdown = () => {
	return {};
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

const UploadFile = (response: any) => {
	return {
		hash: response.getHash(),
	};
};

const DownloadFile = (response: any) => {
	return {
		path: response.getLocalpath(),
	};
};

const ProcessCancel = (response: any) => {
	return {};
};

const WalletCreate = (response: any) => {
	return {
		mnemonic: response.getMnemonic(),
	};
};

const WalletRecover = (response: any) => {
	return {};
};

const WalletConvert = (response: any) => {
	return {
		mnemonic: response.getMnemonic(),
		entropy: response.getEntropy(),
	};
};

const AccountCreate = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
		config: response.hasConfig() ? Mapper.From.AccountConfig(response.getConfig()) : null,
	};
};

const AccountRecover = (response: any) => {
	return {};
};

const AccountSelect = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
		config: response.hasConfig() ? Mapper.From.AccountConfig(response.getConfig()) : null,
	};
};

const AccountStop = (response: any) => {
	return {};
};

const ExternalDropFiles = (response: any) => {
	return {};
};

const PageCreate = (response: any) => {
	return {
		pageId: response.getPageid(),
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

const BlockGetPublicWebURL = (response: any) => {
	return {
		url: response.getUrl(),
	};
};

const BlockOpen = (response: any) => {
	return {};
};

const BlockShow = (response: any) => {
	return {};
}

const ObjectShow = (response: any) => {
	return {
		rootId: response.getRootid(),
		blocks: (response.getBlocksList() || []).map(Mapper.From.Block),
		details: (response.getDetailsList() || []).map(Mapper.From.Details),
		objectTypes: (response.getObjecttypesList() || []).map(Mapper.From.ObjectType),
		relations: (response.getRelationsList() || []).map(Mapper.From.Relation),
		restrictions: Mapper.From.Restrictions(response.getRestrictions()),
	};
};

const BlockOpenBreadcrumbs = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockSetBreadcrumbs = (response: any) => {
	return {};
};

const BlockClose = (response: any) => {
	return {};
};

const BlockUndo = (response: any) => {
	return {};
};

const BlockRedo = (response: any) => {
	return {};
};

const BlockCreate = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockCreatePage = (response: any) => {
	return {
		blockId: response.getBlockid(),
		targetId: response.getTargetid(),
	};
};

const BlockCreateSet = (response: any) => {
	return {
		blockId: response.getBlockid(),
		targetId: response.getTargetid(),
	};
};

const BlockUnlink = (response: any) => {
	return {};
};

const BlockSetTextText = (response: any) => {
	return {};
};

const BlockSetTextChecked = (response: any) => {
	return {};
};

const BlockSetFields = (response: any) => {
	return {};
};

const BlockSetDetails = (response: any) => {
	return {};
};

const BlockMerge = (response: any) => {
	return {};
};

const BlockSplit = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockUpload = (response: any) => {
	return {};
};

const BlockBookmarkFetch = (response: any) => {
	return {};
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

const BlockImportMarkdown = (response: any) => {
	return {
		rootLinkIds: response.getRootlinkidsList(),
	};
};

const BlockListMove = (response: any) => {
	return {};
};

const BlockListMoveToNewPage = (response: any) => {
	return {
		linkId: response.getLinkid(),
	};
};

const BlockListDuplicate = (response: any) => {
	return {
		blockIds: response.getBlockidsList(),
	};
};

const BlockListConvertChildrenToPages = (response: any) => {
	return {
		linkIds: response.getLinkidsList(),
	};
};

const BlockListSetTextStyle = (response: any) => {
	return {};
};

const BlockListTurnInto = (response: any) => {
	return {};
};

const BlockListSetDivStyle = (response: any) => {
	return {};
};

const BlockListSetTextColor = (response: any) => {
	return {};
};

const BlockListSetTextMark = (response: any) => {
	return {};
};

const BlockListSetFields = (response: any) => {
	return {};
};

const BlockListSetBackgroundColor = (response: any) => {
	return {};
};

const BlockListSetAlign = (response: any) => {
	return {};
};

const BlockDataviewViewCreate = (response: any) => {
	return {
		viewId: response.getViewid(),
	};
};

const BlockDataviewViewUpdate = (response: any) => {
	return {};
};

const BlockDataviewViewSetActive = (response: any) => {
	return {};
};

const BlockDataviewRecordCreate = (response: any) => {
	return {
		record: Mapper.From.Record(response.getRecord()),
	};
};

const BlockDataviewRecordUpdate = (response: any) => {
	return {};
};

const BlockDataviewRecordDelete = (response: any) => {
	return {};
};

const BlockDataviewRelationAdd = (response: any) => {
	return {
		relationKey: response.getRelationkey(),
	};
};

const BlockDataviewRelationListAvailable = (response: any) => {
	return {
		relations: (response.getRelationsList() || []).map(Mapper.From.Relation),
	};
};

const BlockDataviewRecordRelationOptionAdd = (response: any) => {
	return {
		option: Mapper.From.SelectOption(response.getOption()),
	};
};

const BlockDataviewRecordRelationOptionUpdate = (response: any) => {
	return {};
};

const BlockDataviewRecordRelationOptionDelete = (response: any) => {
	return {};
};

const HistoryVersions = (response: any) => {
	return {
		versions: (response.getVersionsList() || []).map(Mapper.From.HistoryVersion),
	};
};

const HistoryShow = (response: any) => {
	const version = response.getVersion();
	return {
		version: version ? Mapper.From.HistoryVersion(response.getVersion()) : null,
		objectShow: ObjectShow(response.getObjectshow()),
	};
};

const HistorySetVersion = (response: any) => {
	return {};
};

const ObjectTypeList = (response: any) => {
	return {
		objectTypes: (response.getObjecttypesList() || []).map(Mapper.From.ObjectType),
	};
};

const ObjectTypeCreate = (response: any) => {
	return {
		objectType: Mapper.From.ObjectType(response.getObjecttype()),
	};
};

const ObjectTypeRelationAdd = (response: any) => {
	return {
		relations: (response.getRelationsList() || []).map(Mapper.From.Relation),
	};
};

const SetCreate = (response: any) => {
	return {
		id: response.getId(),
	};
};

const ObjectSearch = (response: any) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.decodeStruct),
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

const ObjectIdsSubscribe = (response: any) => {
	return {
		records: (response.getRecordsList() || []).map(Decode.decodeStruct),
		dependencies: (response.getDependenciesList() || []).map(Decode.decodeStruct),
	};
};

const ObjectGraph = (response: any) => {
	return {
		edges: (response.getEdgesList() || []).map(Mapper.From.GraphEdge),
		nodes: (response.getNodesList() || []).map(Mapper.From.GraphNode),
	};
};

const ObjectRelationAdd = (response: any) => {
	return {
		relation: Mapper.From.Relation(response.getRelation()),
	};
};

const ObjectRelationListAvailable = (response: any) => {
	return {
		relations: (response.getRelationsList() || []).map(Mapper.From.Relation),
	};
};

const ObjectRelationOptionAdd = (response: any) => {
	return {
		option: Mapper.From.SelectOption(response.getOption()),
	};
};

const ObjectToSet = (response: any) => {
	return {
		id: response.getSetid(),
	};
};

const ObjectListDelete = (response: any) => {
	return {};
};

const ObjectShareByLink = (response: any) => {
	return {
		link: response.getLink(),
	};
};

const MakeTemplate = (response: any) => {
	return {
		id: response.getId(),
	};
};

const MakeTemplateByObjectType = (response: any) => {
	return {
		id: response.getId(),
	};
};

const CloneTemplate = (response: any) => {
	return {
		id: response.getId(),
	};
};

const WorkspaceCreate = (response: any) => {
	return {
		id: response.getWorkspaceid(),
	};
};

export {
	VersionGet,
	DebugSync,

	ConfigGet,
	Export,
	Shutdown,
	UploadFile,
	DownloadFile,
	ProcessCancel,
	LinkPreview,
	FileListOffload,

	WalletCreate,
	WalletRecover,
	WalletConvert,

	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,

	ExternalDropFiles,

	PageCreate,
	SetCreate,

	NavigationGetObjectInfoWithLinks,

	BlockGetPublicWebURL,

	BlockOpen,
	BlockShow,
	BlockOpenBreadcrumbs,
	BlockSetBreadcrumbs,
	
	BlockUnlink,
	BlockClose,
	BlockUndo,
	BlockRedo,

	BlockMerge,
	BlockSplit,
	BlockCopy,
	BlockCut,
	BlockPaste,
	BlockUpload,

	BlockFileCreateAndUpload,
	BlockBookmarkFetch,
	BlockBookmarkCreateAndFetch,
	
	BlockImportMarkdown,

	BlockCreate,
	BlockCreatePage,
	BlockDataviewViewCreate,
	BlockCreateSet,

	BlockSetTextText,
	BlockSetTextChecked,
	BlockSetFields,
	BlockSetDetails,
	
	BlockDataviewViewUpdate,
	BlockDataviewViewSetActive,

	BlockDataviewRecordCreate,
	BlockDataviewRecordUpdate,
	BlockDataviewRecordDelete,

	BlockDataviewRelationAdd,
	BlockDataviewRelationListAvailable,

	BlockDataviewRecordRelationOptionAdd,
	BlockDataviewRecordRelationOptionUpdate,
	BlockDataviewRecordRelationOptionDelete,

	BlockListMove,
	BlockListMoveToNewPage,
	BlockListDuplicate,
	BlockListConvertChildrenToPages,

	BlockListSetBackgroundColor,
	BlockListSetTextColor,
	BlockListSetTextStyle,
	BlockListTurnInto,
	BlockListSetTextMark,
	BlockListSetDivStyle,
	BlockListSetFields,
	BlockListSetAlign,

	HistoryVersions,
	HistoryShow,
	HistorySetVersion,

	ObjectShow,

	ObjectTypeList,
	ObjectTypeCreate,
	ObjectTypeRelationAdd,

	ObjectSearch,
	ObjectSearchSubscribe,
	ObjectIdsSubscribe,
	ObjectGraph,
	ObjectRelationAdd,
	ObjectRelationListAvailable,
	ObjectRelationOptionAdd,
	ObjectToSet,
	ObjectShareByLink,

	ObjectListDelete,

	MakeTemplate,
	MakeTemplateByObjectType,
	CloneTemplate,

	WorkspaceCreate,
};
