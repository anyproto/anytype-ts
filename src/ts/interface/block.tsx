import { I } from 'ts/lib';

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
	Property	 = 'property',
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
	isIndentable?(): boolean;
	isFocusable?(): boolean;
	isSelectable?(): boolean;
	isDraggable?(): boolean;
	isPage?(): boolean;
	isPageProfile?(): boolean;
	isLayout?(): boolean;
	isLayoutRow?(): boolean;
	isLayoutColumn?(): boolean;
	isLayoutDiv?(): boolean;
	isLink?(): boolean;
	isLinkArchive?(): boolean;
	isIcon?(): boolean;
	isIconPage?(): boolean;
	isIconUser?(): boolean;
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
	isHeader?(): boolean;
	isHeader1?(): boolean;
	isHeader2?(): boolean;
	isHeader3?(): boolean;
	isQuote?(): boolean;
	getLength?(): number;
};