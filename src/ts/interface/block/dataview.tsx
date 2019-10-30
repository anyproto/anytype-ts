import { I } from 'ts/lib';

export enum ViewType { 
	Grid	 = 0, 
	Board	 = 1, 
	Gallery	 = 2, 
	List	 = 3 
};

export enum PropertyType { 
	Title	 = 0, 
	Text	 = 1, 
	Number	 = 2, 
	Date	 = 3, 
	Select	 = 4, 
	Multiple = 5,
	Account	 = 6,
	File	 = 7,
	Bool	 = 8, 
	Link	 = 9,
	Email	 = 10,
	Phone	 = 11,
};

export enum SortType { Asc, Desc };
export enum FilterTypeCondition { None, And, Or };
export enum FilterTypeEquality { Equal, NotEqual, In, NotIn, Greater, Lesser, Like, NotLike };

export interface Property {
	id: string;
	name: string;
	type: PropertyType;
	values?: any[];
};

export interface Sort {
	propertyId: string;
	type: SortType;
};

export interface Filter {
	propertyId: string;
	condition: FilterTypeCondition;
	equality: FilterTypeEquality;
	value: any;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	sorts: Sort[];
	filters: Filter[];
};

export interface Cell {
	id: number;
	property: Property;
	data: any;
};

export interface ContentDataview {
	view: string;
	properties: Property[];
	views: View[];
	data: any[];
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};