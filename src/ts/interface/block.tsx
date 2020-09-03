import { I } from 'ts/lib';

export interface PageInfo {
	id: string;
	snippet: string;
	details: any;	
	text: string;
};

export enum BlockType {
	Empty		 = '',
	Page		 = 'page',
	Dataview	 = 'dataview',
	Layout		 = 'layout',
	Text		 = 'text',
	File		 = 'file',
	Bookmark	 = 'bookmark',
	IconPage	 = 'iconPage',
	IconUser	 = 'iconUser',
	Title		 = 'title',
	Div			 = 'div',
	Link		 = 'link',
	Cover		 = 'cover',
	Relation	 = 'relation',
};

export enum BlockPosition {
	None	 = 0,
	Top		 = 1,
	Bottom	 = 2,
	Left	 = 3,
	Right	 = 4,
	Inner	 = 5,
	Replace	 = 6,
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
	block: I.Block;
	readOnly?: boolean;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onKeyUp?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
};

export interface Block {
	id: string;
	type: BlockType;
	pageType?: I.PageType;
	parentId?: string;
	fields: any;
	align?: BlockAlign;
	bgColor?: string;
	content: any;
	childrenIds: string[];
	
	getLength?(): number;
	isSystem?(): boolean;

	canHaveTitle?(): boolean;
	canHaveChildren?(): boolean;
	canHaveAlign?(): boolean;
	canHaveColor?(): boolean;
	canHaveBackground?(): boolean;
	canTurn?(): boolean;

	isIndentable?(): boolean;
	isFocusable?(): boolean;
	isSelectable?(): boolean;
	isDraggable?(): boolean;

	isPage?(): boolean;
	isPagePage?(): boolean;
	isPageProfile?(): boolean;
	isPageSet?(): boolean;

	isLayout?(): boolean;
	isLayoutRow?(): boolean;
	isLayoutColumn?(): boolean;
	isLayoutDiv?(): boolean;

	isLink?(): boolean;
	isLinkPage?(): boolean;
	isLinkArchive?(): boolean;

	isIcon?(): boolean;
	isIconPage?(): boolean;
	isIconUser?(): boolean;

	isDiv?(): boolean;
	isDivLine?(): boolean;
	isDivDot?(): boolean;

	isFile?(): boolean;
	isImage?(): boolean;
	isVideo?(): boolean;
	isTitle?(): boolean;

	isText?(): boolean;
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
};