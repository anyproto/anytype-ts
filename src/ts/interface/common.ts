import { RouteComponentProps } from 'react-router';
import { I } from 'Lib';

export enum Platform {
	Windows	 = 'Windows',
	Mac		 = 'Mac',
	Linux	 = 'Linux',
};

export enum DropType {
	None	 = '',
	Block	 = 'block',
	Menu	 = 'menu',
	Relation = 'relation',
	Record	 = 'record',
	Widget	 = 'widget',
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

export enum NavigationType {
	Go		 = 0,
	Move	 = 1,
	Link	 = 2,
	LinkTo	 = 3,
};

export interface Toast {
	action?: ToastAction;
	text?: string;
	objectId?: string;
	targetId?: string;
	originId?: string;
	object?: any;
	target?: any;
	origin?: any;
	count?: number;
	value?: boolean;
	ids?: string[];
};

export enum ToastAction {
	None		 	= 0,
	Move		 	= 1,
	Link		 	= 2,
	Lock 		 	= 3,
	Collection	 	= 4,
	StorageFull		= 5,
	TemplateCreate	= 6,
	Archive 		= 7,
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
	groupId: number;
	time: number;
};

export enum ImportMode {
	AllOrNothing = 0,
	IgnoreErrors = 1,
};

export enum CsvImportMode {
	Collection = 0,
	Table = 1,
};

export enum ImportType {
	Notion		 = 0,
	Markdown	 = 1,
	External	 = 2,
	Protobuf	 = 3,
	Html		 = 4,
	Text		 = 5,
	Csv			 = 6,
};

export enum ExportType {
	Markdown	 = 0,
	Protobuf	 = 1,
	Json		 = 2,
	Dot			 = 3,
	Svg			 = 4,
	GraphJson	 = 5,

	Html		 = 100,
	Pdf			 = 110,
};

export enum Source {
	Popup		 = 0,
};

export enum EdgeType {
	Link		 = 0,
	Relation	 = 1,
};

export enum Usecase {
	None		 = 0,
	GetStarted	 = 1,
	Personal	 = 2,
    Knowledge	 = 3,
    Notes		 = 4,
	Strategic 	 = 5,
	Empty		 = 6,
};

export enum HomePredefinedId {
	Graph		 = 'graph',
	Last		 = 'lastOpened',
	Existing	 = 'existing',
};

export interface HeaderComponent extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
	dataset?: I.Dataset;
	tabs?: any[];
	tab?: string;
	text?: string;
	layout?: I.ObjectLayout;
	onTab?: (id: string) => void;
	onSearch?: () => void;
	onNavigation?: () => void;
	onGraph?: () => void;
	onTooltipShow?: (e: any, text: string, caption?: string) => void;
	onTooltipHide?: () => void;
	menuOpen?: (id: string, elementId: string, param: Partial<I.MenuParam>) => void;
};

export interface PageComponent extends RouteComponentProps<any> {
	rootId?: string;
	isPopup?: boolean;
	matchPopup?: any;
	dataset?: I.Dataset;
	storageGet?(): any;
	storageSet?(data: any): void;
};

export interface FooterComponent {
	onHelp?: (e: any) => void;
	onTogglePanel?: (toggle: boolean) => void;
};

export interface ButtonComponent {
	id?: string;
	icon?: string;
	type?: string;
	arrow?: boolean;
	subType?: string;
	text?: string;
	className?: string;
	color?: string;
	menu?: string;
	withTabs?: boolean;
	dataset?: any;
	tooltip?: string;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	showDot?: boolean;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
};

export enum SurveyType {
	Register 	= 0,
	Delete 		= 1,
	Pmf 		= 2,
	Object 		= 3,
};

export enum SliceOperation {
	None	 = 0,
	Add		 = 1,
    Move	 = 2,
	Remove	 = 3,
    Replace	 = 4,
};

export interface Dataset {
	selection: {
		isSelecting: boolean;
		checkSelected: (type: I.SelectType) => boolean;
		renderSelection: () => void;
		scrollToElement: (id: string, dir: number) => void;
		set: (type: I.SelectType, ids: string[]) => void;
		get: (type: I.SelectType, withChildren?: boolean) => string[];
		clear: () => void;
		hide: () => void;
		setIsSelecting: (v: boolean) => void;
	};
	dragProvider: {
		onScroll: () => void;
	};
	onDragStart: (e: React.DragEvent, dropType: I.DropType, ids: string[], component: unknown) => void;
	preventCommonDrop: (value: boolean) => void;
};

export enum FileSyncStatus {
	Unknown		 = 0,
	Synced		 = 1,
	NotSynced	 = 2,
};

export enum StoreTab {
	Type = 'type',
	Relation = 'relation',
};

export enum BannerType {
	None			 = 0,
	IsArchived		 = 1,
	IsTemplate		 = 2,
	TemplateSelect	 = 3,
};

export enum ObjectManagerItemInfo {
	Description 	= 0,
	FileSize 		= 1,
};

export enum ObjectManagerPopup {
	Favorites 	= 0,
};

export enum NetworkMode {
	Default		 = 0,
	Local		 = 1,
	Custom		 = 2,
};