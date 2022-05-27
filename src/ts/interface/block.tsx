import { I } from 'ts/lib';

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
	Latex				 = 'latex',
	Table				 = 'table',
	TableColumn			 = 'tableColumn',
	TableRow			 = 'tableRow',
	TableCell			 = 'tableCell',
	TableOfContents		 = 'tableOfContents',
};

export enum BlockPosition {
	None	 = 0,
	Top		 = 1,
	Bottom	 = 2,
	Left	 = 3,
	Right	 = 4,
	Inner	 = 5,
	Replace	 = 6,
	InnerFirst = 7,
};

export enum BlockSplitMode {
	Bottom = 0,
	Top = 1,
	Inner = 2,
};

export enum BlockAlign {
	Left	 = 0,
	Center	 = 1,
	Right	 = 2,
};

export interface BlockComponent {
	dataset?: any;
	rootId: string;
	traceId?: string;
	block: I.Block;
	readonly?: boolean;
	isPopup?: boolean;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onKeyUp?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange, marks: I.Mark[]): void;
	onPaste?(e: any): void;
	getWrapper?(): any;
	getWrapperWidth?(): number;
};

export interface BlockStructure {
	parentId: string;
	childrenIds: string[];
};

export interface Block {
	id: string;
	type: BlockType;
	layout?: I.ObjectLayout;
	parentId?: string;
	fields: any;
	align?: BlockAlign;
	bgColor?: string;
	content: any;
	childrenIds: string[];
	
	getLength?(): number;
	isSystem?(): boolean;
	isLocked?(): boolean;

	canHaveChildren?(): boolean;
	canHaveAlign?(): boolean;
	canHaveColor?(): boolean;
	canHaveBackground?(): boolean;
	canHaveMarks?(): boolean;
	canHaveHistory?(): boolean;
	canTurn?(): boolean;
	canTurnText?(): boolean;
	canTurnPage?(): boolean;
	canTurnList?(): boolean;
	canTurnObject?(): boolean;
	canCreateBlock?(): boolean;

	isIndentable?(): boolean;
	isFocusable?(): boolean;
	isSelectable?(): boolean;
	isDraggable?(): boolean;

	isPage?(): boolean;
	isObjectPage?(): boolean;
	isObjectHuman?(): boolean;
	isObjectTask?(): boolean;
	isObjectNote?(): boolean;
	isObjectSet?(): boolean;
	isObjectSpace?(): boolean;
	isObjectFileKind?(): boolean;
	isObjectFile?(): boolean;
	isObjectImage?(): boolean;
	isObjectVideo?(): boolean;
	isObjectAudio?(): boolean;
	isObjectType?(): boolean;
	isObjectRelation?(): boolean;

	isFeatured?(): boolean;
	isDataview?(): boolean;
	isRelation?(): boolean;
	isType?(): boolean;

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
	isTableCell?(): boolean;

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

	isLatex?(): boolean;

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