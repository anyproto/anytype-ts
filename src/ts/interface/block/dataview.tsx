import { I } from 'ts/lib';

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
	Equal			 = 0,
	NotEqual		 = 1,
	Greater			 = 2,
	Less			 = 3,
	GreaterOrEqual	 = 4,
	LessOrEqual		 = 5,
	Like			 = 6,
	NotLike			 = 7,
	In				 = 8,
	NotIn			 = 9,
	Empty			 = 10,
	NotEmpty		 = 11,
};

export interface Sort {
	relationKey: string;
	type: SortType;
};

export interface Filter {
	relationKey: string;
	operator: FilterOperator;
	condition: FilterCondition;
	value: any;
};

export interface ViewRelation extends I.Relation {
	isVisible: boolean;
	width: number;
	includeTime: boolean;
	dateFormat: I.DateFormat;
	timeFormat: I.TimeFormat;
};

export interface ViewComponent {
	rootId: string;
	block: I.Block;
	readOnly: boolean;
	scrollContainer?: any;
	pageContainer?: any;
	isPopup?: boolean;
	onRef?(ref: any, id: string): void;
	getData(viewId: string, offset: number): void;
	getRecord(index: number): any;
	getView(): View;
	onRowAdd?: (e: any) => void;
	onCellClick?(e: any, key: string, index: number): void;
	onCellChange?: (id: string, key: string, value: any) => void;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	sorts: Sort[];
	filters: Filter[];
	relations: any[];
};

export interface Cell {
	rootId: string;
	block: I.Block;
	id?: string;
	idPrefix?: string;
	relation?: I.Relation;
	index?: number;
	viewType: I.ViewType;
	readOnly?: boolean;
	canEdit?: boolean;
	pageContainer?: any;
	getRecord(index: number): any;
	onChange?(data: any): void;
	onClick?(e: any): void;
	onCellChange?: (id: string, key: string, value: any) => void;
};

export interface ContentDataview {
	source: string;
	views: View[];
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};