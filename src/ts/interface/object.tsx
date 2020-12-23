import { I } from 'ts/lib';

export enum ObjectLayout {
	Page	 = 0,
	Contact	 = 1,
	Task	 = 2,
	Set		 = 3,
	ObjectType = 4,
	File	 = 5,
};

export interface ObjectType {
	url: string;
	name: string;
	layout: ObjectLayout;
	iconEmoji: string;
	relations: Relation[];
};

export interface ObjectTypePerObject {
	objectId: string;
	objectTypes: string[];
}

export enum RelationType { 
	Description	 = 0, 
	Title		 = 1, 
	Number		 = 2, 
	Select		 = 3, 
	Date		 = 4, 
	File		 = 5,
	Checkbox	 = 6, 
	Icon		 = 7,
	Url			 = 8,
	Email		 = 9,
	Phone		 = 10,
	Object		 = 100,
};

export interface Relation {
	relationKey: string;
	format: RelationType;
	name: string;
	dataSource: number;
	isHidden: boolean;
	isReadOnly: boolean;
	isMultiple: boolean;
	objectTypes: string[];
	selectDict: any[];
	includeTime?: boolean;
	dateFormat?: I.DateFormat;
	timeFormat?: I.TimeFormat;
};

export interface SelectOption {
	id: string;
	text: string;
	color: string;
};