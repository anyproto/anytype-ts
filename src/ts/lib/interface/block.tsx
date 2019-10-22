export enum BlockType {
	DashBoard	 = 0,
	Page		 = 1,
	DataView	 = 2,
	
	Text		 = 3,
	File		 = 4,
	Image		 = 5,
	Video		 = 6,
};

export interface Permissions {
	editable: boolean;
	removable: boolean;
	readable: boolean;
	draggable: boolean;
	droppable: boolean;
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