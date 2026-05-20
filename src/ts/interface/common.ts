import * as I from 'Interface';

export enum Platform {
	None	 = '',
	Windows	 = 'Windows',
	Mac		 = 'Mac',
	Linux	 = 'Linux',
};

export enum ProfilerReason {
	Unknown					 = 0,
	UserRequest				 = 1,
	MemoryPressureWarn		 = 2,
	MemoryPressureCritical	 = 3,
	ThermalSerious			 = 4,
	ThermalCritical			 = 5,
};

export enum DropType {
	None	 = '',
	Block	 = 'block',
	Menu	 = 'menu',
	Relation = 'relation',
	Record	 = 'record',
	Widget	 = 'widget',
	View	 = 'view',
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
	autoArchivedIds?: string[];
	autoRestoredIds?: string[];
	icon?: string;
	uploadCounts?: { [key: string]: number };
};

export enum ToastAction {
	None		 	 = 0,
	Move		 	 = 1,
	Link		 	 = 2,
	Lock 		 	 = 3,
	Collection	 	 = 4,
	StorageFull		 = 5,
	TemplateCreate	 = 6,
	Archive 		 = 7,
	Widget			 = 8,
	Restore			 = 9,
	Upload			 = 10,
	AutoArchive		 = 11,
	AutoRestore		 = 12,
};

export interface Option {
	id: any;
	name: string;
	icon?: string;
	iconParam?: I.IconParam;
	color?: string;
	isSection?: boolean;
	isDiv?: boolean;
};

export interface HistoryVersion {
	id: string;
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
	Obsidian	 = 7,
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
	DataSpace	 = 2,
	ChatSpace	 = 5,
};

export enum HomePredefinedId {
	Graph		 = 'graph',
	Chat		 = 'chat',
	Last		 = 'lastOpened',
	Existing	 = 'existing',
	Widget		 = 'widgets',
};

export interface DashboardObject {
	id: string;
	name?: string;
	layout?: I.ObjectLayout;
	iconEmoji?: string;
	iconImage?: string;
	iconOption?: number;
	_empty_?: boolean;
	isDeleted?: boolean;
	[key: string]: any;
};

export interface HeaderComponent {
	rootId?: string;
	isPopup?: boolean;
	tabs?: any[];
	tab?: string;
	text?: string;
	layout?: I.ObjectLayout;
	withBanner?: boolean;
	renderLeftIcons?: (withNavigation?: boolean, withGraph?: boolean, onOpen?: () => void) => any;
	renderTabs?: () => any;
	onTab?: (id: string) => void;
	onSearch?: () => void;
	onTooltipShow?: (e: any, text: string, caption?: string) => void;
	onTooltipHide?: () => void;
	menuOpen?: (id: string, elementId: string, param: Partial<I.MenuParam>) => void;
	onBanner?: (e: any) => void;
	onBannerClose?: (e: any) => void;
};

export interface PageComponent {
	rootId?: string;
	isPopup?: boolean;
	matchPopup?: any;
	storageGet?(): any;
	storageSet?(data: any): void;
};

export interface PageSettingsComponent extends PageComponent {
	onPage: (id: string, data?: any) => void;
	setConfirmPin: (v: () => void) => void;
	onConfirmPin: () => void;
	onExport: (format: I.ExportType, param: any) => void;
	onSpaceTypeTooltip: (e: any) => void;
	getId?(): string;
};

export interface FooterComponent {
	onTogglePanel?: (toggle: boolean) => void;
};

export interface ButtonComponent {
	id?: string;
	icon?: string;
	iconParam?: I.IconParam;
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
	Register		 = 0,
	Delete			 = 1,
	Pmf				 = 2,
	Object			 = 3,
	Shared			 = 4,
	Multiplayer		 = 5,
	Cta				 = 6,
};

export enum SliceOperation {
	None			 = 0,
	Add				 = 1,
	Move			 = 2,
	Remove			 = 3,
	Replace			 = 4,
};

export enum ObjectContainerType {
	Object			 = 'object',
	List			 = 'list',
	File			 = 'file',
	Media			 = 'media',
	Bookmark		 = 'bookmark',
	Type			 = 'type',
	Relation		 = 'relation',
};

export enum BannerType {
	None			 = 0,
	IsArchived		 = 1,
	IsTemplate		 = 2,
	TemplateSelect	 = 3,
};

export enum ObjectManagerItemInfo {
	Description		 = 0,
	FileSize		 = 1,
};

