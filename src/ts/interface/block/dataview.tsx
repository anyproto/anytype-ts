import { I } from 'ts/lib';

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
	relationKey: string;
	type: SortType;
};

export interface Filter {
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
	rootId: string;
	block?: I.Block;
	readonly: boolean;
	bodyContainer?: string;
	pageContainer?: string;
	dataset?: any;
	isPopup?: boolean;
	onRef?(ref: any, id: string): void;
	getData(viewId: string, offset: number, callBack?: (message: any) => void): void;
	getRecord(index: number): any;
	getView?(): View;
	getKeys?(viewId: string): string[];
	onRecordAdd?: (e: any, dir: number) => void;
	onCellClick?(e: any, key: string, index: number): void;
	onContext?(e: any, id: string): void;
	onCellChange?: (id: string, key: string, value: any, callBack?: (message: any) => void) => void;
	optionCommand?: (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void) => void;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	coverRelationKey: string;
	groupRelationKey: string;
	coverFit: boolean;
	cardSize: I.CardSize;
	hideIcon: boolean;
	sorts: Sort[];
	filters: Filter[];
	relations: any[];
	getRelation?:(relationKey: string) => I.ViewRelation;
};

export interface Cell {
	rootId: string;
	subId: string;
	block?: I.Block;
	id?: string;
	idPrefix?: string;
	relation?: any;
	index?: number;
	viewType: I.ViewType;
	readonly?: boolean;
	canOpen?: boolean;
	canEdit?: boolean;
	bodyContainer?: string;
	pageContainer?: string;
	isInline?: boolean;
	iconSize?: number;
	placeholder?: string;
	getView?(): View;
	getRecord(index: number): any;
	onChange?(value: any, callBack?: (message: any) => void): void;
	onClick?(e: any): void;
	onParentClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onCellChange?: (id: string, key: string, value: any, callBack?: (message: any) => void) => void;
	cellPosition?: (cellId: string) => void;
	elementMapper?: (relation: any, item: any) => any;
	arrayLimit?: number;
};

export interface BoardGroup {
	id: string;
	value: any;
};

export interface ContentDataview {
	sources: string[];
	views: View[];
	groupOrder: any[];
	objectOrder: any[];
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};