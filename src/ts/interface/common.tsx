export interface Account {
	id: string;
};

export enum Platform {
	Windows = 'Windows',
	Mac = 'Mac',
	Linux = 'Linux',
};

export enum DragItem {
	Block = 'block',
	Menu = 'menu',
};

export enum CoverType {
	None	 = 0,
	Image	 = 1,
	Color	 = 2,
	Gradient = 3,
	BgImage  = 4, 
};

export enum CrumbsType {
	Page	 = 'page',
	Popup	 = 'popup',
};

export enum NavigationType {
	Go		 = 'go',
	Move	 = 'move',
	Link	 = 'link',
};

export interface Option {
	id: string;
	name: string;
	icon?: string;
};

export interface Version {
	id: string;
	previousIds: string[];
	authorId: string;
	authorName: string;
	time: number;
};