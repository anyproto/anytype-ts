import { I } from 'Lib';

export enum CardSize {
	Small	 = 0,
	Medium	 = 1,
	Large	 = 2,
};

export enum DateFormat {
	MonthAbbrBeforeDay	 = 0, // Jul 30, 2020
	MonthAbbrAfterDay	 = 1, // 30 Jul 2020
	Short				 = 2, // 30/07/2020
	ShortUS				 = 3, // 07/30/2020
	ISO					 = 4, // 2020-07-30
};

export enum TimeFormat {
	H12 = 0,
	H24 = 1,
};

export enum ViewType {
	Grid	 = 0,
	List	 = 1,
	Gallery	 = 2,
	Board	 = 3,
};

export enum SortType { 
	Asc		 = 0, 
	Desc	 = 1,
	Custom	 = 2,
};

export enum FilterOperator { 
	And		 = 0, 
	Or		 = 1,
};

export enum FilterCondition { 
	None			 = 0,
	Equal			 = 1,
	NotEqual		 = 2,
	Greater			 = 3,
	Less			 = 4,
	GreaterOrEqual	 = 5,
	LessOrEqual		 = 6,
	Like			 = 7,
	NotLike			 = 8,
	In				 = 9,
	NotIn			 = 10,
	Empty			 = 11,
	NotEmpty		 = 12,
	AllIn			 = 13,
	NotAllIn		 = 14,
	ExactIn			 = 15,
    NotExactIn		 = 16,
};

export enum FilterQuickOption {
	ExactDate		 = 0,
	Yesterday		 = 1,
	Today			 = 2,
	Tomorrow		 = 3,
	LastWeek		 = 4,
	CurrentWeek		 = 5,
	NextWeek		 = 6,
	LastMonth		 = 7,
	CurrentMonth	 = 8,
	NextMonth		 = 9,
	NumberOfDaysAgo	 = 10,
	NumberOfDaysNow	 = 11,
};

export interface Sort {
	id?: string;
	relationKey: string;
	type: SortType;
	includeTime?: boolean;
	customOrder?: string[];
};

export interface Filter {
	id?: string;
	relationKey: string;
	operator: FilterOperator;
	condition: FilterCondition;
	quickOption?: FilterQuickOption;
	value: any;
};

export interface ViewRelation {
	relationKey: string;
	isVisible?: boolean;
	width?: number;
	includeTime?: boolean;
	dateFormat?: I.DateFormat;
	timeFormat?: I.TimeFormat;
};

export interface ViewComponent {
	rootId?: string;
	block?: I.Block;
	readonly: boolean;
	bodyContainer?: string;
	pageContainer?: string;
	dataset?: I.Dataset;
	isPopup?: boolean;
	isInline?: boolean;
	isCollection?: boolean;
	className?: string;
	onRef?(ref: any, id: string): void;
	loadData(viewId: string, offset: number, clear: boolean, callBack?: (message: any) => void): void;
	getRecords?(): string[];
	getRecord(id: string): any;
	getCoverObject?(id: string): any;
	getView?(): View;
	getSources?(): string[];
	getTarget?(): any;
	getKeys?(viewId: string): string[];
	getIdPrefix?(): string;
	getLimit?(): number;
	getVisibleRelations?(): I.ViewRelation[];
	getEmpty?(type: string): any;
	onRecordAdd?: (e: any, dir: number, groupId?: string) => void;
	onTemplatesMenu?: (e: any, dur: number) => void;
	onCellClick?(e: any, key: string, id?: string): void;
	onContext?(e: any, id: string): void;
	onCellChange?: (id: string, key: string, value: any, callBack?: (message: any) => void) => void;
	onDragRecordStart?: (e: any, id?: string) => void;
	onSelectToggle?: (e: React.MouseEvent, id: string) => void;
	onSelectEnd?: () => void;
	isAllowedObject?: () => boolean;
	isAllowedTemplate?: () => boolean;
	objectOrderUpdate?: (orders: any[], records: any[], callBack?: (message: any) => void) => void;
	applyObjectOrder?: (groupId: string, records: any[]) => any[];
	onSourceSelect?(element: any, param: Partial<I.MenuParam>): void;
	onSourceTypeSelect?(element: any): void;
	refCells?: any;
};

export interface ViewEmpty {
	rootId?: string;
	block?: I.Block;
	title: string;
	description: string;
	button: string;
	withButton: boolean;
	className?: string;
	onClick: (e: any) => void;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	coverRelationKey: string;
	groupRelationKey: string;
	groupBackgroundColors: boolean;
	coverFit: boolean;
	cardSize: I.CardSize;
	hideIcon: boolean;
	pageLimit: number;
	sorts: Sort[];
	filters: Filter[];
	relations: any[];
	defaultTemplateId?: string;
	getVisibleRelations?: () => I.ViewRelation[];
	getRelation?: (relationKey: string) => I.ViewRelation;
	isGrid?: () => boolean;
	isList?: () => boolean;
	isGallery?: () => boolean;
	isBoard?: () => boolean;
};

export interface Cell {
	rootId?: string;
	subId: string;
	block?: I.Block;
	id?: string;
	idPrefix?: string;
	relation?: any;
	relationKey?: string;
	recordId: string;
	viewType: I.ViewType;
	readonly?: boolean;
	canOpen?: boolean;
	canEdit?: boolean;
	bodyContainer?: string;
	pageContainer?: string;
	isInline?: boolean;
	iconSize?: number;
	placeholder?: string;
	withLabel?: boolean;
	textLimit?: number;
	arrayLimit?: number;
	shortUrl?: boolean;
	getView?(): View;
	getRecord(id: string): any;
	onChange?(value: any, callBack?: (message: any) => void): void;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onCellChange?: (id: string, key: string, value: any, callBack?: (message: any) => void) => void;
	cellPosition?: (cellId: string) => void;
	elementMapper?: (relation: any, item: any) => any;
};

export interface BoardGroup {
	id: string;
	value: any;
};

export interface ContentDataview {
	sources: string[];
	views: View[];
	relationLinks: any[];
	groupOrder: any[];
	objectOrder: any[];
	targetObjectId: string;
	isCollection: boolean;
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};
