import * as I from 'Interface';

// Menu data interfaces — one per menu component
// Menus not yet typed default to Record<string, any> via MenuDataMap fallback

export interface MenuSearchObjectData {
	filter?: string;
	rootId?: string;
	type?: string;
	blockId?: string;
	blockIds?: string[];
	position?: I.BlockPosition;
	onSelect?: (...args: any[]) => void;
	noClose?: boolean;
	route?: string;
	onBackspaceClose?: () => void;
	onFilterChange?: (v: string) => void;
	[key: string]: any;
};

export interface MenuSearchTextData {
	route?: string;
	isPopup?: boolean;
	[key: string]: any;
};

export interface MenuSearchChatData {
	chatId?: string;
	route?: string;
	scrollToMessage?: (id: string) => void;
	[key: string]: any;
};

export interface MenuSelectData {
	filter?: string;
	options?: I.Option[];
	value?: any;
	noFilter?: boolean;
	noClose?: boolean;
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuSmileData {
	noHead?: boolean;
	noRemove?: boolean;
	value?: string;
	onSelect?: (...args: any[]) => void;
	onIconSelect?: (...args: any[]) => void;
	onUpload?: (...args: any[]) => void;
	noGallery?: boolean;
	noUpload?: boolean;
	withIcons?: boolean;
	[key: string]: any;
};

export interface MenuSmileSkinData {
	smileId?: string;
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuSmileColorData {
	itemId?: string;
	isEmoji?: boolean;
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuCalendarData {
	value?: number;
	isEmpty?: boolean;
	relationKey?: string;
	canEdit?: boolean;
	canClear?: boolean;
	noKeyboard?: boolean;
	getDotMap?: (...args: any[]) => any;
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuCalendarDayData {
	y?: number;
	m?: number;
	d?: number;
	hideIcon?: boolean;
	className?: string;
	fromWidget?: boolean;
	relationKey?: string;
	load?: (...args: any[]) => void;
	onCreate?: (...args: any[]) => void;
	readonly?: boolean;
	[key: string]: any;
};

export interface MenuBlockAddData {
	rootId?: string;
	blockId?: string;
	onSelect?: (...args: any[]) => void;
	blockCreate?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockActionData {
	rootId?: string;
	blockId?: string;
	blockIds?: string[];
	blockRemove?: () => void;
	range?: I.TextRange;
	filter?: string;
	[key: string]: any;
};

export interface MenuBlockContextData {
	blockId?: string;
	rootId?: string;
	blockIds?: string[];
	marks?: I.Mark[];
	isInsideTable?: boolean;
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockStyleData {
	rootId?: string;
	blockId?: string;
	blockIds?: string[];
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockColorData {
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockBackgroundData {
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockAlignData {
	rootId?: string;
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockLinkData {
	type?: I.MarkType | string;
	onChange?: (...args: any[]) => void;
	filter?: string;
	onClear?: (...args: any[]) => void;
	skipIds?: string[];
	[key: string]: any;
};

export interface MenuBlockMentionData {
	pronounId?: string;
	withCaption?: boolean;
	canAdd?: boolean;
	skipIds?: string[];
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockCoverData {
	rootId?: string;
	onSelect?: (...args: any[]) => void;
	onUpload?: (...args: any[]) => void;
	onUploadStart?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockMediaData {
	rootId?: string;
	blockId?: string;
	type?: number;
	[key: string]: any;
};

export interface MenuBlockEmojiData {
	onChange?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuBlockLayoutData {
	rootId?: string;
	value?: I.ObjectLayout;
	isPopup?: boolean;
	[key: string]: any;
};

export interface MenuBlockLatexData {
	onSelect?: (...args: any[]) => void;
	isTemplate?: boolean;
	[key: string]: any;
};

export interface MenuBlockLinkSettingsData {
	rootId?: string;
	blockId?: string;
	blockIds?: string[];
	[key: string]: any;
};

export interface MenuChatTextData {
	rootId?: string;
	blockId?: string;
	marks?: I.Mark[];
	range?: I.TextRange;
	onTextButtonToggle?: (...args: any[]) => void;
	removeBookmark?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuCommentToolbarData {
	onToggleFormat?: (...args: any[]) => void;
	onBlockStyle?: (...args: any[]) => void;
	onLink?: (...args: any[]) => void;
	getActiveFormats?: () => any;
	getBlockStyle?: () => any;
	[key: string]: any;
};

export interface MenuObjectData {
	blockId?: string;
	rootId?: string;
	isFilePreview?: boolean;
	onSelect?: (...args: any[]) => void;
	onArchive?: () => void;
	onDelete?: () => void;
	[key: string]: any;
};

export interface MenuWidgetData {
	blockId?: string;
	isPreview?: boolean;
	target?: any;
	[key: string]: any;
};

export interface MenuWidgetSectionData {
	readonly?: boolean;
	[key: string]: any;
};

export interface MenuRelationSuggestData {
	filter?: string;
	blockId?: string;
	noFilter?: boolean;
	skipCreate?: boolean;
	rootId?: string;
	menuIdEdit?: string;
	addCommand?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuTypeSuggestData {
	noFilter?: boolean;
	skipIds?: string[];
	onMore?: (...args: any[]) => void;
	onClick?: (...args: any[]) => void;
	canAdd?: boolean;
	noClose?: boolean;
	filter?: string;
	[key: string]: any;
};

export interface MenuGraphSettingsData {
	storageKey?: string;
	allowLocal?: boolean;
	[key: string]: any;
};

export interface MenuTableOfContentsData {
	rootId?: string;
	isPopup?: boolean;
	blockId?: string;
	[key: string]: any;
};

export interface MenuSyncStatusInfoData {
	title?: string;
	message?: string;
	[key: string]: any;
};

export interface MenuPreviewLatexData {
	text?: string;
	example?: boolean;
	[key: string]: any;
};

export interface MenuPreviewObjectData {
	rootId?: string;
	[key: string]: any;
};

export interface MenuPublishData {
	rootId?: string;
	[key: string]: any;
};

export interface MenuDataviewRelationListData {
	rootId?: string;
	blockId?: string;
	readonly?: boolean;
	getView?: () => any;
	onAdd?: () => void;
	[key: string]: any;
};

export interface MenuDataviewSortData {
	rootId?: string;
	blockId?: string;
	getView?: () => any;
	onSortAdd?: (...args: any[]) => void;
	isInline?: boolean;
	getTarget?: () => any;
	readonly?: boolean;
	closeFilters?: (...args: any[]) => void;
	loadData?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuDataviewFilterListData {
	rootId?: string;
	blockId?: string;
	getView?: () => any;
	loadData?: (...args: any[]) => void;
	isInline?: boolean;
	getTarget?: () => any;
	readonly?: boolean;
	closeFilters?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuDataviewTemplateListData {
	activeId?: string;
	typeId?: string;
	fromBanner?: boolean;
	noAdd?: boolean;
	onSelect?: (...args: any[]) => void;
	getView?: () => any;
	onSetDefault?: (...args: any[]) => void;
	route?: string;
	[key: string]: any;
};

export interface MenuDataviewTextData {
	value?: string;
	placeholder?: string;
	canEdit?: boolean;
	noResize?: boolean;
	cellId?: string;
	onChange?: (...args: any[]) => void;
	relationKey?: string;
	actions?: any[];
	onSelect?: (...args: any[]) => void;
	[key: string]: any;
};

export interface MenuDataviewSourceData {
	readonly?: boolean;
	rootId?: string;
	objectId?: string;
	[key: string]: any;
};

// Map of menu IDs to their data types
export interface MenuDataMap {
	searchObject: MenuSearchObjectData;
	searchText: MenuSearchTextData;
	searchChat: MenuSearchChatData;
	select: MenuSelectData;
	smile: MenuSmileData;
	smileColor: MenuSmileColorData;
	calendar: MenuCalendarData;
	calendarDay: MenuCalendarDayData;
	blockAdd: MenuBlockAddData;
	blockAction: MenuBlockActionData;
	blockContext: MenuBlockContextData;
	blockStyle: MenuBlockStyleData;
	blockColor: MenuBlockColorData;
	blockBackground: MenuBlockBackgroundData;
	blockAlign: MenuBlockAlignData;
	blockLink: MenuBlockLinkData;
	blockMention: MenuBlockMentionData;
	blockCover: MenuBlockCoverData;
	blockMedia: MenuBlockMediaData;
	blockEmoji: MenuBlockEmojiData;
	blockLayout: MenuBlockLayoutData;
	blockLatex: MenuBlockLatexData;
	blockLinkSettings: MenuBlockLinkSettingsData;
	chatText: MenuChatTextData;
	commentToolbar: MenuCommentToolbarData;
	object: MenuObjectData;
	widget: MenuWidgetData;
	widgetSection: MenuWidgetSectionData;
	relationSuggest: MenuRelationSuggestData;
	typeSuggest: MenuTypeSuggestData;
	graphSettings: MenuGraphSettingsData;
	tableOfContents: MenuTableOfContentsData;
	syncStatusInfo: MenuSyncStatusInfoData;
	previewLatex: MenuPreviewLatexData;
	previewObject: MenuPreviewObjectData;
	publish: MenuPublishData;
	dataviewRelationList: MenuDataviewRelationListData;
	dataviewSort: MenuDataviewSortData;
	dataviewFilterList: MenuDataviewFilterListData;
	dataviewTemplateList: MenuDataviewTemplateListData;
	dataviewText: MenuDataviewTextData;
	dataviewSource: MenuDataviewSourceData;
	[key: string]: Record<string, any>;
};