export enum ObjectManagerPopup {
	Favorites		 = 0,
	TypeArchive 	 = 1,
};

export enum NetworkMode {
	Default			 = 0,
	Local			 = 1,
	Custom			 = 2,
};

export enum InterfaceStatus {
	Ok				 = 'ok',
	Error			 = 'error',
};

export interface GraphSettings {
	icon: boolean;
	preview: boolean;
	orphan: boolean;
	marker: boolean;
	label: boolean;
	relation: boolean;
	link: boolean;
	files: boolean;
	local: boolean;
	cluster: boolean;
	filter: string;
	depth: number;
	filterTypes: string[];
	typeEdges: boolean;
	timeline: boolean;
};

export interface FocusState {
	focused: string;
	range: I.TextRange;
};

export interface RouteParam {
	replace: boolean;
	updateTabRoute: boolean;
	onRouteChange?: () => void;
};

export interface SearchSubscribeParam {
	spaceId: string;
	subId: string;
	idField: string;
	filters: I.Filter[];
	sorts: I.Sort[];
	keys: string[];
	sources: string[];
	collectionId: string;
	afterId: string;
	beforeId: string;
	offset: number;
	limit: number;
	ignoreHidden: boolean;
	ignoreDeleted: boolean;
	ignoreArchived: boolean;
	ignoreChat: boolean;
	skipLayoutFormat: I.ObjectLayout[];
	noDeps: boolean;
	crossSpace: boolean;
};

export interface SearchIdsParam extends SearchSubscribeParam {
	ids: string[];
	updateDetails?: boolean;
};

export enum SortId {
	Name		 = 'name',
	LastUsed	 = 'lastUsed',
};

export enum LoaderType {
	Loader		 = 'loader',
	Dots		 = 'dots',
};

export interface Error {
	code: number;
	description: string;
};

export interface PageRef {
	resize: () => void;
};

export interface TooltipParam {
	element?: HTMLElement;
	title?: string;
	text?: string;
	caption?: string;
	className?: string;
	typeX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	typeY?: I.MenuDirection.Top| I.MenuDirection.Center | I.MenuDirection.Bottom;
	offsetX?: number;
	offsetY?: number;
	delay?: number;
};

export enum LocalApiScope {
	Limited		 = 0,
	Json		 = 1,
	Full		 = 2,
};

export interface AppConfig {
	channel?: string;
	theme?: string;
	showMenuBar?: boolean;
	alwaysShowTabs?: boolean;
	hardwareAcceleration?: boolean;
	hideTray?: boolean;
	sudo?: boolean;
	zoom?: number;
	interfaceLang?: string;
	userDataPath?: string;
	updateDisabled?: boolean;
	updateTimeout?: number;
	disableCss?: boolean;
	experimental?: boolean;
	debug?: Record<string, boolean>;
	flagsMw?: Record<string, boolean>;
	languages?: string[];
	[key: string]: any;
};

export interface AppInfo {
	hash: string;
	apiKey: string;
	name: string;
	createdAt: number;
	expireAt: number;
	scope: LocalApiScope;
	isActive: boolean;
};

export enum ImageSize {
	Small		 = 100,
	Medium		 = 320,
	Large		 = 1920,
};

export enum AppDeviceState {
	Background	 = 0, // means app is suspended
	Foreground	 = 1,
};

export enum RecentEditMode {
	All			 = 0,
	Me			 = 1,
};

export interface DragProviderRefProps {
	onDragStart: (e: any, dropType: I.DropType, ids: string[], component: any) => void;
	onScroll: () => void;
};

export interface DragComponentProps {
	getNode: () => any;
	onRecordDrop?: (targetId: string, ids: string[], position: I.BlockPosition) => void;
};

export interface ImageParam {
	src: string;
	width: number;
	height: number;
	excavate: boolean;
};

export interface StickyScrollbarRef {
	resize: (config: { width: number; left: number; paddingLeft: number; display: string; trackWidth: number }) => void;
	bind: (element: HTMLElement, isSyncing: boolean) => void;
	unbind: () => void;
	sync: (element: HTMLElement, isSyncing: boolean) => boolean;
};

export enum ClipboardMode {
	Copy		= 0,
	Cut			= 1,
};

export enum SearchSortKey {
	OrderId		 = 0,
	Score		 = 1,
	CreatedAt	 = 2,
	ModifiedAt	 = 3,
};