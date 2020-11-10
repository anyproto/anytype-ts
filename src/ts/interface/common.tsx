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

export interface HistoryVersion {
	id: string;
	previousIds: string[];
	authorId: string;
	authorName: string;
	groupId: number;
	time: number;
};

export interface LinkPreview {
	type: string;
	title: string;
	description: string;
	faviconUrl: string;
	imageUrl: string;
};

 export enum Color {
	Grey	 = 0,
	Yellow	 = 1,
	Amber	 = 2,
	Red		 = 3,
	Pink	 = 4,
	Purple	 = 5,
	Blue	 = 6,
	Sky		 = 7,
	Teal	 = 8,
	Green	 = 9,
};