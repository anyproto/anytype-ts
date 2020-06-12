import { I } from 'ts/lib';

export enum ViewType {
	Grid	 = 0,
	List	 = 1,
	Gallery	 = 2,
	Board	 = 3,
};

export enum RelationType { 
	None		 = '',
	Title		 = 'title', 
	Description	 = 'description', 
	Number		 = 'number', 
	Date		 = 'date', 
	Select		 = 'select', 
	Multiple	 = 'multiselect',
	Link		 = 'link',
	File		 = 'file',
	Image		 = 'image',
	Checkbox	 = 'checkbox', 
	Icon		 = 'emoji',
	Url			 = 'url',
	Email		 = 'email',
	Phone		 = 'phone',
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
};

export interface Relation {
	id: string;
	name: string;
	type: RelationType;
	isHidden: boolean;
	isReadOnly: boolean;
	values?: any[];
};

export interface Sort {
	relationId: string;
	type: SortType;
};

export interface Filter {
	relationId: string;
	operator: FilterOperator;
	condition: FilterCondition;
	value: any;
};

export interface ViewRelation extends Relation {
	visible: boolean;
	order: number;
};

export interface ViewComponent {
	view: I.View;
	data: any[];
	readOnly: boolean;
	onOpen(e: any, data: any): void;
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
	id: string;
	relation: Relation;
	data: any;
	view: any;
	readOnly?: boolean;
	onOpen?(e: any, data: any): void;
};

export interface ContentDataview {
	databaseId: string;
	schemaURL: string;
	viewId: string;
	views: View[];
	data: any[];
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};