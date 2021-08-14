export interface Account {
	id: string;
};

export interface AccountConfig {
	allowDataview: boolean;
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
	Upload	 = 1,
	Color	 = 2,
	Gradient = 3,
	Image	 = 4, 
	Source	 = 5,
};

export enum CrumbsType {
	Page	 = 'page',
	Popup	 = 'popup',
	Recent	 = 'recent',
};

export enum NavigationType {
	Go		 = 0,
	Move	 = 1,
	Link	 = 2,
	LinkTo	 = 3,
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

export enum ExportFormat {
	Markdown = 0,
	Protobuf = 1,
};

export enum Source {
	Popup = 0,
};