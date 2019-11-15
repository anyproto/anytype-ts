export enum BlockType {
	Dashboard	 = 'dashboard',
	Page		 = 'page',
	Dataview	 = 'dataview',
	Layout		 = 'layout',
	
	Text		 = 'text',
	File		 = 'file',
	Image		 = 'image',
	Video		 = 'video',
	Bookmark	 = 'bookmark',
	Icon		 = 'icon',
	Div			 = 'div',
};

export interface Permissions {
	edit: boolean;
	remove: boolean;
	drag: boolean;
	dropOn: boolean;
}

export interface Block {
	id: string;
	type: BlockType;
	parentId?: string;
	fields: any;
	content: any;
	childrenIds: string[];
	childBlocks: Block[];
};