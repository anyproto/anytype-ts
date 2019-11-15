export enum BlockType {
	Dashboard	 = 0,
	Page		 = 1,
	Dataview	 = 2,
	Layout		 = 3,
	
	Text		 = 4,
	File		 = 5,
	Image		 = 6,
	Video		 = 7,
	Bookmark	 = 8,
	Icon		 = 9,
	Div			 = 10,
};

export interface Permissions {
	edit: boolean;
	remove: boolean;
	drag: boolean;
	dropOn: boolean;
}

export interface BlockHeader {
	parentId: string;
	type: BlockType;
	name: string;
	icon: string;
	permissions?: Permissions;
};

export interface Block {
	id: string;
	header: BlockHeader;
	fields: any;
	content: any;
	childBlocks: Block[];
};