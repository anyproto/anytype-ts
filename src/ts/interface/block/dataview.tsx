import { I } from 'ts/lib';

export enum ViewType { Grid, Board, Gallery, List };
export enum PropertyType { Title, Text, Number, Date };
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