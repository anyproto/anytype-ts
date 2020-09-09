import { Mapper } from 'ts/lib';

const VersionGet = (response: any) => {
	return {};
};

const ImageGetBlob = (response: any) => {
	return {
		blob: response.getBlob(),
	};
};

const ConfigGet = (response: any) => {
	return {
		homeBlockId: response.getHomeblockid(),
		archiveBlockId: response.getArchiveblockid(),
		profileBlockId: response.getProfileblockid(),
		gatewayUrl: response.getGatewayurl(),
	};
};

const Shutdown = () => {
	return {};
};

const LinkPreview = (response: any) => {
	return {
		linkPreview: response.hasLinkpreview() ? Mapper.From.LinkPreview(response.getLinkpreview()) : {},
	};
};

const UploadFile = (response: any) => {
	return {
		hash: response.getHash(),
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

const AccountCreate = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

const AccountRecover = (response: any) => {
	return {};
};

const AccountSelect = (response: any) => {
	return {
		account: Mapper.From.Account(response.getAccount()),
	};
};

const AccountStop = (response: any) => {
	return {};
};

const ExternalDropFiles = (response: any) => {
	return {};
};

const NavigationListPages = (response: any) => {
	return {
		pages: (response.getPagesList() || []).map(Mapper.From.PageInfo),
	};
};

const NavigationGetPageInfoWithLinks = (response: any) => {
	const page = response.getPage();
	const links = page.getLinks();
	return {
		page: {
			id: page.getId(),
			info: Mapper.From.PageInfo(page.getInfo()),
			links: {
				inbound: (links.getInboundList() || []).map(Mapper.From.PageInfo),
				outbound: (links.getOutboundList() || []).map(Mapper.From.PageInfo),
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

const BlockBookmarkFetch = (response: any) => {
	return {};
};

const BlockBookmarkCreateAndFetch = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockUpload = (response: any) => {
	return {};
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

const BlockListSetPageIsArchived = (response: any) => {
	return {};
};

const BlockListDeletePage = (response: any) => {
	return {};
};

const BlockCreateDataviewView = (response: any) => {
	return {
		viewId: response.getViewid(),
	};
};

const BlockSetDataviewView = (response: any) => {
	return {};
};

const BlockSetDataviewActiveView = (response: any) => {
	return {};
};

const BlockCreateDataviewRecord = (response: any) => {
	return {
		record: Mapper.From.Record(response.getRecord()),
	};
};

const BlockUpdateDataviewRecord = (response: any) => {
	return {};
};

const BlockDeleteDataviewRecord = (response: any) => {
	return {};
};

export {
	VersionGet,

	ImageGetBlob,
	ConfigGet,
	Shutdown,
	UploadFile,
	ProcessCancel,
	LinkPreview,

	WalletCreate,
	WalletRecover,

	AccountCreate,
	AccountRecover,
	AccountSelect,
	AccountStop,

	ExternalDropFiles,

	NavigationListPages,
	NavigationGetPageInfoWithLinks,

	BlockGetPublicWebURL,

	BlockOpen,
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

	BlockFileCreateAndUpload,
	BlockUpload,
	BlockBookmarkFetch,
	BlockBookmarkCreateAndFetch,
	
	BlockImportMarkdown,

	BlockCreate,
	BlockCreatePage,
	BlockCreateDataviewView,

	BlockSetTextText,
	BlockSetTextChecked,
	BlockSetFields,
	BlockSetDetails,
	
	BlockSetDataviewView,
	BlockSetDataviewActiveView,

	BlockCreateDataviewRecord,
	BlockUpdateDataviewRecord,
	BlockDeleteDataviewRecord,

	BlockListMove,
	BlockListMoveToNewPage,
	BlockListDuplicate,
	BlockListConvertChildrenToPages,
	BlockListSetPageIsArchived,

	BlockListSetBackgroundColor,
	BlockListSetTextColor,
	BlockListSetTextStyle,
	BlockListSetTextMark,
	BlockListSetDivStyle,
	BlockListSetFields,
	BlockListSetAlign,
	BlockListDeletePage,

};
