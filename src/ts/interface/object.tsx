import { I } from 'ts/lib';

export enum ObjectLayout {
	Page	 = 0,
	Contact	 = 1,
	Task	 = 2,
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
	key: string;
	format: RelationType;
	name: string;
	dataSource: string;
	isHidden: boolean;
	isReadOnly: boolean;
	isMultiple: boolean;
	objectType: string;
	selectDict: any[];
};

export interface SelectOption {
	id: string;
	text: string;
	color: I.Color;
};