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
};

export interface Permissions {
	edit: boolean;
	remove: boolean;
	drag: boolean;
	dropOn: boolean;
}

export interface BlockHeader {
	id: string;
	parentId: string;
	type: BlockType;
	name: string;
	icon: string;
	permissions?: Permissions;
};

export interface Block {
	header: BlockHeader;
	content: any;
	children: Block[];
};