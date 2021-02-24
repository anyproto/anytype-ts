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
	Database	 = 8,
	Image		 = 9,
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

export enum RelationType { 
	LongText	 = 0, 
	ShortText	 = 1, 
	Number		 = 2, 
	Status		 = 3, 
	Date		 = 4, 
	File		 = 5,
	Checkbox	 = 6, 
	Icon		 = 7,
	Url			 = 8,
	Email		 = 9,
	Phone		 = 10,
	Tag			 = 11,
	Object		 = 100,
};

export enum RelationScope {
	Object				 = 0,
	Type				 = 1,
	SetOfTheSameType	 = 2,
	ObjectsOfTheSameType = 3,
	Library				 = 4,
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

export enum OptionScope {
    Local	 = 0,
	Relation = 1,
	Format	 = 2,
}

export interface SelectOption {
	id: string;
	text: string;
	color: string;
	scope: I.OptionScope;
};