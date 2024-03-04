import { I } from 'Lib';

export interface PageInfo {
	id: string;
	snippet: string;
	details: any;	
	text?: string;
	hasInboundLinks?: boolean;
};

export enum BlockType {
	Empty				 = '',
	Page				 = 'page',
	Dataview			 = 'dataview',
	Layout				 = 'layout',
	Text				 = 'text',
	File				 = 'file',
	Bookmark			 = 'bookmark',
	IconPage			 = 'iconPage',
	IconUser			 = 'iconUser',
	Div					 = 'div',
	Link				 = 'link',
	Cover				 = 'cover',
	Relation			 = 'relation',
	Featured			 = 'featured',
	Type				 = 'type',
	Embed				 = 'latex',
	Table				 = 'table',
	TableColumn			 = 'tableColumn',
	TableRow			 = 'tableRow',
	TableOfContents		 = 'tableOfContents',
	Widget		 		 = 'widget',
};

export enum BlockPosition {
	None		 = 0,
	Top			 = 1,
	Bottom		 = 2,
	Left		 = 3,
	Right		 = 4,
	Inner		 = 5,
	Replace		 = 6,
	InnerFirst	 = 7,
};

export enum BlockSplitMode {
	Bottom		 = 0,
	Top			 = 1,
	Inner		 = 2,
};

export enum BlockHAlign {
	Left		 = 0,
	Center		 = 1,
	Right		 = 2,
};

export enum BlockVAlign {
	Top			 = 0,
	Middle		 = 1,
	Bottom		 = 2,
};

export interface BlockComponent {
	dataset?: I.Dataset;
	rootId?: string;
	traceId?: string;
	block?: I.Block;
	readonly?: boolean;
	isPopup?: boolean;
	isInsideTable?: boolean;
	isInsidePreview?: boolean;
	isSelectionDisabled?: boolean;
	isContextMenuDisabled?: boolean;
	index?: any;
	className?: string;
	setLoading?(v: boolean): void;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any): void;
	onKeyUp?(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange, marks: I.Mark[]): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onPaste?(e: any, props: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onCopy?(e: any, cut: boolean): void;
	onUpdate?(): void;
	getWrapperWidth?(): number;
	blockRemove?(focused?: I.Block): void;
};

export interface BlockStructure {
	parentId: string;
	childrenIds: string[];
};

export interface Block {
	id?: string;
	type: BlockType;
	layout?: I.ObjectLayout;
	parentId?: string;
	fields?: any;
	hAlign?: BlockHAlign;
	vAlign?: BlockVAlign;
	bgColor?: string;
	content: any;
	childrenIds?: string[];
	
	getLength?(): number;
	getTargetObjectId?(): string;
	isSystem?(): boolean;
	isLocked?(): boolean;

	canHaveChildren?(): boolean;
	canHaveAlign?(): boolean;
	canHaveColor?(): boolean;
	canHaveBackground?(): boolean;
	canHaveMarks?(): boolean;
	canTurn?(): boolean;
	canTurnText?(): boolean;
	canTurnPage?(): boolean;
	canTurnList?(): boolean;
	canTurnObject?(): boolean;
	canCreateBlock?(): boolean;
	canBecomeWidget?(): boolean;

	isIndentable?(): boolean;
	isFocusable?(): boolean;
	isSelectable?(): boolean;
	isDraggable?(): boolean;
	isDeletable?(): boolean;

	isPage?(): boolean;
	isObjectPage?(): boolean;
	isObjectHuman?(): boolean;
	isObjectParticipant?(): boolean;
	isObjectTask?(): boolean;
	isObjectNote?(): boolean;
	isObjectSet?(): boolean;
	isObjectFileKind?(): boolean;
	isObjectFile?(): boolean;
	isObjectImage?(): boolean;
	isObjectVideo?(): boolean;
	isObjectAudio?(): boolean;
	isObjectType?(): boolean;
	isObjectRelation?(): boolean;
	isObjectBookmark?(): boolean;
	isObjectDate?(): boolean;

	isFeatured?(): boolean;
	isDataview?(): boolean;
	isRelation?(): boolean;
	isType?(): boolean;

	isWidget?(): boolean;
	isWidgetLink?(): boolean;
	isWidgetList?(): boolean;
	isWidgetTree?(): boolean;
	isWidgetCompact?(): boolean;

	isLayout?(): boolean;
	isLayoutRow?(): boolean;
	isLayoutColumn?(): boolean;
	isLayoutDiv?(): boolean;
	isLayoutHeader?(): boolean;
	isLayoutFooter?(): boolean;
	isLayoutTableRows?(): boolean;
	isLayoutTableColumns?(): boolean;

	isTable?(): boolean;
	isTableColumn?(): boolean;
	isTableRow?(): boolean;

	isBookmark?(): boolean;
	isLink?(): boolean;

	isIcon?(): boolean;
	isIconPage?(): boolean;
	isIconUser?(): boolean;

	isDiv?(): boolean;
	isDivLine?(): boolean;
	isDivDot?(): boolean;

	isFile?(): boolean;
	isFileFile?(): boolean;
	isFileImage?(): boolean;
	isFileVideo?(): boolean;
	isFileAudio?(): boolean;
	isFilePdf?(): boolean;
	isFileStyleLink?(): boolean;
	isFileStyleEmbed?(): boolean;

	isEmbed?(): boolean;
	isEmbedLatex?(): boolean;
	isEmbedKroki?(): boolean;
	isEmbedTelegram?(): boolean;
	isEmbedGithubGist?(): boolean;
	isEmbedSketchfab?(): boolean;
	isEmbedBilibili?(): boolean;

	isText?(): boolean;
	isTextTitle?(): boolean;
	isTextDescription?(): boolean;
	isTextParagraph?(): boolean;
	isTextHeader?(): boolean;
	isTextHeader1?(): boolean;
	isTextHeader2?(): boolean;
	isTextHeader3?(): boolean;
	isTextList?(): boolean;
	isTextToggle?(): boolean;
	isTextNumbered?(): boolean;
	isTextBulleted?(): boolean;
	isTextCheckbox?(): boolean;
	isTextCode?(): boolean;
	isTextQuote?(): boolean;
	isTextCallout?(): boolean;
};