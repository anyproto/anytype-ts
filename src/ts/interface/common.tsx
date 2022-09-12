import { RouteComponentProps } from 'react-router';

export enum Platform {
	Windows = 'Windows',
	Mac = 'Mac',
	Linux = 'Linux',
};

export enum DropType {
	None	 = '',
	Block	 = 'block',
	Menu	 = 'menu',
	Relation = 'relation',
};

export enum SelectType {
	Block	 = 'block',
	Record	 = 'record',
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
	id: any;
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

export interface PreviewLink {
	type: string;
	title: string;
	description: string;
	faviconUrl: string;
	imageUrl: string;
};

export enum ImportFormat {
	Notion = 0,
};

export enum ExportFormat {
	Markdown = 0,
	Protobuf = 1,
	Json	 = 2,
	Dot		 = 3,
	Svg		 = 4,
	GraphJson = 5,

	Html	 = 100,
};

export enum Source {
	Popup = 0,
};

export enum EdgeType {
	Link		 = 0,
	Relation	 = 1,
};

export enum GraphView {
    Controls = 1,
    Preview	 = 2,
    Filter	 = 3,
};

export enum TabIndex {
	None		 = '',
	Favorite	 = 'favorite',
	Recent		 = 'recent',
	Set			 = 'set',
	Space		 = 'space',
	Shared		 = 'shared',
	Archive		 = 'archive',
};

export interface HeaderComponent extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
	dataset?: any;
	tabs?: any[];
	tab?: string;
	onTab?: (id: string) => void;
	onHome?: (e: any) => void;
	onForward?: (e: any) => void;
	onBack?: (e: any) => void;
	onSearch?: (e: any) => void;
	onNavigation?: (e: any) => void;
	onGraph?: (e: any) => void;
};

export interface PageComponent extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
	matchPopup?: any;
	dataset?: any;
	storageGet?(): any;
	storageSet?(data: any): void;
};

export interface FooterComponent extends RouteComponentProps<any> {
	onHelp?: (e: any) => void;
};

export enum SurveyType {
	Register 	= 'register',
	Delete 		= 'delete',
	Pmf 		= 'pmf',
	Object 		= 'object',
};