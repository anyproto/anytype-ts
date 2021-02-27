import { I } from 'ts/lib';

export enum ObjectLayout {
	Page		 = 0,
	Human		 = 1,
	Task		 = 2,
	Set			 = 3,
	ObjectType	 = 4,
	Relation	 = 5,
	File		 = 6,
	Dashboard	 = 7,
	Image		 = 9,
	Database	 = 20,
};

export enum RelationType { 
	LongText	 = 0, 
	ShortText	 = 1, 
	Number		 = 2, 
	Status		 = 3, 
	Date		 = 4, 
	File		 = 5,
	Checkbox	 = 6, 
	Url			 = 7,
	Email		 = 8,
	Phone		 = 9,
	Icon		 = 10,
	Tag			 = 11,
	Object		 = 100,
	Relations	 = 101,
};

export enum RelationScope {
	Object				 = 0,
	Type				 = 1,
	SetOfTheSameType	 = 2,
	ObjectsOfTheSameType = 3,
	Library				 = 4,
};

export enum OptionScope {
    Local	 = 0,
	Relation = 1,
	Format	 = 2,
};

export interface ObjectType {
	id: string;
	name: string;
	description?: string;
	layout: ObjectLayout;
	iconEmoji: string;
	isHidden: boolean;
	relations: Relation[];
};

export interface Relation {
	relationKey: string;
	format: RelationType;
	name: string;
	dataSource: number;
	isHidden: boolean;
	isReadOnly: boolean;
	objectTypes: string[];
	selectDict: any[];
	includeTime?: boolean;
	dateFormat?: I.DateFormat;
	timeFormat?: I.TimeFormat;
	maxCount: number;
	scope: RelationScope;
};

export interface SelectOption {
	id: string;
	text: string;
	color: string;
	scope: I.OptionScope;
};