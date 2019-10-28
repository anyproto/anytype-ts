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

export interface Property {
	id: string;
	name: string;
	type: PropertyType;
};

export interface Sort {
	propertyId: string;
	type: SortType;
};

export interface Filter {
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	sort: Sort[];
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