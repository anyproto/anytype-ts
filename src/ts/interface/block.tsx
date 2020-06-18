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

export enum BlockAlign {
	Left	 = 0,
	Center	 = 1,
	Right	 = 2,
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
	hasTitle?(): boolean;
	canHaveChildren?(): boolean;

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

	isHeader?(): boolean;
	isHeader1?(): boolean;
	isHeader2?(): boolean;
	isHeader3?(): boolean;

	isFile?(): boolean;
	isImage?(): boolean;
	isVideo?(): boolean;
	isDiv?(): boolean;
	isText?(): boolean;
	isTitle?(): boolean;
	isToggle?(): boolean;
	isNumbered?(): boolean;
	isBulleted?(): boolean;
	isCheckbox?(): boolean;
	isCode?(): boolean;
	isQuote?(): boolean;
};