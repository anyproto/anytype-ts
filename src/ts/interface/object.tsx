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

export enum RelationType { 
	Description	 = 0, 
	Title		 = 1, 
	Number		 = 2, 
	Date		 = 3, 
	Select		 = 4, 
	File		 = 5,
	Checkbox	 = 6, 
	Icon		 = 7,
	Url			 = 8,
	Email		 = 9,
	Phone		 = 10,
	Object		 = 100,
	Self		 = 101,
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
	options: any[];
};