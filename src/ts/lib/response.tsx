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
		linkPreview: response.getLinkpreview(),
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
		account: response.getAccount(),
	};
};

const AccountRecover = (response: any) => {
	return {};
};

const AccountSelect = (response: any) => {
	return {
		account: response.getAccount(),
	};
};

const AccountStop = (response: any) => {
	return {};
};

const ExternalDropFiles = (response: any) => {
	return {};
};

/*

const NavigationListPages = (response: any) => {
};

const NavigationGetPageInfoWithLinks = (response: any) => {
};

const BlockGetPublicWebURL = (response: any) => {
};

const BlockOpen = (response: any) => {
};
*/

const BlockOpenBreadcrumbs = (response: any) => {
	return {
		blockId: response.getBlockid(),
	};
};

const BlockSetBreadcrumbs = (response: any) => {
	return {};
};

/*

const BlockClose = (response: any) => {
};

const BlockUndo = (response: any) => {
};

const BlockRedo = (response: any) => {
};

const BlockCreate = (response: any) => {
};

const BlockCreatePage = (response: any) => {
};

const BlockUnlink = (response: any) => {
};

const BlockSetTextText = (response: any) => {
};

const BlockSetTextChecked = (response: any) => {
};

const BlockSetFields = (response: any) => {
};

const BlockSetDetails = (response: any) => {
};

const BlockMerge = (response: any) => {
};

const BlockSplit = (response: any) => {
};

const BlockBookmarkFetch = (response: any) => {
};

const BlockBookmarkCreateAndFetch = (response: any) => {
};

const BlockUpload = (response: any) => {
};

const BlockFileCreateAndUpload = (response: any) => {
};

const BlockCopy = (response: any) => {
};

const BlockCut = (response: any) => {
};

const BlockExportPrint = (response: any) => {
};

const BlockPaste = (response: any) => {
};

const BlockImportMarkdown = (response: any) => {
};

const BlockListMove = (response: any) => {
};

const BlockListMoveToNewPage = (response: any) => {
};

const BlockListConvertChildrenToPages = (response: any) => {
};

const BlockListDuplicate = (response: any) => {
};

const BlockListSetTextStyle = (response: any) => {
};

const BlockListSetDivStyle = (response: any) => {
};

const BlockListSetTextColor = (response: any) => {
};

const BlockListSetTextMark = (response: any) => {
};

const BlockListSetFields = (response: any) => {
};

const BlockListSetBackgroundColor = (response: any) => {
};

const BlockListSetAlign = (response: any) => {
};

const BlockListSetPageIsArchived = (response: any) => {
};

const BlockListDeletePage = (response: any) => {
};

const BlockCreateDataviewView = (response: any) => {
};

const BlockSetDataviewView = (response: any) => {
};

const BlockSetDataviewActiveView = (response: any) => {
};
*/

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

	/*

	NavigationListPages,
	NavigationGetPageInfoWithLinks,

	BlockGetPublicWebURL,
	BlockOpen,
	*/
	BlockOpenBreadcrumbs,
	BlockSetBreadcrumbs,
	/*
	BlockClose,
	BlockUndo,
	BlockRedo,
	BlockUnlink,
	BlockMerge,
	BlockSplit,
	BlockBookmarkFetch,
	BlockBookmarkCreateAndFetch,
	BlockUpload,
	BlockFileCreateAndUpload,
	BlockCopy,
	BlockCut,
	BlockExportPrint,
	BlockPaste,
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

	BlockListMove,
	BlockListMoveToNewPage,
	BlockListConvertChildrenToPages,
	BlockListDuplicate,
	BlockListSetBackgroundColor,
	BlockListSetTextColor,
	BlockListSetTextStyle,
	BlockListSetTextMark,
	BlockListSetDivStyle,
	BlockListSetFields,
	BlockListSetAlign,
	BlockListSetPageIsArchived,
	BlockListDeletePage,
	*/
};
