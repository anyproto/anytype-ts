export enum BlockType {
	Dashboard	 = 0,
	Page		 = 1,
	Dataview	 = 2,
	
	Text		 = 3,
	File		 = 4,
	Image		 = 5,
	Video		 = 6,
	Bookmark	 = 7,
};

export interface Permissions {
	edit: boolean;
	remove: boolean;
	drag: boolean;
	dropOn: boolean;
}

export interface BlockHeader {
	id: string;
	type: BlockType;
	name: string;
	icon: string;
	permissions?: Permissions;
};

export interface Block {
	header: BlockHeader;
	content: any;
};